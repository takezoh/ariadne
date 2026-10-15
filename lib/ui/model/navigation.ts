import { perspectiveFilter } from '../../domain/core';
import { evaluatePerspectiveQuery, normalizePerspectiveQuery, perspectiveReferenceIds } from '../../domain/perspective-query';
import type { PerspectiveFilter, PerspectiveQuery, PerspectiveQueryCondition, ProjectedPerspectiveAction, PerspectiveQueryCatalog } from '../../domain/perspective-query';

export type NavigationView='inbox'|'projects'|'tags'|'flagged'|'history'|'perspective';
export type NavigationStatus='active'|'on-hold'|'completed'|'dropped';
export interface NavigationSettings {classificationId:string;perspectiveId:string|null;includeDescendants:boolean;statuses:NavigationStatus[];includeDeferred:boolean}
export interface NavigationSelection extends NavigationSettings {view:NavigationView;remembered?:Partial<Record<NavigationView,NavigationSettings>>}
export interface NavigationAction {id:string;title:string;status:string;project_id?:string|null;project_path?:string|null;tags?:{id:string;name:string;path?:string}[];is_deferred?:boolean;flagged?:boolean;[key:string]:unknown}
export interface NavigationCatalog {order:number;id:string;name:string;path?:string;parent_id?:string|null;description?:string}
export interface NavigationFilter {statuses?:readonly string[];is_deferred?:boolean;flagged?:boolean;project_id?:string|null;tag_id?:string;include_descendants?:boolean}
export type NavigationPerspective={id:string;name:string;description?:string}&(
 {definition_version:1;filter:PerspectiveFilter;query?:never}|{definition_version:2;query:PerspectiveQuery;filter?:never}
);
export interface NavigationSnapshot {actions:NavigationAction[];projects?:NavigationCatalog[];tags?:NavigationCatalog[];perspectives?:NavigationPerspective[];list_scopes?:Record<string,string[]>}
/** Validate persisted Perspective variants before a UI snapshot can replace the confirmed state. */
export function validPerspectiveSnapshot(value:unknown):boolean {
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const snapshot=value as {perspectives?:unknown;projects?:unknown;tags?:unknown};
 if(!Array.isArray(snapshot.perspectives)||!Array.isArray(snapshot.projects)||!Array.isArray(snapshot.tags))return false;
 const projectIds=new Set(snapshot.projects.map(item=>item&&typeof item==='object'?'id' in item?(item as {id?:unknown}).id:undefined:undefined));
 const tagIds=new Set(snapshot.tags.map(item=>item&&typeof item==='object'?'id' in item?(item as {id?:unknown}).id:undefined:undefined));
 const seen=new Set<string>();
 try{
  for(const value of snapshot.perspectives){
   if(!value||typeof value!=='object'||Array.isArray(value))return false;
   const saved=value as Record<string,unknown>;
   if(typeof saved.id!=='string'||!saved.id||seen.has(saved.id)||typeof saved.name!=='string'||saved.description!==undefined&&typeof saved.description!=='string')return false;
   seen.add(saved.id);
   if(saved.definition_version===1){
    if(!Object.hasOwn(saved,'filter')||Object.hasOwn(saved,'query'))return false;
    const filter=perspectiveFilter(saved.filter);
    if(filter.project_id!==undefined&&filter.project_id!==null&&!projectIds.has(filter.project_id))return false;
    if(filter.tag_id!==undefined&&!tagIds.has(filter.tag_id))return false;
   }else if(saved.definition_version===2){
    if(!Object.hasOwn(saved,'query')||Object.hasOwn(saved,'filter'))return false;
    const references=perspectiveReferenceIds(normalizePerspectiveQuery(saved.query));
    if(references.project_ids.some(id=>!projectIds.has(id))||references.tag_ids.some(id=>!tagIds.has(id)))return false;
   }else return false;
  }
  return true;
 }catch{return false;}
}
/** Closed pure factory also embeds unchanged into the self-contained UI resource. */
export function createNavigationModel(){
 const names:Record<string,string>={inbox:'Inbox',projects:'Projects',tags:'Tags',flagged:'Flagged',history:'History',perspective:'Perspectives'};
 function initial(view:NavigationView='inbox'):NavigationSelection{return {view,classificationId:'all',perspectiveId:null,includeDescendants:false,statuses:view==='history'?['completed','dropped']:['active','on-hold'],includeDeferred:false};}
 function settings(current:NavigationSettings):NavigationSettings{return {classificationId:current.classificationId,perspectiveId:current.perspectiveId,includeDescendants:current.includeDescendants,statuses:[...current.statuses],includeDeferred:current.includeDeferred};}
 function select(current:NavigationSelection,patch:Partial<NavigationSelection>):NavigationSelection {
  const view=patch.view??current.view,remembered:Partial<Record<NavigationView,NavigationSettings>>={};for(const [key,value] of Object.entries(current.remembered||{}))if(value)remembered[key as NavigationView]=settings(value);
  if(view!==current.view)remembered[current.view]=settings(current);
  const next={...initial(view),...(view===current.view?current:remembered[view]),...patch,view,remembered};return {...next,statuses:[...next.statuses]};
 }
 function displayOptions(selection:NavigationSelection){return selection.view==='inbox'||selection.view==='perspective'?[]:selection.view==='history'?['completed','dropped']:['active','on-hold','completed','dropped','deferred'];}
 function toggleDisplay(selection:NavigationSelection,choice:string):NavigationSelection {if(!displayOptions(selection).includes(choice))return select(selection,{});if(choice==='deferred')return select(selection,{includeDeferred:!selection.includeDeferred});const statuses=['active','on-hold','completed','dropped'].filter(status=>status===choice?!selection.statuses.includes(status as NavigationStatus):selection.statuses.includes(status as NavigationStatus)) as NavigationStatus[];return select(selection,{statuses});}
 function displayFilter(selection:NavigationSelection):NavigationFilter{return {statuses:[...selection.statuses],...(selection.includeDeferred?{}:{is_deferred:false})};}
 function descendants(catalog:readonly NavigationCatalog[],id:string,include:boolean):Set<string>{const ids=new Set([id]);if(include){const children=new Map<string,string[]>();for(const item of catalog)if(item.parent_id){const rows=children.get(item.parent_id)||[];rows.push(item.id);children.set(item.parent_id,rows);}const pending=[id];while(pending.length){for(const child of children.get(pending.pop()!)||[])if(!ids.has(child)){ids.add(child);pending.push(child);}}}return ids;}
 function filterActions(snapshot:NavigationSnapshot,filter:NavigationFilter):NavigationAction[]|null {
  const projects=snapshot.projects??[],tags=snapshot.tags??[];
  const projectIds=new Set(projects.map(project=>project.id)),tagIds=new Set(tags.map(tag=>tag.id));
  if(filter.project_id&&!projectIds.has(filter.project_id)||filter.tag_id&&!tagIds.has(filter.tag_id))return null;
  const pids=filter.project_id?descendants(projects,filter.project_id,filter.include_descendants===true):null,tids=filter.tag_id?descendants(tags,filter.tag_id,filter.include_descendants===true):null;
  return snapshot.actions.filter(action=>(!Object.hasOwn(filter,'statuses')||filter.statuses!.includes(action.status))&&(!Object.hasOwn(filter,'is_deferred')||Boolean(action.is_deferred)===filter.is_deferred)&&(!Object.hasOwn(filter,'flagged')||Boolean(action.flagged)===filter.flagged)&&(!Object.hasOwn(filter,'project_id')||(filter.project_id===null?action.project_id===null:Boolean(action.project_id&&pids?.has(action.project_id))))&&(!tids||Boolean(action.tags?.some(tag=>tids.has(tag.id)))));
 }
 function evaluateSavedPerspective(snapshot:NavigationSnapshot,saved:NavigationPerspective):NavigationAction[]|null {
  let query:PerspectiveQuery;
  if(saved.definition_version===2)query=saved.query;else if(saved.definition_version===1)query=filterQuery(saved.filter);else return null;
  const projects=(snapshot.projects??[]).map(item=>({...item,parent_id:item.parent_id??null}));
  const tags=(snapshot.tags??[]).map(item=>({...item,parent_id:item.parent_id??null}));
  const action_tags=snapshot.actions.flatMap(action=>(action.tags??[]).map(tag=>({action_id:action.id,tag_id:tag.id,revision:0})));
  try{return [...evaluatePerspectiveQuery({projects,tags,action_tags} as unknown as PerspectiveQueryCatalog,snapshot.actions as unknown as ProjectedPerspectiveAction[],query)] as NavigationAction[];}catch{return null;}
 }
 function classificationName(snapshot:NavigationSnapshot,field:'project_id'|'tag_id',value:string|null):string {
  if(value===null)return field==='project_id'?'Unassigned':'Untagged';
  const rows=field==='project_id'?snapshot.projects??[]:snapshot.tags??[];
  const match=rows.find(item=>item.id===value);
  return match?.path??match?.name??'Unavailable classification';
 }
 function statusName(value:string):string{return ({active:'Active','on-hold':'On hold',completed:'Completed',dropped:'Dropped'} as Record<string,string>)[value]??value;}
 function conditionSummary(snapshot:NavigationSnapshot,condition:PerspectiveQueryCondition):string {
  if('and'in condition)return '('+condition.and.map(item=>conditionSummary(snapshot,item)).join(' AND ')+')';
  if('or'in condition)return '('+condition.or.map(item=>conditionSummary(snapshot,item)).join(' OR ')+')';
  if('not'in condition)return 'NOT ('+conditionSummary(snapshot,condition.not)+')';
  const field=condition.field,subject=field==='project_id'?'Project':field==='tag_id'?'Tag':field==='status'?'Status':field==='flagged'?'Flagged':'Deferred';
  const values='value'in condition?[condition.value]:condition.values;
  if(values.length===0)return condition.op==='in'?subject+' matches nothing (empty set)':subject+' matches everything (empty set)';
  const rendered=values.map(value=>field==='project_id'||field==='tag_id'?classificationName(snapshot,field,value as string|null):field==='status'?statusName(value as string):String(value)).join(', ');
  const operator=condition.op==='eq'?'is':condition.op==='ne'?'is not':condition.op==='in'?'is any of':'is none of';
  const descendants=field==='project_id'||field==='tag_id'?values.some(value=>value!==null)?(condition.include_descendants?' (including descendants)':' (direct matches only)'):'':'';
  return subject+' '+operator+' '+rendered+descendants;
 }
 function savedPerspectiveSummary(snapshot:NavigationSnapshot,saved:NavigationPerspective):string {
  if(saved.definition_version===1){
   const filter=perspectiveFilter(saved.filter),conditions:string[]=[];
   if(Object.hasOwn(filter,'statuses'))conditions.push(filter.statuses!.length?'Status is any of '+filter.statuses!.map(statusName).join(', '):'Status matches nothing (empty set)');
   if(Object.hasOwn(filter,'is_deferred'))conditions.push('Deferred is '+String(filter.is_deferred));
   if(Object.hasOwn(filter,'flagged'))conditions.push('Flagged is '+String(filter.flagged));
   if(Object.hasOwn(filter,'project_id'))conditions.push('Project is '+classificationName(snapshot,'project_id',filter.project_id!)+(filter.project_id!==null&&filter.include_descendants?' (including descendants)':filter.project_id!==null?' (direct matches only)':''));
   if(Object.hasOwn(filter,'tag_id'))conditions.push('Tag is '+classificationName(snapshot,'tag_id',filter.tag_id!) +(filter.include_descendants?' (including descendants)':' (direct matches only)'));
   return 'Conditions: '+(conditions.length?conditions.join('; '):'All actions')+'. Order: current Action tree order.';
  }
  const query=normalizePerspectiveQuery(saved.query),condition=query.where?conditionSummary(snapshot,query.where):'All actions';
  let order='current Action tree order';
  if(Object.hasOwn(query,'order_by')){
   const sortKeys=query.order_by??[];
   order=sortKeys.length?sortKeys.map(key=>{
    const label=({due_at:'Due date',defer_until:'Defer date',created_at:'Created time',updated_at:'Updated time',title:'Title',status:'Status',flagged:'Flag',order:'Saved order'} as Record<string,string>)[key.field];
    const nullable=key.field==='due_at'||key.field==='defer_until'?' (nulls '+key.nulls+')':'';
    return label+' '+(key.direction==='asc'?'ascending':'descending')+nullable;
   }).join(' → ')+' → Action ID ascending (tie-breaker)':'Action ID ascending';
  }
  return 'Conditions: '+condition+'. Order: '+order+'.';
 }
 function filterQuery(filter:NavigationFilter):PerspectiveQuery {
  const where:unknown[]=[];
  if(Object.hasOwn(filter,'statuses'))where.push({field:'status',op:'in',values:filter.statuses as PerspectiveFilter['statuses']});
  if(Object.hasOwn(filter,'is_deferred'))where.push({field:'is_deferred',op:'eq',value:filter.is_deferred});
  if(Object.hasOwn(filter,'flagged'))where.push({field:'flagged',op:'eq',value:filter.flagged});
  if(Object.hasOwn(filter,'project_id'))where.push({field:'project_id',op:'eq',value:filter.project_id,include_descendants:filter.include_descendants===true});
  if(Object.hasOwn(filter,'tag_id'))where.push({field:'tag_id',op:'eq',value:filter.tag_id,include_descendants:filter.include_descendants===true});
  return where.length?{where:{and:where as PerspectiveQueryCondition[]}}:{};
 }
 function present(snapshot:NavigationSnapshot,selection:NavigationSelection){
  const {view,classificationId,perspectiveId,includeDescendants,statuses}=selection;let heading=names[view],summary='',description='',actions:NavigationAction[]=[],unavailable=false;
  const catalog=view==='projects'?snapshot.projects??[]:snapshot.tags??[];const options=view==='projects'?[{id:'all',label:'All projects'},{id:'unassigned',label:'Unassigned'},...catalog.map(item=>({id:item.id,label:item.path??item.name}))]:view==='tags'?[{id:'all',label:'All tags'},{id:'untagged',label:'Untagged'},...catalog.map(item=>({id:item.id,label:item.path??item.name}))]:[];
  if(view==='inbox'){const ids=new Set(snapshot.list_scopes?.inbox??[]);actions=snapshot.actions.filter(action=>ids.has(action.id));}
  else if(view==='history'){actions=snapshot.actions.filter(a=>['completed','dropped'].includes(a.status)&&statuses.includes(a.status as NavigationStatus));}
  else if(view==='perspective'){const saved=snapshot.perspectives?.find(p=>p.id===perspectiveId);if(!saved){heading='Unavailable perspective';summary='This saved view is no longer available. Refresh to check its definition.';unavailable=true;}else{heading=saved.name;description=saved.description??'';const matching=evaluateSavedPerspective(snapshot,saved);if(matching===null){unavailable=true;summary='A referenced classification or definition is unavailable';}else{actions=matching;try{summary=savedPerspectiveSummary(snapshot,saved);}catch{unavailable=true;actions=[];summary='A referenced classification or definition is unavailable';}}}}
  else {
   const filter:NavigationFilter=displayFilter(selection);
   if(view==='flagged'){filter.flagged=true;}
   else if(classificationId!=='all'&&classificationId!=='unassigned'&&classificationId!=='untagged'){
    const item=catalog.find(item=>item.id===classificationId);if(!item){unavailable=true;heading='Unavailable '+(view==='projects'?'project':'tag');options.push({id:classificationId,label:'Unavailable selection'});}else{heading=item.path??item.name;description=item.description??'';if(view==='projects')filter.project_id=item.id;else filter.tag_id=item.id;filter.include_descendants=includeDescendants;}
   }else if(classificationId==='unassigned'){heading='Unassigned';filter.project_id=null;}else if(classificationId==='untagged'){heading='Untagged';}
   const matching=unavailable?null:filterActions(snapshot,filter);if(matching)actions=matching.filter(a=>view==='projects'&&classificationId==='all'?Boolean(a.project_id):view==='tags'&&classificationId==='all'?Boolean(a.tags?.length):view==='tags'&&classificationId==='untagged'?!a.tags?.length:true);
   if(unavailable)summary='This selection is no longer available';
  }
  return {heading,summary,description,actions,options,unavailable};
 }
 function creationContext(snapshot:NavigationSnapshot,selection:NavigationSelection,object?:{kind:string;id:string;catalogId?:string|null}|null){
  const payload:Record<string,unknown>={title:'',notes:'',project_id:null};
  if(object?.kind==='action'){const action=snapshot.actions.find(a=>a.id===object.id);if(action){payload.parent_id=action.id;payload.project_id=action.project_id??null;if(selection.view==='tags'&&object.catalogId&&snapshot.tags?.some(t=>t.id===object.catalogId))payload.tag_ids=[object.catalogId];}}
  else if(object?.kind==='project'&&snapshot.projects?.some(p=>p.id===object.id))payload.project_id=object.id;
  else if(object?.kind==='tag'&&snapshot.tags?.some(t=>t.id===object.id))payload.tag_ids=[object.id];
  if(selection.view==='flagged')payload.flagged=true;
  return {allowed:true,payload,label:'Add',reason:''};
 }

 return {initial,select,present,filterActions,creationContext,displayOptions,toggleDisplay,displayFilter};
}
