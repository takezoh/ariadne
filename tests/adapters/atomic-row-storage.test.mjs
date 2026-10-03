import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createD1ActionStore} from '../../lib/adapters/d1-action-store.ts';
import {actionCall} from '../../lib/application/action-service.ts';
import {change} from '../../lib/domain/core.ts';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';

const now='2026-10-03T00:00:00.000Z';
const legacyMigrations=['0000_worthless_pyro','0001_structured_todo','0002_worthless_lorna_dane','0003_absent_landau','0004_material_silhouette'];
function legacyDatabase(){const sql=new DatabaseSync(':memory:');for(const name of legacyMigrations)sql.exec(readFileSync(`drizzle/${name}.sql`,'utf8'));return sql;}
function setup(t){const fixture=sqliteFixture();t.after(()=>fixture.sql.close());const store=createD1ActionStore(fixture.db);const call=(name,args={})=>actionCall({store,clock:()=>now,newId:()=>crypto.randomUUID()},'A',name,args);const write=async(kind,payload)=>call('apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:(await store.readSnapshot('A')).revision,kind,payload});return {...fixture,store,call,write};}

test('reads create no owner rows, and obsolete columns and state table are absent',async t=>{
 const {sql,store}=setup(t);assert.equal((await store.readSnapshot('A')).revision,0);assert.equal((await store.readSnapshot('B')).revision,0);
 assert.equal(sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='owner_state'").get(),undefined);
 const columns=sql.prepare('PRAGMA table_info(actions)').all().map(x=>x.name);
 for(const name of ['initial_title','last_request','defer_zone'])assert(!columns.includes(name));
 for(const table of ['actions','operations','projects','tags','action_tags','catalog_identity_ledger'])assert.equal(sql.prepare(`SELECT count(*) AS n FROM ${table}`).get().n,0);
});

test('one action edit writes one action among 2000 and never rewrites catalogs or relationships',async t=>{
 const {sql,store,write}=setup(t),insert=sql.prepare('INSERT INTO actions(owner,id,title,revision,created_at,updated_at) VALUES(?,?,?,1,?,?)');
 sql.exec('BEGIN');let target;for(let i=0;i<2000;i++){const id=crypto.randomUUID();target??=id;insert.run('A',id,`fictional-${i}`,now,now);}sql.exec('COMMIT');
 const before=sql.prepare('SELECT rowid,id,title,revision FROM actions WHERE owner=? ORDER BY id').all('A');
 sql.exec("CREATE TABLE write_audit(kind TEXT); CREATE TRIGGER audit_action_update AFTER UPDATE ON actions BEGIN INSERT INTO write_audit VALUES('action'); END; CREATE TRIGGER no_action_delete BEFORE DELETE ON actions BEGIN SELECT RAISE(ABORT,'unexpected delete'); END;");
 for(const table of ['projects','tags','action_tags','catalog_identity_ledger'])for(const verb of ['INSERT','UPDATE','DELETE'])sql.exec(`CREATE TRIGGER reject_${table}_${verb} BEFORE ${verb} ON ${table} BEGIN SELECT RAISE(ABORT,'unrelated write'); END;`);
 const result=await write('edit',{id:target,title:'changed'});
 assert.equal(result.revision,1);assert.deepEqual(sql.prepare('SELECT kind FROM write_audit').all().map(x=>x.kind),['action']);
 const after=sql.prepare('SELECT rowid,id,title,revision FROM actions WHERE owner=? ORDER BY id').all('A');
 assert.deepEqual(after.filter(x=>x.id!==target),before.filter(x=>x.id!==target));
 assert.equal(after.find(x=>x.id===target).rowid,before.find(x=>x.id===target).rowid);
 const delta=JSON.parse((await store.readReceipt('A',result.result.operationId)).delta);assert.equal(delta.actions.length,1);
});

test('a relationship failure rolls back earlier actions, Inbox action, receipt and revision',async t=>{
 const {sql,store,call,write}=setup(t);
 const captured=await call('capture_intent',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:0,title:'parent and child',text:'fictional parent and child'}),captureId=captured.result.resolved.actions[0].id;
 const before=await store.readSnapshot('A');
 sql.exec("CREATE TRIGGER reject_child BEFORE INSERT ON actions WHEN NEW.parent_id IS NOT NULL BEGIN SELECT RAISE(ABORT,'injected relationship failure'); END;");
 await assert.rejects(write('structure_create',{inbox_action_id:captureId,actions:[{ref:'parent',title:'parent'},{ref:'child',title:'child',parent_ref:'parent'}]}),/injected relationship failure/);
 assert.deepEqual(await store.readSnapshot('A'),before);assert.equal(sql.prepare('SELECT count(*) AS n FROM operations').get().n,1);
});

test('same operation racing at adapter commit replays once, changed payload rejects',async t=>{
 const {store}=setup(t),before=await store.readSnapshot('A'),operationId=crypto.randomUUID(),id=crypto.randomUUID(),after=change(before,{kind:'add',payload:{id,title:'concurrent'}},now);
 const request={owner:'A',operationId,payload:'same original',before,after,now,undoOf:null};
 const results=await Promise.all([store.commit(request),store.commit(request)]);assert.deepEqual(results[0],results[1]);assert.equal((await store.readSnapshot('A')).revision,1);assert.equal((await store.readSnapshot('A')).actions.length,1);
 await assert.rejects(store.commit({...request,payload:'different'}),e=>e.code==='idempotency_conflict');
});

test('revision guard raises its generic marker and a stale commit is a conflict',async t=>{
 const {store,sql}=setup(t),before=await store.readSnapshot('A');
 assert.match(sql.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name='operations_revision_guard'").get().sql,/RAISE\(ABORT, 'revision_conflict'\)/);
 const first=change(before,{kind:'add',payload:{id:crypto.randomUUID(),title:'first'}},now),stale=change(before,{kind:'add',payload:{id:crypto.randomUUID(),title:'stale'}},now);
 await store.commit({owner:'A',operationId:crypto.randomUUID(),payload:'first',before,after:first,now,undoOf:null});
 await assert.rejects(store.commit({owner:'A',operationId:crypto.randomUUID(),payload:'stale',before,after:stale,now,undoOf:null}),e=>e.code==='conflict');
 assert.equal((await store.readSnapshot('A')).revision,1);assert.equal((await store.readSnapshot('A')).actions.length,1);
});

test('0005 rejects missing operation history before deleting any state or column',t=>{
 const sql=legacyDatabase();t.after(()=>sql.close());sql.prepare('INSERT INTO owner_state(owner,revision) VALUES(?,9)').run('A');
 sql.exec('BEGIN');assert.throws(()=>sql.exec(readFileSync('drizzle/0005_burly_catseye.sql','utf8')),/CHECK constraint failed/);sql.exec('ROLLBACK');
 assert.equal(sql.prepare('SELECT revision FROM owner_state WHERE owner=?').get('A').revision,9);assert(sql.prepare('PRAGMA table_info(tasks)').all().some(x=>x.name==='initial_title'));
});

test('parent completion over 100 descendants commits atomically and SQL failure preserves all statuses',async t=>{
 const {sql,store,write}=setup(t),parent=crypto.randomUUID(),insert=sql.prepare('INSERT INTO actions(owner,id,title,revision,created_at,updated_at,parent_id,status) VALUES(?,?,?,1,?,?,?,?)');
 insert.run('A',parent,'parent',now,now,null,'active');const children=[];for(let i=0;i<120;i++){const id=crypto.randomUUID();children.push(id);insert.run('A',id,'child '+i,now,now,parent,i%2?'on-hold':'dropped');}
 sql.exec(`CREATE TRIGGER reject_one_completion BEFORE UPDATE ON actions WHEN NEW.id='${children[50]}' BEGIN SELECT RAISE(ABORT,'injected cascade failure'); END;`);
 await assert.rejects(write('edit',{id:parent,status:'completed'}),/injected cascade failure/);assert.equal((await store.readSnapshot('A')).revision,0);assert.equal(sql.prepare("SELECT count(*) n FROM actions WHERE status='completed'").get().n,0);assert.equal(sql.prepare('SELECT count(*) n FROM operations').get().n,0);
 sql.exec('DROP TRIGGER reject_one_completion');const result=await write('complete',{id:parent});assert.equal(result.result.changedIds.length,121);assert.equal(sql.prepare("SELECT count(*) n FROM actions WHERE status='completed'").get().n,121);
});
