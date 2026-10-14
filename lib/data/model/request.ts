import {fail,object,exact,text,catalogName,actionTitle,initialTagIds,description,id,actionOrder,booleanFlag,perspectiveFilter,validatePerspectiveReferences} from '../../domain/core';
import {validatePerspectiveQueryReferences} from '../../domain/perspective-query';
import type {Change,OperationResolution,Snapshot} from '../types';

export type PreparedChange=Readonly<{idSlots:number;change:Change|null;resolved?:OperationResolution;actionRefs?:ReadonlyMap<string,string>;createdActionIds?:readonly string[]}>;

export function normalizeChange(snapshot:Snapshot,requested:Change):PreparedChange {
 let idSlots=0;const generatedId=()=>`__generated_id_${idSlots++}__`;
 const kind=requested.kind,p=object(requested.payload);
 if(kind==='perspective_add'){
  exact(p,['name','description','filter','query']);const hasFilter=Object.hasOwn(p,'filter'),hasQuery=Object.hasOwn(p,'query');if(hasFilter===hasQuery)fail('invalid_input','filterまたはqueryのどちらか一方を指定してください。');const initialDescription='description' in p?description(p.description):'',name=text(p.name);let definition:{filter:ReturnType<typeof perspectiveFilter>}|{query:ReturnType<typeof validatePerspectiveQueryReferences>};if(hasFilter){const filter=perspectiveFilter(p.filter);validatePerspectiveReferences(snapshot,filter);definition={filter};}else definition={query:validatePerspectiveQueryReferences(snapshot,p.query)};
  const entityId=generatedId();
  return {idSlots,change:{kind,payload:{id:entityId,name,description:initialDescription,...definition}},resolved:{perspective:{id:entityId}}};
 }
 if(kind==='add'){
  exact(p,['title','parent_id','project_id','notes','order','flagged','tag_ids']);
  const tagIds=initialTagIds(snapshot,p.tag_ids),projectId=p.project_id===undefined||p.project_id===null?null:id(p.project_id);
  if(projectId&&!snapshot.projects.some(x=>x.id===projectId))fail('not_found','プロジェクトがありません。',404);
  const title=actionTitle(p.title),parentId=p.parent_id===undefined||p.parent_id===null?null:id(p.parent_id);
  if(parentId&&!snapshot.actions.some(x=>x.id===parentId))fail('not_found','親アクションがありません。',404);
  const notes=p.notes===undefined?'':typeof p.notes==='string'&&p.notes.length<=65536?p.notes:fail('invalid_input','メモが不正です。');
  if(p.order!==undefined)actionOrder(p.order);if(p.flagged!==undefined)booleanFlag(p.flagged);
  const entityId=generatedId();
  return {idSlots,change:{kind:'add',payload:{id:entityId,title,parent_id:parentId,notes,tag_ids:tagIds,...(p.project_id!==undefined?{project_id:p.project_id}:{}),...(p.order!==undefined?{order:p.order}:{}),...(p.flagged!==undefined?{flagged:p.flagged}:{})}},resolved:{actions:[{id:entityId}]},createdActionIds:[entityId]};
 }
 if(kind==='capture'){
  exact(p,['title','text','source']);const title=text(p.title);text(p.text,65536);if((p.text as string).length>65536)fail('invalid_input','元入力が大きすぎます。');const captureText=p.text as string;
  const entityId=generatedId();
  return {idSlots,change:{kind:'add',payload:{id:entityId,title,notes:captureText}},resolved:{actions:[{id:entityId}]},createdActionIds:[entityId]};
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
  const refs=new Map<string,string>();for(const [index,ref] of [...refSet].entries())refs.set(ref,index===0?inboxId:generatedId());
  const internalActions=normalizedActions.map(actionValue=>({id:refs.get(actionValue.ref),title:actionValue.title,...(actionValue.parent_ref!==undefined?{parent_id:refs.get(actionValue.parent_ref)}:actionValue.parent_id!==undefined?{parent_id:actionValue.parent_id}:{}),...(actionValue.notes!==undefined?{notes:actionValue.notes}:{}),...(actionValue.order!==undefined?{order:actionValue.order}:{}),...(actionValue.flagged!==undefined?{flagged:actionValue.flagged}:{})}));
  const actionRefs=new Map([...refs].map(([ref,entityId])=>[entityId,ref]));
  return {idSlots,change:{kind:'structure',payload:{inbox_action_id:inboxId,actions:internalActions}},resolved:{actions:[...refs].map(([ref,entityId])=>({ref,id:entityId}))},actionRefs,createdActionIds:[...refs.values()].slice(1)};
 }
 if(kind==='project_get_or_create'||kind==='tag_get_or_create'){
  exact(p,['name','description','parent_id']);const initialDescription='description' in p?description(p.description):'',name=text(p.name,200),parentId=p.parent_id===undefined||p.parent_id===null?null:id(p.parent_id);
  const isProject=kind==='project_get_or_create',nodes=isProject?snapshot.projects:snapshot.tags;
  if(parentId&&!nodes.some(x=>x.id===parentId))fail('not_found',isProject?'親プロジェクトがありません。':'親タグがありません。',404);
  const existing=nodes.find(x=>x.name===name&&x.parent_id===parentId);
  if(existing)return {idSlots,change:null,resolved:isProject?{project:{id:existing.id,created:false}}:{tag:{id:existing.id,created:false}}};
  const entityId=generatedId(),internalKind=isProject?'project_add':'tag_add';
  return {idSlots,change:{kind:internalKind,payload:{id:entityId,name,description:initialDescription,parent_id:parentId}},resolved:isProject?{project:{id:entityId,created:true}}:{tag:{id:entityId,created:true}}};
 }
 if(kind==='project_add'||kind==='tag_add'){
  exact(p,['name','description','parent_id']);const name=catalogName(p.name),initialDescription='description' in p?description(p.description):'',parentId=p.parent_id===undefined||p.parent_id===null?null:id(p.parent_id),isProject=kind==='project_add',nodes=isProject?snapshot.projects:snapshot.tags;
  if(parentId&&!nodes.some(x=>x.id===parentId))fail('not_found','Parent catalog object is unavailable.',404);
  if(name&&nodes.some(x=>x.name===name&&x.parent_id===parentId))fail('invalid_state','A named sibling already exists.');
  const entityId=generatedId();
  return {idSlots,change:{kind,payload:{id:entityId,name,description:initialDescription,parent_id:parentId}},resolved:isProject?{project:{id:entityId,created:true}}:{tag:{id:entityId,created:true}}};
 }
 if(kind==='structure'||kind==='capture')fail('invalid_input','IDを含む旧形式は新しい要求では使用できません。');
 return {idSlots,change:requested};
}


/** Inject explicit IDs into a normalized request without allocating them or touching caller data. */
export function finalizeChange(snapshot:Snapshot,operationIdValue:string,prepared:PreparedChange,explicitIds:readonly string[]):PreparedChange {
 const operationId=id(operationIdValue);
 if(explicitIds.length!==prepared.idSlots)fail('invalid_state','Generated ID count does not match the normalized request.');
 const reserved=new Set<string>();
 const ids=explicitIds.map(value=>{
  const candidate=id(value);
  const collision=candidate===operationId||reserved.has(candidate)||snapshot.actions.some(row=>row.id===candidate)||snapshot.projects.some(row=>row.id===candidate)||snapshot.tags.some(row=>row.id===candidate)||snapshot.perspectives.some(row=>row.id===candidate)||snapshot.catalog_identity_ledger.some(row=>(row.kind==='project'||row.kind==='tag'||row.kind==='perspective')&&row.identity===candidate);
  if(collision)fail('invalid_input','Generated IDs must be unique and unused.');
  reserved.add(candidate);return candidate;
 });
 const replace=(value:unknown):unknown=>{
  if(typeof value!=='string')return value;
  const match=value.match(/^__generated_id_(\d+)__$/);
  if(!match)return value;
  const index=Number(match[1]);if(!Number.isSafeInteger(index)||!ids[index])fail('invalid_state','Normalized request contains an invalid generated ID slot.');
  return ids[index];
 };
 let change=prepared.change;
 if(change){
  const payload=change.payload;
  const finalizedPayload=change.kind==='add'||change.kind==='project_add'||change.kind==='tag_add'||change.kind==='perspective_add'
    ? {...payload,id:replace(payload.id)}
    : change.kind==='structure'&&Array.isArray(payload.actions)
      ? {...payload,actions:payload.actions.map(value=>{const row=object(value);return {...row,...('id' in row?{id:replace(row.id)}:{}),...('parent_id' in row?{parent_id:replace(row.parent_id)}:{})};})}
      : payload;
  change={...change,payload:finalizedPayload};
 }
 const resolved=prepared.resolved?{
  ...(prepared.resolved.actions?{actions:prepared.resolved.actions.map(row=>({...row,id:replace(row.id) as string}))}:{}),
  ...(prepared.resolved.perspective?{perspective:{...prepared.resolved.perspective,id:replace(prepared.resolved.perspective.id) as string}}:{}),
  ...(prepared.resolved.project?{project:{...prepared.resolved.project,id:replace(prepared.resolved.project.id) as string}}:{}),
  ...(prepared.resolved.tag?{tag:{...prepared.resolved.tag,id:replace(prepared.resolved.tag.id) as string}}:{})
 }:undefined;
 const actionRefs=prepared.actionRefs?new Map([...prepared.actionRefs].map(([key,value])=>[replace(key) as string,value])):undefined;
 const createdActionIds=prepared.createdActionIds?.map(value=>replace(value) as string);
 return {idSlots:prepared.idSlots,change,resolved,actionRefs,createdActionIds};
}
