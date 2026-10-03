import {test} from 'node:test';
import assert from 'node:assert/strict';
import {change,project,dateDefer} from '../../lib/domain/core.ts';
import {delta,undo,preview,response,queryResponse} from '../../lib/domain/operations.ts';
const now='2026-10-03T00:00:00.000Z';
const id='00000000-0000-4000-8000-000000000001';
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
const empty=()=>({revision:0,catalog_identity_ledger:[],actions:[],projects:[],tags:[],action_tags:[],perspectives:[]});
test('domain transitions, preview, delta and Undo do not mutate inputs',()=>{
 const before=freeze(empty());const command=freeze({kind:'add',payload:{id,title:'action'}});
 const after=change(before,command,now);assert.equal(before.actions.length,0);freeze(after);
 const changes=freeze(delta(before,after));const reverted=undo(after,changes,now,1);
 assert.equal(reverted.actions[0].status,'dropped');assert.equal(after.actions[0].status,'active');
 const pv=preview(after,freeze({kind:'defer',payload:{id,date:'2026-10-04',timezone:'Asia/Tokyo'}}),now);
 assert.equal(pv.payload.until,'2026-10-04T00:00:00.000Z');assert.equal(after.actions[0].defer_until,null);
 assert.deepEqual(change(before,command,now),change(before,command,now));
});
test('time projection changes views without changing persisted values',()=>{
 const action=change(change(empty(),{kind:'add',payload:{id,title:'action'}},now),{kind:'defer',payload:{id,date:'2026-10-04',timezone:'Asia/Tokyo'}},now);freeze(action);
 assert.equal(project(action,now)[0].view,'deferred');assert.equal(project(action,'2026-10-05T00:00:00.000Z')[0].view,'normal');assert.equal(action.actions[0].defer_until,'2026-10-04T00:00:00.000Z');
});
test('date-only input rejects missing zone and invalid calendar dates',()=>{assert.throws(()=>dateDefer('2026-10-04',null),e=>e.code==='timezone_required');assert.throws(()=>dateDefer('2026-02-30','Asia/Tokyo'),e=>e.code==='invalid_input');});
test('date-only Defer preview rejects mixed forms and unknown fields before normalization',()=>{
 const saved=freeze(change(empty(),{kind:'add',payload:{id,title:'action'}},now));
 for(const extra of [{until:'2026-10-10T00:00:00Z'},{until:null},{unexpected:true}]){
  const command=freeze({kind:'defer',payload:{id,date:'2026-10-10',timezone:'Asia/Tokyo',...extra}});
  assert.throws(()=>preview(saved,command,now),e=>e.code==='invalid_input');assert.throws(()=>change(saved,command,now),e=>e.code==='invalid_input');
 }
 assert.equal(preview(saved,{kind:'defer',payload:{id,date:'2026-10-10',timezone:'Asia/Tokyo'}},now).payload.until,'2026-10-10T00:00:00.000Z');
 assert.equal(saved.actions[0].defer_until,null);
});
test('graph rejection leaves deeply frozen snapshots intact',()=>{
 const other='00000000-0000-4000-8000-000000000002';
 const parent=change(empty(),{kind:'add',payload:{id,title:'parent'}},now);
 const tree=freeze(change(parent,{kind:'add',payload:{id:other,title:'child',parent_id:id}},now));
 assert.throws(()=>change(tree,{kind:'edit',payload:{id,parent_id:other}},now),e=>e.code==='invalid_graph');
 assert(change(tree,{kind:'complete',payload:{id}},now).actions.every(t=>t.status==='completed'));
 assert.throws(()=>change(tree,{kind:'dependency',payload:{dependent:id,prerequisite:id,enabled:true}},now),e=>e.code==='unknown_kind');
 assert.equal(tree.actions[0].parent_id,null);assert.equal(tree.actions[0].status,'active');assert.equal('dependencies' in tree,false);
});
test('invalid instant and stale Undo reject without mutating frozen input',()=>{
 const added=change(empty(),{kind:'add',payload:{id,title:'original'}},now);
 assert.throws(()=>change(freeze(added),{kind:'defer',payload:{id,until:'2026-02-30T00:00:00Z'}},now),e=>e.code==='invalid_input');
 assert.throws(()=>change(added,{kind:'edit',payload:{id,due_at:'2026-10-03T00:00:00'}},now),e=>e.code==='invalid_input');
 const edited=change(added,{kind:'edit',payload:{id,title:'first'}},now),changes=freeze(delta(added,edited));
 const latest=freeze(change(edited,{kind:'edit',payload:{id,title:'correction'}},now));
 assert.throws(()=>undo(latest,changes,now,1),e=>e.code==='undo_conflict');assert.equal(latest.actions[0].title,'correction');
});

test('timezone setting is retired',()=>{assert.throws(()=>change(empty(),{kind:'timezone',payload:{timezone:'Asia/Tokyo'}},now),e=>e.code==='unknown_kind');});

 test('Inbox includes deferred active actions and excludes project-assigned and completed actions',()=>{
 let s=change(empty(),{kind:'add',payload:{id,title:'Inbox'}},now);
 s=change(s,{kind:'defer',payload:{id,until:'2026-12-01T00:00:00Z'}},now);
 assert.deepEqual(response(s,now).list_scopes.inbox,[id]);
 s=change(s,{kind:'complete',payload:{id}},now);assert.deepEqual(response(s,now).list_scopes.inbox,[]);
 });


test('explicit waiting remains unfinished, has no prerequisite constraints and respects Defer',()=>{
 const other='00000000-0000-4000-8000-000000000099';
 let s=change(empty(),{kind:'add',payload:{id,title:'parent'}},now);
 s=change(s,{kind:'add',payload:{id:other,title:'child',parent_id:id}},now);
 const before=s;s=change(s,{kind:'status',payload:{id:other,status:'on-hold'}},now);
 assert.equal(s.actions.find(t=>t.id===other).status,'on-hold');assert.deepEqual(response(s,now).list_scopes.waiting,[other]);
 const cascaded=change(s,{kind:'complete',payload:{id}},now);assert(cascaded.actions.every(t=>t.status==='completed'));
 const reversed=undo(s,delta(before,s),now,1);assert.equal(reversed.actions.find(t=>t.id===other).status,'active');
 s=change(s,{kind:'defer',payload:{id:other,until:'2026-12-01T00:00:00Z'}},now);
 assert.equal(project(s,now).find(t=>t.id===other).view,'deferred');assert(response(s,now).list_scopes.inbox.includes(other));
 assert.equal(s.actions.find(t=>t.id===other).status,'on-hold');
 s=change(s,{kind:'complete',payload:{id:other}},now);s=change(s,{kind:'complete',payload:{id}},now);
 assert.equal(change(s,{kind:'status',payload:{id:other,status:'on-hold'}},now).actions.find(t=>t.id===other).status,'on-hold');
 assert.equal(change(s,{kind:'add',payload:{id:'00000000-0000-4000-8000-000000000098',title:'new',parent_id:id}},now).actions.length,3);
});

test('generic properties retain relations across cancellation and independently clear own Defer',()=>{
 const child='00000000-0000-4000-8000-000000000099';
 let s=change(empty(),{kind:'add',payload:{id,title:'parent'}},now);
 s=change(s,{kind:'add',payload:{id:child,title:'child',parent_id:id}},now);
 s=change(s,{kind:'edit',payload:{id,status:'dropped',defer_until:'2026-12-01T00:00:00Z'}},now);
 assert.equal(s.actions.find(t=>t.id===child).parent_id,id);assert.equal('waiting' in project(s,now).find(t=>t.id===child),false);
 s=change(s,{kind:'edit',payload:{id,title:'renamed',status:'on-hold'}},now);
 s=change(s,{kind:'defer',payload:{id:child,until:'2026-11-01T00:00:00Z'}},now);
 s=change(s,{kind:'release',payload:{id:child}},now);assert.equal(s.actions.find(t=>t.id===child).defer_until,null);assert.equal(project(s,now).find(t=>t.id===child).is_deferred,true);
 s=change(s,{kind:'cancel',payload:{id:child}},now);s=change(s,{kind:'complete',payload:{id}},now);
 s=change(s,{kind:'defer',payload:{id:child,until:'2026-12-02T00:00:00Z'}},now);assert.equal(s.actions.find(t=>t.id===child).status,'completed');
 assert.equal(change(s,{kind:'edit',payload:{id:child,status:'on-hold'}},now).actions.find(t=>t.id===child).status,'on-hold');
 s=change(s,{kind:'status',payload:{id,status:'active'}},now);s=change(s,{kind:'status',payload:{id:child,status:'on-hold'}},now);assert.equal(s.actions.find(t=>t.id===child).status,'on-hold');
});

 test('completion cascades every descendant atomically and Undo restores lifecycle without losing attributes',()=>{
 const child='00000000-0000-4000-8000-000000000097',leaf='00000000-0000-4000-8000-000000000098';
 let s=change(empty(),{kind:'add',payload:{id,title:'parent'}},now);
 s=change(s,{kind:'add',payload:{id:child,title:'child',parent_id:id,notes:'keep'}},now);
 s=change(s,{kind:'add',payload:{id:leaf,title:'leaf',parent_id:child}},now);
 s=change(s,{kind:'edit',payload:{id:child,status:'on-hold',defer_until:'2026-12-01T00:00:00Z'}},now);
 s=change(s,{kind:'status',payload:{id:leaf,status:'dropped'}},now);
 const p=preview(s,{kind:'complete',payload:{id}},now);assert.deepEqual(new Set(p.affected.map(t=>t.id)),new Set([id,child,leaf]));
 const done=change(s,{kind:'edit',payload:{id,status:'completed'}},now);assert(done.actions.every(t=>t.status==='completed'));assert.equal(done.actions.find(t=>t.id===child).notes,'keep');assert.equal(done.actions.find(t=>t.id===child).defer_until,'2026-12-01T00:00:00.000Z');
 const restored=undo(done,delta(s,done),now,1);assert.equal(restored.actions.find(t=>t.id===child).status,'on-hold');assert.equal(restored.actions.find(t=>t.id===leaf).status,'dropped');
 const reopened=preview(done,{kind:'reopen',payload:{id:child}},now);assert.equal(reopened.payload.reopen_ancestors,undefined);assert.equal(reopened.affected.find(t=>t.id===child).status,'active');assert.equal(change(done,{kind:'reopen',payload:{id:child}},now).actions.find(t=>t.id===id).status,'completed');
 const later=change(done,{kind:'edit',payload:{id:leaf,notes:'later'}},now);assert.throws(()=>undo(later,delta(s,done),now,1),e=>e.code==='undo_conflict');
 });


test('active is the ordinary lifecycle status and legacy open input is rejected',()=>{
 const s=change(empty(),{kind:'add',payload:{id,title:'action'}},now);
 assert.equal(s.actions[0].status,'active');
 assert.deepEqual(queryResponse(s,now,{status:'active'}).actions.map(t=>t.id),[id]);
 for(const status of ['open','waiting','done','cancelled','pause']){for(const kind of ['edit','status'])assert.throws(()=>change(s,{kind,payload:{id,status}},now),e=>e.code==='invalid_input');assert.throws(()=>queryResponse(s,now,{status}),e=>e.code==='invalid_input');}
 for(const status of ['active','on-hold','completed','dropped']){const changed=change(s,{kind:'status',payload:{id,status}},now);assert.equal(changed.actions[0].status,status);assert.equal(queryResponse(changed,now,{status}).actions.length,1);}
});
