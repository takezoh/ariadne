import type {DatePair} from './date-input';
import type {Draft,DraftAction} from './drafts';
import type {CatalogRecord,CatalogDraft} from './catalog-drafts';
import {savedValue} from './autosave';
import {displayTitle} from './presentation';

export interface DateInputProjection {
 due:DatePair;
 defer:DatePair;
 dueDate?:string;
 dueTime?:string;
 deferDate?:string;
 deferTime?:string;
}

export function projectDateInputs(input:{
 dueValue:string|null|undefined;
 deferValue:string|null|undefined;
 dueEdited:boolean;
 deferEdited:boolean;
 duePair?:DatePair;
 deferPair?:DatePair;
 pair:(value:string|null|undefined)=>DatePair;
}):DateInputProjection {
 const due=input.dueEdited&&input.duePair?input.duePair:input.pair(input.dueValue);
 const defer=input.deferEdited&&input.deferPair?input.deferPair:input.pair(input.deferValue);
 return {
  due,
  defer,
  ...(!due.badDate?{dueDate:due.date}:{}),
  ...(!due.badTime?{dueTime:due.time}:{}),
  ...(!defer.badDate?{deferDate:defer.date}:{}),
  ...(!defer.badTime?{deferTime:defer.time}:{}),
 };
}

export function normalizePickerIndex(index:number,itemCount:number):number {
 return itemCount>0?Math.min(index,itemCount-1):-1;
}

export function resolveChoice(previous:string,candidates:readonly string[]):string {
 return candidates.includes(previous)?previous:candidates[0]||'';
}

const conflictLabels:Readonly<Record<string,string>>={
 tag_ids:'Tags',project_id:'Project',title:'Title',notes:'Notes',status:'Status',due_at:'Due',
 deferDate:'Defer',deferUntil:'Defer',flagged:'Flag',order:'Order',parent_id:'Parent action',
};

export function projectSavedComparison(fields:readonly string[],action:Omit<DraftAction,'status'>&{status?:string}|null|undefined,projects:readonly (CatalogRecord&{path?:string})[],tags:readonly (CatalogRecord&{path?:string})[],formatInstant?:(value:string)=>string):string {
 if(!action)return '';
 const displayValue=(field:string,value:unknown):string=>{
  if(field==='project_id')return projects.find(item=>item.id===value)?.path||projects.find(item=>item.id===value)?.name||'Unassigned';
  if(field==='tag_ids')return (Array.isArray(value)?[...value].sort():[]).map(id=>tags.find(item=>item.id===id)?.path||tags.find(item=>item.id===id)?.name||'Unavailable tag').join(', ');
  if(['due_at','deferDate','deferUntil'].includes(field)&&typeof value==='string'&&value&&formatInstant)return formatInstant(value);
  return value==null||value===''?'Empty':String(value);
 };
 return fields.map(field=>{
  return 'Saved '+(conflictLabels[field]||field)+': '+displayValue(field,savedValue(action as DraftAction,field));
 }).join('\n');
}

export type UiActionRecord=Omit<DraftAction,'status'|'tags'>&{status:string;is_deferred?:boolean;project_path?:string;tags?:{id:string;name?:string;path?:string}[];defer_reasons?:{id:string;title:string;until:string;ancestor:boolean}[]};
export interface ProjectedActionRow {title:string;accessibleTitle:string;badges:{text:string;icon?:string}[];signature:string;batchSelected:boolean;active:boolean}

export function projectActionRow(input:{entry:{key:string;level:number;parentKey?:string|null;catalogId?:string|null};action:UiActionRecord;actions:readonly UiActionRecord[];draft?:Draft;tree:boolean;visibleActionIds:readonly string[];batchSelected:boolean;active:boolean;formattedDue:string}):ProjectedActionRow {
 const {entry,action,actions,draft}=input,parentVisible=Boolean(action.parent_id&&input.visibleActionIds.includes(action.parent_id)),parent=parentVisible?undefined:actions.find(row=>row.id===action.parent_id),badges:{text:string;icon?:string}[]=[];
 const parentListed=input.tree?Boolean(action.parent_id&&entry.parentKey?.endsWith(':action:'+action.parent_id)):parentVisible;
 if(action.parent_id&&!parentListed&&parent?.title)badges.push({text:'In '+displayTitle(parent.title)});
 if(action.status==='on-hold')badges.push({text:'On hold',icon:'waiting'});
 if(action.status==='dropped')badges.push({text:'Dropped'});
 if(action.status==='completed')badges.push({text:'Completed'});
 if(action.defer_reasons?.length)badges.push({text:'Later'});
 if(action.due_at)badges.push({text:'Due '+input.formattedDue});
 if(action.project_path)badges.push({text:action.project_path});
 if(action.tags?.length)badges.push({text:action.tags.map(tag=>tag.path||tag.name||'').filter(Boolean).join(', ')});
 return {title:displayTitle(draft?.title??action.title),accessibleTitle:displayTitle(action.title),badges,signature:JSON.stringify([entry.key,entry.level,input.tree,action.id,action.title,action.status,action.parent_id,action.flagged,entry.parentKey??null,parentVisible,parent?.title||'',action.defer_reasons,action.due_at,input.formattedDue,action.project_path,action.tags,draft?.title,input.batchSelected,input.active]),batchSelected:input.batchSelected,active:input.active};
}

export function projectCatalogRow(input:{entry:{key:string;kind:string;id:string;level:number;label:string;expandable:boolean};collapsed:readonly string[];draft?:CatalogDraft;selected:boolean;batchSelected?:boolean}):{signature:string;title:string;collapsed:boolean;selected:boolean;batchSelected:boolean} {
 const {entry}=input,collapsed=input.collapsed.includes(entry.key),batchSelected=input.batchSelected??false;return {signature:JSON.stringify([entry.key,entry.kind,entry.id,entry.level,entry.label,entry.expandable,collapsed,input.draft?.name,input.selected,batchSelected]),title:input.draft?.name||entry.label,collapsed,selected:input.selected,batchSelected};
}

function catalogPath(catalog:readonly (CatalogRecord&{path?:string})[],id:string,kind:'project'|'tag'):string {
 const byId=new Map(catalog.map(item=>[item.id,item]));const parts:string[]=[],seen=new Set<string>();let node=byId.get(id);
 while(node&&!seen.has(node.id)){seen.add(node.id);parts.unshift(node.name||'Untitled '+kind);node=node.parent_id?byId.get(node.parent_id):undefined;}
 return parts.join(' / ');
}

export interface ActionInspectorProjection {targetAvailable:boolean;title:string;notes:string;flagged:boolean;status:string;dates:DateInputProjection;lifecycle:string;timestamps?:{created:string;updated:string};missingMessage:string;savedCompare:string;dateSummary:string;releases:{id:string;label:string}[];projectValue?:string;tags:{id:string;label:string;focusKey:string}[]}
export function projectActionInspector(input:{id:string;draft:Draft;action?:UiActionRecord;savedAction?:{created_at?:string;updated_at?:string};targetAvailable:boolean;conflicts:readonly string[];projects:readonly (CatalogRecord&{path?:string})[];tags:readonly (CatalogRecord&{path?:string})[];dates:DateInputProjection;projectPickerFocused:boolean;formatInstant:(value:string)=>string}):ActionInspectorProjection {
 const {id,draft,action}=input,project=draft.project_id?input.projects.find(item=>item.id===draft.project_id):undefined;
 const dateSummary=(action?.defer_reasons||[]).filter(reason=>reason.ancestor).map(reason=>'Parent '+displayTitle(reason.title)+' · Deferred until: '+input.formatInstant(reason.until)).join(' / ');
 const releases=(action?.defer_reasons||[]).map(reason=>({id:reason.id,label:reason.ancestor?'Parent '+displayTitle(reason.title)+' · Clear Defer':'Clear Defer'}));
 const projectValue=!input.projectPickerFocused?draft.project_id?(project?catalogPath(input.projects,project.id,'project'):'Unassigned'):'':undefined;
 const tags=draft.tag_ids.map(tagId=>{const tag=input.tags.find(item=>item.id===tagId);return {id:tagId,label:tag?catalogPath(input.tags,tag.id,'tag'):'Unavailable Tag',focusKey:'tag:'+id+':'+tagId};});
 return {targetAvailable:input.targetAvailable,title:draft.title,notes:draft.notes,flagged:draft.flagged,status:draft.status,dates:input.dates,lifecycle:action?.status==='on-hold'?'On hold':action?.status==='completed'?'Completed':action?.status==='dropped'?'Dropped':'Active',missingMessage:'This action is no longer available. Your unsaved changes are retained. Refresh before saving.',timestamps:input.savedAction?{created:input.formatInstant(input.savedAction.created_at||''),updated:input.formatInstant(input.savedAction.updated_at||'')}:undefined,savedCompare:projectSavedComparison(input.conflicts,action,input.projects,input.tags,input.formatInstant),dateSummary,releases,projectValue,tags};
}

export interface CatalogInspectorProjection {kind:'project'|'tag';temporary:boolean;exists:boolean;draft?:{name:string;description:string};missingMessage:string;parentText:string;nameErrorText:string;descriptionErrorText:string;conflict:boolean;problemText:string;savedCompare:string;showRetry:boolean;retryDisabled:boolean}
export function projectCatalogInspector(input:{kind:'project'|'tag';id:string;temporary:boolean;draft?:CatalogDraft;record?:CatalogRecord;nodes:readonly (CatalogRecord&{path?:string})[];conflicts:readonly string[];error?:string;unknown:boolean;busy:boolean;recoveryRequired:boolean;validation:Record<string,string>}):CatalogInspectorProjection {
 const {kind,draft,record}=input,inline=Boolean(input.error)&&Object.values(input.validation).includes(input.error!);
 const parent=record?.parent_id?input.nodes.find(item=>item.id===record.parent_id):undefined;
 const savedCompare=input.conflicts.map(field=>{const value=record?.[field as keyof CatalogRecord];return 'Saved '+field+': '+(value==null||value===''?'Empty':String(value));}).join('\n');
 const parentText=record?.parent_id?'Parent: '+(parent?.path||parent?.name||'Unavailable'):'Top level';
 const missingMessage='This '+kind+' is no longer available. Your edits are retained.';
 const errors=input.validation;
 return {kind,temporary:input.temporary,exists:Boolean(record),...(draft?{draft:{name:draft.name,description:draft.description}}:{}),missingMessage,parentText,nameErrorText:errors.name||'',descriptionErrorText:errors.description||'',conflict:Boolean(input.conflicts.length),problemText:input.conflicts.length||inline?'':input.error||'',savedCompare,showRetry:Boolean(input.error)&&!input.conflicts.length&&!input.unknown,retryDisabled:input.busy||input.recoveryRequired};
}

export function projectPickerOptions(kind:'project'|'tag',items:readonly {id:string;name:string}[],records:readonly (CatalogRecord&{path?:string})[],draft:Draft|undefined,index:number):{id:string;label:string;selected:boolean;active:boolean;focusKey:string}[] {
 return items.map((item,position)=>({id:item.id,label:!item.id&&kind==='project'?'Unassigned':records.find(record=>record.id===item.id)?catalogPath(records,item.id,kind):item.name,selected:kind==='project'?(draft?.project_id||'')===item.id:Boolean(draft?.tag_ids.includes(item.id)),active:position===index,focusKey:'picker:'+kind+':'+item.id}));
}

export function projectMoveDestinations(actions:readonly UiActionRecord[],drafts:Readonly<Record<string,Draft>>):{id:string;label:string}[] {
 const seen=new Set<string>();return actions.filter(action=>!seen.has(action.id)&&Boolean(seen.add(action.id))).map(action=>({id:action.id,label:displayTitle(drafts[action.id]?.title??action.title)}));
}

export function projectCatalogMoveDestinations(nodes:readonly (CatalogRecord&{path?:string})[]):{id:string;label:string}[] {
 return nodes.map(node=>({id:node.id,label:node.path||node.name}));
}
