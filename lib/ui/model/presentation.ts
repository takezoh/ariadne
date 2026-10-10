/** Scopes are supplied by the authoritative snapshot, never inferred from labels. */
export function visibleActions<T extends {id:string;view?:string}>(actions:readonly T[],scopes:Record<string,string[]>,view:string):T[] {
 const ids=new Set(scopes[view]??[]);return actions.filter(action=>['inbox','waiting','flagged'].includes(view)?ids.has(action.id):action.view===view);
}
export function scopeTitle(view:string):string {return ({inbox:'Inbox',normal:'Actions',flagged:'Flagged',waiting:'On hold',deferred:'Later',completed:'Completed',cancelled:'Dropped'} as Record<string,string>)[view]??'Action';}

/** The review describes exactly the persisted fields sent, never the unsent draft. */
export function reviewChangeSummary(preview:{kind:string;payload:Record<string,unknown>},actions:readonly {id:string;title:string;[key:string]:unknown}[]):string[] {
 const action=actions.find(action=>action.id===preview.payload.id);const fields={...preview.payload};delete fields.id;
 if(preview.kind==='defer'&&Object.hasOwn(fields,'until')){fields.defer_until=fields.until;delete fields.until;}
 if(preview.kind==='release')fields.defer_until=null;
 if(['complete','cancel','reopen'].includes(preview.kind))fields.status=({complete:'completed',cancel:'dropped',reopen:'active'} as Record<string,string>)[preview.kind];
 const names:Record<string,string>={title:'Title',notes:'Notes',parent_id:'Parent action',due_at:'Due',defer_until:'Deferred until',status:'Status',order:'Order',flagged:'Flagged',date:'Defer date',timezone:'Timezone'};
 function value(field:string,input:unknown,proposed:boolean):string {
  if(input==null)return proposed?'None (clear)':'None';
  if(field==='flagged')return input?'On':'Off';
  if(field==='status')return ({active:'Active','on-hold':'On hold',completed:'Completed',dropped:'Dropped'} as Record<string,string>)[String(input)]??String(input);
  if(field==='parent_id')return '“'+(actions.find(a=>a.id===input)?.title??'Unavailable parent ('+String(input)+')')+'”';
  if(input==='')return proposed?'Clear (empty text)':'Empty text';
  if(typeof input==='string')return '“'+input+'”';
  return typeof input==='object'?JSON.stringify(input):String(input);
 }
 return Object.entries(fields).map(([field,after])=>`${names[field]??field}\nSaved: ${value(field,action?.[field],false)}\nAfter: ${value(field,after,true)}`);
}

/** UI copy depends on typed failures, never on server-authored message strings. */
export function errorMessage(code:unknown):string {
 const messages:Record<string,string>={
  outcome_unknown:'The save result is unknown. Your input and exact request are retained. Check the result or retry the same request.',
  outcome_pending:'Check the pending save result before making another change.',
  revision_conflict:'Actions changed elsewhere. Your edits are retained. Refresh and review the latest values before saving.',
  conflict:'Actions changed elsewhere. Your edits are retained. Refresh and review the latest values before saving.',
  idempotency_conflict:'This request ID was already used with different input. Keep the original request; refresh and review before making a new change.',
  undo_conflict:'This action changed after the original save. Undo cannot overwrite those changes. Refresh to review the latest values.',
  not_found:'The action or saved history is no longer available. Your edits are retained. Refresh to check the latest state.',
  invalid_input:'Check the entered values. Order must be a nonnegative whole number, and dates must include a valid timezone where requested.',
  invalid_state:'This change is not valid for the current action state. Your edits are retained. Refresh and review the action.',
  timezone_required:'Choose an explicit timezone for this date. Date-only Defer uses 09:00 in that timezone.',
  ambiguous_time:'This local time is ambiguous or unavailable. Enter a date and time with an explicit UTC offset.',
  cycle:'An action cannot be its own ancestor. Choose a different parent.',
  invalid_graph:'This parent structure is not valid. Choose an available parent without a containment cycle.',
  related_actions:'This item still contains or is used by other actions. Review those references before removing it.',
  related_perspectives:'A saved perspective still references this item. Update that perspective before removing it.',
  unauthorized:'Sign in to access your actions. Your unsaved input is retained.',
  forbidden:'This operation is not permitted. Your unsaved input is retained.',
  unavailable:'The service is unavailable. Your input is retained. Try refreshing before making a new change.',
  unknown_kind:'This change is not supported. Your input is retained. Refresh the app before trying again.'
 };
 return messages[String(code)]??'Could not complete this operation. Your input is retained. Refresh and review the current state before making a new change.';
}

/** The current warning wire shape describes Due/Defer conflicts without a code. */
export function warningMessage(warning:{id?:string;due_at?:string;code?:string},actions:readonly {id:string;title:string}[]):string {
 if(warning.id&&typeof warning.due_at==='string'){
  const title=actions.find(action=>action.id===warning.id)?.title;
  return `${title?`“${title}”`:'An affected action'} is deferred beyond its due time (${warning.due_at}).`;
 }
 return 'Review this change carefully: it includes an additional warning for an affected action.';
}

/** Bound indentation protects narrow layouts while preserving saved tree order. */
export function actionDepth(id:string,actions:readonly {id:string;parent_id?:string|null}[]):number {
 const byId=new Map(actions.map(action=>[action.id,action]));const seen=new Set<string>();let depth=0,current=byId.get(id);
 while(current?.parent_id&&!seen.has(current.parent_id)){seen.add(current.parent_id);depth++;current=byId.get(current.parent_id);}
 return Math.min(depth,3);
}

/** Empty saved titles use a label only at presentation boundaries. */
export function displayTitle(title:unknown):string {return typeof title==='string'&&title!==''?title:'Untitled';}
