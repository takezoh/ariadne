export type DraftStatus='active'|'on-hold'|'completed'|'dropped';
export type DraftGroup='edit'|'defer'|'status';
export interface DraftAction {id:string;title:string;notes:string;order:number;flagged:boolean;revision:number;parent_id?:string|null;due_at?:string|null;status?:DraftStatus;defer_until?:string|null;project_id?:string|null;tags?:{id:string}[]}
export interface DraftValues {title:string;notes:string;order:number;flagged:boolean;parent_id:string|null;due_at:string|null;status:DraftStatus;deferDate:string;deferUntil:string;timezone:string;project_id:string|null;tag_ids:string[]}
export interface Draft extends DraftValues {baseRevision:number;dirty:boolean;patch:Partial<DraftValues>;dirtyGroups:Record<DraftGroup,boolean>}
export type Drafts=Readonly<Record<string,Draft>>;
/** Refresh untouched fields while preserving the proposal's original comparison revision. */
export function mergeDrafts(drafts:Drafts,actions:readonly DraftAction[]):Drafts {
 const next:Record<string,Draft>={};
 for(const [id,draft] of Object.entries(drafts))if(draft.dirty)next[id]=draft;
 for(const action of actions){const previous=drafts[action.id];const saved:DraftValues={title:action.title,notes:action.notes,order:action.order,flagged:action.flagged,parent_id:action.parent_id??null,due_at:action.due_at??null,status:action.status??'active',deferDate:'',deferUntil:action.defer_until??'',timezone:'',project_id:action.project_id??null,tag_ids:(action.tags||[]).map(tag=>tag.id).sort()};next[action.id]={...saved,...previous?.patch,baseRevision:previous?.dirty?previous.baseRevision:action.revision,dirty:previous?.dirty??false,patch:{...previous?.patch},dirtyGroups:previous?.dirtyGroups??{edit:false,defer:false,status:false}};}
 return next;
}
export function editDraft(drafts:Drafts,id:string,patch:Partial<DraftValues>):Drafts {
 if(!drafts[id])throw new Error('Unknown draft');
 const merged={...drafts[id].patch,...patch};const fields=Object.keys(merged);const dirtyGroups={edit:fields.some(f=>['title','notes','order','flagged','parent_id','due_at'].includes(f)),defer:fields.some(f=>['deferDate','deferUntil','timezone'].includes(f)),status:fields.includes('status')};
 return {...drafts,[id]:{...drafts[id],...patch,patch:merged,dirty:true,dirtyGroups}};
}
export function discardDraft(drafts:Drafts,id:string):Drafts {const next={...drafts};delete next[id];return next;}
/** Only explicitly edited persisted fields belong in the edit operation. */
export function draftPayload(id:string,draft:Draft):Record<string,unknown> {const payload:Record<string,unknown>={id};for(const field of ['title','notes','order','flagged','parent_id','due_at'] as const)if(Object.hasOwn(draft.patch,field))payload[field]=draft.patch[field];return payload;}
export function draftGroupPayload(id:string,draft:Draft,group:DraftGroup,deferMode:'date'|'until'='date'):Record<string,unknown> {
 if(group==='status')return {id,status:draft.status};
 if(group==='defer')return deferMode==='date'?{id,date:draft.deferDate,timezone:draft.timezone}:{id,until:draft.deferUntil};
 const payload:Record<string,unknown>={id};for(const field of ['title','notes','order','flagged','parent_id','due_at'] as const)if(Object.hasOwn(draft.patch,field))payload[field]=draft.patch[field];return payload;
}
/** Acknowledgment clears only captured fields still matching this proposal. */
export function acknowledgeDraft(drafts:Drafts,id:string,captured:Partial<DraftValues>):Drafts {
 const draft=drafts[id];if(!draft)return drafts;const patch={...draft.patch};for(const field of Object.keys(captured) as (keyof DraftValues)[])if(Object.hasOwn(patch,field)&&(Object.is(patch[field],captured[field])||Array.isArray(patch[field])&&Array.isArray(captured[field])&&JSON.stringify(patch[field])===JSON.stringify(captured[field])))delete patch[field];
 const fields=Object.keys(patch);return {...drafts,[id]:{...draft,patch,dirty:fields.length>0,dirtyGroups:{edit:fields.some(f=>['title','notes','order','flagged','parent_id','due_at'].includes(f)),defer:fields.some(f=>['deferDate','deferUntil','timezone'].includes(f)),status:fields.includes('status')}}};
}
