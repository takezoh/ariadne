import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createD1ActionStore} from '../helpers/owner-composition.mjs';
import {actionCallForOwner as actionCall} from '../helpers/owner-composition.mjs';
import {memoryActionStore} from '../helpers/memory-action-store.mjs';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';
const now='2026-10-03T00:00:00.000Z';
const kinds=['project','tag','perspective'];
const table=kind=>kind==='perspective'?'perspectives':kind+'s';
const initial=kind=>({name:'Context',...(kind==='perspective'?{filter:{}}:{})});
const createKind=kind=>kind==='perspective'?'perspective_add':kind+'_get_or_create';
const envelope=(revision,kind,payload)=>({schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:revision,kind,payload});
for(const backend of ['memory','SQLite D1'])for(const kind of kinds)test(`${backend} ${kind} description round trips, replay, CAS and Undo`,async t=>{
 const fixture=backend==='memory'?null:sqliteFixture();if(fixture)t.after(()=>fixture.sql.close());
 const store=fixture?createD1ActionStore(fixture.db):memoryActionStore(),ports={store,clock:()=>now,newId:()=>crypto.randomUUID()};
 const call=(name,args={},owner='A')=>actionCall(ports,owner,name,args);
 const write=async(op,payload)=>call('apply_change',envelope((await store.readSnapshot('A')).revision,op,payload));
 const revert=async(result)=>call('undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot('A')).revision,undoOf:result.result.operationId});
 const raw='  Purpose\r\n日本語 🐈\n  ';
 const added=await write(createKind(kind),{...initial(kind),description:raw}),entity=added[table(kind)][0],id=entity.id;
 assert.equal(entity.description,raw);
 assert.equal((await call('get_relevant_context'))[table(kind)][0].description,raw);
 if(kind==='perspective'){
  assert.equal((await call('list_perspectives')).perspectives[0].description,raw);
  assert.equal((await call('query_perspective',{id})).perspective.description,raw);
 }else{
  assert.equal((await call('query_actions'))[table(kind)][0].description,raw);
  const match=await write(createKind(kind),{...initial(kind),description:'Must not overwrite'});
  assert.equal(match.result.resolved[kind].created,false);assert.equal(match[table(kind)][0].description,raw);
 }
 const foreignRevision=(await store.readSnapshot('B')).revision;
 await assert.rejects(call('apply_change',envelope(foreignRevision,kind+'_edit',{id,description:'hijack'}),'B'),e=>e.code==='not_found');
 assert.equal((await store.readSnapshot('B'))[table(kind)].length,0);
 const renamed=await write(kind+'_edit',{id,name:'Renamed'});assert.equal(renamed[table(kind)][0].description,raw);
 const beforePreview=await store.readSnapshot('A');
 const preview=await call('preview_change',{expectedRevision:beforePreview.revision,kind:kind+'_edit',payload:{id,description:''}});
 const affected=preview['affected_'+table(kind)][0];assert.equal(kind==='perspective'?affected.after.description:affected.description,'');
 assert.deepEqual(await store.readSnapshot('A'),beforePreview);
 const cleared=await write(kind+'_edit',{id,description:''});assert.equal(cleared[table(kind)][0].description,'');
 const restored=await revert(cleared);assert.equal(restored[table(kind)][0].description,raw);
 const args=envelope(restored.revision,kind+'_edit',{id,description:'unknown'});
 if(fixture)fixture.lose();else store.lose();await assert.rejects(call('apply_change',args),/lost response/);
 assert.equal((await call('operation_status',{operationId:args.operationId})).status,'applied');
 await write(kind+'_edit',{id,description:'Correction'});
 const replay=await call('apply_change',args);assert.equal(replay[table(kind)][0].description,'Correction');assert.equal(replay.result.revision,args.expectedRevision+1);
 await assert.rejects(call('apply_change',{...args,payload:{id,description:'Different'}}),e=>e.code==='idempotency_conflict');
 await assert.rejects(revert({result:{operationId:args.operationId}}),e=>e.code==='undo_conflict');
 const revision=(await store.readSnapshot('A')).revision;
 const competitors=await Promise.allSettled(['One','Two'].map(description=>call('apply_change',envelope(revision,kind+'_edit',{id,description}))));
 assert.equal(competitors.filter(x=>x.status==='fulfilled').length,1);assert.equal(competitors.filter(x=>x.status==='rejected'&&x.reason.code==='conflict').length,1);
 const removed=await write(kind+'_remove',{id}),beforeUndo=(await store.readSnapshot('A'))[table(kind)];assert.deepEqual(beforeUndo,[]);
 await revert(removed);assert.equal((await store.readSnapshot('A'))[table(kind)][0].description,competitors.find(x=>x.status==='fulfilled').value[table(kind)][0].description);
});
for(const kind of kinds)test(`${kind} description validation, defaults and no semantic effects`,async()=>{
 const store=memoryActionStore();let generated=0;const ports={store,clock:()=>now,newId:()=>{generated++;return crypto.randomUUID();}};
 const call=(name,args={})=>actionCall(ports,'A',name,args);
 const write=async(op,payload)=>call('apply_change',envelope((await store.readSnapshot('A')).revision,op,payload));
 for(const description of [null,12,{},[],undefined,'x'.repeat(65537)])await assert.rejects(write(createKind(kind),{...initial(kind),description}),e=>e.code==='invalid_input');
 assert.equal(generated,0,'invalid creation must not allocate IDs');
 const created=await write(createKind(kind),initial(kind)),id=created[table(kind)][0].id;assert.equal(created[table(kind)][0].description,'');
 for(const description of [null,12,{},[],undefined,'x'.repeat(65537)]){
  await assert.rejects(write(kind+'_edit',{id,description}),e=>e.code==='invalid_input');
  if(kind!=='perspective')await assert.rejects(write(createKind(kind),{...initial(kind),description}),e=>e.code==='invalid_input');
 }
 await assert.rejects(write(kind+'_edit',{id}),e=>e.code==='invalid_input');
 await write('add',{title:'Action',flagged:true});
 const before=await store.readSnapshot('A'),queryBefore=await call('query_actions');
 const updated=await write(kind+'_edit',{id,description:'x'.repeat(65536)});
 assert.equal(updated[table(kind)][0].description.length,65536);
 assert.deepEqual(updated.actions,queryBefore.actions);assert.deepEqual((await store.readSnapshot('A')).action_tags,before.action_tags);
 if(kind==='perspective')assert.deepEqual((await call('query_perspective',{id})).actions,queryBefore.actions);
});
for(const kind of kinds)test(`SQLite ${kind} description failure rolls back receipt, revision and ledger`,async t=>{
 const fixture=sqliteFixture();t.after(()=>fixture.sql.close());const store=createD1ActionStore(fixture.db),ports={store,clock:()=>now,newId:()=>crypto.randomUUID()};
 const added=await actionCall(ports,'A','apply_change',envelope(0,createKind(kind),initial(kind))),id=added[table(kind)][0].id,before=await store.readSnapshot('A');
 fixture.sql.exec(`CREATE TRIGGER reject_description BEFORE UPDATE ON ${table(kind)} WHEN NEW.description='Reject' BEGIN SELECT RAISE(ABORT,'description failure'); END;`);
 const args=envelope(before.revision,kind+'_edit',{id,description:'Reject'});
 await assert.rejects(actionCall(ports,'A','apply_change',args),/description failure/);
 assert.deepEqual(await store.readSnapshot('A'),before);assert.equal(await store.readReceipt('A',args.operationId),null);
});

test('description migration preserves existing data and old receipt bytes, and incomplete Undo rejection',async t=>{
 const fixture=sqliteFixture({beforeDescriptionMigration:true});t.after(()=>fixture.sql.close());const {sql}=fixture;
 const ids=Object.fromEntries(kinds.map(kind=>[kind,crypto.randomUUID()]));
 for(const owner of ['A','B'])for(const [index,kind] of kinds.entries()){
  const row={id:ids[kind],name:'Renamed',...(kind==='perspective'?{filter:{},definition_version:1}:{parent_id:null}),revision:index+1,created_at:now,updated_at:now};
  const before={...row,name:'Original'};
  if(kind==='perspective')sql.prepare('INSERT INTO perspectives VALUES(?,?,?,?,?,?,?,?)').run(owner,row.id,row.name,'{}',1,row.revision,now,now);
  else sql.prepare(`INSERT INTO ${table(kind)} VALUES(?,?,?,?,?,?,?)`).run(owner,row.id,row.name,null,row.revision,now,now);
  sql.prepare('INSERT INTO catalog_identity_ledger VALUES(?,?,?,?)').run(owner,kind,row.id,index+1);
  const delta={actions:[],projects:[],tags:[],action_tags:[],perspectives:[],[table(kind)]:[{before,after:row}]};
  sql.prepare('INSERT INTO operations VALUES(?,?,?,?,?,?,?,?,?)').run(owner,crypto.randomUUID(),'original request bytes','{}',JSON.stringify(delta),index,index+1,null,now);
 }
 const tables=['projects','tags','perspectives','operations','catalog_identity_ledger'],before=Object.fromEntries(tables.map(name=>[name,sql.prepare(`SELECT * FROM ${name} ORDER BY owner`).all()]));
 sql.exec(readFileSync('drizzle/0011_catalog_descriptions.sql','utf8'));
 for(const name of tables)assert.deepEqual(sql.prepare(`SELECT * FROM ${name} ORDER BY owner`).all().map(row=>({...row})),kinds.map(table).includes(name)?before[name].map(row=>({...row,description:''})):before[name].map(row=>({...row})));
 sql.exec(readFileSync('drizzle/0013_project_order.sql','utf8'));
 sql.exec(readFileSync('drizzle/0016_tag_order.sql','utf8'));const store=createD1ActionStore(fixture.db),ports={store,clock:()=>now,newId:()=>crypto.randomUUID()};
 for(const kind of kinds){
  const target=before.operations.find(row=>row.owner==='A'&&JSON.parse(row.delta)[table(kind)].length),revision=(await store.readSnapshot('A')).revision;
  await assert.rejects(actionCall(ports,'A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:revision,undoOf:target.operation_id}),e=>e.code==='undo_conflict');
  assert.equal((await store.readSnapshot('A'))[table(kind)][0].name,'Renamed');
  assert.equal((await store.readSnapshot('B'))[table(kind)][0].name,'Renamed');
  assert.equal((await store.readReceipt('A',target.operation_id)).delta,target.delta);
  const otherTarget=before.operations.find(row=>row.owner==='B'&&JSON.parse(row.delta)[table(kind)].length);
  await actionCall(ports,'B','apply_change',envelope((await store.readSnapshot('B')).revision,kind+'_edit',{id:ids[kind],description:'Later correction'}));
  await assert.rejects(actionCall(ports,'B','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot('B')).revision,undoOf:otherTarget.operation_id}),e=>e.code==='undo_conflict');
  assert.equal((await store.readSnapshot('B'))[table(kind)][0].description,'Later correction');
 }
});
