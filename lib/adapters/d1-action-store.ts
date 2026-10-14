import {fail} from '../domain/core';
import {assertBoundJson,decodeSnapshotRows,planStorageCommit,type SnapshotRows,type StorageRowChange,type StorageTableKey} from '../data/model/storage';
import type {ChangeWindow, OwnerCommitRequest, Receipt, Snapshot} from '../data/types';
import type {OwnerActionStore} from '../application/ports';
import {verifiedOwner,type VerifiedIdentity} from '../server/auth';
import {OPERATION_HISTORY_LIMIT} from '../application/ports';

async function receipt(db:D1Database,owner:string,operationId:string){return db.prepare('SELECT canonical_payload,result,delta,revision_after,undo_of FROM operations WHERE owner=? AND operation_id=?').bind(owner,operationId).first<Receipt>();}
async function snapshot(db:D1Database,owner:string):Promise<Snapshot> {
 // One read batch keeps the operation revision and graph in the same snapshot.
 // Reading an empty owner does not create any database rows.
 const rows=await db.batch([
  db.prepare('SELECT COALESCE(MAX(revision_after),0) AS revision FROM operations WHERE owner=?').bind(owner),
  db.prepare('SELECT id,title,revision,parent_id,project_id,status,due_at,defer_until,notes,"order",flagged,created_at,updated_at FROM actions WHERE owner=?').bind(owner),
  db.prepare('SELECT id,name,description,parent_id,"order",revision,created_at,updated_at FROM projects WHERE owner=?').bind(owner),
  db.prepare('SELECT id,name,description,parent_id,"order",revision,created_at,updated_at FROM tags WHERE owner=?').bind(owner),
  db.prepare('SELECT action_id,tag_id,revision FROM action_tags WHERE owner=?').bind(owner),
  db.prepare('SELECT kind,identity,revision FROM catalog_identity_ledger WHERE owner=?').bind(owner),
  db.prepare('SELECT id,name,description,filter,definition_version,revision,created_at,updated_at FROM perspectives WHERE owner=?').bind(owner)
 ]);
 return decodeSnapshotRows(rows.map(row=>row.results) as unknown as SnapshotRows);
}

async function changeWindow(db:D1Database,owner:string,afterRevision:number,throughRevision:number|null):Promise<ChangeWindow> {
 // The head, retention boundary and selected receipts share one D1 read batch.
 const operationQuery=throughRevision===null
  ?db.prepare('SELECT operation_id,revision_before,revision_after,created_at AS committed_at,undo_of,delta FROM operations WHERE owner=? AND revision_after>? ORDER BY revision_after ASC LIMIT 101').bind(owner,afterRevision)
  :db.prepare('SELECT operation_id,revision_before,revision_after,created_at AS committed_at,undo_of,delta FROM operations WHERE owner=? AND revision_after>? AND revision_after<=? ORDER BY revision_after ASC LIMIT 101').bind(owner,afterRevision,throughRevision);
 const rows=await db.batch([
  db.prepare('SELECT COALESCE(MAX(revision_after),0) AS revision FROM operations WHERE owner=?').bind(owner),
  db.prepare('SELECT MIN(revision_after) AS revision FROM operations WHERE owner=?').bind(owner),
  operationQuery
 ]);
 const head=rows[0].results[0] as {revision:number}|undefined,oldest=rows[1].results[0] as {revision:number|null}|undefined;
 if(!head||!oldest)fail('unavailable','Change history is unavailable.',503);
 return {head_revision:head.revision,oldest_revision:oldest.revision,operations:rows[2].results as unknown as ChangeWindow['operations']};
}

/** Closed, immutable table descriptors. Callers cannot supply table, column or key identifiers. */
const TABLES={
 actions:{name:'actions',columns:['id','title','revision','parent_id','project_id','status','due_at','defer_until','notes','order','flagged','created_at','updated_at'],keys:['id']},
 projects:{name:'projects',columns:['id','name','description','parent_id','order','revision','created_at','updated_at'],keys:['id']},
 tags:{name:'tags',columns:['id','name','description','parent_id','order','revision','created_at','updated_at'],keys:['id']},
 perspectives:{name:'perspectives',columns:['id','name','description','filter','definition_version','revision','created_at','updated_at'],keys:['id']},
 action_tags:{name:'action_tags',columns:['action_id','tag_id','revision'],keys:['action_id','tag_id']},
 catalog_identity_ledger:{name:'catalog_identity_ledger',columns:['kind','identity','revision'],keys:['kind','identity']},
} as const;

/** Only changed identities are written; no owner-wide DELETE or snapshot JSON. */
function rowStatements(db:D1Database,owner:string,key:StorageTableKey,changes:readonly StorageRowChange[]) {
 const {name,columns,keys}=TABLES[key],statements:D1PreparedStatement[]=[];
 const removed=changes.filter(x=>x.after===null).map(x=>x.before);
 if(removed.length){
  const payload=JSON.stringify(removed);assertBoundJson(payload);
  const match=keys.map(k=>`${name}.${k}=json_extract(value,'$.${k}')`).join(' AND ');
  statements.push(db.prepare(`DELETE FROM ${name} WHERE owner=? AND EXISTS (SELECT 1 FROM json_each(?) WHERE ${match})`).bind(owner,payload));
 }
 const saved=changes.flatMap(x=>x.after?[x.after]:[]);
 if(saved.length){
  const payload=JSON.stringify(saved);assertBoundJson(payload);
  const values=columns.map(c=>`json_extract(value,'$.${c}')`).join(',');
  const updates=columns.filter(c=>!(keys as readonly string[]).includes(c)).map(c=>`"${c}"=excluded."${c}"`).join(',');
  statements.push(db.prepare(`INSERT INTO ${name} (owner,${columns.map(c=>`"${c}"`).join(',')}) SELECT ?,${values} FROM json_each(?) WHERE 1 ON CONFLICT(owner,${keys.join(',')}) DO UPDATE SET ${updates}`).bind(owner,payload));
 }
 return statements;
}

async function commit(db:D1Database,request:OwnerCommitRequest&{owner:string}) {
 const {owner,operationId:op,payload,before,now,undoOf}=request;
 const plan=planStorageCommit(request),{changes,result,tables,markerChanges}=plan;
 // The INSERT trigger checks the latest operation revision before any row writes.
 // Receipt, related records and identity markers commit or roll back as one batch.
 const statements=[db.prepare('INSERT INTO operations(owner,operation_id,canonical_payload,result,delta,revision_before,revision_after,undo_of,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(owner,op,payload,JSON.stringify(result),JSON.stringify(changes),before.revision,result.revision,undoOf,now)];
 for(const table of tables)statements.push(...rowStatements(db,owner,table.key,table.changes));
 statements.push(...rowStatements(db,owner,'catalog_identity_ledger',markerChanges));
 // Revisions increase by one per write. Undo receipts are newer than their target,
 // so pruning the oldest prefix cannot lose a retained target's Undo marker.
 statements.push(db.prepare('DELETE FROM operations WHERE owner=? AND revision_after<=?').bind(owner,result.revision-OPERATION_HISTORY_LIMIT));
 if(statements.length>50)fail('operation_too_large','Generated query count exceeds the storage budget.',413);
 try{await db.batch(statements);}catch(error){
  // A duplicate invocation may already have committed. Resolve identity before
  // classifying a revision error; unrelated database/transport errors stay unknown.
  const message=error instanceof Error?error.message:'';
  const revisionConflict=message.includes('revision_conflict');
  if(!revisionConflict&&!message.includes('UNIQUE constraint failed: operations.owner, operations.operation_id'))throw error;
  const prior=await receipt(db,owner,op);
  if(prior){if(prior.canonical_payload!==payload)fail('idempotency_conflict','同じ要求IDに異なる入力が指定されています。',409);return JSON.parse(prior.result);}
  if(revisionConflict)fail('conflict','更新が競合しました。最新状態と未保存案を確認してください。',409);
  throw error;
 }
 return result;
}

/** Request-scoped identity capability fixes the owner for every SQL path. */
export function createOwnerBoundActionStore(db:D1Database,identity:VerifiedIdentity):OwnerActionStore {
 const owner=verifiedOwner(identity);
 return Object.freeze({
 readSnapshot:()=>snapshot(db,owner),
 readChangeWindow:(afterRevision:number,throughRevision:number|null)=>changeWindow(db,owner,afterRevision,throughRevision),
 readReceipt:(operationId:string)=>receipt(db,owner,operationId),
 async hasUndo(undoOf:string){return !!await db.prepare('SELECT operation_id FROM operations WHERE owner=? AND undo_of=?').bind(owner,undoOf).first();},
 commit:(command:OwnerCommitRequest)=>commit(db,{...command,owner})
 });
}
