import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOwnerBoundActionStore} from '../../lib/adapters/d1-action-store.ts';
import {change} from '../../lib/domain/core.ts';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';

import {identity} from '../helpers/owner-composition.mjs';
const now = '2026-10-03T00:00:00.000Z';

test('owner-bound factory fixes identity and isolates the same entity ID across owners', async t => {
  const f = sqliteFixture(); t.after(() => f.sql.close());
  const a = createOwnerBoundActionStore(f.db, identity('A')), b = createOwnerBoundActionStore(f.db, identity('B'));
  const id = crypto.randomUUID();
  const beforeA = await a.readSnapshot();
  await a.commit({operationId: crypto.randomUUID(), payload: 'A', before: beforeA, after: change(beforeA, {kind: 'add', payload: {id, title: 'A only'}}, now), now, undoOf: null});
  assert.equal((await a.readSnapshot()).actions.length, 1);
  assert.equal((await b.readSnapshot()).actions.length, 0);
  const beforeB = await b.readSnapshot();
  await b.commit({operationId: crypto.randomUUID(), payload: 'B', before: beforeB, after: change(beforeB, {kind: 'add', payload: {id, title: 'B only'}}, now), now, undoOf: null});
  assert.equal((await b.readSnapshot()).actions[0].title, 'B only');
  assert.equal((await a.readSnapshot()).actions[0].title, 'A only');
});

test('a generated commit plan over the storage budget is rejected before writing', async t => {
  const f = sqliteFixture(); t.after(() => f.sql.close());
  const store = createOwnerBoundActionStore(f.db, identity('A'));
  const before = await store.readSnapshot();
  let after = before;
  for (let index = 0; index < 6; index++) after = change(after, {kind: 'add', payload: {id: crypto.randomUUID(), title: 'parent ' + index, notes: 'x'.repeat(65536)}}, now);
  await assert.rejects(store.commit({operationId: crypto.randomUUID(), payload: 'plan', before, after, now, undoOf: null}), e => e.code === 'operation_too_large');
  const unchanged = await store.readSnapshot();
  assert.equal(unchanged.revision, 0);
  assert.equal(unchanged.actions.length, 0);
});

test('opaque runtime identity rejects strings, structural casts and owner override', async t => {
 const f=sqliteFixture();t.after(()=>f.sql.close());
 for(const forged of ['A',{owner:'A'},null])assert.throws(()=>createOwnerBoundActionStore(f.db,forged),e=>e.code==='unauthenticated');
 const a=createOwnerBoundActionStore(f.db,identity('A')),b=createOwnerBoundActionStore(f.db,identity('B')),before=await a.readSnapshot();
 await a.commit({owner:'B',operationId:crypto.randomUUID(),payload:'override',before,after:change(before,{kind:'add',payload:{id:crypto.randomUUID(),title:'A remains bound'}},now),now,undoOf:null});
 assert.equal((await a.readSnapshot()).actions.length,1);assert.equal((await b.readSnapshot()).actions.length,0);
});
