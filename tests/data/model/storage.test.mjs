import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertBoundJson, decodeSnapshotRows, parseReceiptResult, planStorageCommit } from '../../../lib/data/model/storage.ts';

const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const now = '2026-10-14T09:00:00.000Z';
const defaultView = { type: 'tasklist', sort: 'action_order', direction: 'asc', group: 'none', completion_label: 'complete', show_notes: false };
const empty = revision => ({ revision, catalog_identity_ledger: [], actions: [], projects: [], tags: [], action_tags: [], perspectives: [] });
const action = (id, title) => ({ id, title, revision: 1, parent_id: null, project_id: null, status: 'active', due_at: null, defer_until: null, notes: '', order: 0, flagged: false, created_at: now, updated_at: now });

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

test('snapshot codec decodes SQL booleans and JSON without altering returned rows', () => {
  const raw = [
    [{ revision: 3 }],
    [{ ...action(uuid(1), 'Saved'), flagged: 1 }],
    [], [], [], [],
    [{ id: uuid(2), name: 'View', description: '', filter: '{"statuses":["active"]}', view: JSON.stringify(defaultView), definition_version: 2, revision: 1, created_at: now, updated_at: now }],
  ];
  deepFreeze(raw);
  const decoded = decodeSnapshotRows(raw);
  assert.equal(decoded.revision, 3);
  assert.equal(decoded.actions[0].flagged, true);
  assert.deepEqual(decoded.perspectives[0].filter, { statuses: ['active'] });
  assert.deepEqual(decoded.perspectives[0].view, defaultView);
  assert.equal(raw[1][0].flagged, 1);
  assert.equal(raw[6][0].filter, '{"statuses":["active"]}');
  assert.equal(raw[6][0].view, JSON.stringify(defaultView));
});

test('receipt parser validates current delta and returns the exact stored result shape', () => {
  const result = {
    operationId: uuid(9), revision: 4, changedIds: [uuid(1)],
    resolved: { actions: [{ ref: 'parent', id: uuid(1) }], project: { id: uuid(2), created: true } },
    preservedExtension: { exact: 'stored' },
  };
  const parsed = parseReceiptResult({
    result: JSON.stringify(result),
    delta: JSON.stringify({ actions: [], projects: [], tags: [], action_tags: [], perspectives: [] }),
  });
  assert.deepEqual(parsed, result);
  assert.throws(() => parseReceiptResult({ result: JSON.stringify({ ...result, revision: -1 }), delta: JSON.stringify({}) }), error => error.code === 'invalid_state');
});

test('receipt parsing accepts only complete known v1 Perspective history and leaves its bytes/result untouched', () => {
  const oldRow = { id: uuid(3), name: 'Old', description: 'exact\ncontext', filter: { statuses: ['active'] }, definition_version: 1, revision: 4, created_at: now, updated_at: now };
  const result = { operationId: uuid(9), revision: 4, changedIds: [], resolved: { perspective: { id: uuid(3) } } };
  const delta = { perspectives: [{ before: null, after: oldRow }], actions: [], projects: [], tags: [], action_tags: [] };
  const parsed = parseReceiptResult({ result: JSON.stringify(result), delta: JSON.stringify(delta) });
  assert.deepEqual(parsed, result);
  const without=(value,key)=>{const copy={...value};delete copy[key];return copy;},current={...oldRow,definition_version:2,view:defaultView};
  for (const after of [
    { ...oldRow, unknown: true }, { ...oldRow, view: defaultView }, { ...oldRow, definition_version: 3 },
    { ...oldRow, definition_version: 2 }, { ...oldRow, definition_version: 2, view: { ...defaultView, unknown: true } },
    { ...oldRow, created_at: null }, without(oldRow,'created_at'), { ...oldRow, updated_at: null }, without(oldRow,'updated_at'),
    { ...current, created_at: null }, without(current,'created_at'), { ...current, updated_at: null }, without(current,'updated_at'),
    { ...current, revision: null }, without(current,'revision'),
  ]) assert.throws(() => parseReceiptResult({ result: JSON.stringify(result), delta: JSON.stringify({ ...delta, perspectives: [{ before: null, after }] }) }), error => error.code === 'invalid_state');
});

test('storage plan is deterministic, readonly-input safe, preserves canonical filters and marker atomicity', () => {
  const before = deepFreeze(empty(3));
  const after = deepFreeze({
    ...empty(3),
    actions: [action(uuid(1), 'Saved')],
    projects: [{ id: uuid(2), name: 'Project', description: '', parent_id: null, order: 0, revision: 1, created_at: now, updated_at: now }],
    catalog_identity_ledger: [{ kind: 'project', identity: uuid(2), revision: 4 }],
    perspectives: [{ id: uuid(3), name: 'View', description: '', filter: { statuses: ['active'], flagged: true }, view: { ...defaultView, type: 'tasklist', sort: 'title', direction: 'desc', show_notes: true }, definition_version: 2, revision: 4, created_at: now, updated_at: now }],
  });
  const request = deepFreeze({ operationId: uuid(8), payload: '{"operation":"apply"}', before, after, now, undoOf: null, resolved: { actions: [{ id: uuid(1) }] } });
  const first = planStorageCommit(request), second = planStorageCommit(request);
  assert.deepEqual(first, second);
  assert.equal(first.result.revision, 4);
  assert.deepEqual(first.result.changedIds, [uuid(1)]);
  assert.deepEqual(first.tables.map(row => row.key), ['actions', 'projects', 'tags', 'perspectives', 'action_tags']);
  assert.equal(first.tables.find(row => row.key === 'perspectives').changes[0].after.filter, '{"flagged":true,"statuses":["active"]}');
  assert.equal(first.tables.find(row => row.key === 'perspectives').changes[0].after.view, '{"completion_label":"complete","direction":"desc","group":"none","show_notes":true,"sort":"title","type":"tasklist"}');
  assert.deepEqual(first.markerChanges, [{ before: null, after: { kind: 'project', identity: uuid(2), revision: 4 } }]);
  assert.equal(before.actions.length, 0);
  assert.equal(after.perspectives[0].filter.statuses[0], 'active');
});

test('individual bound JSON budget is measured in UTF-8 bytes and rejects oversize data', () => {
  assert.equal(assertBoundJson('日本語'), new TextEncoder().encode('日本語').length);
  assert.throws(() => assertBoundJson('x'.repeat(100001)), error => error.code === 'operation_too_large');
});
