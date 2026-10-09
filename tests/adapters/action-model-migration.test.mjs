import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';
import {createD1ActionStore} from '../helpers/owner-composition.mjs';
import {actionCallForOwner as actionCall} from '../helpers/owner-composition.mjs';
const now='2026-10-03T00:00:00.000Z';
test('action migration resets both owners and removes the retired tables and history',async t=>{
 const {sql,db}=sqliteFixture({beforeActionMigration:true});t.after(()=>sql.close());
 for(const owner of ['A','B']){
  const action=crypto.randomUUID(),project=crypto.randomUUID(),tag=crypto.randomUUID();
  sql.prepare('INSERT INTO tasks(owner,id,title,created_at,updated_at) VALUES(?,?,?,?,?)').run(owner,action,'test',now,now);
  for(const [table,id] of [['projects',project],['tags',tag]])sql.prepare(`INSERT INTO ${table} VALUES(?,?,?,NULL,1,?,?)`).run(owner,id,'test',now,now);
  sql.prepare('INSERT INTO task_tags VALUES(?,?,?,1)').run(owner,action,tag);
  sql.prepare('INSERT INTO dependencies VALUES(?,?,?,1)').run(owner,action,action);
  sql.prepare('INSERT INTO catalog_identity_ledger VALUES(?,?,?,1)').run(owner,'project',project);
  sql.prepare('INSERT INTO operations VALUES(?,?,?,?,?,?,?,?,?)').run(owner,crypto.randomUUID(),'old','{}','{}',0,1,null,now);
 }
 sql.exec('BEGIN');sql.exec(readFileSync('drizzle/0009_action_model.sql','utf8'));sql.exec('COMMIT');
 for(const table of ['tasks','task_tags','dependencies'])assert.equal(sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table),undefined);
 for(const table of ['actions','action_tags','projects','tags','operations','catalog_identity_ledger'])assert.equal(sql.prepare(`SELECT count(*) n FROM ${table}`).get().n,0);
 // The current adapter expects the complete schema; the assertions above isolate migration 0009.
 sql.exec(readFileSync('drizzle/0010_ambiguous_umar.sql','utf8'));sql.exec(readFileSync('drizzle/0011_catalog_descriptions.sql','utf8'));sql.exec(readFileSync('drizzle/0013_project_order.sql','utf8'));sql.exec(readFileSync('drizzle/0016_tag_order.sql','utf8'));
 const store=createD1ActionStore(db);assert.equal((await store.readSnapshot('A')).revision,0);assert.equal((await store.readSnapshot('B')).revision,0);
});
test('real adapter preserves order and boolean flag, replay, Undo and owner isolation',async t=>{
 const fixture=sqliteFixture();t.after(()=>fixture.sql.close());const store=createD1ActionStore(fixture.db);
 const call=(owner,name,args={})=>actionCall({store,clock:()=>now,newId:()=>crypto.randomUUID()},owner,name,args);
 const write=async(owner,kind,payload)=>call(owner,'apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot(owner)).revision,kind,payload});
 const first=await write('A','add',{title:'First',order:8,flagged:true}),id=first.result.resolved.actions[0].id;
 await write('A','add',{title:'Second',order:2});
 assert.deepEqual((await call('A','query_actions')).actions.map(t=>t.title),['Second','First']);
 assert.deepEqual((await call('A','query_actions',{flagged:true})).actions.map(t=>t.id),[id]);assert.deepEqual((await call('B','query_actions',{flagged:true})).actions,[]);
 const raw=fixture.sql.prepare('SELECT "order",flagged FROM actions WHERE owner=? AND id=?').get('A',id);assert.equal(raw.order,8);assert.equal(raw.flagged,1);
 const request={schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:2,kind:'edit',payload:{id,order:0,flagged:false}};
 fixture.lose();await assert.rejects(call('A','apply_change',request),/lost response/);
 const replay=await call('A','apply_change',request);assert.equal(replay.revision,3);assert.equal(replay.actions[0].id,id);assert.equal(replay.actions[0].flagged,false);
 await call('A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:3,undoOf:request.operationId});
 const restored=await store.readSnapshot('A');assert.equal(restored.actions.find(t=>t.id===id).order,8);assert.equal(restored.actions.find(t=>t.id===id).flagged,true);
 const changed=await write('A','edit',{id,flagged:false});await write('A','edit',{id,order:4});
 await assert.rejects(call('A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:6,undoOf:changed.result.operationId}),e=>e.code==='undo_conflict');
 await assert.rejects(call('A','list_tasks'),e=>e.code==='unknown_tool');await assert.rejects(call('A','query_tasks'),e=>e.code==='unknown_tool');
 await assert.rejects(write('A','dependency',{dependent:id,prerequisite:id,enabled:true}),e=>e.code==='unknown_kind');
 assert.equal((await store.readSnapshot('A')).revision,6);
});
test('structured creation accepts order and flags but rejects retired dependency fields',async t=>{
 const fixture=sqliteFixture();t.after(()=>fixture.sql.close());const store=createD1ActionStore(fixture.db);
 const call=(name,args={})=>actionCall({store,clock:()=>now,newId:()=>crypto.randomUUID()},'A',name,args);
 const saved=await call('capture_intent',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:0,title:'Concern',text:'Original'}),id=saved.actions[0].id;
 const request={schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:1,kind:'structure_create',payload:{inbox_action_id:id,actions:[{ref:'root',title:'Root',flagged:true},{ref:'later',title:'Later',parent_ref:'root',order:5},{ref:'earlier',title:'Earlier',parent_ref:'root',order:1,flagged:true}]}};
 const result=await call('apply_change',request);assert.deepEqual(result.actions.map(t=>[t.title,t.flagged]),[['Root',true],['Earlier',true],['Later',false]]);
 await assert.rejects(call('apply_change',{...request,operationId:crypto.randomUUID(),expectedRevision:2,payload:{...request.payload,dependencies:[]}}),e=>e.code==='invalid_input');
 assert.equal((await store.readSnapshot('A')).revision,2);
});
