/** Global feedback is a pure projection, including drafts outside the current inspector. */
export function createSaveStatusModel(){
 function project(state:{data?:unknown;unknown?:unknown;recoveryRequired?:boolean;saving?:boolean;operationError?:unknown;moveIssue?:unknown;classificationIssue?:unknown;drafts?:Record<string,{dirty?:boolean}>;catalogDrafts?:Record<string,{patch?:object}>;saveErrors?:Record<string,unknown>;catalogErrors?:Record<string,unknown>;conflicts?:Record<string,readonly unknown[]>;catalogConflicts?:Record<string,readonly unknown[]>},local:{errors?:boolean;composing?:boolean;pending?:boolean}={}){
  if(state.unknown||state.recoveryRequired)return {kind:'unknown',label:'Save result unknown',icon:'waiting'};
  if(state.operationError||state.moveIssue||state.classificationIssue||local.errors||Object.values(state.saveErrors||{}).some(Boolean)||Object.values(state.catalogErrors||{}).some(Boolean)||Object.values(state.conflicts||{}).some(fields=>fields.length)||Object.values(state.catalogConflicts||{}).some(fields=>fields.length))return {kind:'error',label:'Changes need attention',icon:'waiting'};
  if(state.saving)return {kind:'saving',label:'Saving changes',icon:'refresh'};
  if(local.pending||local.composing||Object.values(state.drafts||{}).some(draft=>draft.dirty)||Object.values(state.catalogDrafts||{}).some(draft=>Object.keys(draft.patch||{}).length))return {kind:'pending',label:'Changes waiting to save',icon:'circle'};
  return state.data?{kind:'saved',label:'All changes saved',icon:'tick'}:{kind:'loading',label:'Connecting',icon:'refresh'};
 }
 function message(text:string){return ['Saved.','Save confirmed.','Up to date. Unsaved changes are retained.'].includes(text)?'':text;}
 return {project,message};
}
