import type {CatalogDraft} from './catalog-drafts';
import type {DraftAction, Drafts, DraftValues} from './drafts';
import type {UiInteractionState} from './interaction';
import type {MovePayload} from './movement';
import type {TransientRecord} from './transient-create';

export interface UiResult {
 operationId?:string;
 resolved?:{actions?:{id:string}[];project?:{id:string;created:boolean};tag?:{id:string;created:boolean}};
}
export interface UiSnapshot {revision:number;actions:DraftAction[];result?:UiResult;[key:string]:unknown}
export interface UiPreview {expectedRevision:number;kind:string;payload:Record<string,unknown>;[key:string]:unknown}
export interface UiState {
 interaction:UiInteractionState;
 transients:Record<string,TransientRecord>;
 drafts:Drafts;
 busy:boolean;
 saving:boolean;
 operationError:{key:string;message:string;temporaryId?:string}|null;
 data:UiSnapshot|null;
 view:string;
 unknown:({name:string;args:Readonly<Record<string,unknown>>;targetId?:string;captured?:Partial<DraftValues>})|null;
 createdActionId:string|null;
 retainedActionId:string|null;
 movedActionIds:string[];
 classificationIssue:{kind:'action_project'|'action_tag';payload:Record<string,unknown>;reason:string}|null;
 moveIssue:{payload:MovePayload;reason:string}|null;
 inspector:{kind:'action'|'project'|'tag';id:string}|null;
 catalogDrafts:Record<string,CatalogDraft>;
 catalogErrors:Record<string,string>;
 catalogConflicts:Record<string,string[]>;
 catalogCreated:{type:'project'|'tag';id:string;sequence:number;token:number;available?:boolean}|null;
 creationFocusId:string|null;
 fieldIssues:Record<string,{field:UiFieldIssue;message:string}>;
 saveErrors:Record<string,string>;
 conflicts:Record<string,string[]>;
 saveStatus:string;
 recoveryRequired:boolean;
 lastOperation:string|null;
 selectedId:string|null;
 reviewed:{p:UiPreview;draftId:string|null;captured:Partial<DraftValues>}|null;
}
export type DeepReadonly<T>=T extends (...args:never[])=>unknown?T:T extends object?{readonly [K in keyof T]:DeepReadonly<T[K]>}:T;
export type UiFieldIssue='due_at'|'deferUntil';
