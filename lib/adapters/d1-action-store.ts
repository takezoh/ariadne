import {delta} from '../domain/operations';
import {canonical,fail,type Snapshot,type Action,type Perspective} from '../domain/core';
import type {Receipt,CommitRequest,ActionStore} from '../application/ports';
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
/** Only changed identities are written; no owner-wide DELETE or snapshot JSON. */
function rowStatements(db:D1Database,owner:string,name:string,columns:string[],keys:string[],changes:RowChange[]) {
 const statements:D1PreparedStatement[]=[];
 const removed=changes.filter(x=>x.after===null).map(x=>x.before);
 if(removed.length){
  const match=keys.map(k=>`${name}.${k}=json_extract(value,'$.${k}')`).join(' AND ');
  statements.push(db.prepare(`DELETE FROM ${name} WHERE owner=? AND EXISTS (SELECT 1 FROM json_each(?) WHERE ${match})`).bind(owner,JSON.stringify(removed)));
 }
 const saved=changes.flatMap(x=>x.after?[x.after]:[]);
 if(saved.length){
  const values=columns.map(c=>`json_extract(value,'$.${c}')`).join(',');
  const updates=columns.filter(c=>!keys.includes(c)).map(c=>`"${c}"=excluded."${c}"`).join(',');
  statements.push(db.prepare(`INSERT INTO ${name} (owner,${columns.map(c=>`"${c}"`).join(',')}) SELECT ?,${values} FROM json_each(?) WHERE 1 ON CONFLICT(owner,${keys.join(',')}) DO UPDATE SET ${updates}`).bind(owner,JSON.stringify(saved)));
 }
 return statements;
}

async function commit(db:D1Database,request:CommitRequest) {
 const {owner,operationId:op,payload,before,after,now,undoOf}=request;
 const changes=delta(before,after),result={operationId:op,revision:before.revision+1,changedIds:changes.actions.map(x=>(x.after??x.before)!.id),...(request.resolved?{resolved:request.resolved}:{})};
 // The INSERT trigger checks the latest operation revision before any row writes.
 // Receipt, related records and identity markers commit or roll back as one batch.
 const statements=[db.prepare('INSERT INTO operations(owner,operation_id,canonical_payload,result,delta,revision_before,revision_after,undo_of,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(owner,op,payload,JSON.stringify(result),JSON.stringify(changes),before.revision,result.revision,undoOf,now)];
 const tables=[
  {name:'actions',changes:changes.actions,keys:['id'],columns:['id','title','revision','parent_id','project_id','status','due_at','defer_until','notes','order','flagged','created_at','updated_at']},
  {name:'projects',changes:changes.projects,keys:['id'],columns:['id','name','description','parent_id','order','revision','created_at','updated_at']},
  {name:'tags',changes:changes.tags,keys:['id'],columns:['id','name','description','parent_id','order','revision','created_at','updated_at']},
  {name:'perspectives',changes:changes.perspectives.map(x=>({before:x.before?{...x.before,filter:canonical(x.before.filter)}:null,after:x.after?{...x.after,filter:canonical(x.after.filter)}:null})),keys:['id'],columns:['id','name','description','filter','definition_version','revision','created_at','updated_at']},
  {name:'action_tags',changes:changes.action_tags,keys:['action_id','tag_id'],columns:['action_id','tag_id','revision']}
 ];
 for(const table of tables)statements.push(...rowStatements(db,owner,table.name,table.columns,table.keys,table.changes));
 const oldMarkers=new Map(before.catalog_identity_ledger.map(x=>[JSON.stringify([x.kind,x.identity]),x]));
 const markerChanges=after.catalog_identity_ledger.flatMap(row=>{const old=oldMarkers.get(JSON.stringify([row.kind,row.identity]))??null;return canonical(old)===canonical(row)?[]:[{before:old,after:row}];});
 statements.push(...rowStatements(db,owner,'catalog_identity_ledger',['kind','identity','revision'],['kind','identity'],markerChanges));
 // Revisions increase by one per write. Undo receipts are newer than their target,
 // so pruning the oldest prefix cannot lose a retained target's Undo marker.
 statements.push(db.prepare('DELETE FROM operations WHERE owner=? AND revision_after<=?').bind(owner,result.revision-OPERATION_HISTORY_LIMIT));
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

export function createD1ActionStore(db:D1Database):ActionStore {return {
 readSnapshot:owner=>snapshot(db,owner),
 readReceipt:(owner,op)=>receipt(db,owner,op),
 async hasUndo(owner,undoOf){return !!await db.prepare('SELECT operation_id FROM operations WHERE owner=? AND undo_of=?').bind(owner,undoOf).first();},
 commit:request=>commit(db,request)
};}
