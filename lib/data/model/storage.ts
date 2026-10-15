import { canonical, fail, id, integer, object } from '../../domain/core';
import { delta, validateDelta } from '../../domain/operations';
import type { Action, DeepReadonly, OperationResult, OwnerCommitRequest, Perspective, Receipt, Snapshot } from '../types';
import { persistedPerspective } from '../../domain/persisted-dto';

export const MAX_BOUND_JSON_BYTES = 100000;
export const MAX_COMMIT_PLAN_BYTES = 524288;

function encodedBytes(value: unknown) {
  return new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value)).length;
}

/** Keep each JSON value used as a bound D1 payload within its statement budget. */
export function assertBoundJson(value: string) {
  const size = encodedBytes(value);
  if (size > MAX_BOUND_JSON_BYTES) fail('operation_too_large', '保存する変更が大きすぎます。', 413);
  return size;
}

export type SnapshotRows = readonly [
  readonly { revision: number }[],
  readonly (Omit<Action, 'flagged'> & { flagged: number })[],
  Snapshot['projects'],
  Snapshot['tags'],
  Snapshot['action_tags'],
  Snapshot['catalog_identity_ledger'],
  readonly (Pick<Perspective, 'id' | 'name' | 'description' | 'revision' | 'created_at' | 'updated_at'> & {
    definition_version: 1 | 2;
    filter: string;
  })[],
];

function decodePerspectiveRow(row: SnapshotRows[6][number]): Perspective {
  let definition: unknown;
  try { definition = JSON.parse(row.filter); } catch { fail('invalid_state', 'Persisted Perspective definition is invalid.'); }
  const metadata = {
    id: row.id,
    name: row.name,
    description: row.description,
    revision: row.revision,
    created_at: row.created_at,
    updated_at: row.updated_at,
    definition_version: row.definition_version,
  };
  return row.definition_version === 1
    ? persistedPerspective({ ...metadata, filter: definition })
    : persistedPerspective({ ...metadata, query: definition });
}

/** Decode database scalar representations into the shared, readonly application snapshot. */
export function decodeSnapshotRows(rows: SnapshotRows): Snapshot {
  const state = rows[0][0];
  if (!state) fail('unavailable', '保存先を取得できません。', 503);
  return {
    ...state,
    actions: rows[1].map(row => ({ ...row, flagged: row.flagged === 1 })),
    projects: rows[2],
    tags: rows[3],
    action_tags: rows[4],
    catalog_identity_ledger: rows[5],
    perspectives: rows[6].map(decodePerspectiveRow),
  };
}

export function parseReceiptResult(receipt: Pick<Receipt, 'delta' | 'result'>): OperationResult {
  try {
    validateDelta(JSON.parse(receipt.delta));
    const result = object(JSON.parse(receipt.result));
    id(result.operationId);
    integer(result.revision);
    if (!Array.isArray(result.changedIds)) fail('invalid_state', 'Receipt changed IDs are required.');
    for (const value of result.changedIds) id(value);
    if (result.resolved !== undefined) {
      const resolved = object(result.resolved);
      if (resolved.actions !== undefined) {
        if (!Array.isArray(resolved.actions)) fail('invalid_state', 'Receipt resolved actions must be an array.');
        for (const row of resolved.actions) id(object(row).id);
      }
      for (const key of ['project', 'tag', 'perspective']) if (resolved[key] !== undefined) {
        const row = object(resolved[key]);
        id(row.id);
        if (key !== 'perspective' && typeof row.created !== 'boolean') fail('invalid_state', 'Receipt creation state is required.');
      }
    }
    return result as unknown as OperationResult;
  } catch {
    fail('invalid_state', 'The receipt does not match the current schema.');
  }
}

export type StorageRowChange = Readonly<{ before: object | null; after: object | null }>;
export type StorageTableKey = 'actions' | 'projects' | 'tags' | 'perspectives' | 'action_tags' | 'catalog_identity_ledger';
export type StorageTablePlan = Readonly<{ key: StorageTableKey; changes: readonly StorageRowChange[] }>;
export type StoragePlan = DeepReadonly<{
  result: OperationResult;
  changes: ReturnType<typeof delta>;
  tables: readonly StorageTablePlan[];
  markerChanges: readonly StorageRowChange[];
  planBytes: number;
}>;

function perspectiveStorageRow(value: Perspective): object {
  if (value.definition_version === 1) return { ...value, filter: canonical(value.filter) };
  const { query, ...metadata } = value;
  return { ...metadata, filter: canonical(query) };
}

/** Build a pure, owner-free description of the row writes and enforce all plan budgets. */
export function planStorageCommit(request: OwnerCommitRequest): StoragePlan {
  const { operationId, payload, before, after } = request;
  const changes = delta(before, after);
  const result: OperationResult = {
    operationId,
    revision: before.revision + 1,
    changedIds: changes.actions.map(item => (item.after ?? item.before)!.id),
    ...(request.resolved ? { resolved: request.resolved } : {}),
  };
  const tables: StorageTablePlan[] = [
    { key: 'actions', changes: changes.actions },
    { key: 'projects', changes: changes.projects },
    { key: 'tags', changes: changes.tags },
    {
      key: 'perspectives',
      changes: changes.perspectives.map(item => ({
        before: item.before ? perspectiveStorageRow(item.before) : null,
        after: item.after ? perspectiveStorageRow(item.after) : null,
      })),
    },
    { key: 'action_tags', changes: changes.action_tags },
  ];
  const receiptBytes = assertBoundJson(payload)
    + assertBoundJson(JSON.stringify(result))
    + assertBoundJson(JSON.stringify(changes));
  const bulkBytes = tables.reduce((total, table) => total + encodedBytes(table.changes), 0);
  let planBytes = receiptBytes + bulkBytes;
  if (planBytes > MAX_COMMIT_PLAN_BYTES) fail('operation_too_large', '保存する変更が大きすぎます。', 413);

  const previousMarkers = new Map(before.catalog_identity_ledger.map(row => [JSON.stringify([row.kind, row.identity]), row]));
  const markerChanges = after.catalog_identity_ledger.flatMap(row => {
    const previous = previousMarkers.get(JSON.stringify([row.kind, row.identity])) ?? null;
    return canonical(previous) === canonical(row) ? [] : [{ before: previous, after: row }];
  });
  planBytes += encodedBytes(markerChanges);
  if (planBytes > MAX_COMMIT_PLAN_BYTES) fail('operation_too_large', 'Generated identity markers exceed the storage budget.', 413);

  return { result, changes, tables, markerChanges, planBytes };
}
