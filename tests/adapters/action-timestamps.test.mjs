import test from 'node:test';
import assert from 'node:assert/strict';
import {createD1ActionStore,actionCallForOwner} from '../helpers/owner-composition.mjs';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';

test('production SQL stores immutable Action creation instants and current mutation instants across recovery',async t=>{
 const fixture=sqliteFixture();t.after(()=>fixture.sql.close());let now='2026-10-01T12:00:00.000Z';let store=createD1ActionStore(fixture.db);const ports={store,clock:()=>now,newId:()=>crypto.randomUUID()},owner='timestamps';
 const call=(name,args={})=>actionCallForOwner(ports,owner,name,args);
 async function write(kind,payload){const before=await call('list_actions'),operationId=crypto.randomUUID();const reply=await call('apply_change',{schemaVersion:2,operationId,expectedRevision:before.revision,kind,payload});return {before,reply,operationId};}
 const check=(snapshot,id,updatedAt,createdAt='2026-10-01T12:00:00.000Z')=>{const row=snapshot.actions.find(action=>action.id===id);assert(row,`action ${id} is persisted`);assert.equal(row.created_at,createdAt);assert.equal(row.updated_at,updatedAt);return row;};

 const project=(await write('project_get_or_create',{name:'Project'})).reply.result.resolved.project.id;
 const otherProject=(await write('project_get_or_create',{name:'Other'})).reply.result.resolved.project.id;
 const tag=(await write('tag_get_or_create',{name:'Tag'})).reply.result.resolved.tag.id;
 const parentAdd=await write('add',{title:'Parent',project_id:project}),parent=parentAdd.reply.result.resolved.actions[0].id;
 const childAdd=await write('add',{title:'Child',parent_id:parent}),child=childAdd.reply.result.resolved.actions[0].id;
 const siblingAdd=await write('add',{title:'Sibling',project_id:project}),sibling=siblingAdd.reply.result.resolved.actions[0].id;
 const otherSiblingAdd=await write('add',{title:'Other sibling',project_id:otherProject}),otherSibling=otherSiblingAdd.reply.result.resolved.actions[0].id;
 let snapshot=await call('list_actions');check(snapshot,parent,now);check(snapshot,child,now);check(snapshot,sibling,now);

 now='2026-10-02T12:00:00.000Z';await write('edit',{id:parent,title:'Edited'});snapshot=await call('list_actions');check(snapshot,parent,now);check(snapshot,child,'2026-10-01T12:00:00.000Z');
 now='2026-10-03T12:00:00.000Z';await write('action_tag',{id:parent,tag_id:tag,enabled:true});check(await call('list_actions'),parent,now);
 now='2026-10-04T12:00:00.000Z';await write('action_project',{id:sibling,project_id:otherProject});snapshot=await call('list_actions');check(snapshot,parent,'2026-10-03T12:00:00.000Z');check(snapshot,sibling,now);check(snapshot,child,'2026-10-01T12:00:00.000Z');
 now='2026-10-05T12:00:00.000Z';await write('action_move',{ids:[sibling],placement:'before',anchor_id:otherSibling});snapshot=await call('list_actions');check(snapshot,sibling,now);check(snapshot,otherSibling,now);
 now='2026-10-06T12:00:00.000Z';await write('edit',{id:parent,order:7});check(await call('list_actions'),parent,now);
 now='2026-10-07T12:00:00.000Z';await write('status',{id:parent,status:'on-hold'});check(await call('list_actions'),parent,now);
 now='2026-10-08T12:00:00.000Z';await write('defer',{id:parent,until:'2026-11-01T09:00:00Z'});check(await call('list_actions'),parent,now);
 now='2026-10-09T12:00:00.000Z';const completion=await write('complete',{id:parent});snapshot=await call('list_actions');check(snapshot,parent,now);check(snapshot,child,now);assert.equal(snapshot.actions.find(action=>action.id===child).status,'completed');
 now='2026-10-10T12:00:00.000Z';await call('undo_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:snapshot.revision,undoOf:completion.operationId});snapshot=await call('list_actions');check(snapshot,parent,now);check(snapshot,child,now);assert.equal(snapshot.actions.find(action=>action.id===child).status,'active');

 now='2026-10-11T12:00:00.000Z';const original=await call('list_actions'),request={schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:original.revision,kind:'edit',payload:{id:parent,title:'First correction'}};await call('apply_change',request);check(await call('list_actions'),parent,now);
 now='2026-10-12T12:00:00.000Z';await write('edit',{id:parent,title:'Later correction'});const later=await call('list_actions');check(later,parent,now);
 now='2026-10-13T12:00:00.000Z';const replay=await call('apply_change',request);assert.equal(replay.actions.find(action=>action.id===parent).title,'Later correction');check(replay,parent,'2026-10-12T12:00:00.000Z');

 const beforeRead=await store.readSnapshot(owner);now='2026-10-14T12:00:00.000Z';const read=await call('list_actions');assert.equal(read.actions.find(action=>action.id===parent).created_at,'2026-10-01T12:00:00.000Z');assert.equal(read.actions.find(action=>action.id===parent).updated_at,'2026-10-12T12:00:00.000Z');await call('preview_change',{expectedRevision:read.revision,kind:'edit',payload:{id:parent,title:'Preview only'}});assert.deepEqual(await store.readSnapshot(owner),beforeRead);
 now='2026-10-15T12:00:00.000Z';await write('status',{id:parent,status:'active'});check(await call('list_actions'),parent,now);
 now='2026-10-16T12:00:00.000Z';const beforeNoMove=await call('list_actions');await write('action_move',{ids:[sibling],placement:'before',anchor_id:otherSibling});snapshot=await call('list_actions');assert(snapshot.revision>beforeNoMove.revision,'the accepted no-change operation still receives its ordinary operation revision');check(snapshot,sibling,'2026-10-05T12:00:00.000Z');
 store=createD1ActionStore(fixture.db);const reloaded=await store.readSnapshot(owner);check(reloaded,parent,'2026-10-15T12:00:00.000Z');check(reloaded,child,'2026-10-10T12:00:00.000Z');check(reloaded,sibling,'2026-10-05T12:00:00.000Z');
});
