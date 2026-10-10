/** Global feedback is a pure projection, including drafts outside the current inspector. */
export function createSaveStatusModel(){
 const feedback=(kind:string,label:string,icon:string)=>({kind,label,icon,visibleLabel:kind==='saved'||kind==='loading'?'':label,attention:kind==='unknown'||kind==='error'});
 function project(state:{data?:unknown;unknown?:unknown;recoveryRequired?:boolean;saving?:boolean;operationError?:unknown;moveIssue?:unknown;classificationIssue?:unknown;drafts?:Record<string,{dirty?:boolean}>;catalogDrafts?:Record<string,{patch?:object}>;saveErrors?:Record<string,unknown>;catalogErrors?:Record<string,unknown>;conflicts?:Record<string,readonly unknown[]>;catalogConflicts?:Record<string,readonly unknown[]>},local:{errors?:boolean;composing?:boolean;pending?:boolean}={}){
  if(state.unknown||state.recoveryRequired)return feedback('unknown','Save result unknown','waiting');
  if(state.operationError||state.moveIssue||state.classificationIssue||local.errors||Object.values(state.saveErrors||{}).some(Boolean)||Object.values(state.catalogErrors||{}).some(Boolean)||Object.values(state.conflicts||{}).some(fields=>fields.length)||Object.values(state.catalogConflicts||{}).some(fields=>fields.length))return feedback('error','Changes need attention','waiting');
  if(state.saving)return feedback('saving','Saving changes','refresh');
  if(local.pending||local.composing||Object.values(state.drafts||{}).some(draft=>draft.dirty)||Object.values(state.catalogDrafts||{}).some(draft=>Object.keys(draft.patch||{}).length))return feedback('pending','Changes waiting to save','circle');
  return state.data?feedback('saved','All changes saved','tick'):feedback('loading','Connecting','refresh');
 }
 function message(text:string){return ['Saved.','Save confirmed.','Up to date. Unsaved changes are retained.'].includes(text)?'':text;}
 return {project,message};
}
