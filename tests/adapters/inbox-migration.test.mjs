import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const migration=readFileSync('drizzle/0006_good_tag.sql','utf8');
function legacy(t){const db=new DatabaseSync(':memory:');t.after(()=>db.close());for(const name of ['0000_worthless_pyro','0001_structured_todo','0002_worthless_lorna_dane','0003_absent_landau','0004_material_silhouette','0005_burly_catseye'])db.exec(readFileSync(`drizzle/${name}.sql`,'utf8'));return db;}
const uuid=()=>crypto.randomUUID();
function migrate(db){db.exec('BEGIN');try{db.exec(migration);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}
function input(db,owner,id,text,status='pending'){db.prepare('INSERT INTO captures VALUES(?,?,?,?,?,1)').run(owner,id,text,'conversation',status);}
function task(db,owner,id,notes='',source=null,wait=null){db.prepare("INSERT INTO tasks(owner,id,title,revision,created_at,updated_at,notes,source_capture_id,manual_wait) VALUES(?,?,?,1,?,?,?, ?,?)").run(owner,id,'Any title','2026-10-03T00:00:00.000Z','2026-10-03T00:00:00.000Z',notes,source,wait);}
test('Inbox migration preserves pending, linked and orphan input, wait notes and owner boundaries without creating tags',t=>{
 const db=legacy(t),pending=uuid(),applied=uuid(),orphan=uuid(),linked=uuid(),same=uuid(),foreign=uuid();
 input(db,'A',pending,'  未整理\n原文  ');input(db,'A',applied,'元の文章','applied');input(db,'A',orphan,'孤立した原文','applied');input(db,'B',foreign,'別owner原文');
 task(db,'A',linked,'本人の訂正',applied,'返信待ち');task(db,'A',same,'元の文章',applied);task(db,'B',uuid(),'別ownerメモ');
 const tag=uuid();db.prepare('INSERT INTO tags VALUES(?,?,?,NULL,1,?,?)').run('A',tag,'ユーザーのタグ','old','old');const tags=db.prepare('SELECT * FROM tags').all();
 migrate(db);
 const rows=db.prepare('SELECT * FROM tasks WHERE owner=?').all('A');assert.equal(rows.length,4);
 assert.equal(rows.find(x=>x.id===pending).notes,'  未整理\n原文  ');assert.equal(rows.find(x=>x.id===orphan).notes,'孤立した原文');
 const x=rows.find(x=>x.id===linked);assert.equal(x.notes,'本人の訂正\n\n元の文章\n\n他者待ち：返信待ち');assert.equal(x.title,'Any title');assert.equal(x.revision,2);assert.equal(x.status,'waiting');
 assert.equal(rows.find(x=>x.id===same).notes,'元の文章');assert.deepEqual(db.prepare('SELECT * FROM tags').all(),tags);assert.equal(db.prepare('SELECT count(*) n FROM task_tags').get().n,0);
 assert.equal(db.prepare('SELECT notes FROM tasks WHERE owner=? AND id=?').get('B',foreign).notes,'別owner原文');
 assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='captures'").get(),undefined);const cols=db.prepare('PRAGMA table_info(tasks)').all().map(x=>x.name);assert(!cols.includes('manual_wait'));assert(!cols.includes('source_capture_id'));
});
test('migration aborts without deleting data on colliding pending task identity',t=>{const db=legacy(t),id=uuid();input(db,'A',id,'原文');task(db,'A',id,'既存');assert.throws(()=>migrate(db),/CHECK constraint/);assert.equal(db.prepare('SELECT text FROM captures').get().text,'原文');assert.equal(db.prepare('SELECT notes FROM tasks').get().notes,'既存');});
test('migration refuses notes overflow atomically rather than truncating text',t=>{const db=legacy(t),id=uuid();input(db,'A',id,'原文','applied');task(db,'A',uuid(),'x'.repeat(65536),id);assert.throws(()=>migrate(db),/CHECK constraint/);assert.equal(db.prepare('SELECT text FROM captures').get().text,'原文');assert.equal(db.prepare('SELECT length(notes) n FROM tasks').get().n,65536);});

test('migration matches UTF-16 limits for supplementary characters',t=>{const db=legacy(t),id=uuid();input(db,'A',id,'原文'.repeat(20),'applied');task(db,'A',uuid(),'😀'.repeat(32760),id);assert.throws(()=>migrate(db),/CHECK constraint/);assert.equal(db.prepare('SELECT text FROM captures').get().text,'原文'.repeat(20));});

test('legacy raw input title uses content even after Unicode whitespace',t=>{const db=legacy(t),id=uuid(),raw='\n'.repeat(100)+'\u3000\uFEFF内容\n';input(db,'A',id,raw);migrate(db);const saved=db.prepare('SELECT title,notes FROM tasks WHERE id=?').get(id);assert.equal(saved.title,'内容');assert.equal(saved.notes,raw);});

test('migration keeps terminal status while preserving historical wait reason',t=>{const db=legacy(t);for(const status of ['done','cancelled']){const id=uuid();task(db,'A',id,'記録',null,'旧待機理由');db.prepare('UPDATE tasks SET status=? WHERE id=?').run(status,id);}migrate(db);assert.deepEqual(db.prepare('SELECT status FROM tasks ORDER BY status').all().map(x=>x.status),['cancelled','done']);assert(db.prepare('SELECT notes FROM tasks').all().every(x=>x.notes.includes('旧待機理由')));});
test('migration refuses NUL input before dropping original records',t=>{const db=legacy(t),id=uuid();input(db,'A',id,'\0原文');assert.throws(()=>migrate(db),/CHECK constraint/);assert.equal(db.prepare('SELECT hex(CAST(text AS BLOB)) value FROM captures').get().value,Buffer.from('\0原文').toString('hex').toUpperCase());});
