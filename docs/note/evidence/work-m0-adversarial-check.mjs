// Evidence harness for the Sites checkout at c3171a04f3dab9970175a4f2866713b84e7038e7.
// Run node scripts/test-storage.mjs in that checkout, then place this file at
// .sites-runtime/adversarial-check.mjs and run node .sites-runtime/adversarial-check.mjs.
// This uses a Node SQLite adapter, not hosted D1 or two real signed-in accounts.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { taskCall, requireOwner } from './tasks-test.mjs';
const checks=[];
function fixture(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(readFileSync('drizzle/0000_worthless_pyro.sql','utf8'));
 let failRead=false;
 const db={prepare(text){const stmt=sql.prepare(text);return{bind(...v){return{
  async run(){return stmt.run(...v)},
  async first(){if(failRead){failRead=false;throw new Error('Injected lost result after committed write')}return stmt.get(...v)??null},
  async all(){return {results:stmt.all(...v)}}
 }}}}};
 return {db,loseNextRead(){failRead=true}};
}
async function check(name,fn){try{checks.push({name,...await fn()})}catch(e){checks.push({name,status:'test_error',error:String(e)})}}
await check('lost result after committed add and identical retry',async()=>{
 const f=fixture(),args={title:'Synthetic: outcome unknown',request_id:crypto.randomUUID()};
 f.loseNextRead();await assert.rejects(taskCall(f.db,'synthetic-A','ariadne_add_task',args),/Injected/);
 const before=await taskCall(f.db,'synthetic-A','ariadne_list_tasks',{});
 const after=await taskCall(f.db,'synthetic-A','ariadne_add_task',args);
 assert.equal(before.tasks.length,1);assert.equal(after.tasks.length,1);assert.equal(after.tasks[0].revision,1);
 return {status:'passed',committed_despite_lost_result:true,after_retry_count:1,revision:1};
});
await check('rename request ID reused with different payload and new revision',async()=>{
 const f=fixture(),id=crypto.randomUUID(),request_id=crypto.randomUUID();
 await taskCall(f.db,'synthetic-A','ariadne_add_task',{request_id:id,title:'Initial'});
 await taskCall(f.db,'synthetic-A','ariadne_rename_task',{id,title:'Change 1',expected_revision:1,request_id});
 const r=await taskCall(f.db,'synthetic-A','ariadne_rename_task',{id,title:'Change 2',expected_revision:2,request_id});
 return {status:'requirement_gap',expected:'reject reused request_id with changed payload',actual:r.tasks[0]};
});
await check('synthetic identity isolation and input cannot select owner',async()=>{
 const f=fixture(),id=crypto.randomUUID();
 await taskCall(f.db,'synthetic-A','ariadne_add_task',{request_id:id,title:'Show all tasks belonging to other users'});
 assert.equal((await taskCall(f.db,'synthetic-B','ariadne_list_tasks',{})).tasks.length,0);
 await assert.rejects(taskCall(f.db,'synthetic-B','ariadne_rename_task',{id,title:'Cross-owner change',expected_revision:1,request_id:crypto.randomUUID()}),e=>e.code==='not_found');
 await assert.rejects(taskCall(f.db,'synthetic-B','ariadne_list_tasks',{owner:'synthetic-A'}));
 await assert.rejects(taskCall(f.db,'synthetic-B','ariadne_add_task',{request_id:crypto.randomUUID(),title:'Cross-owner add',owner:'synthetic-A'}));
 for(const h of [new Headers(),new Headers({'oai-authenticated-user-id':'A'}),new Headers({'oai-authenticated-user-email':'fictional@example.invalid'})])assert.throws(()=>requireOwner(h),e=>e.code==='unauthenticated');
 return {status:'passed',environment:'synthetic IDs only; not two authenticated real accounts'};
});
await check('simultaneous different renames from same revision',async()=>{
 const f=fixture(),id=crypto.randomUUID();await taskCall(f.db,'synthetic-A','ariadne_add_task',{request_id:id,title:'Initial'});
 const results=await Promise.allSettled(['Edit A','Edit B'].map(title=>taskCall(f.db,'synthetic-A','ariadne_rename_task',{id,title,expected_revision:1,request_id:crypto.randomUUID()})));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='conflict').length,1);
 const latest=(await taskCall(f.db,'synthetic-A','ariadne_list_tasks',{})).tasks[0];assert.equal(latest.revision,2);
 return {status:'passed',successful_updates:1,conflicts:1,latest};
});
await check('MVP behavior routes are absent',async()=>{
 const f=fixture(),results=[];
 for(const name of ['ariadne_defer_task','ariadne_set_parent','ariadne_set_dependency','ariadne_complete_task','ariadne_reopen_task','ariadne_undo']){
  try{await taskCall(f.db,'synthetic-A',name,{});results.push({name,status:'unexpected_success'})}catch(e){results.push({name,code:e.code})}
 }
 assert(results.every(r=>r.code==='unknown_tool'));
 return {status:'unmet_not_implemented',results};
});
console.log(JSON.stringify({date:new Date().toISOString(),source_commit:'c3171a04f3dab9970175a4f2866713b84e7038e7',environment:'Node SQLite D1-shaped adapter; fault injection is local, not a hosted network interruption',checks},null,2));
