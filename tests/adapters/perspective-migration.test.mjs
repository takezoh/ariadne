import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';
import {createD1ActionStore} from '../../lib/adapters/d1-action-store.ts';
import {actionCall} from '../../lib/application/action-service.ts';
const now='2026-10-03T00:00:00.000Z';
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
 const pid=crypto.randomUUID();for(const owner of ['A','B'])sql.prepare('INSERT INTO perspectives VALUES(?,?,?,?,?,?,?,?)').run(owner,pid,owner+' view','{}',1,1,now,now);
 assert.throws(()=>sql.prepare('INSERT INTO perspectives VALUES(?,?,?,?,?,?,?,?)').run('A',pid,'Duplicate','{}',1,1,now,now),/UNIQUE/);
 for(const [filter,version] of [['[]',1],['invalid',1],['{}',2]])assert.throws(()=>sql.prepare('INSERT INTO perspectives VALUES(?,?,?,?,?,?,?,?)').run('A',crypto.randomUUID(),'Bad',filter,version,1,now,now));
 sql.exec(readFileSync('drizzle/0011_catalog_descriptions.sql','utf8'));sql.exec(readFileSync('drizzle/0013_project_order.sql','utf8'));sql.exec(readFileSync('drizzle/0016_tag_order.sql','utf8'));
 const store=createD1ActionStore(fixture.db),ports={store,clock:()=>now,newId:()=>crypto.randomUUID()};
 assert.equal((await actionCall(ports,'A','query_perspective',{id:pid})).perspective.name,'A view');assert.equal((await actionCall(ports,'B','query_perspective',{id:pid})).perspective.name,'B view');
 const result=await actionCall(ports,'A','apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:1,kind:'perspective_edit',payload:{id:pid,name:'Corrected'}});assert.equal(result.revision,2);assert.equal((await store.readSnapshot('B')).perspectives[0].name,'B view');
});
