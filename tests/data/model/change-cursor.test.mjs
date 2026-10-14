import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeChangeCursor, encodeChangeCursor, pageChangeWindow, projectRetainedOperation } from '../../../lib/data/model/change-cursor.ts';
import { persistedAction, persistedProject, persistedTag, persistedPerspective, persistedActionTag } from '../../../lib/domain/persisted-dto.ts';

const scope = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const now = '2026-10-14T09:00:00.000Z';
const uuid = value => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
const emptyDelta = () => ({ actions: [], projects: [], tags: [], perspectives: [], action_tags: [] });
const retained = (revision, delta = emptyDelta()) => ({ operation_id: uuid(revision), revision_before: revision - 1, revision_after: revision, committed_at: now, undo_of: null, delta: JSON.stringify(delta) });
const window = (head, operations, oldest = operations[0]?.revision_after ?? null) => ({ head_revision: head, oldest_revision: oldest, operations });
const utf8Length = value => new TextEncoder().encode(JSON.stringify(value)).length;

function token(payload) {
  return btoa(JSON.stringify(payload)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

test('cursor encoding is canonical and decoding rejects padding, duplicate keys, extensions and malformed positions', () => {
  const encoded = encodeChangeCursor(scope, 12, 19);
  assert.deepEqual(decodeChangeCursor(encoded), { v: 1, scope, position: 12, through_revision: 19 });
  for (const invalid of [encoded + '=', token({ v: 1, scope, position: 12, through_revision: 19, extra: 0 }), token({ v: 2, scope, position: 12, through_revision: 19 }), token({ v: 1, scope, position: 20, through_revision: 19 }), token({ v: 1, scope, position: -1, through_revision: 19 })]) {
    assert.throws(() => decodeChangeCursor(invalid), error => error.code === 'invalid_cursor');
  }
  const duplicate = btoa(`{"v":1,"scope":"${scope}","position":1,"position":1,"through_revision":null}`).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
  assert.throws(() => decodeChangeCursor(duplicate), error => error.code === 'invalid_cursor');
});

test('feed projection preserves persisted before/after records and omits derived and internal fields', () => {
  const action = { id: uuid(1), title: 'Action', revision: 2, parent_id: null, project_id: null, status: 'active', due_at: null, defer_until: null, notes: ' exact ', order: 0, flagged: true, created_at: now, updated_at: now, owner: 'secret', view: 'normal', tags: ['derived'] };
  const project = { id: uuid(2), name: 'Project', description: '', parent_id: null, order: 0, revision: 2, created_at: now, updated_at: now, path: 'derived' };
  const tag = { id: uuid(3), name: 'Tag', description: '', parent_id: null, order: 0, revision: 2, created_at: now, updated_at: now };
  const perspective = { id: uuid(4), name: 'View', description: '', filter: { statuses: ['active'], flagged: true }, definition_version: 1, revision: 2, created_at: now, updated_at: now };
  const relation = { action_id: uuid(1), tag_id: uuid(3), revision: 2 };
  const projected = projectRetainedOperation(retained(2, {
    actions: [{ before: null, after: action }], projects: [{ before: project, after: null }], tags: [{ before: null, after: tag }],
    perspectives: [{ before: null, after: perspective }], action_tags: [{ before: relation, after: null }],
  }));
  assert.deepEqual(projected.changes.actions[0], { before: null, after: { id: action.id, title: action.title, revision: 2, parent_id: null, project_id: null, status: 'active', due_at: null, defer_until: null, notes: ' exact ', order: 0, flagged: true, created_at: now, updated_at: now } });
  assert.deepEqual(projected.changes.actions[0].after, persistedAction(action));
  assert.deepEqual(projected.changes.projects[0].before, persistedProject(project));
  assert.deepEqual(projected.changes.projects[0], { before: { id: project.id, name: project.name, description: '', parent_id: null, order: 0, revision: 2, created_at: now, updated_at: now }, after: null });
  assert.deepEqual(projected.changes.tags[0].after, persistedTag(tag));
  assert.deepEqual(projected.changes.perspectives[0].after.filter, { statuses: ['active'], flagged: true });
  assert.deepEqual(projected.changes.perspectives[0].after, persistedPerspective(perspective));
  assert.deepEqual(projected.changes.action_tags[0], { before: relation, after: null });
  assert.deepEqual(projected.changes.action_tags[0].before, persistedActionTag(relation));
});

test('whole-operation pages fence the initial head, reset terminal and empty cursors, and remain under one MiB', () => {
  const records = [retained(1), retained(2), retained(3)];
  const first = pageChangeWindow(window(3, records), decodeChangeCursor(encodeChangeCursor(scope, 0)), scope, 1);
  assert.deepEqual(first.changes.map(row => row.revision_after), [1]);
  assert.equal(first.has_more, true);
  assert.deepEqual(decodeChangeCursor(first.next_cursor), { v: 1, scope, position: 1, through_revision: 3 });
  const second = pageChangeWindow(window(4, records.slice(1), 1), decodeChangeCursor(first.next_cursor), scope, 10);
  assert.deepEqual(second.changes.map(row => row.revision_after), [2, 3]);
  assert.equal(second.has_more, false);
  assert.deepEqual(decodeChangeCursor(second.next_cursor), { v: 1, scope, position: 3, through_revision: null });
  const empty = pageChangeWindow(window(4, [], 1), decodeChangeCursor(encodeChangeCursor(scope, 4)), scope, 20);
  assert.deepEqual(empty.changes, []);
  assert.deepEqual(decodeChangeCursor(empty.next_cursor), { v: 1, scope, position: 4, through_revision: null });
  assert(utf8Length(second) <= 1_048_576);
});

test('expired positions, retained gaps, future cursors and a single oversized operation fail explicitly', () => {
  assert.throws(() => pageChangeWindow(window(101, Array.from({ length: 100 }, (_, index) => retained(index + 2)), 2), decodeChangeCursor(encodeChangeCursor(scope, 0)), scope, 20), error => error.code === 'cursor_expired');
  assert.throws(() => pageChangeWindow(window(3, [retained(1), retained(3)]), decodeChangeCursor(encodeChangeCursor(scope, 0)), scope, 20), error => error.code === 'invalid_state');
  assert.throws(() => pageChangeWindow(window(0, []), decodeChangeCursor(encodeChangeCursor(scope, 1)), scope, 20), error => error.code === 'invalid_cursor');
  const largeOperations = Array.from({ length: 18 }, (_, index) => {
    const action = { id: uuid(index + 1), title: 'Saved', revision: index + 1, parent_id: null, project_id: null, status: 'active', due_at: null, defer_until: null, notes: 'n'.repeat(60_000), order: 0, flagged: false, created_at: now, updated_at: now };
    return retained(index + 1, { ...emptyDelta(), actions: [{ before: null, after: action }] });
  });
  const bounded = pageChangeWindow(window(18, largeOperations), decodeChangeCursor(encodeChangeCursor(scope, 0)), scope, 100);
  assert.equal(bounded.has_more, true);
  assert(utf8Length(bounded) <= 1_048_576);
  assert(bounded.changes.length < largeOperations.length);
  const malformed = retained(1, { ...emptyDelta(), actions: [{ before: null, after: { id: 'broken' } }] });
  assert.throws(() => projectRetainedOperation(malformed), error => error.code === 'invalid_state');
});

test('history rejects non-UUID identities, noncanonical instants and duplicated perspective statuses', () => {
  const action = { id: uuid(1), title: 'Action', revision: 1, parent_id: null, project_id: null, status: 'active', due_at: null, defer_until: null, notes: '', order: 0, flagged: false, created_at: now, updated_at: now };
  for (const changed of [
    { ...action, id: 'not-a-uuid' },
    { ...action, due_at: 'soon' },
  ]) assert.throws(() => projectRetainedOperation(retained(1, { ...emptyDelta(), actions: [{ before: null, after: changed }] })), error => error.code === 'invalid_state');
  const perspective = { id: uuid(2), name: 'View', description: '', filter: { statuses: ['active', 'active'] }, definition_version: 1, revision: 1, created_at: now, updated_at: now };
  assert.throws(() => projectRetainedOperation(retained(1, { ...emptyDelta(), perspectives: [{ before: null, after: perspective }] })), error => error.code === 'invalid_state');
});
