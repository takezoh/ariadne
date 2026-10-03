import {test} from 'node:test';import assert from 'node:assert/strict';
import {change,actionMoveEdits,orderedActions} from '../../lib/domain/core.ts';import {delta,undo,preview} from '../../lib/domain/operations.ts';
const now='2026-10-03T00:00:00.000Z',uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const row=(n,p={})=>({id:uid(n),title:'Action '+n,notes:' exact\n日本語 ',revision:1,status:'active',parent_id:null,project_id:null,due_at:null,defer_until:null,order:n,flagged:false,created_at:now,updated_at:now,...p});
const snapshot=actions=>({revision:5,actions,projects:[],tags:[],action_tags:[],catalog_identity_ledger:[],perspectives:[]});
const move=(s,ids,placement,anchor)=>change(s,{kind:'action_move',payload:{ids:ids.map(uid),placement,...(anchor===undefined?{}:{anchor_id:uid(anchor)})}},now);
test('move bundle uses explicit input order and full hidden siblings, preserving source gaps and untouched values',()=>{
 const s=snapshot([row(1,{order:10}),row(2,{order:30,status:'on-hold',flagged:true,defer_until:'2026-12-01T09:00:00Z'}),row(3,{order:50,status:'completed'}),row(4,{order:70,status:'dropped'})]),before=structuredClone(s);
 const after=move(s,[4,1],'after',2);assert.deepEqual(orderedActions(after).map(a=>a.id),[2,4,1,3].map(uid));assert.deepEqual(after.actions.map(a=>a.order),[2,0,3,1]);assert.deepEqual(s,before);
 for(const action of after.actions){const original=s.actions.find(a=>a.id===action.id);for(const field of ['title','notes','status','flagged','due_at','defer_until','project_id'])assert.deepEqual(action[field],original[field]);assert.equal(action.revision,original.revision+1);}
 const nested=snapshot([row(1),row(2,{parent_id:uid(1),order:20}),row(3,{parent_id:uid(1),order:80}),row(4)]),moved=move(nested,[2],'inside',4);assert.equal(moved.actions.find(a=>a.id===uid(3)).order,80);assert.equal(moved.actions.find(a=>a.id===uid(3)).revision,1);
});
test('selected ancestor absorbs selected descendant, keeps subtree links/ranks and preserves bundle order',()=>{
 const s=snapshot([row(1),row(2,{parent_id:uid(1),order:80}),row(3),row(4),row(5,{parent_id:uid(4),order:100})]);
 const after=move(s,[2,3,1],'inside',4);assert.deepEqual(after.actions.filter(a=>a.parent_id===uid(4)).sort((a,b)=>a.order-b.order).map(a=>a.id),[5,3,1].map(uid));assert.equal(after.actions.find(a=>a.id===uid(2)).parent_id,uid(1));assert.equal(after.actions.find(a=>a.id===uid(2)).order,80);assert.equal(after.actions.find(a=>a.id===uid(2)).revision,1);
});
test('mixed Project top-level detach appends within each own group while root before/after rejects cross-group',()=>{
 const p1=uid(91),p2=uid(92),s=snapshot([row(1,{project_id:p1,order:99}),row(2,{project_id:p2,order:99}),row(3,{parent_id:uid(1),project_id:p2}),row(4,{parent_id:uid(1),project_id:p1}),row(5,{parent_id:uid(1),project_id:p2})]);s.projects=[{id:p1,name:'P1',description:'',parent_id:null,order:0},{id:p2,name:'P2',description:'',parent_id:null,order:0}];
 const after=move(s,[5,4,3],'root');assert.deepEqual(orderedActions(after).map(a=>a.id),[1,4,2,5,3].map(uid));for(const a of after.actions)assert.equal(a.project_id,s.actions.find(x=>x.id===a.id).project_id);
 assert.throws(()=>move(s,[3],'before',1),e=>e.code==='invalid_input');const inside=move(s,[2],'inside',1);assert.equal(inside.actions.find(a=>a.id===uid(2)).project_id,p2);
});
test('unchanged semantic placement is a no-op, including tied or exhausted existing ranks',()=>{
 const s=snapshot([row(1,{order:0}),row(2,{order:Number.MAX_SAFE_INTEGER})]);assert.deepEqual(actionMoveEdits(s,{ids:[uid(2)],placement:'after',anchor_id:uid(1)}),[]);assert.deepEqual(delta(s,move(s,[2],'after',1)).actions,[]);
 const reversed=move(s,[2],'before',1);assert.deepEqual(orderedActions(reversed).map(a=>a.id),[2,1].map(uid));assert.deepEqual(reversed.actions.map(a=>a.order),[1,0]);
 const tied=snapshot([row(1,{order:7}),row(2,{order:7})]);assert.deepEqual(move(tied,[2],'after',1),tied);
});
test('invalid, foreign, duplicate, self, subtree and malformed move intents reject without input mutation',()=>{
 const s=snapshot([row(1),row(2,{parent_id:uid(1)}),row(3)]),before=structuredClone(s);
 const payloads=[{}, {ids:[],placement:'root'},{ids:[uid(1),uid(1)],placement:'root'},{ids:[uid(99)],placement:'root'},{ids:[uid(1)],placement:'root',anchor_id:null},{ids:[uid(1)],placement:'other'},{ids:[uid(1)],placement:'before'},{ids:[uid(1)],placement:'inside',anchor_id:uid(99)},{ids:[uid(1)],placement:'inside',anchor_id:uid(2)},{ids:[uid(1),uid(2)],placement:'after',anchor_id:uid(2)},{ids:[uid(1)],placement:'before',anchor_id:uid(1)},{ids:[uid(1)],placement:'root',notes:'forbidden'},{ids:'wrong',placement:'root'}];
 for(const payload of payloads){assert.throws(()=>change(s,{kind:'action_move',payload},now));assert.deepEqual(s,before);}
});
test('preview and Undo cover all changed structure atomically and refuse later touched-row corrections',()=>{
 const s=snapshot([row(1),row(2),row(3,{parent_id:uid(1),order:99})]),payload={ids:[uid(1),uid(2)],placement:'inside',anchor_id:uid(3)};assert.throws(()=>preview(s,{kind:'action_move',payload},now));
 const valid={ids:[uid(3),uid(2)],placement:'inside',anchor_id:uid(1)},after=change(s,{kind:'action_move',payload:valid},now),p=preview(s,{kind:'action_move',payload:valid},now);assert.deepEqual(p.affected.map(a=>a.id).sort(),delta(s,after).actions.map(x=>x.after.id).sort());
 const restored=undo({...after,revision:6},delta(s,after),now,6);for(const a of restored.actions){const old=s.actions.find(x=>x.id===a.id);assert.equal(a.parent_id,old.parent_id);assert.equal(a.order,old.order);}
 const corrected=change({...after,revision:6},{kind:'edit',payload:{id:uid(2),notes:'later'}},now);assert.throws(()=>undo(corrected,delta(s,after),now,6),e=>e.code==='undo_conflict');
});
test('movement has no arbitrary selected-ID count limit',()=>{
 const s=snapshot(Array.from({length:202},(_,i)=>row(i+1))),ids=Array.from({length:201},(_,i)=>uid(201-i));const after=change(s,{kind:'action_move',payload:{ids,placement:'inside',anchor_id:uid(202)}},now);assert.equal(after.actions.filter(a=>a.parent_id===uid(202)).length,201);assert.equal(after.actions.find(a=>a.id===uid(201)).order,0);
});
