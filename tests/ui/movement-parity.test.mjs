import test from 'node:test';
import assert from 'node:assert/strict';
import {actionCallForOwner} from '../helpers/owner-composition.mjs';
import {memoryActionStore} from '../helpers/memory-action-store.mjs';

const now='2026-10-03T00:00:00Z';
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');

async function exercise(mode,{stale=false,invalid=false,undoConflict=false}={}){
 const store=memoryActionStore(),owner='move-parity';let recordId=300,operationId=20;
 const ports={store,clock:()=>now,newId:()=>uuid(recordId++)};
 const call=(name,args)=>actionCallForOwner(ports,owner,name,args);
 async function apply(kind,payload){
  const current=await store.readSnapshot(owner);
  return call('apply_change',{schemaVersion:2,operationId:uuid(operationId++),expectedRevision:current.revision,kind,payload});
 }
 const parent=(await apply('add',{title:'Bundle parent'})).result.resolved.actions[0].id;
 const child=(await apply('add',{title:'Bundle child',parent_id:parent})).result.resolved.actions[0].id;
 const target=(await apply('add',{title:'Target'})).result.resolved.actions[0].id;
 const hidden=(await apply('add',{title:'Completed hidden sibling',parent_id:target})).result.resolved.actions[0].id;
 await apply('status',{id:hidden,status:'completed'});
 const sibling=(await apply('add',{title:'Visible sibling',parent_id:target})).result.resolved.actions[0].id;
 const initial=await store.readSnapshot(owner);
 const payload=invalid
  ?{ids:[parent],placement:'inside',anchor_id:child}
  :{ids:[parent],placement:'inside',anchor_id:target};
 const expectedRevision=stale?initial.revision-1:initial.revision;
 const moveId=uuid(900),args={schemaVersion:2,operationId:moveId,expectedRevision,kind:'action_move',payload};
 const captureError=async action=>{try{await action();return null;}catch(error){return error.code||error.name;}};
 if(stale||invalid){
  const rejection=await captureError(()=>mode==='direct'
   ?call('apply_change',args)
   :call('preview_change',{expectedRevision,kind:'action_move',payload}));
  return {rejection,snapshot:await store.readSnapshot(owner)};
 }
 let sent=args;
 if(mode==='preview'){
  const plan=await call('preview_change',{expectedRevision,kind:'action_move',payload});
  sent={...args,expectedRevision:plan.expectedRevision,kind:plan.kind,payload:plan.payload};
 }
 const moved=await call('apply_change',sent);
 const replay=await call('apply_change',sent);
 const receipt=await call('operation_status',{operationId:moveId});
 const changedInput=await captureError(()=>call('apply_change',{
  ...sent,payload:{ids:[parent],placement:'root'},
 }));
 const afterMove=await store.readSnapshot(owner);
 let externalCorrection=null;
 if(undoConflict)externalCorrection=await apply('edit',{id:parent,title:'External correction'});
 const beforeUndo=await store.readSnapshot(owner);
 let undo=null,undoError=null;
 try{
  undo=await call('undo_change',{schemaVersion:2,operationId:uuid(901),expectedRevision:beforeUndo.revision,undoOf:moveId});
 }catch(error){undoError=error.code||error.name;}
 return {
  moved,replay,receipt,changedInput,afterMove,externalCorrection,undo,undoError,
  final:await store.readSnapshot(owner),ids:{parent,child,target,hidden,sibling},
 };
}

test('direct action_move matches preview-plus-apply for results, validation, receipt replay, hidden siblings, and Undo',async()=>{
 const direct=await exercise('direct'),reviewed=await exercise('preview');
 assert.deepEqual(direct.moved,reviewed.moved);
 assert.deepEqual(direct.replay,reviewed.replay);
 assert.deepEqual(direct.receipt,reviewed.receipt);
 assert.equal(direct.changedInput,'idempotency_conflict');
 assert.equal(reviewed.changedInput,'idempotency_conflict');
 assert.deepEqual(direct.afterMove,reviewed.afterMove);
 const {parent,child,target,hidden,sibling}=direct.ids;
 assert.equal(direct.afterMove.actions.find(row=>row.id===parent).parent_id,target);
 assert.equal(direct.afterMove.actions.find(row=>row.id===child).parent_id,parent);
 assert.equal(direct.afterMove.actions.find(row=>row.id===hidden).status,'completed');
 assert.equal(direct.afterMove.actions.find(row=>row.id===sibling).parent_id,target);
 assert.deepEqual(direct.undo,reviewed.undo);
 assert.equal(direct.undoError,null);
 assert.deepEqual(direct.final,reviewed.final);
});

test('direct and preview movement reject the same stale revision and cyclic destination without writing',async()=>{
 for(const scenario of [{stale:true},{invalid:true}]){
  const direct=await exercise('direct',scenario),reviewed=await exercise('preview',scenario);
  assert.equal(direct.rejection,reviewed.rejection);
  assert.deepEqual(direct.snapshot,reviewed.snapshot);
 }
});

test('Undo conflict after an external correction is identical and preserves the corrected action',async()=>{
 const direct=await exercise('direct',{undoConflict:true}),reviewed=await exercise('preview',{undoConflict:true});
 assert.deepEqual(direct.moved,reviewed.moved);
 assert.deepEqual(direct.externalCorrection,reviewed.externalCorrection);
 assert.equal(direct.undoError,'undo_conflict');
 assert.equal(reviewed.undoError,'undo_conflict');
 assert.deepEqual(direct.final,reviewed.final);
 const {parent,target}=direct.ids;
 assert.equal(direct.final.actions.find(row=>row.id===parent).title,'External correction');
 assert.equal(direct.final.actions.find(row=>row.id===parent).parent_id,target);
});
