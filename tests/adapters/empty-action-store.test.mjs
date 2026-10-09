import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createD1ActionStore} from '../helpers/owner-composition.mjs';
import {actionCallForOwner as actionCall} from '../helpers/owner-composition.mjs';
import {memoryActionStore} from '../helpers/memory-action-store.mjs';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';
const now='2026-10-03T00:00:00.000Z';
for(const kind of ['memory','SQLite D1'])test(kind+' contextual creation is atomic, replayable, owner-scoped and undoable',async t=>{
 const fixture=kind==='memory'?null:sqliteFixture();if(fixture)t.after(()=>fixture.sql.close());
 const store=fixture?createD1ActionStore(fixture.db):memoryActionStore();let generated=0;
 const call=(owner,name,args={})=>actionCall({store,clock:()=>now,newId:()=>{generated++;return crypto.randomUUID();}},owner,name,args);
 const write=async(owner,kind,payload)=>call(owner,'apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot(owner)).revision,kind,payload});
 const project=(await write('A','project_get_or_create',{name:'Project'})).result.resolved.project.id;
 const tag=(await write('A','tag_get_or_create',{name:'Tag'})).result.resolved.tag.id;
 const request={schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:2,kind:'add',payload:{title:'Named',notes:'  raw\n日本語  ',project_id:project,tag_ids:[tag],flagged:true}};
 const base=await store.readSnapshot('A'),idsBefore=generated;
 for(const tag_ids of [[tag,tag],['invalid'],[crypto.randomUUID()],null])await assert.rejects(call('A','apply_change',{...request,operationId:crypto.randomUUID(),payload:{...request.payload,tag_ids}}));
 await assert.rejects(call('B','apply_change',{...request,expectedRevision:0}),e=>e.code==='not_found');
 assert.equal(generated,idsBefore);assert.deepEqual(await store.readSnapshot('A'),base);assert.equal(await store.readReceipt('A',request.operationId),null);
 if(fixture)fixture.lose();else store.lose();await assert.rejects(call('A','apply_change',request),/lost response/);
 const proof=await call('A','operation_status',{operationId:request.operationId}),id=proof.result.resolved.actions[0].id;
 assert.equal(proof.status,'applied');assert.equal(proof.result.revision,3);
 const afterLost=await store.readSnapshot('A');assert.equal(afterLost.actions.length,1);assert.equal(afterLost.action_tags.length,1);assert.equal(afterLost.actions[0].title,'Named');
 const idsAfter=generated,replay=await call('A','apply_change',request);assert.equal(generated,idsAfter);assert.equal(replay.actions[0].notes,request.payload.notes);assert.equal(replay.actions[0].project_id,project);assert.deepEqual(replay.actions[0].tags.map(x=>x.id),[tag]);
 const race=await Promise.allSettled([1,2].map(()=>call('A','apply_change',{...request,operationId:crypto.randomUUID(),expectedRevision:3})));
 assert.equal(race.filter(x=>x.status==='fulfilled').length,1);assert.equal(race.filter(x=>x.status==='rejected'&&x.reason.code==='conflict').length,1);
 await call('A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:4,undoOf:request.operationId});
 const undone=await store.readSnapshot('A'),target=undone.actions.find(x=>x.id===id);assert.equal(target.status,'dropped');assert.equal(target.project_id,null);assert.equal(undone.action_tags.some(x=>x.action_id===id),false);
 const fresh=await write('A','add',{title:'Named',tag_ids:[tag]}),fid=fresh.result.resolved.actions[0].id;
 await write('A','action_tag',{id:fid,tag_id:tag,enabled:false});await write('A','action_tag',{id:fid,tag_id:tag,enabled:true});
 const beforeConflict=await store.readSnapshot('A');await assert.rejects(call('A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:beforeConflict.revision,undoOf:fresh.result.operationId}),e=>e.code==='undo_conflict');assert.deepEqual(await store.readSnapshot('A'),beforeConflict);
});
test('SQLite association failure rolls back action, initial tags, identity and receipt together',async t=>{
 const fixture=sqliteFixture();t.after(()=>fixture.sql.close());const store=createD1ActionStore(fixture.db);
 const call=args=>actionCall({store,clock:()=>now,newId:()=>crypto.randomUUID()},'A','apply_change',args);
 const tag=(await call({schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:0,kind:'tag_get_or_create',payload:{name:'T'}})).result.resolved.tag.id;
 fixture.sql.exec("CREATE TRIGGER reject_initial_tag BEFORE INSERT ON action_tags BEGIN SELECT RAISE(ABORT, 'injected association failure'); END");
 const before=await store.readSnapshot('A'),operationId=crypto.randomUUID();await assert.rejects(call({schemaVersion:2,operationId,expectedRevision:1,kind:'add',payload:{title:'Named',tag_ids:[tag]}}));
 assert.deepEqual(await store.readSnapshot('A'),before);assert.equal(await store.readReceipt('A',operationId),null);
});
for(const adapter of ['memory','SQLite D1'])test(adapter+' invalid stored Action is rejected without a compatibility edit/read path',async t=>{
 const fixture=adapter==='memory'?null:sqliteFixture();if(fixture)t.after(()=>fixture.sql.close());const store=fixture?createD1ActionStore(fixture.db):memoryActionStore(),ports={store,clock:()=>now,newId:()=>crypto.randomUUID()};const created=await actionCall(ports,'A','apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:0,kind:'add',payload:{title:'Valid'}});const id=created.result.resolved.actions[0].id;
 if(fixture)fixture.sql.prepare('UPDATE actions SET title=? WHERE owner=?').run('','A');else{const read=store.readSnapshot.bind(store);store.readSnapshot=async owner=>{const s=await read(owner);s.actions[0].title='';return s;};}
 const invalid=await store.readSnapshot('A');await assert.rejects(actionCall(ports,'A','list_actions'),e=>e.code==='invalid_input'||e.code==='invalid_state');await assert.rejects(actionCall(ports,'A','apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:invalid.revision,kind:'edit',payload:{id,notes:'Cannot rescue old shape'}}));assert.deepEqual(await store.readSnapshot('A'),invalid);
});
