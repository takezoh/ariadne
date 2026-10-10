export interface MovementAction {id:string;parent_id?:string|null;project_id?:string|null;order:number}
export type MovePlacement='before'|'after'|'inside'|'root';
export interface MovePayload {ids:string[];placement:MovePlacement;anchor_id?:string}
export interface MovementIndex {
 byId:Map<string,MovementAction>;
 children:Map<string|null,MovementAction[]>;
 ancestors:Map<string,Set<string>>;
 ordered:MovementAction[];
 changedRegions:Set<string>;
 changedGroups:Set<string>;
}
const compare=(a:MovementAction,b:MovementAction)=>a.order-b.order||(a.id<b.id?-1:a.id>b.id?1:0);
function relatedSourceIds(ids:readonly string[],prepared:MovementIndex):Set<string>{
 const related=new Set<string>(),stack:string[]=[],visited=new Set<string>();
 for(const id of ids){
  if(!prepared.byId.has(id))continue;
  related.add(id);stack.push(id);
  for(const ancestor of prepared.ancestors.get(id)||[])related.add(ancestor);
 }
 while(stack.length){const id=stack.pop()!;if(visited.has(id))continue;visited.add(id);for(const child of prepared.children.get(id)||[]){related.add(child.id);stack.push(child.id);}}
 return related;
}
function groupKey(action:MovementAction):string{return action.parent_id?`parent:${action.parent_id}`:`root:${action.project_id??'\u0000'}`;}
function buildIndex(actions:readonly MovementAction[],previous?:MovementIndex):MovementIndex {
 const byId=new Map(actions.map(action=>[action.id,action]));
 const children=new Map<string|null,MovementAction[]>();
 for(const action of actions){const parent=action.parent_id??null;const rows=children.get(parent)||[];rows.push(action);children.set(parent,rows);}
 for(const rows of children.values())rows.sort(compare);
 const ancestors=new Map<string,Set<string>>();
 for(const action of actions){
  const path=new Set<string>(),seen=new Set<string>();let parent=action.parent_id??null;
  while(parent&&byId.has(parent)&&!seen.has(parent)){seen.add(parent);path.add(parent);parent=byId.get(parent)?.parent_id??null;}
  ancestors.set(action.id,path);
 }
 const roots=(children.get(null)||[]).slice().sort((a,b)=>((a.project_id??'')<(b.project_id??'')?-1:(a.project_id??'')>(b.project_id??'')?1:0)||compare(a,b));
 const ordered:MovementAction[]=[],visited=new Set<string>();
 function visit(action:MovementAction){if(visited.has(action.id))return;visited.add(action.id);ordered.push(action);for(const child of children.get(action.id)||[])visit(child);}
 for(const root of roots)visit(root);
 const changedRegions=new Set<string>(),changedGroups=new Set<string>();
 if(previous){
  const changed=new Set<string>();for(const id of new Set([...previous.byId.keys(),...byId.keys()])){const before=previous.byId.get(id),after=byId.get(id);if(!before||!after||before.parent_id!==after.parent_id||before.project_id!==after.project_id||before.order!==after.order)changed.add(id);}
  for(const id of changed){changedRegions.add(id);const before=previous.byId.get(id),after=byId.get(id);if(before){changedGroups.add(groupKey(before));for(const ancestor of previous.ancestors.get(id)||[])changedRegions.add(ancestor);}if(after){changedGroups.add(groupKey(after));for(const ancestor of ancestors.get(id)||[])changedRegions.add(ancestor);}}
 }
 return {byId,children,ancestors,ordered,changedRegions,changedGroups};
}
/** Closed deterministic UI intent model; backend owns authoritative rank changes. */
export function createMovementModel(){
 const index=buildIndex;
 function ordered(actions:readonly MovementAction[],prepared=index(actions)):MovementAction[]{return prepared.ordered.slice();}
 function contains(actions:readonly MovementAction[],ancestor:string,id:string,prepared=index(actions)):boolean{return prepared.ancestors.get(id)?.has(ancestor)||false;}
 function depth(id:string,prepared:MovementIndex):number{return prepared.ancestors.get(id)?.size||0;}
 function sourceIds(ids:readonly string[],prepared:MovementIndex):Set<string>{return relatedSourceIds(ids,prepared);}
 function targetGroups(actions:readonly MovementAction[],payload:MovePayload,prepared=index(actions)){
  if(payload.placement==='root')return [...new Set(payload.ids.map(id=>prepared.byId.get(id)?.project_id??null))].map(project=>`root:${project??'\u0000'}`);
  const anchor=prepared.byId.get(payload.anchor_id||'');if(!anchor)return [];
  if(payload.placement==='inside')return [`parent:${anchor.id}`];
  return [anchor.parent_id?`parent:${anchor.parent_id}`:`root:${anchor.project_id??'\u0000'}`];
 }
 function affects(scope:ReadonlySet<string>,prepared:MovementIndex):boolean{for(const id of prepared.changedRegions)if(scope.has(id))return true;return false;}
 function groupsChanged(groups:readonly string[],prepared:MovementIndex):boolean{return groups.some(group=>prepared.changedGroups.has(group));}
 function relevant(actions:readonly MovementAction[],payload:MovePayload,prepared=index(actions)){
  const related=relatedSourceIds(payload.ids,prepared),selectedRows=payload.ids.map(id=>prepared.byId.get(id)).filter((row):row is MovementAction=>Boolean(row));
  const anchor=prepared.byId.get(payload.anchor_id||''),parent=payload.placement==='inside'?anchor?.id:anchor?.parent_id??null;
  if(anchor)related.add(anchor.id);
  for(const ancestor of prepared.ancestors.get(anchor?.id||'')||[])related.add(ancestor);
  if(payload.placement==='root'){
   const projects=new Set(selectedRows.map(row=>row.project_id??null));
   for(const root of prepared.children.get(null)||[])if(projects.has(root.project_id??null))related.add(root.id);
  }else {
   const siblings=parent===undefined?actions.filter(action=>action.parent_id===undefined):prepared.children.get(parent??null)||[];
   for(const sibling of siblings)if(parent!==null||(sibling.project_id??null)===(anchor?.project_id??null))related.add(sibling.id);
  }
  return actions.filter(action=>related.has(action.id)).map(action=>action.id);
 }
 function sourceFingerprint(actions:readonly MovementAction[],ids:readonly string[],prepared=index(actions)){
  const related=relatedSourceIds(ids,prepared);
  return JSON.stringify(actions.filter(action=>related.has(action.id)).map(action=>[action.id,action.parent_id??null,action.project_id??null,action.order]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
 }
 function fingerprint(actions:readonly MovementAction[],payload?:MovePayload,prepared=index(actions)){
  const ids=new Set(payload?relevant(actions,payload,prepared):actions.map(action=>action.id));
  return JSON.stringify(actions.filter(action=>ids.has(action.id)).map(action=>[action.id,action.parent_id??null,action.project_id??null,action.order]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
 }
 function intent(actions:readonly MovementAction[],ids:readonly string[],placement:MovePlacement,anchorId?:string,prepared=index(actions)){
  const rejected=(reason:string)=>({allowed:false,reason,roots:[] as string[],payload:null as MovePayload|null});
  if(!['before','after','inside','root'].includes(placement))return rejected('Choose a valid placement.');
  if(!ids.length)return rejected('Select an action to move.');
  if(new Set(ids).size!==ids.length||ids.some(id=>!prepared.byId.has(id)))return rejected('The selection is no longer available.');
  const selected=new Set(ids),roots=prepared.ordered.filter(action=>selected.has(action.id)&&![...(prepared.ancestors.get(action.id)||[])].some(ancestor=>selected.has(ancestor)));
  if(!roots.length)return rejected('The selection is no longer available.');
  if(placement!=='root'){
   const anchor=prepared.byId.get(anchorId||'');
   if(!anchor)return rejected('Choose an available destination.');
   if(roots.some(action=>action.id===anchor.id||prepared.ancestors.get(anchor.id)?.has(action.id)))return rejected('An action cannot move into its own subtree.');
   if((placement==='before'||placement==='after')&&!anchor.parent_id&&roots.some(action=>(action.project_id??null)!==(anchor.project_id??null)))return rejected('Choose a destination in the same Project, or move Into the action.');
  }
  const payload:MovePayload={ids:roots.map(action=>action.id),placement,...(placement==='root'?{}:{anchor_id:anchorId!})};
  return {allowed:true,reason:'',roots:payload.ids,payload};
 }
 function selection(current:readonly string[],anchor:string|null,id:string,visible:readonly string[],range:boolean){if(!visible.includes(id))return {ids:[...current],anchor};if(range&&anchor&&visible.includes(anchor)){const a=visible.indexOf(anchor),b=visible.indexOf(id);return {ids:visible.slice(Math.min(a,b),Math.max(a,b)+1),anchor};}return {ids:[id],anchor:id};}
 return {index,ordered,contains,depth,fingerprint,intent,selection,relevant,sourceFingerprint,sourceIds,targetGroups,affects,groupsChanged};
}
