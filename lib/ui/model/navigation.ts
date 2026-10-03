export type NavigationView='inbox'|'projects'|'tags'|'flagged'|'history'|'perspective';
export type NavigationStatus='active'|'on-hold'|'completed'|'dropped';
export interface NavigationSettings {classificationId:string;perspectiveId:string|null;includeDescendants:boolean;statuses:NavigationStatus[];includeDeferred:boolean}
export interface NavigationSelection extends NavigationSettings {view:NavigationView;remembered?:Partial<Record<NavigationView,NavigationSettings>>}
export interface NavigationAction {id:string;title:string;status:string;project_id?:string|null;project_path?:string|null;tags?:{id:string;name:string;path?:string}[];is_deferred?:boolean;flagged?:boolean;[key:string]:unknown}
export interface NavigationCatalog {order:number;id:string;name:string;path?:string;parent_id?:string|null;description?:string}
export interface NavigationFilter {statuses?:string[];is_deferred?:boolean;flagged?:boolean;project_id?:string|null;tag_id?:string;include_descendants?:boolean}
export interface NavigationPerspective {id:string;name:string;description?:string;filter:NavigationFilter}
export interface NavigationSnapshot {actions:NavigationAction[];projects?:NavigationCatalog[];tags?:NavigationCatalog[];perspectives?:NavigationPerspective[];list_scopes?:Record<string,string[]>}
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
 function descendants(catalog:readonly NavigationCatalog[],id:string,include:boolean):Set<string>{const ids=new Set([id]);if(include){let changed=true;while(changed){changed=false;for(const item of catalog)if(item.parent_id&&ids.has(item.parent_id)&&!ids.has(item.id)){ids.add(item.id);changed=true;}}}return ids;}
 function filterActions(snapshot:NavigationSnapshot,filter:NavigationFilter):NavigationAction[]|null {
  const projects=snapshot.projects??[],tags=snapshot.tags??[];
  if(filter.project_id&&!projects.some(p=>p.id===filter.project_id)||filter.tag_id&&!tags.some(t=>t.id===filter.tag_id))return null;
  const pids=filter.project_id?descendants(projects,filter.project_id,filter.include_descendants===true):null,tids=filter.tag_id?descendants(tags,filter.tag_id,filter.include_descendants===true):null;
  return snapshot.actions.filter(action=>(!Object.hasOwn(filter,'statuses')||filter.statuses!.includes(action.status))&&(!Object.hasOwn(filter,'is_deferred')||Boolean(action.is_deferred)===filter.is_deferred)&&(!Object.hasOwn(filter,'flagged')||Boolean(action.flagged)===filter.flagged)&&(!Object.hasOwn(filter,'project_id')||(filter.project_id===null?action.project_id===null:Boolean(action.project_id&&pids?.has(action.project_id))))&&(!tids||Boolean(action.tags?.some(tag=>tids.has(tag.id)))));
 }
 function present(snapshot:NavigationSnapshot,selection:NavigationSelection){
  const {view,classificationId,perspectiveId,includeDescendants,statuses}=selection;let heading=names[view],summary='',description='',actions:NavigationAction[]=[],unavailable=false;
  const catalog=view==='projects'?snapshot.projects??[]:snapshot.tags??[];const options=view==='projects'?[{id:'all',label:'All projects'},{id:'unassigned',label:'Unassigned'},...catalog.map(item=>({id:item.id,label:item.path??item.name}))]:view==='tags'?[{id:'all',label:'All tags'},{id:'untagged',label:'Untagged'},...catalog.map(item=>({id:item.id,label:item.path??item.name}))]:[];
  if(view==='inbox'){const ids=new Set(snapshot.list_scopes?.inbox??[]);actions=snapshot.actions.filter(action=>ids.has(action.id));}
  else if(view==='history'){actions=snapshot.actions.filter(a=>['completed','dropped'].includes(a.status)&&statuses.includes(a.status as NavigationStatus));}
  else if(view==='perspective'){const saved=snapshot.perspectives?.find(p=>p.id===perspectiveId);if(!saved){heading='Unavailable perspective';summary='This saved view is no longer available. Refresh to check its definition.';unavailable=true;}else{heading=saved.name;description=saved.description??'';const matching=filterActions(snapshot,saved.filter);if(matching===null){unavailable=true;summary='A referenced classification is unavailable';}else actions=matching;}}
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
