import {fail,object,exact,text,catalogName,actionTitle,initialTagIds,description,id,integer,canonical,change,validateGraph,actionOrder,booleanFlag,perspectiveFilter,validatePerspectiveReferences,type Snapshot,type Change} from '../domain/core';
import {response,undo,validateDelta,preview,queryResponse,listPerspectives,queryPerspective} from '../domain/operations';
import type {OperationResolution,ActionPorts} from './ports';

type PreparedChange={change:Change|null;resolved?:OperationResolution;actionRefs?:Map<string,string>;createdActionIds?:string[]};

function generatedId(snapshot:Snapshot,newId:()=>string,operationId:string,reserved:Set<string>) {
 for(let attempt=0;attempt<8;attempt++){
  const value=id(newId());
  const alreadyUsed=reserved.has(value)||value===operationId||snapshot.actions.some(x=>x.id===value)||snapshot.projects.some(x=>x.id===value)||snapshot.tags.some(x=>x.id===value)||snapshot.perspectives.some(x=>x.id===value)||snapshot.catalog_identity_ledger.some(x=>(x.kind==='project'||x.kind==='tag'||x.kind==='perspective')&&x.identity===value);
  if(!alreadyUsed){reserved.add(value);return value;}
 }
 return fail('unavailable','一意なIDを生成できません。',503);
}

function prepareChange(snapshot:Snapshot,requested:Change,newId:()=>string,operationId:string):PreparedChange {
 const kind=requested.kind,p=object(requested.payload),reserved=new Set<string>();
 if(kind==='perspective_add'){
  exact(p,['name','description','filter']);const initialDescription='description' in p?description(p.description):'',name=text(p.name),filter=perspectiveFilter(p.filter);validatePerspectiveReferences(snapshot,filter);
  const entityId=generatedId(snapshot,newId,operationId,reserved);
  return {change:{kind,payload:{id:entityId,name,description:initialDescription,filter}},resolved:{perspective:{id:entityId}}};
 }
 if(kind==='add'){
  exact(p,['title','parent_id','project_id','notes','order','flagged','tag_ids']);
  const tagIds=initialTagIds(snapshot,p.tag_ids),projectId=p.project_id===undefined||p.project_id===null?null:id(p.project_id);
  if(projectId&&!snapshot.projects.some(x=>x.id===projectId))fail('not_found','プロジェクトがありません。',404);
  const title=actionTitle(p.title),parentId=p.parent_id===undefined||p.parent_id===null?null:id(p.parent_id);
  if(parentId&&!snapshot.actions.some(x=>x.id===parentId))fail('not_found','親アクションがありません。',404);
  const notes=p.notes===undefined?'':typeof p.notes==='string'&&p.notes.length<=65536?p.notes:fail('invalid_input','メモが不正です。');
  if(p.order!==undefined)actionOrder(p.order);if(p.flagged!==undefined)booleanFlag(p.flagged);
  const entityId=generatedId(snapshot,newId,operationId,reserved);
  return {change:{kind:'add',payload:{id:entityId,title,parent_id:parentId,notes,tag_ids:tagIds,...(p.project_id!==undefined?{project_id:p.project_id}:{}),...(p.order!==undefined?{order:p.order}:{}),...(p.flagged!==undefined?{flagged:p.flagged}:{})}},resolved:{actions:[{id:entityId}]},createdActionIds:[entityId]};
 }
 if(kind==='capture'){
  exact(p,['title','text','source']);const title=text(p.title);text(p.text,65536);if((p.text as string).length>65536)fail('invalid_input','元入力が大きすぎます。');const captureText=p.text as string;
  const entityId=generatedId(snapshot,newId,operationId,reserved);
  return {change:{kind:'add',payload:{id:entityId,title,notes:captureText}},resolved:{actions:[{id:entityId}]},createdActionIds:[entityId]};
 }
 if(kind==='structure_create'){
  exact(p,['inbox_action_id','actions']);
  const inboxId=id(p.inbox_action_id),inbox=snapshot.actions.find(x=>x.id===inboxId);
  if(!inbox)fail('invalid_state','この入力は未保存または整理済みです。');
  if(!Array.isArray(p.actions)||!p.actions.length)fail('invalid_input','構造化結果が不正です。');
  const actions=p.actions.map(object),refSet=new Set<string>();
  const normalizedActions=actions.map(actionValue=>{
   exact(actionValue,['ref','title','parent_ref','parent_id','notes','order','flagged']);
   const ref=text(actionValue.ref,80);if(refSet.has(ref))fail('invalid_input','refが重複しています。');refSet.add(ref);
   if('parent_ref' in actionValue&&'parent_id' in actionValue)fail('invalid_input','parent_refとparent_idは同時に指定できません。');
   const title=actionTitle(actionValue.title),parent_ref='parent_ref' in actionValue?text(actionValue.parent_ref,80):undefined,parent_id='parent_id' in actionValue?(actionValue.parent_id===null?null:id(actionValue.parent_id)):undefined;
   if(actionValue.notes!==undefined&&(typeof actionValue.notes!=='string'||actionValue.notes.length>65536))fail('invalid_input','メモが不正です。');
   if(parent_id&&!snapshot.actions.some(x=>x.id===parent_id))fail('not_found','親アクションがありません。',404);
   if(actionValue.order!==undefined)actionOrder(actionValue.order);if(actionValue.flagged!==undefined)booleanFlag(actionValue.flagged);
   return {ref,title,parent_ref,parent_id,notes:actionValue.notes,order:actionValue.order,flagged:actionValue.flagged};
  });
  for(const actionValue of normalizedActions)if(actionValue.parent_ref!==undefined&&!refSet.has(actionValue.parent_ref))fail('invalid_input','親refが未定義です。');
  const refs=new Map<string,string>();for(const [index,ref] of [...refSet].entries())refs.set(ref,index===0?inboxId:generatedId(snapshot,newId,operationId,reserved));
  const internalActions=normalizedActions.map(actionValue=>({id:refs.get(actionValue.ref),title:actionValue.title,...(actionValue.parent_ref!==undefined?{parent_id:refs.get(actionValue.parent_ref)}:actionValue.parent_id!==undefined?{parent_id:actionValue.parent_id}:{}),...(actionValue.notes!==undefined?{notes:actionValue.notes}:{}),...(actionValue.order!==undefined?{order:actionValue.order}:{}),...(actionValue.flagged!==undefined?{flagged:actionValue.flagged}:{})}));
  const actionRefs=new Map([...refs].map(([ref,entityId])=>[entityId,ref]));
  return {change:{kind:'structure',payload:{inbox_action_id:inboxId,actions:internalActions}},resolved:{actions:[...refs].map(([ref,entityId])=>({ref,id:entityId}))},actionRefs,createdActionIds:[...refs.values()].slice(1)};
 }
 if(kind==='project_get_or_create'||kind==='tag_get_or_create'){
  exact(p,['name','description','parent_id']);const initialDescription='description' in p?description(p.description):'',name=text(p.name,200),parentId=p.parent_id===undefined||p.parent_id===null?null:id(p.parent_id);
  const isProject=kind==='project_get_or_create',nodes=isProject?snapshot.projects:snapshot.tags;
  if(parentId&&!nodes.some(x=>x.id===parentId))fail('not_found',isProject?'親プロジェクトがありません。':'親タグがありません。',404);
  const existing=nodes.find(x=>x.name===name&&x.parent_id===parentId);
  if(existing)return {change:null,resolved:isProject?{project:{id:existing.id,created:false}}:{tag:{id:existing.id,created:false}}};
  const entityId=generatedId(snapshot,newId,operationId,reserved),internalKind=isProject?'project_add':'tag_add';
  return {change:{kind:internalKind,payload:{id:entityId,name,description:initialDescription,parent_id:parentId}},resolved:isProject?{project:{id:entityId,created:true}}:{tag:{id:entityId,created:true}}};
 }
 if(kind==='project_add'||kind==='tag_add'){
  exact(p,['name','description','parent_id']);const name=catalogName(p.name),initialDescription='description' in p?description(p.description):'',parentId=p.parent_id===undefined||p.parent_id===null?null:id(p.parent_id),isProject=kind==='project_add',nodes=isProject?snapshot.projects:snapshot.tags;
  if(parentId&&!nodes.some(x=>x.id===parentId))fail('not_found','Parent catalog object is unavailable.',404);
  if(name&&nodes.some(x=>x.name===name&&x.parent_id===parentId))fail('invalid_state','A named sibling already exists.');
  const entityId=generatedId(snapshot,newId,operationId,reserved);
  return {change:{kind,payload:{id:entityId,name,description:initialDescription,parent_id:parentId}},resolved:isProject?{project:{id:entityId,created:true}}:{tag:{id:entityId,created:true}}};
 }
 if(kind==='structure'||kind==='capture')fail('invalid_input','IDを含む旧形式は新しい要求では使用できません。');
 return {change:requested};
}

function previewResolution(resolved:OperationResolution|undefined,createdActionIds?:string[]) {
 if(!resolved)return undefined;
 return {
  ...(resolved.actions?{actions:resolved.actions.map(x=>({...x,...(!createdActionIds||createdActionIds.includes(x.id)?{preview_only:true as const}:{})}))}:{}),
  ...(resolved.project?{project:resolved.project.created?{...resolved.project,preview_only:true as const}:resolved.project}:{}),
  ...(resolved.tag?{tag:resolved.tag.created?{...resolved.tag,preview_only:true as const}:resolved.tag}:{}),
  ...(resolved.perspective?{perspective:{...resolved.perspective,preview_only:true as const}}:{})
 };
}

export async function actionCall(ports:ActionPorts,owner:string,name:string,args:unknown) {
 async function readCurrent(){const snapshot=await ports.store.readSnapshot(owner);validateGraph(snapshot);return snapshot;}
 function receiptResult(receipt:{delta:string;result:string}){try{validateDelta(JSON.parse(receipt.delta));const result=object(JSON.parse(receipt.result));id(result.operationId);integer(result.revision);if(!Array.isArray(result.changedIds))fail('invalid_state','Receipt changed IDs are required.');for(const value of result.changedIds)id(value);if(result.resolved!==undefined){const resolved=object(result.resolved);if(resolved.actions!==undefined){if(!Array.isArray(resolved.actions))fail('invalid_state','Receipt resolved actions must be an array.');for(const row of resolved.actions)id(object(row).id);}for(const key of ['project','tag','perspective'])if(resolved[key]!==undefined){const row=object(resolved[key]);id(row.id);if(key!=='perspective'&&typeof row.created!=='boolean')fail('invalid_state','Receipt creation state is required.');}}return result;}catch{fail('invalid_state','The receipt does not match the current schema.');}}

 const {store,clock,newId}=ports;
 if(!owner)fail('unauthenticated','利用者を確認できません。',401);const a=object(args),now=clock();
 if(name==='open_actions'||name==='open_verification'||name==='list_actions'||name==='get_relevant_context'){exact(a,[]);return response(await readCurrent(),now);}
 if(name==='list_perspectives'){exact(a,[]);return listPerspectives(await readCurrent(),now);}
 if(name==='query_perspective'){exact(a,['id']);return queryPerspective(await readCurrent(),now,a.id);}
 if(name==='query_actions'){exact(a,['project_id','tag_id','include_descendants','status','is_deferred','flagged']);return queryResponse(await readCurrent(),now,a);}
 if(name==='operation_status'){exact(a,['operationId']);const r=await store.readReceipt(owner,id(a.operationId));return {schemaVersion:2,status:r?'applied':'not_observed',result:r?receiptResult(r):null};}
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

 const original=canonical({name,args:a}),prior=await store.readReceipt(owner,operationId);
 if(prior){if(prior.canonical_payload!==original)fail('idempotency_conflict','同じ要求IDに異なる入力が指定されています。',409);return response(await readCurrent(),now,receiptResult(prior));}
 const before=await readCurrent();if(before.revision!==expected)fail('conflict','最新の一覧と未保存案を確認してください。',409);
 let after:Snapshot,resolved:OperationResolution|undefined;
 if(undoOf){const target=await store.readReceipt(owner,undoOf);if(!target)fail('not_found','取り消す操作が見つからないか、履歴の保持範囲外です。',404);if(target.undo_of)fail('invalid_state','取り消し操作自体の取り消しは未対応です。');const used=await store.hasUndo(owner,undoOf);if(used)fail('undo_conflict','既に取り消されています。',409);after=undo(before,JSON.parse(target.delta),now,target.revision_after);}
 else {const prepared=prepareChange(before,c,newId,operationId);resolved=prepared.resolved;after=prepared.change?change(before,prepared.change,now):structuredClone(before);}

 if(new TextEncoder().encode(original).length>262144)fail('operation_too_large','入力が大きすぎます。');
 const result=await store.commit({owner,operationId,payload:original,before,after,now,undoOf,resolved});return response(await readCurrent(),now,result);
}
