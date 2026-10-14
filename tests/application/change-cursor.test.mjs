import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actionCallForOwner } from '../helpers/owner-composition.mjs';
import { memoryActionStore } from '../helpers/memory-action-store.mjs';
import { decodeChangeCursor } from '../../lib/data/model/change-cursor.ts';

const now = '2026-10-14T09:00:00.000Z';
function setup() {
  const store = memoryActionStore();
  const ports = { store, clock: () => now, newId: () => crypto.randomUUID() };
  const call = (owner, name, args = {}) => actionCallForOwner(ports, owner, name, args);
  const write = async (owner, kind, payload) => call(owner, 'apply_change', { schemaVersion: 2, operationId: crypto.randomUUID(), expectedRevision: (await store.readSnapshot(owner)).revision, kind, payload });
  return { store, call, write };
}

test('snapshot and current cursor share the revision and expose authoritative Action/Tag associations', async () => {
  const { call, write } = setup();
  const project = (await write('A', 'project_add', { name: 'Project' })).result.resolved.project.id;
  const tag = (await write('A', 'tag_add', { name: 'Tag' })).result.resolved.tag.id;
  const saved = await write('A', 'add', { title: 'Action', project_id: project, tag_ids: [tag] });
  const snapshot = await call('A', 'list_actions');
  const cursor = decodeChangeCursor(snapshot.change_cursor);
  assert.equal(cursor.position, snapshot.revision);
  assert.equal(cursor.through_revision, null);
  assert.deepEqual(snapshot.action_tags, [{ action_id: saved.result.resolved.actions[0].id, tag_id: tag, revision: snapshot.revision }]);
  assert.equal('catalog_identity_ledger' in snapshot, false);
});

test('empty terminal cursor advances to the observed head and sees later writes', async () => {
  const { call, write, store } = setup();
  const baseline = await call('A', 'get_change_cursor');
  const empty = await call('A', 'get_changes', { cursor: baseline.cursor });
  assert.deepEqual(empty.changes, []);
  assert.equal(empty.has_more, false);
  assert.equal(decodeChangeCursor(empty.next_cursor).position, 0);
  assert.equal((await store.readSnapshot('A')).revision, 0);
  await write('A', 'add', { title: 'After empty read' });
  const later = await call('A', 'get_changes', { cursor: empty.next_cursor });
  assert.deepEqual(later.changes.map(row => row.revision_after), [1]);
  assert.equal(later.has_more, false);
});

test('consumer cursors are independent, retries are stable and fenced pages exclude concurrent writes until terminal', async () => {
  const { call, write, store } = setup();
  const baselineA = await call('A', 'get_change_cursor'), baselineB = await call('B', 'get_change_cursor');
  assert.notEqual(baselineA.cursor, baselineB.cursor);
  await assert.rejects(call('B', 'get_changes', { cursor: baselineA.cursor }), error => error.code === 'invalid_cursor');
  await write('A', 'add', { title: 'One' });
  await write('A', 'add', { title: 'Two' });
  await write('A', 'edit', { id: (await store.readSnapshot('A')).actions[0].id, title: 'One corrected' });
  const first = await call('A', 'get_changes', { cursor: baselineA.cursor, page_size: 1 });
  assert.deepEqual((await call('A', 'get_changes', { cursor: baselineA.cursor, page_size: 1 })), first);
  assert.equal(first.has_more, true);
  assert.equal(decodeChangeCursor(first.next_cursor).through_revision, 3);
  await write('A', 'add', { title: 'Concurrent after fence' });
  const second = await call('A', 'get_changes', { cursor: first.next_cursor, page_size: 1 });
  const third = await call('A', 'get_changes', { cursor: second.next_cursor, page_size: 1 });
  assert.equal(second.through_revision, 3);
  assert.equal(third.through_revision, 3);
  assert.equal(third.has_more, false);
  assert.equal(decodeChangeCursor(third.next_cursor).position, 3);
  assert.equal(decodeChangeCursor(third.next_cursor).through_revision, null);
  const nextWindow = await call('A', 'get_changes', { cursor: third.next_cursor });
  assert.deepEqual(nextWindow.changes.map(row => row.revision_after), [4]);
  const ownerB = await call('B', 'get_changes', { cursor: baselineB.cursor });
  assert.deepEqual(ownerB.changes, []);
  assert.equal(ownerB.through_revision, 0);
});

test('feeds carry all persisted entity and association deltas without changing state or fabricating deletions', async () => {
  const { call, write, store } = setup();
  const baseline = await call('A', 'get_change_cursor');
  const project = (await write('A', 'project_add', { name: 'P' })).result.resolved.project.id;
  const tag = (await write('A', 'tag_add', { name: 'T' })).result.resolved.tag.id;
  const perspective = (await write('A', 'perspective_add', { name: 'V', filter: { project_id: project, tag_id: tag } })).result.resolved.perspective.id;
  const action = (await write('A', 'add', { title: 'A', project_id: project, tag_ids: [tag] })).result.resolved.actions[0].id;
  const current = await store.readSnapshot('A');
  const beforeReads = structuredClone(current);
  const page = await call('A', 'get_changes', { cursor: baseline.cursor, page_size: 100 });
  assert.equal(page.changes.length, 4);
  assert(page.changes[0].changes.projects.some(item => item.before === null && item.after.id === project));
  assert(page.changes[1].changes.tags.some(item => item.before === null && item.after.id === tag));
  assert(page.changes[2].changes.perspectives.some(item => item.before === null && item.after.id === perspective));
  assert(page.changes[3].changes.actions.some(item => item.before === null && item.after.id === action));
  assert(page.changes[3].changes.action_tags.some(item => item.before === null && item.after.action_id === action && item.after.tag_id === tag));
  const actionDto = page.changes[3].changes.actions[0].after;
  assert.equal('view' in actionDto, false);
  assert.equal('tags' in actionDto, false);
  assert.equal('path' in page.changes[0].changes.projects[0].after, false);
  assert.deepEqual(await store.readSnapshot('A'), beforeReads);

  await write('A', 'action_tag', { id: action, tag_id: tag, enabled: false });
  await write('A', 'project_edit', { id: project, description: 'updated' });
  await write('A', 'tag_edit', { id: tag, description: 'updated' });
  await write('A', 'perspective_edit', { id: perspective, description: 'updated' });
  const changed = await call('A', 'get_changes', { cursor: page.next_cursor, page_size: 100 });
  assert(changed.changes[0].changes.action_tags.some(item => item.before && item.after === null));
  assert(changed.changes[1].changes.projects.some(item => item.before.description === '' && item.after.description === 'updated'));
  assert(changed.changes[2].changes.tags.some(item => item.before.description === '' && item.after.description === 'updated'));
  assert(changed.changes[3].changes.perspectives.some(item => item.before.description === '' && item.after.description === 'updated'));
});

test('strict cursor arguments reject unknown fields, invalid page sizes and pruned positions', async () => {
  const { call, write } = setup();
  const baseline = await call('A', 'get_change_cursor');
  await assert.rejects(call('A', 'get_changes', { cursor: baseline.cursor, extra: true }), error => error.code === 'invalid_input');
  for (const page_size of [0, 1.5, 101, '2']) await assert.rejects(call('A', 'get_changes', { cursor: baseline.cursor, page_size }), error => error.code === 'invalid_input');
  for (let i = 0; i < 101; i++) await write('A', 'add', { title: `Action ${i}` });
  await assert.rejects(call('A', 'get_changes', { cursor: baseline.cursor }), error => error.code === 'cursor_expired');
});
