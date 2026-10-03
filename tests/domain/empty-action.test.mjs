import {test} from 'node:test';
import assert from 'node:assert/strict';
import {actionTitle,text,change} from '../../lib/domain/core.ts';
import {delta,undo} from '../../lib/domain/operations.ts';
const now='2026-10-03T00:00:00.000Z',uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const empty=()=>({revision:0,catalog_identity_ledger:[],actions:[],projects:[],tags:[],action_tags:[],perspectives:[]});
test('new action titles are nonempty and blank stored actions fail current validation',()=>{
 for(const value of ['', '  ', '\n',null,undefined,1,'a'.repeat(201),' '+ 'a'.repeat(200)])assert.throws(()=>actionTitle(value),e=>e.code==='invalid_input');
 assert.equal(actionTitle('  日本語  '),'日本語');assert.equal(actionTitle('a'.repeat(200)).length,200);assert.throws(()=>text(''));
 const named=change(empty(),{kind:'add',payload:{id:uid(1),title:' Named '}},now);assert.equal(named.actions[0].title,'Named');assert.equal(named.actions[0].notes,'');
 const legacy=structuredClone(named);legacy.actions[0].title='';const original=structuredClone(legacy);
 for(const title of ['', '  ']){assert.throws(()=>change(empty(),{kind:'add',payload:{id:uid(1),title,notes:'Notes cannot replace Title'}},now));assert.throws(()=>change(legacy,{kind:'edit',payload:{id:uid(1),title}},now));}
 assert.throws(()=>change(legacy,{kind:'edit',payload:{id:uid(1),notes:' exact ',flagged:true}},now));assert.deepEqual(legacy,original);
});
test('initial tags are pure validated associations with revision identity and creation Undo',()=>{
 const before=empty();before.tags=[{id:uid(2),name:'Tag',description:'',parent_id:null,order:0,revision:1,created_at:now,updated_at:now}];before.revision=1;
 const original=structuredClone(before),after=change(before,{kind:'add',payload:{id:uid(1),title:'Named',tag_ids:[uid(2)]}},now);
 assert.deepEqual(before,original);assert.deepEqual(after.action_tags,[{action_id:uid(1),tag_id:uid(2),revision:2}]);
 assert.ok(after.catalog_identity_ledger.some(x=>x.identity===uid(1)+':'+uid(2)&&x.revision===2));
 const restored=undo({...after,revision:2},delta(before,after),now,2);assert.equal(restored.actions[0].status,'dropped');assert.deepEqual(restored.action_tags,[]);
 for(const tag_ids of [null,uid(2),[uid(2),uid(2)],['invalid'],[uid(3)]])assert.throws(()=>change(before,{kind:'add',payload:{id:uid(1),title:'Named',tag_ids}},now));
});
