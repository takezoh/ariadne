import {initialViewState,viewTransition,type InteractionViewState,type ViewEvent} from './view-state';
import type {GestureState} from './gesture';
export type OccurrenceKind='action'|'project'|'tag';
export interface Occurrence {key:string;id:string;kind:OccurrenceKind;catalogId?:string|null;localUnsaved?:boolean;opaqueKey?:string}
export interface OccurrenceSelection {keys:string[];ids:string[];occurrences:Occurrence[];anchor:string|null;active:string|null;activeOccurrence:Occurrence|null}
export type DeferredInteraction={kind:'select-action';id:string|null}|{kind:'select-catalog';catalogKind:'project'|'tag';id:string;toggle?:boolean}|{kind:'create';entity:'action'|'project'|'tag';payload?:Record<string,unknown>;parent?:string|null};
export interface CompositionState {key:string;field:string;deferred:DeferredInteraction|null}
export interface UiInteractionState {selection:OccurrenceSelection;gesture:GestureState|null;composition:CompositionState|null;view:InteractionViewState}
export type InteractionEvent=
 |{type:'occurrence.range';key:string;range:boolean;toggle:boolean;additive:boolean;entries:readonly Occurrence[]}
 |{type:'occurrence.visible';entries:readonly Occurrence[]}
 |{type:'occurrence.activate';key:string|null;occurrence?:Occurrence|null}
 |{type:'occurrence.replace';keys:readonly string[];ids:readonly string[];occurrences?:readonly Occurrence[]}
 |{type:'occurrence.clear'}
 |{type:'interaction.remap';from:string;to:string}
 |{type:'composition.begin';key:string;field:string}
 |{type:'composition.defer';intent:DeferredInteraction|null}
 |{type:'composition.end'}|ViewEvent;
export function initialInteraction():UiInteractionState{return {selection:{keys:[],ids:[],occurrences:[],anchor:null,active:null,activeOccurrence:null},gesture:null,composition:null,view:initialViewState()};}
/** Occurrence identity is preserved separately from deduplicated persistence IDs. */
export function interactionTransition(state:UiInteractionState,event:InteractionEvent):UiInteractionState {
 const selection=state.selection;
 switch(event.type){
  case 'composition.begin':return {...state,composition:{key:event.key,field:event.field,deferred:null}};
  case 'composition.defer':return state.composition?{...state,composition:{...state.composition,deferred:event.intent}}:state;
  case 'composition.end':return {...state,composition:null};
  case 'occurrence.visible':{
   const selected=new Set(selection.occurrences.map(entry=>entry.key)),occurrences=event.entries.filter(entry=>selected.has(entry.key)).map(entry=>({...entry}));
   const keys=occurrences.map(entry=>entry.key),ids=[...new Set(occurrences.filter(entry=>entry.kind==='action').map(entry=>entry.id))],anchor=selection.anchor&&event.entries.some(entry=>entry.kind==='action'&&entry.key===selection.anchor)?selection.anchor:null;
   const sameOccurrences=occurrences.length===selection.occurrences.length&&occurrences.every((entry,index)=>{const current=selection.occurrences[index];return entry.key===current.key&&entry.id===current.id&&entry.kind===current.kind&&entry.catalogId===current.catalogId&&entry.localUnsaved===current.localUnsaved&&entry.opaqueKey===current.opaqueKey;});
   if(keys.length===selection.keys.length&&keys.every((key,index)=>key===selection.keys[index])&&ids.length===selection.ids.length&&ids.every((id,index)=>id===selection.ids[index])&&anchor===selection.anchor&&sameOccurrences)return state;
   return {...state,selection:{...selection,keys,ids,occurrences,anchor}};
  }
  case 'occurrence.range':{
   const selectable=event.entries.filter(entry=>entry.kind==='action'||entry.kind==='project'||entry.kind==='tag'),byKey=new Map(selectable.map(entry=>[entry.key,entry])),visibleKeys=new Set(byKey.keys()),entries=selectable.filter(entry=>entry.kind==='action'),start=entries.findIndex(entry=>entry.key===selection.anchor),end=entries.findIndex(entry=>entry.key===event.key),selected=new Set(selection.keys.filter(key=>visibleKeys.has(key)));
   if(event.range){
    const range=start>=0&&end>=0?entries.slice(Math.min(start,end),Math.max(start,end)+1).map(entry=>entry.key):[event.key];
    if(!event.additive)selected.clear();for(const key of range)selected.add(key);
   }else if(event.toggle){
    if(selected.has(event.key))selected.delete(event.key);else selected.add(event.key);
   }else{selected.clear();selected.add(event.key);}
   const occurrences=selectable.filter(entry=>selected.has(entry.key)).map(entry=>({...entry})),keys=occurrences.map(entry=>entry.key),ids=[...new Set(occurrences.filter(entry=>entry.kind==='action').map(entry=>entry.id))],clicked=byKey.get(event.key),anchor=clicked?.kind!=='action'?selection.anchor:event.range&&start>=0?selection.anchor:event.toggle&&start>=0?selection.anchor:event.key;
   return {...state,selection:{...selection,keys,ids,occurrences,anchor}};
  }
  case 'occurrence.activate':{
   let activeOccurrence:Occurrence|null=null;
   if(event.key!==null)activeOccurrence=event.occurrence??selection.occurrences.find(entry=>entry.key===event.key)??(selection.activeOccurrence?.key===event.key?selection.activeOccurrence:null);
   return {...state,selection:{...selection,active:event.key,activeOccurrence:activeOccurrence?{...activeOccurrence}:null}};
  }
  case 'occurrence.replace':{
   const occurrences=event.occurrences?[...event.occurrences].map(entry=>({...entry})):event.keys.map((key,index)=>({key,id:event.ids[index]||key,kind:'action' as const}));
   return {...state,selection:{...selection,keys:occurrences.map(entry=>entry.key),ids:[...new Set(occurrences.filter(entry=>entry.kind==='action').map(entry=>entry.id))],occurrences,anchor:selection.anchor&&event.keys.includes(selection.anchor)?selection.anchor:occurrences.find(entry=>entry.kind==='action')?.key||null}};
  }
  case 'occurrence.clear':return {...state,selection:{...selection,keys:[],ids:[],occurrences:[],anchor:null,active:null,activeOccurrence:null}};
  case 'interaction.remap':{
   const remap=(entry:Occurrence|null):Occurrence|null=>entry?{...entry,key:entry.key.replaceAll(event.from,event.to),id:entry.id===event.from?event.to:entry.id,catalogId:entry.catalogId===event.from?event.to:entry.catalogId,...(entry.id===event.from?{localUnsaved:false,opaqueKey:undefined}:{})}:null;
   const occurrences=selection.occurrences.map(entry=>remap(entry)!);
   return {...state,view:viewTransition(state.view,{type:'view.remap',from:event.from,to:event.to}),composition:state.composition?{...state.composition,key:state.composition.key.replaceAll(event.from,event.to)}:null,selection:{keys:occurrences.map(entry=>entry.key),ids:[...new Set(occurrences.filter(entry=>entry.kind==='action').map(entry=>entry.id))],occurrences,anchor:selection.anchor?.replaceAll(event.from,event.to)||null,active:selection.active?.replaceAll(event.from,event.to)||null,activeOccurrence:remap(selection.activeOccurrence)}};
  }
  default:return {...state,view:viewTransition(state.view,event)};
 }
}
