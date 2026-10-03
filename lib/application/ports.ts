import type {Snapshot} from '../domain/core';
/** Successful writes retain only the latest operations per owner, including Undo. */
export const OPERATION_HISTORY_LIMIT=100;
export type Receipt={canonical_payload:string;result:string;delta:string;revision_after:number;undo_of:string|null};

export type OperationResolution={perspective?:{id:string};actions?:{ref?:string;id:string}[];project?:{id:string;created:boolean};tag?:{id:string;created:boolean}};
export type OperationResult={operationId:string;revision:number;changedIds:string[];resolved?:OperationResolution};
export type CommitRequest={owner:string;operationId:string;payload:string;before:Snapshot;after:Snapshot;now:string;undoOf:string|null;resolved?:OperationResolution};
/** All writes, the owner revision, receipt and history pruning commit or roll back together.
 * Keep the latest OPERATION_HISTORY_LIMIT receipts by revision; replay does not prune.
 * The latest receipt always remains, preserving revision and retained Undo markers.
 */
export interface ActionStore {
/** Reads a consistent snapshot; unknown owners have revision zero. */
 readSnapshot(owner:string):Promise<Snapshot>;
 readReceipt(owner:string,operationId:string):Promise<Receipt|null>;
 hasUndo(owner:string,undoOf:string):Promise<boolean>;
 commit(request:CommitRequest):Promise<OperationResult>;
}
export interface ActionPorts {store:ActionStore;clock:()=>string;newId:()=>string}
