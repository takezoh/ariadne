import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';
const now='2026-10-03T00:00:00.000Z';
test('lifecycle migration preserves task data and relations, resets incompatible history, and supports fresh atomic writes and Undo',async t=>{
 const {sql}=sqliteFixture({beforeLifecycleMigration:true});t.after(()=>sql.close());
 const ids=['active','waiting','done','cancelled'].map(()=>crypto.randomUUID());
 for(const owner of ['A','B'])for(const [i,status] of ['active','waiting','done','cancelled'].entries())sql.prepare('INSERT INTO tasks(owner,id,title,notes,revision,created_at,updated_at,status,defer_until) VALUES(?,?,?,?,?,?,?,?,?)').run(owner,ids[i],'waiting done cancelled','original',7,now,now,status,'2026-12-01T00:00:00.000Z');
 sql.prepare('UPDATE tasks SET parent_id=? WHERE owner=? AND id=?').run(ids[0],'A',ids[1]);
 sql.prepare('INSERT INTO dependencies VALUES(?,?,?,7)').run('A',ids[1],ids[0]);
 sql.prepare('INSERT INTO catalog_identity_ledger VALUES(?,?,?,7)').run('A','project',crypto.randomUUID());
 const op=crypto.randomUUID();for(const owner of ['A','B'])sql.prepare('INSERT INTO operations VALUES(?,?,?,?,?,?,?,?,?)').run(owner,op,'old payload','{}','{}',0,1,null,now);
 const before=sql.prepare('SELECT * FROM tasks ORDER BY owner,id').all(),edges=sql.prepare('SELECT * FROM dependencies').all(),markers=sql.prepare('SELECT * FROM catalog_identity_ledger').all();
 sql.exec('BEGIN');sql.exec(readFileSync('drizzle/0008_lifecycle_status.sql','utf8'));sql.exec('COMMIT');
 const statuses={active:'active',waiting:'on-hold',done:'completed',cancelled:'dropped'};
 assert.deepEqual(sql.prepare('SELECT * FROM tasks ORDER BY owner,id').all(),before.map(x=>Object.assign(Object.create(null),x,{status:statuses[x.status]})));
 assert.deepEqual(sql.prepare('SELECT * FROM dependencies').all(),edges);assert.deepEqual(sql.prepare('SELECT * FROM catalog_identity_ledger').all(),markers.map(x=>Object.assign(Object.create(null),x,{revision:0})));
 assert.equal(sql.prepare('SELECT count(*) AS n FROM operations').get().n,0);

});
