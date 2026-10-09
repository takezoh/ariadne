import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createD1ActionStore} from '../helpers/owner-composition.mjs';
import {actionCallForOwner as actionCall} from '../helpers/owner-composition.mjs';
import {memoryActionStore} from '../helpers/memory-action-store.mjs';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';

const now='2026-10-03T00:00:00.000Z';
function setup(t,kind){
 const fixture=kind==='memory'?null:sqliteFixture();if(fixture)t.after(()=>fixture.sql.close());
 const store=fixture?createD1ActionStore(fixture.db):memoryActionStore();
 const call=(owner,name,args={})=>actionCall({store,clock:()=>now,newId:()=>crypto.randomUUID()},owner,name,args);
 const write=async(owner,kind,payload)=>call(owner,'apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot(owner)).revision,kind,payload});
 const fill=async(owner,revision)=>{while((await store.readSnapshot(owner)).revision<revision)await write(owner,'project_get_or_create',{name:'Filler'});};
 return {fixture,store,call,write,fill};
}

for(const kind of ['memory','SQLite D1'])test(kind+' retains exactly the latest 100 operations and isolates owners at the boundary',async t=>{
 const {fixture,store,call,write,fill}=setup(t,kind);
 const first={schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:0,kind:'add',payload:{title:'Original'}};
 const added=await call('A','apply_change',first),actionId=added.result.resolved.actions[0].id;
 await call('B','apply_change',first);
 await fill('A',100);
 assert(await store.readReceipt('A',first.operationId));
 const replay=await call('A','apply_change',first);assert.equal(replay.revision,100);assert.equal(replay.result.revision,1);
 const requests=[0,1].map(i=>({schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:100,kind:'edit',payload:{id:actionId,title:'Winner '+i}}));
 const raced=await Promise.allSettled(requests.map(args=>call('A','apply_change',args)));
 assert.equal(raced.filter(r=>r.status==='fulfilled').length,1);assert.equal(raced.filter(r=>r.status==='rejected'&&r.reason.code==='conflict').length,1);
 const loser=requests[raced.findIndex(r=>r.status==='rejected')];assert.equal(await store.readReceipt('A',loser.operationId),null);
 assert.equal((await store.readSnapshot('A')).revision,101);
 assert.equal(await store.readReceipt('A',first.operationId),null);
 assert(await store.readReceipt('B',first.operationId));assert.equal((await store.readSnapshot('B')).revision,1);
 assert.equal((await call('A','operation_status',{operationId:first.operationId})).status,'not_observed');
 await assert.rejects(call('A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:101,undoOf:first.operationId}),e=>e.code==='not_found'&&e.message.includes('保持範囲外'));
 const before=await store.readSnapshot('A');await assert.rejects(call('A','apply_change',first),e=>e.code==='conflict');assert.deepEqual(await store.readSnapshot('A'),before);
 const retained=[];for(let i=2;i<=101;i++)retained.push(i);
 if(fixture)assert.deepEqual(fixture.sql.prepare('SELECT revision_after FROM operations WHERE owner=? ORDER BY revision_after').all('A').map(r=>r.revision_after),retained);
 const unknown={schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:101,kind:'edit',payload:{id:actionId,title:'Unknown outcome'}};
 if(fixture)fixture.lose();else store.lose();
 await assert.rejects(call('A','apply_change',unknown),/lost response/);
 assert.equal((await call('A','operation_status',{operationId:unknown.operationId})).status,'applied');
 await write('A','edit',{id:actionId,title:'Later correction'});
 const recovered=await call('A','apply_change',unknown);assert.equal(recovered.revision,103);assert.equal(recovered.result.revision,102);assert.equal(recovered.actions[0].title,'Later correction');
 if(fixture)assert.equal(fixture.sql.prepare('SELECT count(*) n FROM operations WHERE owner=?').get('A').n,100);
});

for(const kind of ['memory','SQLite D1'])test(kind+' retains Undo markers until their targets expire and allows retained Undo',async t=>{
 const {store,call,write,fill}=setup(t,kind);
 const added=await write('A','add',{title:'Original'}),actionId=added.result.resolved.actions[0].id;
 const edited=await write('A','edit',{id:actionId,title:'Edited'}),target=edited.result.operationId;
 await call('A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:2,undoOf:target});
 const project=await write('A','project_get_or_create',{name:'Filler'});
 await fill('A',101);
 assert(await store.readReceipt('A',target));assert.equal(await store.hasUndo('A',target),true);
 await assert.rejects(call('A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:101,undoOf:target}),e=>e.code==='undo_conflict');
 await fill('A',102);assert.equal(await store.readReceipt('A',target),null);
 await assert.rejects(call('A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:102,undoOf:target}),e=>e.code==='not_found');
 await call('A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:102,undoOf:project.result.operationId});
 const current=await store.readSnapshot('A');assert.equal(current.revision,103);assert.deepEqual(current.projects,[]);assert.equal(current.actions[0].title,'Original');
});

test('history pruning failure rolls back action changes, receipt and revision together',async t=>{
 const {fixture,store,call,write,fill}=setup(t,'SQLite D1');
 const added=await write('A','add',{title:'Original'}),actionId=added.result.resolved.actions[0].id;
 await fill('A',100);const before=await store.readSnapshot('A');
 fixture.sql.exec("CREATE TRIGGER reject_pruning BEFORE DELETE ON operations BEGIN SELECT RAISE(ABORT,'injected pruning failure'); END;");
 const args={schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:100,kind:'edit',payload:{id:actionId,title:'Changed'}};
 await assert.rejects(call('A','apply_change',args),/injected pruning failure/);
 assert.deepEqual(await store.readSnapshot('A'),before);assert.equal(await store.readReceipt('A',args.operationId),null);assert(await store.readReceipt('A',added.result.operationId));
 assert.equal(fixture.sql.prepare('SELECT count(*) n FROM operations WHERE owner=?').get('A').n,100);
 fixture.sql.exec('DROP TRIGGER reject_pruning');
 const saved=await call('A','apply_change',args);assert.equal(saved.revision,101);assert.equal(saved.actions[0].title,'Changed');assert.equal(await store.readReceipt('A',added.result.operationId),null);
});

test('previously unlimited history is reduced on the next successful write without resetting revision',async t=>{
 const {fixture,store,write}=setup(t,'SQLite D1');
 const insert=fixture.sql.prepare('INSERT INTO operations(owner,operation_id,canonical_payload,result,delta,revision_before,revision_after,undo_of,created_at) VALUES(?,?,?,?,?,?,?,?,?)');
 const delta=JSON.stringify({actions:[],dependencies:[],projects:[],tags:[],action_tags:[]});
 for(let revision=1;revision<=140;revision++){
  const operationId=crypto.randomUUID();
  insert.run('A',operationId,'{}',JSON.stringify({operationId,revision,changedIds:[]}),delta,revision-1,revision,null,now);
 }
 const b=await write('B','add',{title:'Other owner'});
 assert.equal((await store.readSnapshot('A')).revision,140);
 const saved=await write('A','add',{title:'New action'});assert.equal(saved.revision,141);
 assert.equal((await store.readSnapshot('A')).actions[0].title,'New action');
 const remaining=fixture.sql.prepare('SELECT count(*) n,min(revision_after) oldest,max(revision_after) latest FROM operations WHERE owner=?').get('A');
 assert.equal(remaining.n,100);assert.equal(remaining.oldest,42);assert.equal(remaining.latest,141);
 assert(await store.readReceipt('B',b.result.operationId));assert.equal((await store.readSnapshot('B')).revision,1);
});
