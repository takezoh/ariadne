import test from 'node:test';
import assert from 'node:assert/strict';
import {change,project} from '../../lib/domain/core.ts';
import {delta,preview,response,undo} from '../../lib/domain/operations.ts';

const times={created:'2026-10-01T12:00:00.000Z',updated:'2026-10-02T12:00:00.000Z',undone:'2026-10-03T12:00:00.000Z'};
const ids={action:'00000000-0000-4000-8000-000000000001',sibling:'00000000-0000-4000-8000-000000000002',child:'00000000-0000-4000-8000-000000000003',project:'00000000-0000-4000-8000-000000000004',otherProject:'00000000-0000-4000-8000-000000000005',tag:'00000000-0000-4000-8000-000000000006'};
const empty=()=>({revision:0,catalog_identity_ledger:[],actions:[],projects:[],tags:[],action_tags:[],perspectives:[]});
function base(){let state=empty();for(const command of [{kind:'project_add',payload:{id:ids.project,name:'Project'}},{kind:'project_add',payload:{id:ids.otherProject,name:'Other'}},{kind:'tag_add',payload:{id:ids.tag,name:'Tag'}},{kind:'add',payload:{id:ids.action,title:'Parent',project_id:ids.project}},{kind:'add',payload:{id:ids.sibling,title:'Sibling',project_id:ids.project}},{kind:'add',payload:{id:ids.child,title:'Child',parent_id:ids.action}}]){const next=change(state,command,times.created);next.revision=state.revision+1;state=next;}return state;}
function assertTouched(before,after,updatedAt){const rows=delta(before,after).actions;assert(rows.length>0,'the operation should record an action delta');for(const {before:old,after:next} of rows){if(old)assert.equal(next.created_at,old.created_at,'created_at is immutable for an existing Action');else assert.equal(next.created_at,updatedAt,'a new Action starts both timestamps at the injected clock');assert.equal(next.updated_at,updatedAt,'touched Actions use the injected clock');}}

test('Action timestamps follow every persisted mutation path and survive Undo',()=>{
 const original=base(),cases=[
  ['edit',{kind:'edit',payload:{id:ids.action,title:'Renamed'}}],
  ['Tag assignment',{kind:'action_tag',payload:{id:ids.action,tag_id:ids.tag,enabled:true}}],
  ['Project assignment',{kind:'action_project',payload:{id:ids.sibling,project_id:ids.otherProject}}],
  ['move/reorder',{kind:'action_move',payload:{ids:[ids.sibling],placement:'before',anchor_id:ids.action}}],
  ['direct reorder',{kind:'edit',payload:{id:ids.action,order:8}}],
  ['status',{kind:'status',payload:{id:ids.action,status:'on-hold'}}],
  ['Defer',{kind:'defer',payload:{id:ids.action,until:'2026-11-01T09:00:00Z'}}],
 ];
 for(const [name,command] of cases){const changed=change(original,command,times.updated);assertTouched(original,changed,times.updated);assert.equal(original.actions.find(action=>action.id===ids.action).created_at,times.created,name+' leaves its source untouched');}
 const completed=change(original,{kind:'complete',payload:{id:ids.action}},times.updated);completed.revision=original.revision+1;assertTouched(original,completed,times.updated);for(const id of [ids.action,ids.child])assert.equal(completed.actions.find(action=>action.id===id).status,'completed');assert.equal(completed.actions.find(action=>action.id===ids.sibling).status,'active');assert.equal(completed.actions.find(action=>action.id===ids.child).created_at,times.created);
 const restored=undo(completed,delta(original,completed),times.undone,completed.revision);assert.deepEqual(new Set(delta(completed,restored).actions.map(row=>row.after.id)),new Set([ids.action,ids.child]));for(const action of restored.actions){assert.equal(action.created_at,times.created);if([ids.action,ids.child].includes(action.id))assert.equal(action.updated_at,times.undone);}
 const noMove=change(original,{kind:'action_move',payload:{ids:[ids.action],placement:'before',anchor_id:ids.sibling}},times.updated);assert.deepEqual(delta(original,noMove).actions,[],'a semantic no-change movement leaves Action rows untouched');assert.equal(noMove.actions.find(action=>action.id===ids.action).updated_at,times.created);
});

test('read, preview and no-op writes preserve the saved-instant contract',()=>{
 const saved=base(),original=structuredClone(saved),read=response(saved,times.updated),projected=project(saved,times.updated),previewed=preview(saved,{kind:'edit',payload:{id:ids.action,title:'Preview only'}},times.updated);
 assert.deepEqual(saved,original);assert.equal(read.actions.find(action=>action.id===ids.action).created_at,times.created);assert.equal(projected.find(action=>action.id===ids.action).updated_at,times.created);assert.equal(previewed.affected.find(action=>action.id===ids.action).created_at,times.created);assert.equal(saved.actions.find(action=>action.id===ids.action).title,'Parent');
 const noOp=change(saved,{kind:'status',payload:{id:ids.action,status:'active'}},times.updated);assertTouched(saved,noOp,times.updated);assert.equal(noOp.actions.find(action=>action.id===ids.action).created_at,times.created);
});
