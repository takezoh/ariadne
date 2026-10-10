import test from 'node:test';
import assert from 'node:assert/strict';
import {createUiController} from '../../lib/ui/application.ts';
import * as drafts from '../../lib/ui/model/drafts.ts';
import * as operations from '../../lib/ui/model/operations.ts';
import {createAutosaveModel} from '../../lib/ui/model/autosave.ts';
import {createMovementModel} from '../../lib/ui/model/movement.ts';
import {createTreeDropModel} from '../../lib/ui/model/tree-drop.ts';
import {createCatalogDraftModel} from '../../lib/ui/model/catalog-drafts.ts';
import {createTransientModel} from '../../lib/ui/model/transient-create.ts';
import {actionCallForOwner} from '../helpers/owner-composition.mjs';
import {memoryActionStore} from '../helpers/memory-action-store.mjs';

const now='2026-10-03T00:00:00Z';
const uuid=()=>crypto.randomUUID();
const settle=async()=>{for(let index=0;index<120;index++)await Promise.resolve();};

async function fixture(){
 const store=memoryActionStore(),calls=[],messages=[],timerQueue=new Map();
 const ports={store,clock:()=>now,newId:uuid},owner='move-recovery';
 const real=(name,args={})=>actionCallForOwner(ports,owner,name,args);
 const write=async(kind,payload)=>real('apply_change',{
  schemaVersion:2,operationId:uuid(),expectedRevision:(await store.readSnapshot(owner)).revision,kind,payload,
 });
 const ids=[];
 for(const title of ['Source','Other','Destination','Unrelated'])
  ids.push((await write('add',{title})).result.resolved.actions[0].id);
 let lose=false,hold=false,release=null,timer=0;
 const controller=createUiController({
  model:{...drafts,...operations,transient:createTransientModel(),treeDrop:createTreeDropModel(),catalogDrafts:createCatalogDraftModel(),autosave:createAutosaveModel(),movement:createMovementModel()},
  ids:{next:uuid},
  timers:{schedule:callback=>{const key=++timer;timerQueue.set(key,callback);return key;},cancel:key=>timerQueue.delete(key)},
  view:{render(){},message:text=>messages.push(text),review(){},closeReview(){}},
  call:async(name,args)=>{
   calls.push({name,args:structuredClone(args)});
   const result=await real(name,args);
   if(name==='apply_change'&&lose){lose=false;throw Object.assign(new Error('response lost after commit'),{code:'outcome_unknown'});}
   if(name==='apply_change'&&hold){hold=false;return new Promise(resolve=>{release=()=>resolve(result);});}
   return result;
  },
 });
 controller.accept(await real('list_actions'));
 return {
  controller,calls,messages,ids,real,write,timerQueue,
  setLost(){lose=true;},
  setHold(){hold=true;},
  release(){release?.();release=null;},
 };
}

async function preserveThroughRecovery(method){
 const f=await fixture(),[id,,target]=f.ids;
 f.setLost();
 assert.equal(f.controller.move({ids:[id],placement:'inside',anchor_id:target}),true);
 await settle();
 const exact=structuredClone(f.controller.state.unknown.args);
 assert.equal(exact.kind,'action_move');
 await f.write('edit',{id,title:'External correction'});
 f.controller.accept(await f.real('list_actions'));
 f.controller.editDraft(id,{notes:'Newer unsaved notes'});
 assert.equal(f.timerQueue.size>0,true);
 await f.controller[method]();
 await settle();
 assert.equal(f.controller.state.unknown,null);
 assert.equal(f.controller.state.data.actions.find(row=>row.id===id).title,'External correction');
 assert.equal(f.controller.state.data.actions.find(row=>row.id===id).parent_id,target);
 assert.equal(f.controller.state.drafts[id].notes,'Newer unsaved notes');
 assert.equal(f.controller.state.drafts[id].dirty,true);
 if(method==='retry')assert.deepEqual(
  f.calls.filter(call=>call.name==='apply_change'&&call.args.kind==='action_move').map(call=>call.args),
  [exact,exact],
 );
 await f.controller.undo();
 await settle();
 const latest=await f.real('list_actions');
 assert.equal(latest.actions.find(row=>row.id===id).title,'External correction');
 assert.equal(latest.actions.find(row=>row.id===id).parent_id,target);
 assert.equal(f.controller.state.drafts[id].notes,'Newer unsaved notes');
 assert.equal(f.controller.state.drafts[id].dirty,true);
}

test('operation-status recovery keeps a later external correction and unsaved edit; conflicting Undo preserves both',async()=>{
 await preserveThroughRecovery('check');
});

test('identical retry after an unknown move does not duplicate the write or replace newer input',async()=>{
 await preserveThroughRecovery('retry');
});

test('a held promise that returns an older snapshot cannot overwrite a correction or a newer draft',async()=>{
 const f=await fixture(),[id,,target]=f.ids;
 f.setHold();
 assert.equal(f.controller.move({ids:[id],placement:'inside',anchor_id:target}),true);
 await settle();
 await f.write('edit',{id,title:'External correction'});
 f.controller.accept(await f.real('list_actions'));
 f.controller.editDraft(id,{notes:'Newer unsaved notes'});
 f.release();
 await settle();
 assert.equal(f.controller.state.data.actions.find(row=>row.id===id).title,'External correction');
 assert.equal(f.controller.state.data.actions.find(row=>row.id===id).parent_id,target);
 assert.equal(f.controller.state.drafts[id].notes,'Newer unsaved notes');
 assert.equal(f.controller.state.drafts[id].dirty,true);
 await f.controller.undo();
 await settle();
 const latest=await f.real('list_actions');
 assert.equal(latest.actions.find(row=>row.id===id).title,'External correction');
 assert.equal(latest.actions.find(row=>row.id===id).parent_id,target);
 assert.equal(f.controller.state.drafts[id].notes,'Newer unsaved notes');
});
