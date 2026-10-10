import {initialViewState,viewTransition,type InteractionViewState,type ViewEvent} from './view-state';
import type {GestureState} from './gesture';
export interface Occurrence {key:string;id:string;kind:string}
export interface OccurrenceSelection {keys:string[];ids:string[];anchor:string|null;active:string|null}
export type DeferredInteraction={kind:'select-action';id:string|null}|{kind:'select-catalog';catalogKind:'project'|'tag';id:string}|{kind:'create';entity:'action'|'project'|'tag';payload?:Record<string,unknown>;parent?:string|null};
export interface CompositionState {key:string;field:string;deferred:DeferredInteraction|null}
export interface UiInteractionState {selection:OccurrenceSelection;gesture:GestureState|null;composition:CompositionState|null;view:InteractionViewState}
export type InteractionEvent=
 |{type:'occurrence.range';key:string;range:boolean;entries:readonly Occurrence[]}
 |{type:'occurrence.activate';key:string|null}
 |{type:'occurrence.replace';keys:readonly string[];ids:readonly string[]}
 |{type:'occurrence.clear'}
 |{type:'interaction.remap';from:string;to:string}
 |{type:'composition.begin';key:string;field:string}
 |{type:'composition.defer';intent:DeferredInteraction|null}
 |{type:'composition.end'}|ViewEvent;
export function initialInteraction():UiInteractionState{return {selection:{keys:[],ids:[],anchor:null,active:null},gesture:null,composition:null,view:initialViewState()};}
/** Occurrence identity is preserved separately from deduplicated persistence IDs. */
export function interactionTransition(state:UiInteractionState,event:InteractionEvent):UiInteractionState {
 const selection=state.selection;
 switch(event.type){
  case 'composition.begin':return {...state,composition:{key:event.key,field:event.field,deferred:null}};
  case 'composition.defer':return state.composition?{...state,composition:{...state.composition,deferred:event.intent}}:state;
  case 'composition.end':return {...state,composition:null};
  case 'occurrence.range':{
   const entries=event.entries.filter(entry=>entry.kind==='action'),start=entries.findIndex(entry=>entry.key===selection.anchor),end=entries.findIndex(entry=>entry.key===event.key);
   const keys=event.range&&start>=0&&end>=0?entries.slice(Math.min(start,end),Math.max(start,end)+1).map(entry=>entry.key):[event.key];
   const selected=new Set(keys),ids=[...new Set(entries.filter(entry=>selected.has(entry.key)).map(entry=>entry.id))];
   return {...state,selection:{...selection,keys,ids,anchor:event.range&&start>=0?selection.anchor:event.key}};
  }
  case 'occurrence.activate':return {...state,selection:{...selection,active:event.key}};
  case 'occurrence.replace':return {...state,selection:{...selection,keys:[...event.keys],ids:[...new Set(event.ids)],anchor:selection.anchor&&event.keys.includes(selection.anchor)?selection.anchor:event.keys[0]||null}};
  case 'occurrence.clear':return {...state,selection:{keys:[],ids:[],anchor:null,active:null}};
  case 'interaction.remap':return {...state,view:viewTransition(state.view,{type:'view.remap',from:event.from,to:event.to}),composition:state.composition?{...state.composition,key:state.composition.key.replaceAll(event.from,event.to)}:null,selection:{keys:selection.keys.map(key=>key.replaceAll(event.from,event.to)),ids:selection.ids.map(id=>id===event.from?event.to:id),anchor:selection.anchor?.replaceAll(event.from,event.to)||null,active:selection.active?.replaceAll(event.from,event.to)||null}};
  default:return {...state,view:viewTransition(state.view,event)};
 }
}
