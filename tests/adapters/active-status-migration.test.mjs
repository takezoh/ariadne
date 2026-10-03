import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';
import {canonical} from '../../lib/domain/core.ts';
const now='2026-10-03T00:00:00.000Z';

test('active migration preserves both owners, non-status fields, relationships and original receipts',async t=>{
 const {sql}=sqliteFixture({beforeActiveMigration:true});t.after(()=>sql.close());
 const id=crypto.randomUUID(),op=crypto.randomUUID(),other=crypto.randomUUID();
 const row={id,title:'open',revision:2,parent_id:null,project_id:null,status:'open',due_at:null,defer_until:'2026-12-01T00:00:00.000Z',notes:'open',created_at:now,updated_at:now};
 const insert=sql.prepare('INSERT INTO tasks(owner,id,title,revision,created_at,updated_at,status,defer_until,notes) VALUES(?,?,?,?,?,?,?,?,?)');
 for(const owner of ['A','B'])for(const status of ['open','waiting','done','cancelled'])insert.run(owner,status==='open'?id:crypto.randomUUID(),'open',2,now,now,status,row.defer_until,'open');
 insert.run('A',other,'child',3,now,now,'waiting',null,'keep');
 sql.prepare('UPDATE tasks SET parent_id=? WHERE owner=? AND id=?').run(id,'A',other);
 sql.prepare('INSERT INTO dependencies VALUES(?,?,?,1)').run('A',other,id);
 const args={schemaVersion:2,operationId:op,expectedRevision:0,kind:'status',payload:{id,status:'open'}};
 const result={operationId:op,revision:1,changedIds:[id]};
 sql.prepare('INSERT INTO operations VALUES(?,?,?,?,?,?,?,?,?)').run('A',op,canonical({name:'apply_change',args}),JSON.stringify(result),JSON.stringify({tasks:[{before:{...row,status:'waiting',revision:1},after:row}],dependencies:[]}),0,1,null,now);
 const receipts=sql.prepare('SELECT * FROM operations').all(),rows=sql.prepare('SELECT * FROM tasks ORDER BY owner,id').all(),edges=sql.prepare('SELECT * FROM dependencies').all();
 sql.exec('BEGIN');sql.exec(readFileSync('drizzle/0007_workable_the_professor.sql','utf8'));sql.exec('COMMIT');
 assert.deepEqual(sql.prepare('SELECT * FROM tasks ORDER BY owner,id').all(),rows.map(x=>Object.assign(Object.create(null),x,{status:x.status==='open'?'active':x.status})));
 assert.deepEqual(sql.prepare('SELECT * FROM operations').all(),receipts);assert.deepEqual(sql.prepare('SELECT * FROM dependencies').all(),edges);
 const fresh=crypto.randomUUID();sql.prepare('INSERT INTO tasks(owner,id,title,created_at,updated_at) VALUES(?,?,?,?,?)').run('B',fresh,'fresh',now,now);assert.equal(sql.prepare('SELECT status FROM tasks WHERE owner=? AND id=?').get('B',fresh).status,'active');

});
