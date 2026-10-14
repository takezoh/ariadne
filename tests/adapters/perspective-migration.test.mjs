import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';
import {createD1ActionStore} from '../helpers/owner-composition.mjs';
import {actionCallForOwner as actionCall} from '../helpers/owner-composition.mjs';
import {canonical} from '../../lib/domain/core.ts';
const now='2026-10-03T00:00:00.000Z';
const defaultView={type:'tasklist',sort:'action_order',direction:'asc',group:'none',completion_label:'complete',show_notes:false};
test('perspective migration preserves populated action/catalog/receipt/identity data and owner-scoped keys',async t=>{
 const fixture=sqliteFixture({beforePerspectiveMigration:true});t.after(()=>fixture.sql.close());const {sql}=fixture;
 const action=crypto.randomUUID(),project=crypto.randomUUID(),tag=crypto.randomUUID(),operation=crypto.randomUUID();
 for(const owner of ['A','B']){
  sql.prepare('INSERT INTO actions(owner,id,title,revision,status,notes,"order",flagged,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(owner,action,owner+' action',1,'active','exact notes',3,1,now,now);
  sql.prepare('INSERT INTO projects VALUES(?,?,?,?,?,?,?)').run(owner,project,'Project',null,1,now,now);
  sql.prepare('INSERT INTO tags VALUES(?,?,?,?,?,?,?)').run(owner,tag,'Tag',null,1,now,now);
  sql.prepare('INSERT INTO action_tags VALUES(?,?,?,?)').run(owner,action,tag,1);
  sql.prepare('INSERT INTO catalog_identity_ledger VALUES(?,?,?,?)').run(owner,'project',project,1);
  sql.prepare('INSERT INTO operations VALUES(?,?,?,?,?,?,?,?,?)').run(owner,operation,'retained input','{}','{}',0,1,null,now);
 }
 const tables=['actions','projects','tags','action_tags','catalog_identity_ledger','operations'];
 const before=Object.fromEntries(tables.map(table=>[table,sql.prepare('SELECT * FROM '+table+' ORDER BY owner').all()]));
 sql.exec(readFileSync('drizzle/0010_ambiguous_umar.sql','utf8'));
 assert.deepEqual(Object.fromEntries(tables.map(table=>[table,sql.prepare('SELECT * FROM '+table+' ORDER BY owner').all()])),before);
 sql.exec(readFileSync('drizzle/0011_catalog_descriptions.sql','utf8'));sql.exec(readFileSync('drizzle/0013_project_order.sql','utf8'));sql.exec(readFileSync('drizzle/0016_tag_order.sql','utf8'));
 const pid=crypto.randomUUID();for(const owner of ['A','B'])sql.prepare('INSERT INTO perspectives(owner,id,name,description,filter,definition_version,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(owner,pid,owner+' view','exact description','{}',1,1,now,now);
 assert.throws(()=>sql.prepare('INSERT INTO perspectives(owner,id,name,filter,definition_version,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run('A',pid,'Duplicate','{}',1,1,now,now),/UNIQUE/);
 for(const [filter,version] of [['[]',1],['invalid',1],['{}',2]])assert.throws(()=>sql.prepare('INSERT INTO perspectives(owner,id,name,filter,definition_version,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run('A',crypto.randomUUID(),'Bad',filter,version,1,now,now));
 const retainedReceipts=sql.prepare('SELECT * FROM operations ORDER BY owner').all();
 sql.exec(readFileSync('drizzle/0017_perspective_view.sql','utf8'));
 assert.deepEqual(sql.prepare('SELECT * FROM operations ORDER BY owner').all(),retainedReceipts);
 const migrated=sql.prepare('SELECT definition_version,view,description FROM perspectives ORDER BY owner').all().map(row=>({definition_version:row.definition_version,view:row.view,description:row.description}));
 assert.deepEqual(migrated,['A','B'].map(()=>({definition_version:2,view:'{"completion_label":"complete","direction":"asc","group":"none","show_notes":false,"sort":"action_order","type":"tasklist"}',description:'exact description'})));
 const store=createD1ActionStore(fixture.db),ports={store,clock:()=>now,newId:()=>crypto.randomUUID()};
 assert.equal((await actionCall(ports,'A','query_perspective',{id:pid})).perspective.name,'A view');assert.equal((await actionCall(ports,'B','query_perspective',{id:pid})).perspective.name,'B view');assert.deepEqual((await actionCall(ports,'A','query_perspective',{id:pid})).perspective.view,defaultView);
 const result=await actionCall(ports,'A','apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:1,kind:'perspective_edit',payload:{id:pid,name:'Corrected'}});assert.equal(result.revision,2);assert.equal((await store.readSnapshot('B')).perspectives[0].name,'B view');
});

test('v1 Perspective add/edit/remove receipts survive migration byte-for-byte and support strict replay and Undo',async t=>{
 const fixture=sqliteFixture({beforeViewMigration:true});t.after(()=>fixture.sql.close());const {sql}=fixture;
 const addId=crypto.randomUUID(),editId=crypto.randomUUID(),correctId=crypto.randomUUID(),removeId=crypto.randomUUID(),
  addOperation=crypto.randomUUID(),editOperation=crypto.randomUUID(),correctOperation=crypto.randomUUID(),removeOperation=crypto.randomUUID();
 const later='2026-10-03T01:00:00.000Z';
 const row=(id,name,revision,updated_at=now)=>({id,name,description:'exact legacy context',filter:{statuses:['active']},definition_version:1,revision,created_at:now,updated_at});
 const added=row(addId,'Added',1),editBefore=row(editId,'Before edit',1),editAfter=row(editId,'After edit',2,later),correctBefore=row(correctId,'Before correction',2,later),correctAfter=row(correctId,'Corrected',3,later),removed=row(removeId,'Removed',1);
 const addRequest={schemaVersion:2,operationId:addOperation,expectedRevision:0,kind:'perspective_add',payload:{name:'Added',filter:{statuses:['active']}}};
 const editRequest={schemaVersion:2,operationId:editOperation,expectedRevision:1,kind:'perspective_edit',payload:{id:editId,name:'After edit'}};
 const correctRequest={schemaVersion:2,operationId:correctOperation,expectedRevision:2,kind:'perspective_edit',payload:{id:correctId,name:'Corrected'}};
 const removeRequest={schemaVersion:2,operationId:removeOperation,expectedRevision:0,kind:'perspective_remove',payload:{id:removeId}};
 const record=(owner,request,revisionBefore,revisionAfter,before,after,resolved)=>{
  const changes={perspectives:[{before,after}],actions:[],projects:[],tags:[],action_tags:[]};
  const result={operationId:request.operationId,revision:revisionAfter,changedIds:[],...(resolved?{resolved}:{})};
  sql.prepare('INSERT INTO operations VALUES(?,?,?,?,?,?,?,?,?)').run(owner,request.operationId,canonical({name:'apply_change',args:request}),JSON.stringify(result),JSON.stringify(changes),revisionBefore,revisionAfter,null,now);
 };
 for(const [owner,perspective,revision] of [['A',added,1],['A',editAfter,2],['A',correctAfter,3]]){
  sql.prepare('INSERT INTO perspectives(owner,id,name,description,filter,definition_version,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(owner,perspective.id,perspective.name,perspective.description,JSON.stringify(perspective.filter),1,perspective.revision,perspective.created_at,perspective.updated_at);
  sql.prepare('INSERT INTO catalog_identity_ledger VALUES(?,?,?,?)').run(owner,'perspective',perspective.id,revision);
 }
 sql.prepare('INSERT INTO catalog_identity_ledger VALUES(?,?,?,?)').run('B','perspective',removeId,1);
 record('A',addRequest,0,1,null,added,{perspective:{id:addId}});
 record('A',editRequest,1,2,editBefore,editAfter);
 record('A',correctRequest,2,3,correctBefore,correctAfter);
 record('B',removeRequest,0,1,removed,null);
 const receiptColumns='owner,operation_id,canonical_payload,result,delta,revision_before,revision_after,undo_of,created_at';
 const receiptsBefore=sql.prepare(`SELECT ${receiptColumns} FROM operations ORDER BY owner,revision_after`).all();
 const unrelated=['actions','projects','tags','action_tags','catalog_identity_ledger'];
 const unrelatedBefore=Object.fromEntries(unrelated.map(table=>[table,sql.prepare('SELECT * FROM '+table+' ORDER BY owner').all()]));
 sql.exec(readFileSync('drizzle/0017_perspective_view.sql','utf8'));
 assert.deepEqual(sql.prepare(`SELECT ${receiptColumns} FROM operations ORDER BY owner,revision_after`).all(),receiptsBefore);
 assert.deepEqual(Object.fromEntries(unrelated.map(table=>[table,sql.prepare('SELECT * FROM '+table+' ORDER BY owner').all()])),unrelatedBefore);
 const rows=sql.prepare('SELECT owner,id,name,description,filter,view,definition_version,revision,created_at,updated_at FROM perspectives ORDER BY owner,id').all();
 assert.equal(rows.length,3);for(const current of rows){assert.equal(current.definition_version,2);assert.equal(current.view,'{"completion_label":"complete","direction":"asc","group":"none","show_notes":false,"sort":"action_order","type":"tasklist"}');}
 const store=createD1ActionStore(fixture.db);let generated=0;const ports={store,clock:()=>now,newId:()=>{generated++;return crypto.randomUUID();}};
 const call=(owner,name,args={})=>actionCall(ports,owner,name,args);
 for(const [owner,request,expected] of [['A',addRequest,added],['A',editRequest,editAfter],['A',correctRequest,correctAfter],['B',removeRequest,null]]){
  const replay=await call(owner,'apply_change',request);assert.equal(replay.result.operationId,request.operationId);assert.equal(replay.result.revision,owner==='B'?1:request===addRequest?1:request===editRequest?2:3);
  const current=replay.perspectives.find(value=>value.id===expected?.id);if(expected){assert(current);assert.deepEqual(current.view,defaultView);}else assert.equal(replay.perspectives.some(value=>value.id===removeId),false);
 }
 assert.equal(generated,0,'exact pre-migration requests replay before normalization or ID allocation');
 const undoArgs=operationId=>({schemaVersion:2,operationId:crypto.randomUUID(),undoOf:operationId});
 const ownerARevision=(await store.readSnapshot('A')).revision;
 const undoneAdd=await call('A','undo_change',{...undoArgs(addOperation),expectedRevision:ownerARevision});assert(undoneAdd.perspectives.every(value=>value.id!==addId));
 const undoneEdit=await call('A','undo_change',{...undoArgs(editOperation),expectedRevision:undoneAdd.revision});assert.equal(undoneEdit.perspectives.find(value=>value.id===editId).name,'Before edit');assert.deepEqual(undoneEdit.perspectives.find(value=>value.id===editId).view,defaultView);
 const thread={type:'thread',sort:'updated_at',direction:'desc',group:'status',completion_label:'read',initial_body:'expanded'};
 const replaceView=async(owner,id,view)=>call(owner,'apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot(owner)).revision,kind:'perspective_edit',payload:{id,view}});
 await replaceView('A',correctId,thread);await replaceView('A',correctId,defaultView);
 const correctedReplay=await call('A','apply_change',correctRequest);assert.equal(correctedReplay.result.operationId,correctOperation);assert.equal(correctedReplay.perspectives.find(value=>value.id===correctId).name,'Corrected');assert.deepEqual(correctedReplay.perspectives.find(value=>value.id===correctId).view,defaultView);
 await assert.rejects(call('A','undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot('A')).revision,undoOf:correctOperation}),error=>error.code==='undo_conflict');
 const undoneRemove=await call('B','undo_change',{...undoArgs(removeOperation),expectedRevision:(await store.readSnapshot('B')).revision});
 assert.equal(undoneRemove.perspectives.find(value=>value.id===removeId).name,'Removed');assert.deepEqual(undoneRemove.perspectives.find(value=>value.id===removeId).view,defaultView);
 assert.deepEqual(sql.prepare(`SELECT ${receiptColumns} FROM operations WHERE operation_id IN (?,?,?,?) ORDER BY owner,revision_after`).all(addOperation,editOperation,correctOperation,removeOperation),receiptsBefore);
});
