import type {NavigationSnapshot,NavigationCatalog,NavigationAction,NavigationFilter} from './navigation';
export interface OutlineEntry {key:string;kind:'project'|'tag'|'group'|'action';id:string;level:number;label:string;parentKey:string|null;catalogId:string|null;expandable:boolean;action?:NavigationAction}
interface MembershipIndex {rows:NavigationAction[];ids:Set<string>;children:Map<string,NavigationAction[]>;roots:NavigationAction[]}
const membershipKey=(id:string|null)=>id===null?'\u0000':id;
function catalogIndex(catalog:readonly NavigationCatalog[]){return new Map(catalog.map(record=>[record.id,record]));}
function catalogChildren(catalog:readonly NavigationCatalog[]){const children=new Map<string,NavigationCatalog[]>();for(const record of catalog){const parent=record.parent_id??null;if(parent===null)continue;const rows=children.get(parent)||[];rows.push(record);children.set(parent,rows);}return children;}
function membershipIndex(actions:readonly NavigationAction[],kind:'project'|'tag'){
 const groups=new Map<string,MembershipIndex>();
 for(const action of actions){
  const ids:(string|null)[]=kind==='project'?[typeof action.project_id==='string'?action.project_id:null]:(action.tags?.length?Array.from(new Set<string>(action.tags.map(tag=>tag.id))):[null]);
  for(const id of ids){const key=membershipKey(id),group:MembershipIndex=groups.get(key)||{rows:[],ids:new Set<string>(),children:new Map<string,NavigationAction[]>(),roots:[]};group.rows.push(action);group.ids.add(action.id);groups.set(key,group);}
 }
 for(const group of groups.values())for(const action of group.rows){
  const parent=typeof action.parent_id==='string'?action.parent_id:null;
  if(parent&&group.ids.has(parent)){const children=group.children.get(parent)||[];children.push(action);group.children.set(parent,children);}
  else group.roots.push(action);
 }
 return groups;
}
/** Catalog membership is direct; containment affects indentation only inside a membership. */
export function createCatalogTreeModel(){
 function outline(snapshot:NavigationSnapshot,view:'projects'|'tags',filter:NavigationFilter,collapsed:readonly string[]=[],revealId:string|null=null){
  const kind=view==='projects'?'project':'tag',catalog=[...(view==='projects'?snapshot.projects||[]:snapshot.tags||[])].map(record=>{if(!Number.isSafeInteger(record.order)||record.order<0)throw Error('Catalog order is invalid.');return record;}).sort((a,b)=>(a.order-b.order)||(a.name<b.name?-1:a.name>b.name?1:0)||(a.id<b.id?-1:a.id>b.id?1:0));
  const byId=catalogIndex(catalog),childrenByParent=catalogChildren(catalog),eligible=snapshot.actions.filter(action=>action.id===revealId||(!Object.hasOwn(filter,'statuses')||filter.statuses!.includes(action.status))&&(!Object.hasOwn(filter,'is_deferred')||Boolean(action.is_deferred)===filter.is_deferred));
  const memberships=membershipIndex(eligible,kind),entries:OutlineEntry[]=[],visited=new Set<string>();
  const members=(id:string|null)=>memberships.get(membershipKey(id));
  function actions(id:string|null,level:number,parentKey:string){
  const group=members(id);if(!group)return;const seen=new Set<string>(),childrenByParent=group.children;
  function visit(action:NavigationAction,depth:number,parent:string){if(seen.has(action.id))return;seen.add(action.id);const key=parentKey+':action:'+action.id;entries.push({key,kind:'action',id:action.id,level:depth,label:action.title,parentKey:parent,catalogId:id,expandable:false,action});for(const child of childrenByParent.get(action.id)||[])visit(child,depth+1,key);}
   for(const action of group.roots)visit(action,level,parentKey);
   for(const action of group.rows)visit(action,level,parentKey);
  }
  function node(record:NavigationCatalog,level:number,parentKey:string|null){
   if(visited.has(record.id))return;visited.add(record.id);const key=kind+':'+record.id,children=childrenByParent.get(record.id)||[],membership=members(record.id);
   entries.push({key,kind,id:record.id,level,label:record.name||'Untitled '+kind,parentKey,catalogId:record.id,expandable:Boolean(children.length||membership?.rows.length)});
   if(collapsed.includes(key))return;actions(record.id,level+1,key);for(const child of children)node(child,level+1,key);
  }
  for(const record of catalog)if(!record.parent_id||!byId.has(record.parent_id))node(record,0,null);
  for(const record of catalog){let parent=record.parent_id,hidden=false;const chain=new Set<string>();while(parent&&!chain.has(parent)){chain.add(parent);if(collapsed.includes(kind+':'+parent)){hidden=true;break;}parent=byId.get(parent)?.parent_id??null;}if(!hidden)node(record,0,null);}
  const key=kind+':none',unassigned=members(null);entries.push({key,kind:'group',id:kind==='project'?'unassigned':'untagged',level:0,label:kind==='project'?'Unassigned':'Untagged',parentKey:null,catalogId:null,expandable:Boolean(unassigned?.rows.length)});
  if(!collapsed.includes(key))actions(null,1,key);return entries;
 }
 function reveal(snapshot:NavigationSnapshot,view:string,id:string,collapsed:readonly string[]){
  if(view!=='projects'&&view!=='tags')return [...collapsed];const kind=view==='projects'?'project':'tag',action=snapshot.actions.find(item=>item.id===id);if(!action)return [...collapsed];const catalog=view==='projects'?snapshot.projects||[]:snapshot.tags||[],byId=catalogIndex(catalog),groups=view==='projects'?[action.project_id??null]:(action.tags?.length?action.tags.map(tag=>tag.id):[null]),open=new Set<string>();
  for(const group of groups){if(group===null){open.add(kind+':none');continue;}let node=byId.get(group);while(node&&!open.has(kind+':'+node.id)){open.add(kind+':'+node.id);node=byId.get(node.parent_id||'');}}
  return collapsed.filter(key=>!open.has(key));
 }
 function label(catalog:readonly NavigationCatalog[],id:string,kind:'project'|'tag',prepared?:Map<string,NavigationCatalog>){const parts:string[]=[],seen=new Set<string>(),byId=prepared||catalogIndex(catalog);let node=byId.get(id);while(node&&!seen.has(node.id)){seen.add(node.id);parts.unshift(node.name||'Untitled '+kind);node=byId.get(node.parent_id||'');}return parts.join(' / ');}
 function range(anchor:string|null,key:string,entries:readonly OutlineEntry[],shift:boolean){const visible=entries.filter(entry=>entry.kind==='action').map(entry=>entry.key),positions=new Map(visible.map((value,index)=>[value,index]));if(!positions.has(key))return {keys:[] as string[],anchor:null};const a=anchor?positions.get(anchor):undefined,b=positions.get(key);if(shift&&a!==undefined&&b!==undefined)return {keys:visible.slice(Math.min(a,b),Math.max(a,b)+1),anchor};return {keys:[key],anchor:key};}
 return {outline,range,label,reveal,index:catalogIndex};
}
