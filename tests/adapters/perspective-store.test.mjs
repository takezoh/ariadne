import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createD1ActionStore} from '../helpers/owner-composition.mjs';
import {actionCallForOwner as actionCall} from '../helpers/owner-composition.mjs';
import {memoryActionStore} from '../helpers/memory-action-store.mjs';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';
const now='2026-10-03T00:00:00.000Z';
for(const kind of ['memory','SQLite D1'])test(kind+' saved perspectives share ownership, CAS, replay, unknown outcomes and Undo',async t=>{
 const fixture=kind==='memory'?null:sqliteFixture();if(fixture)t.after(()=>fixture.sql.close());
 const store=fixture?createD1ActionStore(fixture.db):memoryActionStore();let generated=0;
 const ports={store,clock:()=>now,newId:()=>{generated++;return crypto.randomUUID();}};
 const call=(owner,name,args={})=>actionCall(ports,owner,name,args);
 const write=async(owner,kind,payload)=>call(owner,'apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot(owner)).revision,kind,payload});
 const revert=async(owner,result)=>call(owner,'undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot(owner)).revision,undoOf:result.result.operationId});
 const args={schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:0,kind:'perspective_add',payload:{name:'Focus',filter:{flagged:true}}};
 const preview=await call('A','preview_change',{expectedRevision:0,kind:args.kind,payload:args.payload});assert.equal(preview.resolved.perspective.preview_only,true);assert.equal(preview.affected_perspectives[0].after.preview_only,true);assert.equal((await store.readSnapshot('A')).revision,0);
 if(fixture)fixture.lose();else store.lose();await assert.rejects(call('A','apply_change',args),/lost response/);
 const receipt=JSON.parse((await store.readReceipt('A',args.operationId)).result),pid=receipt.resolved.perspective.id;
 assert.notEqual(pid,args.operationId);assert.notEqual(pid,preview.resolved.perspective.id);assert.equal((await call('A','list_perspectives')).perspectives[0].id,pid);assert.equal((await call('B','list_perspectives')).perspectives.length,0);
 await assert.rejects(call('B','query_perspective',{id:pid}),e=>e.code==='not_found');await assert.rejects(call('B','apply_change',{...args,kind:'perspective_edit',payload:{id:pid,name:'hijack'}}),e=>e.code==='not_found');
 await assert.rejects(call('A','list_perspectives',{owner:'B'}),e=>e.code==='invalid_input');await assert.rejects(write('A','perspective_add',{id:crypto.randomUUID(),name:'caller ID',filter:{}}),e=>e.code==='invalid_input');
 const corrected=await write('A','perspective_edit',{id:pid,name:'Correction',filter:{}}),beforeReplay=generated;
 const replay=await call('A','apply_change',args);assert.equal(replay.perspectives[0].name,'Correction');assert.equal(replay.revision,2);assert.equal(replay.result.revision,1);assert.equal(generated,beforeReplay);
 await assert.rejects(call('A','apply_change',{...args,payload:{name:'Changed',filter:{}}}),e=>e.code==='idempotency_conflict');
 const attempts=await Promise.allSettled(['One','Two'].map(name=>call('A','apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:2,kind:'perspective_edit',payload:{id:pid,name}})));assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);assert.equal(attempts.filter(x=>x.status==='rejected'&&x.reason.code==='conflict').length,1);
 await assert.rejects(revert('A',corrected),e=>e.code==='undo_conflict');
 const removed=await write('A','perspective_remove',{id:pid});assert.equal((await call('A','list_perspectives')).perspectives.length,0);await revert('A',removed);assert.equal((await call('A','list_perspectives')).perspectives.length,1);
 await assert.rejects(revert('A',{result:{operationId:args.operationId}}),e=>e.code==='undo_conflict');
 const project=await write('A','project_get_or_create',{name:'P'}),projectId=project.result.resolved.project.id;
 await write('A','perspective_edit',{id:pid,filter:{project_id:projectId}});await assert.rejects(write('A','project_remove',{id:projectId}),e=>e.code==='related_perspectives');await assert.rejects(revert('A',project),e=>e.code==='undo_conflict');
 const changed=await write('A','perspective_edit',{id:pid,filter:{}});await write('A','project_remove',{id:projectId});await assert.rejects(revert('A',changed),e=>e.code==='undo_conflict');
 const action=await write('A','add',{title:'Current action',flagged:true});const beforeRead=await store.readSnapshot('A');assert.deepEqual((await call('A','query_perspective',{id:pid})).actions.map(x=>x.id),[action.result.resolved.actions[0].id]);assert.deepEqual(await store.readSnapshot('A'),beforeRead);
});

test('SQLite perspective failure rolls back receipt, view, CAS and identity marker together',async t=>{
 const fixture=sqliteFixture();t.after(()=>fixture.sql.close());const store=createD1ActionStore(fixture.db);
 fixture.sql.exec("CREATE TRIGGER reject_view BEFORE INSERT ON perspectives WHEN NEW.name='Reject' BEGIN SELECT RAISE(ABORT,'view failure'); END;");
 const operationId=crypto.randomUUID();await assert.rejects(actionCall({store,clock:()=>now,newId:()=>crypto.randomUUID()},'A','apply_change',{schemaVersion:2,operationId,expectedRevision:0,kind:'perspective_add',payload:{name:'Reject',filter:{}}}),/view failure/);
 assert.equal((await store.readSnapshot('A')).revision,0);assert.equal(await store.readReceipt('A',operationId),null);assert.deepEqual((await store.readSnapshot('A')).perspectives,[]);assert.deepEqual((await store.readSnapshot('A')).catalog_identity_ledger,[]);
});

test('SQLite perspective CRUD and Undo never write existing action or catalog rows',async t=>{
 const fixture=sqliteFixture();t.after(()=>fixture.sql.close());const store=createD1ActionStore(fixture.db),ports={store,clock:()=>now,newId:()=>crypto.randomUUID()};
 const write=async(kind,payload)=>actionCall(ports,'A','apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot('A')).revision,kind,payload});
 const project=await write('project_get_or_create',{name:'P'}),tag=await write('tag_get_or_create',{name:'T'}),action=await write('add',{title:'Preserve',project_id:project.result.resolved.project.id});await write('action_tag',{id:action.result.resolved.actions[0].id,tag_id:tag.result.resolved.tag.id,enabled:true});
 const tables=['actions','projects','tags','action_tags'],before=Object.fromEntries(tables.map(table=>[table,fixture.sql.prepare('SELECT * FROM '+table).all()]));
 for(const table of tables)for(const verb of ['INSERT','UPDATE','DELETE'])fixture.sql.exec(`CREATE TRIGGER reject_${table}_${verb} BEFORE ${verb} ON ${table} BEGIN SELECT RAISE(ABORT,'unexpected unrelated row write'); END;`);
 const view=await write('perspective_add',{name:'View',filter:{project_id:project.result.resolved.project.id,tag_id:tag.result.resolved.tag.id}}),pid=view.result.resolved.perspective.id;
 await write('perspective_edit',{id:pid,name:'Renamed',filter:{}});const removed=await write('perspective_remove',{id:pid});await actionCall(ports,'A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot('A')).revision,undoOf:removed.result.operationId});
 assert.deepEqual(Object.fromEntries(tables.map(table=>[table,fixture.sql.prepare('SELECT * FROM '+table).all()])),before);
});
