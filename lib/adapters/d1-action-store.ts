import {delta} from '../domain/operations';
import {canonical,fail,type Snapshot,type Action,type Perspective} from '../domain/core';
import type {Receipt,OwnerCommitRequest,OwnerActionStore} from '../application/ports';
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
 const state=rows[0].results[0] as {revision:number};if(!state)fail('unavailable','保存先を取得できません。',503);
 return {...state,actions:(rows[1].results as (Omit<Action,'flagged'>&{flagged:number})[]).map(t=>({...t,flagged:t.flagged===1})),projects:rows[2].results as Snapshot['projects'],tags:rows[3].results as Snapshot['tags'],action_tags:rows[4].results as Snapshot['action_tags'],catalog_identity_ledger:rows[5].results as Snapshot['catalog_identity_ledger'],perspectives:(rows[6].results as (Omit<Perspective,'filter'>&{filter:string})[]).map(v=>({...v,filter:JSON.parse(v.filter)}))};
}

type RowChange={before:object|null;after:object|null};
/** Closed, immutable table descriptors. Callers cannot supply table, column or key identifiers. */
const TABLES={
 actions:{name:'actions',columns:['id','title','revision','parent_id','project_id','status','due_at','defer_until','notes','order','flagged','created_at','updated_at'],keys:['id']},
 projects:{name:'projects',columns:['id','name','description','parent_id','order','revision','created_at','updated_at'],keys:['id']},
 tags:{name:'tags',columns:['id','name','description','parent_id','order','revision','created_at','updated_at'],keys:['id']},
 perspectives:{name:'perspectives',columns:['id','name','description','filter','definition_version','revision','created_at','updated_at'],keys:['id']},
 action_tags:{name:'action_tags',columns:['action_id','tag_id','revision'],keys:['action_id','tag_id']},
 catalog_identity_ledger:{name:'catalog_identity_ledger',columns:['kind','identity','revision'],keys:['kind','identity']},
} as const;
type TableKey=keyof typeof TABLES;

/** Bound JSON payloads must stay well under D1's statement-size limit; over-budget plans never write. */
export const MAX_BOUND_JSON_BYTES=100000;
/** Total generated commit plan budget across payload, receipt, delta and changed-row JSON. */
export const MAX_COMMIT_PLAN_BYTES=524288;

function encodedBytes(value:unknown){return new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value)).length;}
function budgeted(value:unknown){const size=encodedBytes(value);if(size>MAX_BOUND_JSON_BYTES)fail('operation_too_large','保存する変更が大きすぎます。',413);return size;}

/** Only changed identities are written; no owner-wide DELETE or snapshot JSON. */
function rowStatements(db:D1Database,owner:string,key:TableKey,changes:RowChange[]) {
 const {name,columns,keys}=TABLES[key],statements:D1PreparedStatement[]=[];
 const removed=changes.filter(x=>x.after===null).map(x=>x.before);
 if(removed.length){
  const payload=JSON.stringify(removed);budgeted(payload);
  const match=keys.map(k=>`${name}.${k}=json_extract(value,'$.${k}')`).join(' AND ');
  statements.push(db.prepare(`DELETE FROM ${name} WHERE owner=? AND EXISTS (SELECT 1 FROM json_each(?) WHERE ${match})`).bind(owner,payload));
 }
 const saved=changes.flatMap(x=>x.after?[x.after]:[]);
 if(saved.length){
  const payload=JSON.stringify(saved);budgeted(payload);
  const values=columns.map(c=>`json_extract(value,'$.${c}')`).join(',');
  const updates=columns.filter(c=>!(keys as readonly string[]).includes(c)).map(c=>`"${c}"=excluded."${c}"`).join(',');
  statements.push(db.prepare(`INSERT INTO ${name} (owner,${columns.map(c=>`"${c}"`).join(',')}) SELECT ?,${values} FROM json_each(?) WHERE 1 ON CONFLICT(owner,${keys.join(',')}) DO UPDATE SET ${updates}`).bind(owner,payload));
 }
 return statements;
}

async function commit(db:D1Database,request:OwnerCommitRequest&{owner:string}) {
 const {owner,operationId:op,payload,before,after,now,undoOf}=request;
 const changes=delta(before,after),result={operationId:op,revision:before.revision+1,changedIds:changes.actions.map(x=>(x.after??x.before)!.id),...(request.resolved?{resolved:request.resolved}:{})};
 const tables=[
  {key:'actions' as const,changes:changes.actions},
  {key:'projects' as const,changes:changes.projects},
  {key:'tags' as const,changes:changes.tags},
  {key:'perspectives' as const,changes:changes.perspectives.map(x=>({before:x.before?{...x.before,filter:canonical(x.before.filter)}:null,after:x.after?{...x.after,filter:canonical(x.after.filter)}:null}))},
  {key:'action_tags' as const,changes:changes.action_tags}
 ];
 // Measure the generated plan (payload, receipt result, delta and bulk JSON binds) before writing.
 const receiptBytes=budgeted(payload)+budgeted(JSON.stringify(result))+budgeted(JSON.stringify(changes));
 const planBytes=receiptBytes+tables.reduce((sum,table)=>sum+encodedBytes(table.changes),0);
 if(planBytes>MAX_COMMIT_PLAN_BYTES)fail('operation_too_large','保存する変更が大きすぎます。',413);
 // The INSERT trigger checks the latest operation revision before any row writes.
 // Receipt, related records and identity markers commit or roll back as one batch.
 const statements=[db.prepare('INSERT INTO operations(owner,operation_id,canonical_payload,result,delta,revision_before,revision_after,undo_of,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(owner,op,payload,JSON.stringify(result),JSON.stringify(changes),before.revision,result.revision,undoOf,now)];
 for(const table of tables)statements.push(...rowStatements(db,owner,table.key,table.changes));
 const oldMarkers=new Map(before.catalog_identity_ledger.map(x=>[JSON.stringify([x.kind,x.identity]),x]));
 const markerChanges=after.catalog_identity_ledger.flatMap(row=>{const old=oldMarkers.get(JSON.stringify([row.kind,row.identity]))??null;return canonical(old)===canonical(row)?[]:[{before:old,after:row}];});
 if(planBytes+encodedBytes(markerChanges)>MAX_COMMIT_PLAN_BYTES)fail('operation_too_large','Generated identity markers exceed the storage budget.',413);
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
 readReceipt:(operationId:string)=>receipt(db,owner,operationId),
 async hasUndo(undoOf:string){return !!await db.prepare('SELECT operation_id FROM operations WHERE owner=? AND undo_of=?').bind(owner,undoOf).first();},
 commit:(command:OwnerCommitRequest)=>commit(db,{...command,owner})
 });
}
