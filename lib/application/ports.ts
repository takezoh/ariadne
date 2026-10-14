import type { ChangeWindow, OperationResult, OwnerCommitRequest, Receipt, Snapshot } from '../data/types';

/** Successful writes retain only the latest operations per owner, including Undo. */
export const OPERATION_HISTORY_LIMIT = 100;

/** Owner-bound capability handed to the application. Identity is fixed by its trusted composition. */
export interface OwnerActionStore {
  /** Reads a consistent snapshot for the bound owner; unknown owners have revision zero. */
  readSnapshot(): Promise<Snapshot>;
  /** Reads the retained owner operation window, head and oldest revision atomically. */
  readChangeWindow(afterRevision: number, throughRevision: number | null): Promise<ChangeWindow>;
  readReceipt(operationId: string): Promise<Receipt | null>;
  hasUndo(undoOf: string): Promise<boolean>;
  commit(command: OwnerCommitRequest): Promise<OperationResult>;
}

export type OwnerActionPorts = Readonly<{
  store: OwnerActionStore;
  clock: () => string;
  newId: () => string;
  /** Domain-separated scope fingerprint from the currently verified identity. */
  changeCursorScope: () => Promise<string>;
}>;
