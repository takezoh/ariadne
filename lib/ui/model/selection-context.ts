import type {Occurrence,OccurrenceSelection} from './interaction';
import type {NavigationSelection} from './navigation';
import type {UiSnapshot} from './types';

export type SelectionContextAvailability='ready'|'unavailable';
export type SelectionItemAvailability='available'|'deleted'|'unavailable'|'local_unsaved';
export interface SelectionOccurrenceRef {key:string;catalogId?:string}
export interface SelectionContextItem {
 kind:Occurrence['kind'];
 availability:SelectionItemAvailability;
 id?:string;
 title?:string;
 name?:string;
 occurrences:SelectionOccurrenceRef[];
}
export interface SelectionContext {
 schemaVersion:1;
 instanceId:string;
 contextVersion:number;
 availability:SelectionContextAvailability;
 snapshotRevision:number|null;
 view:{kind:NavigationSelection['view'];classificationId:string|null;perspectiveId:string|null};
 active:SelectionContextItem|null;
 selected:SelectionContextItem[];
}
export interface SelectionContextInput {
 instanceId:string;
 contextVersion:number;
 snapshot:UiSnapshot|null;
 navigation:NavigationSelection;
 selection:OccurrenceSelection;
 activeOccurrence:Occurrence|null;
}

function uuid(value:string|null|undefined):string|null {
 return value&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)?value:null;
}

function occurrenceRef(occurrence:Occurrence):SelectionOccurrenceRef|null {
 const key=occurrence.localUnsaved?occurrence.opaqueKey:occurrence.key;
 if(!key)return null;
 const catalogId=occurrence.localUnsaved?null:uuid(occurrence.catalogId);
 return {key,...(catalogId?{catalogId}:{})};
}

function item(snapshot:UiSnapshot,occurrences:readonly Occurrence[],actions:Map<string,UiSnapshot['actions'][number]>,projects:Map<string,{id:string;name:string}>,tags:Map<string,{id:string;name:string}>):SelectionContextItem|null {
 const first=occurrences[0];if(!first)return null;
 const refs=occurrences.map(occurrenceRef).filter((value):value is SelectionOccurrenceRef=>value!==null);
 if(first.localUnsaved)return {kind:first.kind,availability:'local_unsaved',occurrences:refs};
 const id=uuid(first.id);
 if(!id)return {kind:first.kind,availability:'unavailable',occurrences:refs};
 if(first.kind==='action'){
  const saved=actions.get(id);
  return saved?{kind:first.kind,availability:'available',id,title:saved.title,occurrences:refs}:{kind:first.kind,availability:'deleted',id,occurrences:refs};
 }
 const saved=(first.kind==='project'?projects:tags).get(id);
 return saved?{kind:first.kind,availability:'available',id,name:saved.name,occurrences:refs}:{kind:first.kind,availability:'deleted',id,occurrences:refs};
}

/** Projects only confirmed basic fields; drafts, descriptions and action notes never enter this model. */
export function projectSelectionContext(input:SelectionContextInput):SelectionContext {
 const {snapshot,navigation,selection}=input;
 if(!snapshot)return {schemaVersion:1,instanceId:input.instanceId,contextVersion:input.contextVersion,availability:'unavailable',snapshotRevision:null,view:{kind:navigation.view,classificationId:null,perspectiveId:null},active:null,selected:[]};
 const actions=new Map(snapshot.actions.map(action=>[action.id,action])),projects=new Map(((snapshot.projects||[]) as {id:string;name:string}[]).map(record=>[record.id,record])),tags=new Map(((snapshot.tags||[]) as {id:string;name:string}[]).map(record=>[record.id,record]));
 const active=input.activeOccurrence?item(snapshot,[input.activeOccurrence],actions,projects,tags):null,groups=new Map<string,Occurrence[]>();
 for(const occurrence of selection.occurrences){
  const groupKey=occurrence.kind+':'+(occurrence.localUnsaved?'local:':'saved:')+occurrence.id,group=groups.get(groupKey)||[];
  group.push(occurrence);groups.set(groupKey,group);
 }
 const selected=[...groups.values()].map(rows=>item(snapshot,rows,actions,projects,tags)).filter((value):value is SelectionContextItem=>value!==null);
 const classification=uuid(navigation.classificationId),perspective=uuid(navigation.perspectiveId),perspectives=(Array.isArray(snapshot.perspectives)?snapshot.perspectives:[]) as {id:string}[];
 const classificationExists=Boolean(classification&&(navigation.view==='projects'?projects.has(classification):navigation.view==='tags'?tags.has(classification):false));
 return {schemaVersion:1,instanceId:input.instanceId,contextVersion:input.contextVersion,availability:'ready',snapshotRevision:snapshot.revision,view:{kind:navigation.view,classificationId:classificationExists?classification:null,perspectiveId:perspective&&perspectives.some(record=>record.id===perspective)?perspective:null},active,selected};
}

export function selectionContextFingerprint(context:SelectionContext):string {
 return JSON.stringify({availability:context.availability,snapshotRevision:context.snapshotRevision,view:context.view,active:context.active,selected:context.selected});
}

/** Whole-selection eligibility protects Action-only persistence from mixed, local or missing rows. */
export function eligibleSelectedActions(selection:OccurrenceSelection,snapshot:UiSnapshot|null,transients:Readonly<Record<string,unknown>>):{allowed:boolean;ids:string[];reason:string} {
 if(!selection.occurrences.length)return {allowed:false,ids:[],reason:'Select saved actions before moving or classifying.'};
 const savedIds=new Set(snapshot?.actions.map(action=>action.id)||[]);
 if(!snapshot||selection.occurrences.some(occurrence=>occurrence.kind!=='action'||occurrence.localUnsaved||Object.hasOwn(transients,occurrence.id)||!savedIds.has(occurrence.id)))return {allowed:false,ids:[],reason:'Every selected row must be a saved action before moving or classifying.'};
 const ids=[...new Set(selection.occurrences.map(occurrence=>occurrence.id))];
 return ids.length?{allowed:true,ids,reason:''}:{allowed:false,ids:[],reason:'Select saved actions before moving or classifying.'};
}
