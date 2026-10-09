import type {Snapshot} from '../domain/core';
/** Successful writes retain only the latest operations per owner, including Undo. */
export const OPERATION_HISTORY_LIMIT=100;
export type Receipt={canonical_payload:string;result:string;delta:string;revision_after:number;undo_of:string|null};

export type OperationResolution={perspective?:{id:string};actions?:{ref?:string;id:string}[];project?:{id:string;created:boolean};tag?:{id:string;created:boolean}};
export type OperationResult={operationId:string;revision:number;changedIds:string[];resolved?:OperationResolution};
/** Command data carries no owner; the trusted composition layer binds the verified identity. */
export type OwnerCommitRequest={operationId:string;payload:string;before:Snapshot;after:Snapshot;now:string;undoOf:string|null;resolved?:OperationResolution};
/**
 * Owner-bound capability handed to the application. Owner is fixed by construction and there is
 * no owner parameter or unscoped escape hatch. All writes, the owner revision, receipt and history
 * pruning commit or roll back together; keep the latest OPERATION_HISTORY_LIMIT receipts by
 * revision, and replay does not prune.
 */
export interface OwnerActionStore {
/** Reads a consistent snapshot for the bound owner; unknown owners have revision zero. */
 readSnapshot():Promise<Snapshot>;
 readReceipt(operationId:string):Promise<Receipt|null>;
 hasUndo(undoOf:string):Promise<boolean>;
 commit(command:OwnerCommitRequest):Promise<OperationResult>;
}
export interface OwnerActionPorts {store:OwnerActionStore;clock:()=>string;newId:()=>string}
