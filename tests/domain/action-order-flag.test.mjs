import {test} from 'node:test';
import assert from 'node:assert/strict';
import {change,project} from '../../lib/domain/core.ts';
import {delta,undo,response,queryResponse,preview} from '../../lib/domain/operations.ts';
const now='2026-10-03T00:00:00.000Z';
const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const empty=()=>({revision:0,catalog_identity_ledger:[],actions:[],projects:[],tags:[],action_tags:[],perspectives:[]});
const add=(s,n,p={})=>change(s,{kind:'add',payload:{id:uid(n),title:`Action ${n}`,...p}},now);
const edit=(s,n,p)=>change(s,{kind:'edit',payload:{id:uid(n),...p}},now);
test('sibling order projects a tree and later siblings can complete first',()=>{
 let s=add(empty(),1);s=add(s,2,{parent_id:uid(1),order:20});s=add(s,3,{parent_id:uid(1),order:10});s=add(s,4,{parent_id:uid(3)});s=add(s,5);
 assert.deepEqual(project(s,now).map(t=>t.id),[1,3,4,2,5].map(uid));
 const done=edit(s,2,{status:'completed'});assert.equal(done.actions.find(t=>t.id===uid(3)).status,'active');assert.equal(done.actions.find(t=>t.id===uid(2)).status,'completed');
 const reordered=edit(s,2,{order:0});assert.deepEqual(project(reordered,now).map(t=>t.id),[1,2,3,4,5].map(uid));
 assert.equal(undo(reordered,delta(s,reordered),now,1).actions.find(t=>t.id===uid(2)).order,20);
 assert.equal('dependencies' in s,false);assert.equal('waiting' in project(s,now)[0],false);
});
test('default append and moves use the destination sibling or root project scope',()=>{
 let s=add(empty(),1);s=add(s,2);s=add(s,3,{parent_id:uid(1)});s=add(s,4,{parent_id:uid(1)});
 assert.deepEqual(s.actions.map(t=>t.order),[0,1,0,1]);
 s=edit(s,2,{parent_id:uid(1)});assert.equal(s.actions.find(t=>t.id===uid(2)).order,2);
 s=edit(s,4,{parent_id:null,order:7});assert.equal(s.actions.find(t=>t.id===uid(4)).order,7);
 s=change(s,{kind:'project_add',payload:{id:uid(10),name:'Project'}},now);
 s=change(s,{kind:'action_project',payload:{id:uid(1),project_id:uid(10)}},now);assert.equal(s.actions.find(t=>t.id===uid(1)).order,0);
 s=add(s,5,{project_id:uid(10)});assert.equal(s.actions.find(t=>t.id===uid(5)).order,1);
 const tied=edit(s,5,{order:0});assert.deepEqual(project(tied,now).filter(t=>t.parent_id===null&&t.project_id===uid(10)).map(t=>t.id),[1,5].map(uid));
});
test('direct flags never inherit, change lifecycle, or release Defer, and Undo restores them',()=>{
 let s=add(empty(),1,{flagged:true});s=add(s,2,{parent_id:uid(1)});
 assert.equal(s.actions.find(t=>t.id===uid(2)).flagged,false);
 const deferred=edit(s,2,{flagged:true,defer_until:'2026-12-01T00:00:00Z'});
 assert.equal(project(deferred,now).find(t=>t.id===uid(2)).view,'deferred');
 assert.deepEqual(response(deferred,now).list_scopes.flagged,[uid(1)]);
 assert.deepEqual(queryResponse(deferred,now,{flagged:true}).actions.map(t=>t.id),[1,2].map(uid));
 const releasedFlag=edit(deferred,1,{flagged:false});assert.equal(releasedFlag.actions.find(t=>t.id===uid(2)).flagged,true);
 assert.equal(undo(deferred,delta(s,deferred),now,1).actions.find(t=>t.id===uid(2)).flagged,false);
 const dropped=edit(deferred,2,{status:'dropped'});assert.equal(dropped.actions.find(t=>t.id===uid(2)).flagged,true);
 assert.deepEqual(queryResponse(dropped,now,{flagged:true,status:'dropped'}).actions.map(t=>t.id),[uid(2)]);
 assert.equal(preview(s,{kind:'edit',payload:{id:uid(2),flagged:true,order:9}},now).affected[0].flagged,true);
});
test('invalid rank and flag input is rejected without modifying the source',()=>{
 const s=add(empty(),1);
 for(const order of [-1,1.5,'1',null,Number.MAX_SAFE_INTEGER+1,Infinity])assert.throws(()=>edit(s,1,{order}),e=>e.code==='invalid_input');
 for(const flagged of [1,0,'true',null]){assert.throws(()=>edit(s,1,{flagged}),e=>e.code==='invalid_input');assert.throws(()=>queryResponse(s,now,{flagged}),e=>e.code==='invalid_input');}
 assert.equal(s.actions[0].order,0);assert.equal(s.actions[0].flagged,false);
 const full=edit(s,1,{order:Number.MAX_SAFE_INTEGER});assert.throws(()=>add(full,2),e=>e.code==='invalid_input');
});
