import {fail,object,exact,text,id,integer,canonical,change,validateGraph} from '../domain/core';
import {response,undo,preview,queryResponse,listPerspectives,queryPerspective} from '../domain/operations';
import type {Change, OperationResolution, Snapshot} from '../data/types';
import {finalizeChange,normalizeChange,type PreparedChange} from '../data/model/request';
import {parseReceiptResult} from '../data/model/storage';
import {decodeChangeCursor,DEFAULT_CHANGE_PAGE_SIZE,encodeChangeCursor,pageChangeWindow} from '../data/model/change-cursor';
import type {OwnerActionPorts} from './ports';

function generatedId(snapshot:Snapshot,newId:()=>string,operationId:string,reserved:Set<string>) {
 for(let attempt=0;attempt<8;attempt++){
  const value=id(newId());
  const alreadyUsed=reserved.has(value)||value===operationId||snapshot.actions.some(x=>x.id===value)||snapshot.projects.some(x=>x.id===value)||snapshot.tags.some(x=>x.id===value)||snapshot.perspectives.some(x=>x.id===value)||snapshot.catalog_identity_ledger.some(x=>(x.kind==='project'||x.kind==='tag'||x.kind==='perspective')&&x.identity===value);
  if(!alreadyUsed){reserved.add(value);return value;}
 }
 return fail('unavailable','一意なIDを生成できません。',503);
}

function prepareChange(snapshot:Snapshot,requested:Change,newId:()=>string,operationId:string):PreparedChange {
 const normalized=normalizeChange(snapshot,requested),reserved=new Set<string>();
 const explicitIds=Array.from({length:normalized.idSlots},()=>generatedId(snapshot,newId,operationId,reserved));
 return finalizeChange(snapshot,operationId,normalized,explicitIds);
}

function previewResolution(resolved:OperationResolution|undefined,createdActionIds?:readonly string[]) {
 if(!resolved)return undefined;
 return {
  ...(resolved.actions?{actions:resolved.actions.map(x=>({...x,...(!createdActionIds||createdActionIds.includes(x.id)?{preview_only:true as const}:{})}))}:{}),
  ...(resolved.project?{project:resolved.project.created?{...resolved.project,preview_only:true as const}:resolved.project}:{}),
  ...(resolved.tag?{tag:resolved.tag.created?{...resolved.tag,preview_only:true as const}:resolved.tag}:{}),
  ...(resolved.perspective?{perspective:{...resolved.perspective,preview_only:true as const}}:{})
 };
}

export async function actionCall(ports:OwnerActionPorts,name:string,args:unknown) {
 async function readCurrent(){const snapshot=await ports.store.readSnapshot();validateGraph(snapshot);return snapshot;}
 async function fullSnapshot(snapshot:Snapshot,now:string,result:unknown=null){const scope=await ports.changeCursorScope();return response(snapshot,now,result,encodeChangeCursor(scope,snapshot.revision));}
 const {store,clock,newId}=ports;
 const a=object(args),now=clock();
 if(name==='open_actions'||name==='open_verification'||name==='list_actions'||name==='get_relevant_context'){exact(a,[]);return fullSnapshot(await readCurrent(),now);}
 if(name==='get_change_cursor'){
  exact(a,[]);const snapshot=await readCurrent(),scope=await ports.changeCursorScope();
  return {schemaVersion:2,revision:snapshot.revision,cursor:encodeChangeCursor(scope,snapshot.revision)};
 }
 if(name==='get_changes'){
  exact(a,['cursor','page_size']);const cursor=decodeChangeCursor(a.cursor),scope=await ports.changeCursorScope();
  if(cursor.scope!==scope)fail('invalid_cursor','This cursor is invalid for the authenticated owner. Fetch a current snapshot and cursor to resync.');
  const pageSize=a.page_size===undefined?DEFAULT_CHANGE_PAGE_SIZE:a.page_size;
  if(!Number.isSafeInteger(pageSize)||Number(pageSize)<1||Number(pageSize)>100)fail('invalid_input','page_size must be an integer from 1 through 100.');
  const window=await store.readChangeWindow(cursor.position,cursor.through_revision);
  return pageChangeWindow(window,cursor,scope,Number(pageSize));
 }
 if(name==='list_perspectives'){exact(a,[]);return listPerspectives(await readCurrent(),now);}
 if(name==='query_perspective'){exact(a,['id']);return queryPerspective(await readCurrent(),now,a.id);}
 if(name==='query_actions'){exact(a,['project_id','tag_id','include_descendants','status','is_deferred','flagged']);return queryResponse(await readCurrent(),now,a);}
 if(name==='operation_status'){exact(a,['operationId']);const r=await store.readReceipt(id(a.operationId));return {schemaVersion:2,status:r?'applied':'not_observed',result:r?parseReceiptResult(r):null};}
 if(name==='preview_change'){
  exact(a,['expectedRevision','kind','payload']);const s=await readCurrent();if(integer(a.expectedRevision)!==s.revision)fail('conflict','最新状態を取得してください。',409);
  const requested={kind:text(a.kind,40),payload:object(a.payload)},prepared=prepareChange(s,requested,newId,'00000000-0000-4000-8000-000000000000');
  if(!prepared.change)return {schemaVersion:2,expectedRevision:s.revision,kind:requested.kind,payload:requested.payload,affected:[],affected_projects:[],affected_tags:[],affected_perspectives:[],warnings:[],evaluatedAt:now,resolved:previewResolution(prepared.resolved,prepared.createdActionIds)};
  const result=preview(s,prepared.change,now),actionRefs=prepared.actionRefs??new Map<string,string>(),candidateIds=new Set(prepared.createdActionIds??[]);
  const affected=result.affected.map(item=>{const ref=actionRefs.get(item.id);if(ref)return candidateIds.has(item.id)?{...item,id:ref,ref,preview_only:true}:{...item,ref};if(candidateIds.has(item.id))return {...item,preview_only:true};return item;});
  const projectCandidate=prepared.resolved?.project?.created?prepared.resolved.project.id:null,tagCandidate=prepared.resolved?.tag?.created?prepared.resolved.tag.id:null;
  const affected_projects=result.affected_projects.map(item=>projectCandidate===item.id?{...item,preview_only:true}:item),affected_tags=result.affected_tags.map(item=>tagCandidate===item.id?{...item,preview_only:true}:item);
  const perspectiveCandidate=prepared.resolved?.perspective?.id;
  const affected_perspectives=result.affected_perspectives.map(item=>perspectiveCandidate===item.after?.id?{...item,after:{...item.after,preview_only:true}}:item);
  const publicPayload=requested.kind==='defer'?result.payload:requested.kind==='reopen'?{...requested.payload,reopen_ancestors:result.payload.reopen_ancestors}:requested.payload;
  return {...result,kind:requested.kind,payload:publicPayload,affected,affected_projects,affected_tags,affected_perspectives,...(prepared.resolved?{resolved:previewResolution(prepared.resolved,prepared.createdActionIds)}:{})};
 }
 let operationId:string,expected:number|undefined,c:Change,undoOf:string|null=null;
 if(name==='add_action'){exact(a,['title','request_id','expected_revision','schemaVersion']);if(a.schemaVersion!==2)fail('schema_mismatch','画面を再表示してください。未保存案は保持してください。',409);operationId=id(a.request_id);expected=integer(a.expected_revision);c={kind:'add',payload:{title:a.title}};}
 else if(name==='rename_action'){exact(a,['id','title','request_id','expected_revision','schemaVersion']);if(a.schemaVersion!==2)fail('schema_mismatch','画面を再表示してください。',409);operationId=id(a.request_id);expected=integer(a.expected_revision);c={kind:'edit',payload:{id:a.id,title:a.title}};}
 else if(name==='capture_intent'){exact(a,['operationId','expectedRevision','schemaVersion','title','text','source']);if(a.schemaVersion!==2)fail('schema_mismatch','版を確認してください。');operationId=id(a.operationId);expected=integer(a.expectedRevision);c={kind:'capture',payload:{title:a.title,text:a.text,source:a.source??'conversation'}};}
 else if(name==='apply_change'||name==='undo_change'){
  exact(a,name==='undo_change'?['operationId','expectedRevision','schemaVersion','undoOf']:['operationId','expectedRevision','schemaVersion','kind','payload']);if(a.schemaVersion!==2)fail('schema_mismatch','版を確認してください。');operationId=id(a.operationId);expected=integer(a.expectedRevision);c={kind:text(a.kind??'undo',40),payload:object(a.payload??{})};if(name==='undo_change')undoOf=id(a.undoOf);
 } else fail('unknown_tool','未対応の操作です。',404);

 const original=canonical({name,args:a}),prior=await store.readReceipt(operationId);
 if(prior){if(prior.canonical_payload!==original)fail('idempotency_conflict','同じ要求IDに異なる入力が指定されています。',409);return fullSnapshot(await readCurrent(),now,parseReceiptResult(prior));}
 const before=await readCurrent();if(before.revision!==expected)fail('conflict','最新の一覧と未保存案を確認してください。',409);
 let after:Snapshot,resolved:OperationResolution|undefined;
 if(undoOf){const target=await store.readReceipt(undoOf);if(!target)fail('not_found','取り消す操作が見つからないか、履歴の保持範囲外です。',404);if(target.undo_of)fail('invalid_state','取り消し操作自体の取り消しは未対応です。');const used=await store.hasUndo(undoOf);if(used)fail('undo_conflict','既に取り消されています。',409);after=undo(before,JSON.parse(target.delta),now,target.revision_after);}
 else {const prepared=prepareChange(before,c,newId,operationId);resolved=prepared.resolved;after=prepared.change?change(before,prepared.change,now):structuredClone(before);}

 if(new TextEncoder().encode(original).length>262144)fail('operation_too_large','入力が大きすぎます。');
 const result=await store.commit({operationId,payload:original,before,after,now,undoOf,resolved});return fullSnapshot(await readCurrent(),now,result);
}
