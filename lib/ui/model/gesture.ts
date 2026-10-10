import {createMovementModel,type MovementAction,type MovementIndex,type MovePlacement} from './movement';
import {createTreeDropModel,type DropNode,type DropIndex,type TreeKind} from './tree-drop';
export interface GestureAction extends MovementAction {tag_ids?:string[];tags?:{id:string}[]}
export interface GestureTarget {kind:TreeKind;key:string;id?:string;placement?:MovePlacement;anchor?:string;depth?:number}
export interface GestureContext {actions:readonly GestureAction[];projects:readonly DropNode[];tags:readonly DropNode[];index:MovementIndex;projectIndex:DropIndex;tagIndex:DropIndex}
export interface GestureState {kind:TreeKind;keys:string[];ids:string[];active:boolean;target:GestureTarget|null;targetKey:string|null;intent:ReturnType<ReturnType<typeof createMovementModel>['intent']>|null;sourceScope:string[];targetScope:string[];targetGroups:string[];pendingRegions:string[];pendingGroups:string[];sourceFingerprint:string|null;catalogFingerprint:string|null;targetFingerprint:string|null;classificationBaselines:{project:string;tag:string};issue:string|null}
export type GestureEvent=
 |{type:'gesture.begin';kind:TreeKind;keys:readonly string[];ids:readonly string[]}
 |{type:'gesture.activate'}
 |{type:'gesture.target';target:GestureTarget|null}
 |{type:'gesture.context'}
 |{type:'gesture.cancel'};
const movement=createMovementModel(),tree=createTreeDropModel();
export function classificationFingerprint(context:GestureContext,ids:readonly string[],kind:'project'|'tag') {return JSON.stringify(ids.map(id=>{const row=context.index.byId.get(id) as GestureAction|undefined;return [id,row?(kind==='project'?row.project_id??null:(row.tag_ids||row.tags?.map(tag=>tag.id)||[]).slice().sort()):'missing'];}));}
const overlaps=(left:readonly string[],right:readonly string[])=>left.some(id=>right.includes(id));
/** Gesture policy is deterministic; pointer capture, frames and geometry are adapter effects. */
export function gestureTransition(state:GestureState|null,event:GestureEvent,context:GestureContext):{state:GestureState|null;metrics:string[]} {
 const metrics:string[]=[],measure=<T>(name:string,fn:()=>T)=>{metrics.push(name);return fn();};
 if(event.type==='gesture.cancel')return {state:null,metrics};
 if(event.type==='gesture.begin'){
  const ids=[...new Set(event.ids)],kind=event.kind,nodes=kind==='project'?context.projects:context.tags,index=kind==='project'?context.projectIndex:context.tagIndex;
  const sourceFingerprint=kind==='action'?measure('movement.fingerprint',()=>movement.sourceFingerprint(context.actions,ids,context.index)):null;
  return {state:{kind,sourceFingerprint,keys:[...event.keys],ids,active:false,target:null,targetKey:null,intent:null,sourceScope:kind==='action'?[...movement.sourceIds(ids,context.index)]:[],targetScope:[],targetGroups:[],pendingRegions:[],pendingGroups:[],catalogFingerprint:kind==='action'?null:tree.fingerprint(nodes,ids[0],undefined,false,index),targetFingerprint:null,classificationBaselines:{project:classificationFingerprint(context,ids,'project'),tag:classificationFingerprint(context,ids,'tag')},issue:null},metrics};
 }
 if(!state)return {state,metrics};
 if(event.type==='gesture.activate')return {state:{...state,active:true},metrics};
 if(event.type==='gesture.context'){
  const pendingRegions=[...new Set([...state.pendingRegions,...context.index.changedRegions])],pendingGroups=[...new Set([...state.pendingGroups,...context.index.changedGroups])];
  let issue=state.issue;
  if(state.kind==='action'){
   if(overlaps(state.sourceScope,pendingRegions))issue='The list changed. Choose the destination again.';
   else if(overlaps(state.targetScope,pendingRegions)||overlaps(state.targetGroups,pendingGroups))issue='The destination changed. Choose another destination.';
   if(state.target?.kind==='project'||state.target?.kind==='tag'){const kind=state.target.kind;if(classificationFingerprint(context,state.ids,kind)!==state.classificationBaselines[kind])issue='The classification changed. Drop the actions again.';}
  }else {const nodes=state.kind==='project'?context.projects:context.tags,index=state.kind==='project'?context.projectIndex:context.tagIndex;if(tree.fingerprint(nodes,state.ids[0],undefined,false,index)!==state.catalogFingerprint)issue='The tree changed. Choose the destination again.';}
  return {state:{...state,pendingRegions,pendingGroups,issue},metrics};
 }
 const target=event.target;
 if(state.kind!=='action'){
  const nodes=state.kind==='project'?context.projects:context.tags,index=state.kind==='project'?context.projectIndex:context.tagIndex;
  if(target&&target.placement!=='root'&&(index.ancestors.get(target.anchor!)||[]).some(node=>node.id===state.ids[0]))return {state:{...state,target:null},metrics};
  const key=target?target.placement+':'+(target.anchor||''):null;
  return {state:{...state,target,targetKey:key,targetFingerprint:key!==state.targetKey&&target?tree.fingerprint(nodes,state.ids[0],target.anchor,target.placement==='root',index):state.targetFingerprint},metrics};
 }
 if(target?.kind==='project'||target?.kind==='tag'){
  const kind=target.kind,issue=classificationFingerprint(context,state.ids,kind)!==state.classificationBaselines[kind]?'The classification changed. Drop the actions again.':state.issue;
  return {state:{...state,target,targetKey:kind+':'+target.id,targetFingerprint:null,intent:null,issue},metrics};
 }
 const key=target?target.placement+':'+(target.anchor||''):null;
 if(key===state.targetKey)return {state:{...state,target},metrics};
 const payload=target?{ids:state.ids,placement:target.placement!,anchor_id:target.anchor}:null;
 return {state:{...state,target,targetKey:key,targetFingerprint:payload?measure('movement.fingerprint',()=>movement.fingerprint(context.actions,payload,context.index)):null,intent:payload?measure('movement.intent',()=>movement.intent(context.actions,state.ids,payload.placement,payload.anchor_id,context.index)):null,targetScope:payload?measure('movement.relevant',()=>movement.relevant(context.actions,payload,context.index)):[],targetGroups:payload?measure('movement.target-groups',()=>movement.targetGroups(context.actions,payload,context.index)):[]},metrics};
}
