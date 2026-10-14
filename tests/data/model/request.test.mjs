import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finalizeChange, normalizeChange } from '../../../lib/data/model/request.ts';

const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const inboxId = uuid(1);
const now = '2026-10-14T09:00:00.000Z';
const inbox = { id: inboxId, title: 'Inbox', revision: 1, parent_id: null, project_id: null, status: 'active', due_at: null, defer_until: null, notes: '', order: 0, flagged: false, created_at: now, updated_at: now };
const snapshot = { revision: 0, catalog_identity_ledger: [], actions: [inbox], projects: [], tags: [], action_tags: [], perspectives: [] };

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

test('normalization is deterministic and leaves frozen request and snapshot values untouched', () => {
  const request = deepFreeze({ kind: 'add', payload: { title: '  Keep title  ', notes: '  raw\ntext  ', tag_ids: [] } });
  const state = deepFreeze(snapshot);
  const first = normalizeChange(state, request);
  const second = normalizeChange(state, request);
  assert.deepEqual(first, second);
  assert.equal(first.idSlots, 1);
  assert.equal(first.change.payload.title, 'Keep title');
  assert.equal(first.change.payload.notes, '  raw\ntext  ');
  assert.deepEqual(request.payload, { title: '  Keep title  ', notes: '  raw\ntext  ', tag_ids: [] });
  assert.equal(state.actions[0].title, 'Inbox');
});

test('explicit finalization resolves generated slots while preserving forward refs and first-ref Inbox reuse', () => {
  const request = deepFreeze({ kind: 'structure_create', payload: {
    inbox_action_id: inboxId,
    actions: [
      { ref: 'child', title: 'Child', parent_ref: 'parent' },
      { ref: 'sibling', title: 'Sibling' },
      { ref: 'parent', title: 'Parent' },
    ],
  } });
  const normalized = normalizeChange(snapshot, request);
  const finalized = finalizeChange(snapshot, uuid(9), normalized, [uuid(2), uuid(3)]);
  const actions = finalized.change.payload.actions;
  assert.equal(actions[0].id, inboxId);
  assert.equal(actions[0].parent_id, uuid(3));
  assert.equal(actions[1].id, uuid(2));
  assert.equal(actions[2].id, uuid(3));
  assert.deepEqual(finalized.resolved.actions, [
    { ref: 'child', id: inboxId }, { ref: 'sibling', id: uuid(2) }, { ref: 'parent', id: uuid(3) },
  ]);
  assert.deepEqual([...finalized.actionRefs], [[inboxId, 'child'], [uuid(2), 'sibling'], [uuid(3), 'parent']]);
  assert.deepEqual(request.payload.actions[0], { ref: 'child', title: 'Child', parent_ref: 'parent' });
});

test('every generated-entity request kind exposes and finalizes its explicit ID slots', () => {
  const existingProject = { id: uuid(5), name: 'Existing', description: '', parent_id: null, order: 0, revision: 1, created_at: now, updated_at: now };
  const existingTag = { ...existingProject, id: uuid(6) };
  const state = { ...snapshot, projects: [existingProject], tags: [existingTag] };
  const cases = [
    ['add', { title: 'Action' }, 'add', value => value.change.payload.id],
    ['capture', { title: 'Captured', text: 'raw', source: 'conversation' }, 'add', value => value.change.payload.id],
    ['perspective_add', { name: 'View', filter: {} }, 'perspective_add', value => value.change.payload.id],
    ['project_add', { name: 'Project' }, 'project_add', value => value.change.payload.id],
    ['tag_add', { name: 'Tag' }, 'tag_add', value => value.change.payload.id],
    ['project_get_or_create', { name: 'New project' }, 'project_add', value => value.change.payload.id],
    ['tag_get_or_create', { name: 'New tag' }, 'tag_add', value => value.change.payload.id],
    ['structure_create', { inbox_action_id: inboxId, actions: [{ ref: 'inbox', title: 'Inbox' }, { ref: 'new', title: 'New' }] }, 'structure', value => value.change.payload.actions[1].id],
  ];
  for (const [kind, payload, expectedKind, getId] of cases) {
    const normalized = normalizeChange(state, { kind, payload });
    assert.equal(normalized.idSlots, 1, kind);
    const finalized = finalizeChange(state, uuid(9), normalized, [uuid(20)]);
    assert.equal(finalized.change.kind, expectedKind, kind);
    assert.equal(getId(finalized), uuid(20), kind);
  }
  for (const [kind, payload, existingId] of [
    ['project_get_or_create', { name: 'Existing' }, existingProject.id],
    ['tag_get_or_create', { name: 'Existing' }, existingTag.id],
  ]) {
    const normalized = normalizeChange(state, { kind, payload });
    assert.equal(normalized.idSlots, 0, kind);
    assert.equal(finalizeChange(state, uuid(9), normalized, []).resolved[kind.startsWith('project') ? 'project' : 'tag'].id, existingId);
  }
});

test('perspective request normalization selects exactly one persisted definition variant',()=>{
 const legacy=normalizeChange(snapshot,{kind:'perspective_add',payload:{name:'Legacy',filter:{statuses:[]}}});
 assert.deepEqual(legacy.change.payload,{id:'__generated_id_0__',name:'Legacy',description:'',filter:{statuses:[]}});
 const current=normalizeChange(snapshot,{kind:'perspective_add',payload:{name:'Current',query:{where:{field:'status',op:'eq',value:'active'},order_by:[{field:'title',direction:'asc'}]}}});
 assert.deepEqual(current.change.payload,{id:'__generated_id_0__',name:'Current',description:'',query:{where:{field:'status',op:'eq',value:'active'},order_by:[{field:'title',direction:'asc',nulls:'last'}]}});
 const finalized=finalizeChange(snapshot,uuid(9),current,[uuid(10)]);assert.equal(finalized.change.payload.id,uuid(10));assert.equal(Object.hasOwn(finalized.change.payload,'filter'),false);
 for(const payload of [{name:'Ambiguous',filter:{},query:{}},{name:'Bad query',query:{where:{field:'status',op:'eq',value:'waiting'}}}])assert.throws(()=>normalizeChange(snapshot,{kind:'perspective_add',payload}),error=>error.code==='invalid_input');
});

test('existing get-or-create finalizes with no generated ID and caller marker-like IDs stay opaque', () => {
  const existing = { id: uuid(4), name: 'Project', description: '', parent_id: null, order: 0, revision: 1, created_at: now, updated_at: now };
  const state = { ...snapshot, projects: [existing] };
  const matched = normalizeChange(state, { kind: 'project_get_or_create', payload: { name: ' Project ' } });
  assert.equal(matched.idSlots, 0);
  assert.equal(finalizeChange(state, uuid(9), matched, []).resolved.project.id, uuid(4));

  const edit = { kind: 'edit', payload: { id: '__generated_id_0__', title: 'Renamed' } };
  const finalized = finalizeChange(snapshot, uuid(9), normalizeChange(snapshot, edit), []);
  assert.equal(finalized.change.payload.id, '__generated_id_0__');
});

test('finalization rejects missing, duplicate, operation and owner-reserved generated IDs', () => {
  const normalized = normalizeChange(snapshot, { kind: 'add', payload: { title: 'Action' } });
  assert.throws(() => finalizeChange(snapshot, uuid(9), normalized, []));
  assert.throws(() => finalizeChange(snapshot, uuid(9), normalized, [uuid(9)]));
  assert.throws(() => finalizeChange(snapshot, uuid(9), normalized, [inboxId]));
  const twoSlots = normalizeChange(snapshot, { kind: 'structure_create', payload: { inbox_action_id: inboxId, actions: [{ ref: 'inbox', title: 'Inbox' }, { ref: 'new', title: 'New' }, { ref: 'later', title: 'Later' }] } });
  assert.throws(() => finalizeChange(snapshot, uuid(9), twoSlots, [uuid(2), uuid(2)]));
});
