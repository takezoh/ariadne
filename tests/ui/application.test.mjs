import {createCompletionReviewModel} from '../../lib/ui/model/completion-review.ts';
import {createTransientModel} from '../../lib/ui/model/transient-create.ts';
import {createCatalogDraftModel} from '../../lib/ui/model/catalog-drafts.ts';
import {createTreeDropModel} from '../../lib/ui/model/tree-drop.ts';
import test from 'node:test';import assert from 'node:assert/strict';
import {createUiController} from '../../lib/ui/application/controller.ts';
import {createAutosaveModel} from '../../lib/ui/model/autosave.ts';
import * as drafts from '../../lib/ui/model/drafts.ts';import * as operations from '../../lib/ui/model/operations.ts';
const creationModel={transient:createTransientModel(),catalogDrafts:createCatalogDraftModel(),autosave:createAutosaveModel()};
const settleCreation=async()=>{for(let n=0;n<100;n++)await Promise.resolve();};
function fixture(call,extraModel={}){const messages=[],reviews=[];let ids=0;const controller=createUiController({call,ids:{next:()=>`id-${++ids}`},model:{...drafts,...operations,completionReview:createCompletionReviewModel(),autosave:createAutosaveModel(),...extraModel},view:{render:()=>{},message:text=>messages.push(text),review:(preview,snapshot,scope)=>reviews.push({preview,snapshot,scope}),closeReview:()=>{}}});const snapshot={revision:1,projects:[],tags:[],perspectives:[],actions:[{id:'a',title:'saved',notes:'',revision:1}]};controller.accept(snapshot);return {controller,messages,reviews,snapshot};}
function completionFixture(){
 const snapshot={revision:1,projects:[],tags:[],perspectives:[],actions:[
  {id:'root',title:'Root',notes:'',status:'active',parent_id:null,revision:1},
  {id:'child',title:'Filtered child',notes:'',status:'on-hold',parent_id:'root',revision:1},
  {id:'grandchild',title:'Already completed grandchild',notes:'',status:'completed',parent_id:'child',revision:1},
  {id:'other',title:'Other action',notes:'',status:'active',parent_id:null,revision:1},
 ]};
 const calls=[],reviews=[],messages=[];let sequence=0;
 const controller=createUiController({call:async(name,args)=>{calls.push({name,args:structuredClone(args)});if(name==='preview_change')return {expectedRevision:snapshot.revision,kind:args.kind,payload:args.payload,affected:snapshot.actions.filter(action=>action.id==='root'||action.parent_id==='root'||action.parent_id==='child')};if(name==='apply_change'){const payload=args.payload,completion=args.kind==='complete'||(args.kind==='status'||args.kind==='edit')&&payload.status==='completed';if(completion)for(const action of snapshot.actions)if(action.id===payload.id||action.parent_id==='root'||action.parent_id==='child')action.status='completed';if(args.kind==='edit'&&payload.notes!==undefined)snapshot.actions.find(action=>action.id===payload.id).notes=payload.notes;snapshot.revision++;for(const action of snapshot.actions)action.revision=snapshot.revision;return {...structuredClone(snapshot),result:{operationId:args.operationId}};}if(name==='list_actions')return structuredClone(snapshot);throw new Error('Unexpected tool '+name);},ids:{next:()=>`completion-${++sequence}`},model:{...drafts,...operations,completionReview:createCompletionReviewModel(),autosave:createAutosaveModel()},view:{render(){},message:text=>messages.push(text),review:(preview,data,scope)=>reviews.push({preview,data,scope}),closeReview(){}}});
 controller.accept(structuredClone(snapshot));return {controller,snapshot,calls,reviews,messages};
}
const completionTick=async()=>{for(let index=0;index<120;index++)await Promise.resolve();};

test('all completion entry points disclose hidden descendants and require one deduplicated confirmation',async()=>{
 for(const [kind,payload] of [['complete',{id:'root'}],['status',{id:'root',status:'completed'}],['edit',{id:'root',status:'completed'}]]){
  const f=completionFixture();f.controller.direct(kind,payload);await completionTick();
  assert.deepEqual(f.reviews.at(-1).scope.descendants.map(row=>row.id),['child','grandchild']);
  assert.equal(f.calls.filter(call=>call.name==='apply_change').length,0);
  f.controller.direct(kind,payload);await completionTick();
  assert.equal(f.calls.filter(call=>call.name==='preview_change').length,1,'duplicate click does not issue a second preview');
  assert.equal(f.calls.filter(call=>call.name==='apply_change').length,0,'a duplicate click cannot bypass confirmation');
  await f.controller.confirm();await completionTick();
  assert.equal(f.calls.filter(call=>call.name==='apply_change').length,1);
  assert.equal(f.snapshot.actions.find(row=>row.id==='grandchild').status,'completed');
 }
});

test('direct completion serializes a same-action editor proposal once before confirmation',async()=>{
 const f=completionFixture();f.controller.selectAction('root');f.controller.editDraft('root',{notes:'Updated root context'});f.controller.direct('complete',{id:'root'});await completionTick();
 const sequence=f.calls.filter(call=>call.name==='preview_change'||call.name==='apply_change').map(call=>call.name==='apply_change'?'apply:'+call.args.kind:'preview:'+call.args.kind);
 assert.deepEqual(sequence,['preview:edit','apply:edit','preview:complete']);assert.equal(f.snapshot.actions.find(row=>row.id==='root').notes,'Updated root context');assert.equal(f.snapshot.actions.find(row=>row.id==='root').status,'active');assert.equal(f.calls.filter(call=>call.name==='apply_change'&&call.args.kind==='complete').length,0);assert.deepEqual(f.reviews.at(-1).scope.descendants.map(row=>row.id),['child','grandchild']);
 await f.controller.confirm();await completionTick();assert.equal(f.snapshot.actions.find(row=>row.id==='root').status,'completed');assert.equal(f.calls.filter(call=>call.name==='apply_change'&&call.args.kind==='edit').length,1);
});

test('direct completion serializes the different selected editor action before the target cascade',async()=>{
 const f=completionFixture();f.controller.selectAction('other');f.controller.editDraft('other',{notes:'Updated sibling context'});f.controller.direct('complete',{id:'root'});await completionTick();
 const sequence=f.calls.filter(call=>call.name==='preview_change'||call.name==='apply_change').map(call=>call.name==='apply_change'?'apply:'+call.args.kind:'preview:'+call.args.kind);
 assert.deepEqual(sequence,['preview:edit','apply:edit','preview:complete']);assert.equal(f.snapshot.actions.find(row=>row.id==='other').notes,'Updated sibling context');assert.equal(f.snapshot.actions.find(row=>row.id==='root').status,'active');assert.equal(f.calls.filter(call=>call.name==='apply_change'&&call.args.kind==='complete').length,0);assert.deepEqual(f.reviews.at(-1).scope.descendants.map(row=>row.id),['child','grandchild']);
 await f.controller.confirm();await completionTick();assert.equal(f.snapshot.actions.find(row=>row.id==='root').status,'completed');assert.equal(f.calls.filter(call=>call.name==='apply_change'&&call.args.kind==='edit').length,1);
});

test('completed status autosave uses the same disclosure seam and retains newer notes while confirmed status is saved',async()=>{
 const f=completionFixture();f.controller.editDraft('root',{status:'completed'});f.controller.flush('root');await completionTick();
 assert.equal(f.reviews.at(-1).preview.kind,'status');assert.deepEqual(f.reviews.at(-1).scope.descendants.map(row=>row.id),['child','grandchild']);
 f.controller.editDraft('root',{notes:'newer unsaved correction'});
 await f.controller.confirm();await completionTick();
 const writes=f.calls.filter(call=>call.name==='apply_change');assert.equal(writes.length,2);
 assert.equal(writes[0].args.kind,'status');assert.equal(writes[0].args.payload.status,'completed');
 assert.equal(writes[1].args.kind,'edit');assert.equal(writes[1].args.payload.notes,'newer unsaved correction');
 assert.equal(f.controller.state.data.actions.find(row=>row.id==='root').status,'completed');
 assert.equal(f.controller.state.data.actions.find(row=>row.id==='root').notes,'newer unsaved correction');
});

test('revision or descendant scope changes invalidate an open confirmation and preview the new full scope',async()=>{
 const f=completionFixture();f.controller.direct('complete',{id:'root'});await completionTick();
 const firstRevision=f.reviews.at(-1).scope.expectedRevision;
 f.snapshot.revision++;f.snapshot.actions.push({id:'late-child',title:'Added while dialog was open',notes:'',status:'active',parent_id:'root',revision:f.snapshot.revision});
 f.controller.accept(structuredClone(f.snapshot));await f.controller.confirm();await completionTick();
 assert.equal(firstRevision,1);assert.equal(f.calls.filter(call=>call.name==='apply_change').length,0);
 assert.equal(f.reviews.length,2);assert.equal(f.reviews.at(-1).scope.expectedRevision,2);
 assert.deepEqual(f.reviews.at(-1).scope.descendants.map(row=>row.id),['child','late-child','grandchild']);
 await f.controller.confirm();await completionTick();assert.equal(f.calls.filter(call=>call.name==='apply_change').length,1);
 assert.equal(f.calls.find(call=>call.name==='apply_change').args.expectedRevision,2);
});

test('same-revision descendant changes refresh a saved completion review before writing',async()=>{
 const f=completionFixture();await f.controller.preview('complete',{id:'root'});assert.deepEqual(f.reviews.at(-1).scope.descendants.map(row=>row.id),['child','grandchild']);
 f.snapshot.actions.push({id:'same-revision-child',title:'Added without a revision marker',notes:'',status:'active',parent_id:'root',revision:1});f.controller.accept(structuredClone(f.snapshot));await f.controller.confirm();await completionTick();
 assert.equal(f.calls.filter(call=>call.name==='preview_change').length,2);assert.equal(f.calls.filter(call=>call.name==='apply_change').length,0);assert.deepEqual(f.reviews.at(-1).scope.descendants.map(row=>row.id),['child','same-revision-child','grandchild']);
 await f.controller.confirm();await completionTick();assert.equal(f.calls.filter(call=>call.name==='apply_change').length,1);
});

test('canceling completion keeps the operation uncommitted and a later explicit click can request it again',async()=>{
 const f=completionFixture();f.controller.direct('complete',{id:'root'});await completionTick();f.controller.cancelReview();await completionTick();
 assert.equal(f.calls.filter(call=>call.name==='apply_change').length,0);assert.equal(f.controller.state.busy,false);
 f.controller.direct('complete',{id:'root'});await completionTick();assert.equal(f.reviews.length,2);await f.controller.confirm();await completionTick();
 assert.equal(f.calls.filter(call=>call.name==='apply_change').length,1);
});
test('UI application preserves exact unknown request and callback executes only after confirmed retry',async()=>{
 const calls=[];let lost=true,success=0;const f=fixture(async(name,args)=>{calls.push({name,args:structuredClone(args)});if(lost)throw Object.assign(new Error('lost'),{code:'outcome_unknown'});return {...f.snapshot,result:{operationId:args.request_id}}});
 await f.controller.add(' new action ',()=>success++);assert.equal(success,0);assert.equal(f.controller.state.unknown.args.request_id,'id-1');lost=false;await f.controller.retry();assert.deepEqual(calls[1],calls[0]);assert.equal(success,1);assert.equal(f.controller.state.unknown,null);
});
test('UI application receipt confirmation clears retained write and refreshes without overwriting dirty draft',async()=>{
 let success=0;const f=fixture(async(name)=>{if(name==='add_action')throw Object.assign(new Error('lost'),{code:'outcome_unknown'});if(name==='operation_status')return {status:'applied',result:{operationId:'id-1'}};return {revision:2,projects:[],tags:[],perspectives:[],actions:[{id:'a',title:'new saved',notes:'',revision:2}]}});
 f.controller.editDraft('a',{title:'unsaved'});await f.controller.add('new',()=>success++);await f.controller.check();assert.equal(success,1);assert.equal(f.controller.state.unknown,null);assert.equal(f.controller.state.drafts.a.title,'unsaved');assert.equal(f.controller.state.data.revision,2);
});
test('UI application conflict keeps proposal and discard reconstructs latest saved action',async()=>{
 const f=fixture(async(name,args)=>{if(name==='preview_change')return {expectedRevision:2,kind:args.kind,payload:args.payload};throw Object.assign(new Error('conflict'),{code:'revision_conflict'})});
 f.controller.editDraft('a',{title:'proposal'});f.controller.accept({revision:2,projects:[],tags:[],perspectives:[],actions:[{id:'a',title:'latest',notes:'',revision:2}]});await f.controller.preview('edit',{id:'a',title:'proposal'},'a');await f.controller.confirm();assert.equal(f.controller.state.drafts.a.title,'proposal');assert.equal(f.controller.state.unknown,null);await f.controller.discardDraft('a');assert.equal(f.controller.state.drafts.a.title,'latest');assert.equal(f.controller.state.drafts.a.dirty,false);
});
test('UI application retains exact write after structurally malformed snapshot response',async()=>{
 const requests=[];let malformed=true;const f=fixture(async(name,args)=>{requests.push(structuredClone(args));return malformed?{}:{...f.snapshot,result:{operationId:args.request_id}}});
 await f.controller.add('retain me');assert.equal(f.controller.state.unknown.args.request_id,'id-1');malformed=false;await f.controller.retry();assert.deepEqual(requests[0],requests[1]);assert.equal(f.controller.state.unknown,null);
});
test('UI application rejects snapshot without matching receipt operation identity',async()=>{
 for(const result of [undefined,{operationId:'different'}]){const f=fixture(async()=>({...f.snapshot,result}));await f.controller.add('uncertain');assert.equal(f.controller.state.unknown.args.request_id,'id-1');}
});
test('UI application retains newer proposals but rejects fresh writes while unknown',async()=>{
 const requests=[];const f=fixture(async(name,args)=>{requests.push({name,args});throw Object.assign(new Error('lost'),{code:'outcome_unknown'})});
 await f.controller.add('first');f.controller.editDraft('a',{title:'newer proposal'});assert.equal(f.controller.state.drafts.a.title,'newer proposal');const retained=f.controller.state.unknown;await f.controller.add('second');await f.controller.undo();assert.equal(requests.length,1);assert.equal(f.controller.state.unknown,retained);await f.controller.retry();assert.equal(requests.length,2);assert.deepEqual(requests[1].args,requests[0].args);
});

test('receipt check retains unknown request for absent, wrong, or malformed receipt identity',async()=>{
 for(const receipt of [null,{}, {status:'applied'}, {status:'applied',result:{operationId:'other'}}, {status:'unexpected'}]){
  let success=0;const requests=[];const f=fixture(async(name,args)=>{requests.push({name,args:structuredClone(args)});if(name==='operation_status')return receipt;throw Object.assign(new Error('lost'),{code:'outcome_unknown'})});
  await f.controller.add('uncertain',()=>success++);const retained=f.controller.state.unknown;await f.controller.check();assert.equal(success,0);assert.equal(f.controller.state.unknown,retained);assert.match(f.messages.at(-1),/request are retained/);await f.controller.retry();assert.deepEqual(requests.at(-1),requests[0]);
 }
});
test('invalid read snapshot preserves previous state and never reports latest state fetched',async()=>{
 for(const snapshot of [null,{}, {actions:[],revision:'bad'}]){
  const f=fixture(async()=>snapshot);const before=f.controller.state.data;await f.controller.action(f.controller.refresh);assert.equal(f.controller.state.data,before);assert.match(f.messages.at(-1),/Could not load the latest state/);assert.equal(f.messages.some(text=>text.includes('Up to date')),false);
 }
});

test('group acknowledgment retains other proposals, merges latest untouched fields and clears stale review',async()=>{
 const f=fixture(async(name,args)=>name==='preview_change'?{expectedRevision:1,kind:args.kind,payload:args.payload}:{revision:2,projects:[],tags:[],perspectives:[],actions:[{id:'a',title:'saved proposal',notes:'latest notes',revision:2}],result:{operationId:args.operationId}});
 f.controller.selectAction('a');f.controller.editDraft('a',{title:'saved proposal',status:'on-hold',deferDate:'2026-'});await f.controller.previewDraft('a','edit');await f.controller.confirm();
 assert.equal(f.controller.state.reviewed,null);assert.deepEqual(f.controller.state.drafts.a.patch,{status:'on-hold',deferDate:'2026-'});assert.equal(f.controller.state.drafts.a.notes,'latest notes');assert.equal(f.controller.state.selectedId,'a');assert.equal(f.controller.state.drafts.a.dirtyGroups.edit,false);
 await f.controller.confirm();assert.equal(f.controller.state.unknown,null);
});
test('canceled review cannot write; absent selected proposal remains accessible but cannot preview',async()=>{
 const calls=[];const f=fixture(async(name,args)=>{calls.push(name);return {expectedRevision:1,kind:args.kind,payload:args.payload}});
 f.controller.editDraft('a',{due_at:'2026-'});f.controller.selectAction('a');await f.controller.previewDraft('a','edit');f.controller.cancelReview();await f.controller.confirm();assert.deepEqual(calls,['preview_change']);
 f.controller.accept({revision:2,projects:[],tags:[],perspectives:[],actions:[]});assert.equal(f.controller.state.selectedId,'a');assert.equal(f.controller.state.drafts.a.due_at,'2026-');await assert.rejects(f.controller.previewDraft('a','edit'),/latest action state/);assert.equal(calls.length,1);
});
test('review captures immutable payload; unknown retry acknowledges its group without clearing other groups',async()=>{
 const calls=[];let lost=true;const f=fixture(async(name,args)=>{if(name==='preview_change')return {expectedRevision:1,kind:args.kind,payload:args.payload};calls.push(structuredClone(args));if(lost)throw Object.assign(new Error('lost'),{code:'outcome_unknown'});return {revision:2,projects:[],tags:[],perspectives:[],actions:[{id:'a',title:'saved',notes:'',status:'on-hold',revision:2}],result:{operationId:args.operationId}}});
 f.controller.editDraft('a',{title:'unsaved',status:'on-hold',deferUntil:'partial'});const payload={id:'a',status:'on-hold'};await f.controller.preview('status',payload,'a');payload.status='completed';await f.controller.confirm();assert.equal(f.controller.state.reviewed,null);assert.equal(calls[0].payload.status,'on-hold');lost=false;await f.controller.retry();assert.deepEqual(calls[1],calls[0]);assert.deepEqual(f.controller.state.drafts.a.patch,{title:'unsaved',deferUntil:'partial'});
});
test('normalized date preview acknowledges submitted raw date/timezone and preserves alternate instant draft',async()=>{
 const f=fixture(async(name,args)=>name==='preview_change'?{expectedRevision:1,kind:'defer',payload:{id:'a',until:'2026-10-04T00:00:00Z'}}:{revision:2,projects:[],tags:[],perspectives:[],actions:[{id:'a',title:'saved',notes:'',revision:2,defer_until:'2026-10-04T00:00:00Z'}],result:{operationId:args.operationId}});
 f.controller.editDraft('a',{deferDate:'2026-10-04',timezone:'Asia/Tokyo',deferUntil:'2026-10-'});await f.controller.previewDraft('a','defer','date');await f.controller.confirm();assert.deepEqual(f.controller.state.drafts.a.patch,{deferUntil:'2026-10-'});
});
test('current controller composition acknowledges only captured group and preserves dirty groups',async()=>{
 let controller;controller=createUiController({call:async(name,args)=>name==='preview_change'?{expectedRevision:1,kind:args.kind,payload:args.payload}:{revision:2,projects:[],tags:[],perspectives:[],actions:[{id:'a',title:'new',notes:'',revision:2}],result:{operationId:args.operationId}},ids:{next:()=> 'current'},model:{...drafts,...operations,completionReview:createCompletionReviewModel(),autosave:createAutosaveModel()},view:{render:()=>{},message:()=>{},review:()=>{},closeReview:()=>{}}});
 controller.accept({revision:1,projects:[],tags:[],perspectives:[],actions:[{id:'a',title:'old',notes:'',revision:1}]});controller.editDraft('a',{title:'new',status:'on-hold'});await controller.previewDraft('a','edit');await controller.confirm();assert.deepEqual(controller.state.drafts.a.patch,{status:'on-hold'});assert.deepEqual(controller.state.drafts.a.dirtyGroups,{edit:false,defer:false,status:true});
});
test('direct flag write cannot acknowledge a differing retained editor proposal',async()=>{
 const f=fixture(async(name,args)=>name==='preview_change'?{expectedRevision:1,kind:args.kind,payload:args.payload}:{revision:2,projects:[],tags:[],perspectives:[],actions:[{id:'a',title:'saved',notes:'',flagged:true,revision:2}],result:{operationId:args.operationId}});
 f.controller.editDraft('a',{flagged:false,title:'retained title'});await f.controller.preview('edit',{id:'a',flagged:true},'a');await f.controller.confirm();assert.deepEqual(f.controller.state.drafts.a.patch,{flagged:false,title:'retained title'});assert.equal(f.controller.state.drafts.a.flagged,false);assert.equal(f.controller.state.data.actions[0].flagged,true);
});

test('empty creation retains frozen context and all proposals, validates receipt identity before clearing unknown',async()=>{
 const id='f25a36bb-3eef-4c21-b3ee-0cc45cb596ab',calls=[];let proof=false,lost=true;const f=fixture(async(name,args)=>{calls.push({name,args:structuredClone(args)});if(name==='operation_status')return {status:'applied',result:{operationId:'id-1',...(proof?{resolved:{actions:[{id}]}}:{})}};if(name==='list_actions')return {...f.snapshot,revision:2,actions:[...f.snapshot.actions,{id,title:'Create',notes:'',revision:2}]};if(lost)throw Object.assign(new Error('lost'),{code:'outcome_unknown'});return {...f.snapshot,revision:2,actions:[...f.snapshot.actions,{id,title:'Create',notes:'',revision:2}],result:{operationId:args.operationId,resolved:{actions:[{id}]}}};},creationModel);
 f.controller.editDraft('a',{title:'retained',notes:'  日本語  ',status:'on-hold',deferDate:'2026-10-10',timezone:'Asia/Tokyo',deferUntil:'2026-10-10T01:00:00Z',parent_id:null,order:8,flagged:true});const draft=structuredClone(f.controller.state.drafts.a);f.controller.composing('a',true);const payload={title:'',notes:'',tag_ids:['tag']};const local=f.controller.createEmpty(payload);f.controller.editDraft(local,{title:'Create'});f.controller.flush(local);await settleCreation();payload.tag_ids.push('different');const unknown=f.controller.state.unknown;f.controller.selectView('history');f.controller.selectAction(null);await f.controller.check();assert.equal(f.controller.state.unknown,unknown);assert.match(f.messages.at(-1),/Could not verify the created action/);lost=false;await f.controller.retry();assert.deepEqual(calls.filter(x=>x.name==='apply_change')[1],calls[0]);assert.equal(f.controller.state.selectedId,null);assert.equal(f.controller.state.createdActionId,id);assert.deepEqual(f.controller.state.drafts.a,draft);assert.equal(f.controller.state.view,'history');
});
test('applied creation receipt recovers the exact ID and refreshes before focus, missing created row remains unavailable',async()=>{
 const id='f25a36bb-3eef-4c21-b3ee-0cc45cb596ab';for(const available of [true,false]){const f=fixture(async(name)=>{if(name==='apply_change')throw Object.assign(new Error('lost'),{code:'outcome_unknown'});if(name==='operation_status')return {status:'applied',result:{operationId:'id-1',resolved:{actions:[{id}]}}};return {...f.snapshot,actions:available?[...f.snapshot.actions,{id,title:'Create',notes:'',revision:2}]:f.snapshot.actions};},creationModel);const local=f.controller.createEmpty({title:'',notes:''});f.controller.editDraft(local,{title:'Create'});f.controller.flush(local);await settleCreation();await f.controller.check();assert.equal(f.controller.state.unknown,null);assert.equal(f.controller.state.selectedId,available?id:null);assert.equal(f.controller.state.createdActionId,id);if(!available)assert.match(f.messages.at(-1),/no longer available/);}}
);
test('saving marks only actual writes and scoped failed creation is not erased by an unrelated edit',async()=>{let fail=true;const id='f25a36bb-3eef-4c21-b3ee-0cc45cb596ab',observed=[];const f=fixture(async(name,args)=>{observed.push([name,f.controller.state.saving]);if(name==='preview_change')return {expectedRevision:f.snapshot.revision,kind:args.kind,payload:args.payload};if(name==='apply_change'&&args.kind==='add'&&fail)throw Object.assign(Error('invalid creation'),{code:'validation'});if(name==='apply_change'){if(args.kind==='add')f.snapshot.actions.push({id,title:'Create',notes:'',revision:2});else Object.assign(f.snapshot.actions[0],args.payload);f.snapshot.revision++;return {...structuredClone(f.snapshot),result:{operationId:args.operationId,...(args.kind==='add'?{resolved:{actions:[{id}]}}:{})}};}return structuredClone(f.snapshot);},creationModel);await f.controller.refresh();assert.equal(observed.at(-1)[1],false);const local=f.controller.createEmpty({});f.controller.editDraft(local,{title:'Create'});f.controller.flush(local);await settleCreation();const error=structuredClone(f.controller.state.operationError);assert.match(error.message,/invalid creation/);assert.equal(f.controller.state.saving,false);f.controller.editDraft('a',{notes:'unrelated'});await f.controller.preview('edit',{id:'a',notes:'unrelated'},'a');assert.equal(observed.at(-1)[1],false);await f.controller.confirm();assert.deepEqual(f.controller.state.operationError,error);fail=false;f.controller.editDraft(local,{title:'Create again'});f.controller.flush(local);await settleCreation();assert.equal(f.controller.state.operationError,null);assert(observed.filter(([name])=>name==='apply_change').every(([,saving])=>saving));});
test('failed catalog creation survives unrelated autosave and refresh until its matching intent is canceled',async()=>{const tick=async()=>{for(let n=0;n<80;n++)await Promise.resolve();};const f=fixture(async(name,args)=>{if(name==='preview_change')return {expectedRevision:f.snapshot.revision,kind:args.kind,payload:args.payload};if(name==='apply_change'){if(args.kind==='project_get_or_create')throw Object.assign(Error('catalog failure'),{code:'validation'});Object.assign(f.snapshot.actions[0],args.payload);f.snapshot.revision++;return {...structuredClone(f.snapshot),result:{operationId:args.operationId}};}return structuredClone(f.snapshot);},{autosave:createAutosaveModel()});f.controller.createCatalog('project','Work');await tick();const error=structuredClone(f.controller.state.operationError);assert.match(error.message,/catalog failure/);f.controller.editDraft('a',{notes:'unrelated autosave'});f.controller.flush('a');await tick();assert.equal(f.snapshot.actions[0].notes,'unrelated autosave');assert.deepEqual(f.controller.state.operationError,error);await f.controller.refresh();assert.deepEqual(f.controller.state.operationError,error);f.controller.cancelCatalogCreation('tag');assert.deepEqual(f.controller.state.operationError,error);f.controller.cancelCatalogCreation('project');assert.equal(f.controller.state.operationError,null);});
test('catalog move preview failure is global attention before any write and survives unrelated correction',async()=>{const tick=async()=>{for(let n=0;n<80;n++)await Promise.resolve();};const calls=[];let reject=true;const f=fixture(async(name,args)=>{calls.push({name,args:structuredClone(args)});if(name==='preview_change'){if(args.kind==='project_move'&&reject)throw Object.assign(Error('Sibling name conflict'),{code:'validation'});return {expectedRevision:f.snapshot.revision,kind:args.kind,payload:args.payload};}if(name==='apply_change'){if(args.kind==='edit')Object.assign(f.snapshot.actions[0],args.payload);f.snapshot.revision++;return {...structuredClone(f.snapshot),result:{operationId:args.operationId}};}return structuredClone(f.snapshot);},{autosave:createAutosaveModel(),treeDrop:createTreeDropModel()});f.snapshot.projects=[{id:'p',name:'Work',parent_id:null,order:0}];f.controller.accept(structuredClone(f.snapshot));assert.equal(f.controller.moveCatalog('project',{id:'p',placement:'root'}),true);await tick();assert.equal(calls.filter(c=>c.name==='apply_change').length,0);assert.match(f.controller.state.operationError.message,/Sibling name conflict/);assert.equal(f.controller.state.saving,false);const error=structuredClone(f.controller.state.operationError);f.controller.editDraft('a',{notes:'unrelated'});f.controller.flush('a');await tick();assert.deepEqual(f.controller.state.operationError,error);reject=false;f.controller.moveCatalog('project',{id:'p',placement:'root'});await tick();assert.equal(f.controller.state.operationError,null);});
test('typed catalog receipt followed by a removed record is confirmed unavailable without selecting or duplicating',async()=>{const id='63620a50-eaa0-4e5c-8022-a8e84940a6b2';for(const mode of ['response','check']){const calls=[],f=fixture(async(name,args)=>{calls.push({name,args});if(name==='apply_change'&&mode==='check')throw Object.assign(Error('lost'),{code:'outcome_unknown'});const result={operationId:'id-1',resolved:{project:{id,created:true}}};if(name==='operation_status')return {status:'applied',result};if(name==='list_actions')return {...f.snapshot,revision:3,projects:[],tags:[]};return {...f.snapshot,revision:3,projects:[],tags:[],result};},creationModel);const local=f.controller.createEmptyCatalog('project',null,9);f.controller.editCatalog('project:'+local,{name:'Create'});f.controller.flushCatalog('project:'+local);for(let n=0;n<50;n++)await Promise.resolve();if(mode==='check')await f.controller.check();assert.equal(f.controller.state.unknown,null);assert.deepEqual(f.controller.state.catalogCreated,{type:'project',id,sequence:1,token:9,available:false});assert.equal(f.controller.state.inspector,null);assert.equal(calls.filter(c=>c.name==='apply_change').length,1);assert.match(f.messages.join(' '),/no longer available/);}});

test('partial write response retains exact unknown request and never acknowledges proposals',async()=>{const f=fixture(async(name,args)=>name==='preview_change'?{expectedRevision:1,kind:args.kind,payload:args.payload}:{revision:2,actions:[{id:'a',title:'new',notes:'',revision:2}],result:{operationId:args.operationId}});f.controller.editDraft('a',{title:'new'});await f.controller.previewDraft('a','edit');await f.controller.confirm();assert.ok(f.controller.state.unknown);assert.equal(f.controller.state.data.revision,1);assert.equal(f.controller.state.drafts.a.patch.title,'new');assert.equal(f.controller.state.unknown.args.kind,'edit');});

test('application state is deep read-only and cloneable at the adapter boundary while typed interaction events own mutations',()=>{const f=fixture(async()=>structuredClone(f.snapshot));assert.throws(()=>{f.controller.state.selectedId='outside';},/read-only/);assert.throws(()=>{f.controller.state.data.actions[0].title='outside';},/read only|read-only|not extensible/);assert.throws(()=>{f.controller.state.drafts.a.patch.title='outside';},/read only|read-only|not extensible/);assert.deepEqual(structuredClone(f.controller.state.data.actions[0]),f.snapshot.actions[0]);assert.deepEqual(structuredClone(f.controller.state.drafts.a),f.controller.state.drafts.a);f.controller.dispatch({type:'selection.action',id:'a'});assert.equal(f.controller.state.selectedId,'a');f.controller.dispatch({type:'field.invalid',id:'a',field:'due_at',message:'Choose a valid date.'});assert.deepEqual(f.controller.state.fieldIssues.a,{field:'due_at',message:'Choose a valid date.'});f.controller.editDraft('a',{title:'corrected'});assert.equal(f.controller.state.fieldIssues.a,undefined);});

test('immutable published state shares unchanged drafts and stays current without a timer port',()=>{const renders=[],snapshot={revision:1,projects:[],tags:[],perspectives:[],actions:[{id:'a',title:'one',notes:'',revision:1},{id:'b',title:'two',notes:'',revision:1}]},controller=createUiController({call:async()=>structuredClone(snapshot),ids:{next:()=> 'operation'},model:{...drafts,...operations,completionReview:createCompletionReviewModel(),autosave:createAutosaveModel()},view:{render:state=>renders.push(state),message(){},review(){},closeReview(){}}});controller.accept(snapshot);const previous=controller.state.drafts.b,firstA=controller.state.drafts.a;controller.editDraft('a',{title:'changed'});assert.equal(renders.at(-1).drafts.a.title,'changed');assert.equal(controller.state.drafts.a.title,'changed');assert.notEqual(controller.state.drafts.a,firstA);assert.equal(controller.state.drafts.b,previous);assert.deepEqual(structuredClone(controller.state.drafts.a),controller.state.drafts.a);assert.throws(()=>{controller.state.drafts.a.tag_ids.push('outside');},/read only|read-only|Cannot add property/);});

test('typed interaction events retain occurrence identity and immutable composition ownership across snapshot refresh',()=>{
 const f=fixture(async()=>{}),c=f.controller,entries=[{key:'tag:one:action:a',id:'a',kind:'action'},{key:'tag:two:action:a',id:'a',kind:'action'}];
 c.dispatch({type:'occurrence.range',key:entries[0].key,range:false,entries});c.dispatch({type:'occurrence.range',key:entries[1].key,range:true,entries});c.dispatch({type:'composition.begin',key:'a',field:'notes'});c.composing('a',true);c.editDraft('a',{notes:'途中'});c.dispatch({type:'composition.defer',intent:{kind:'select-action',id:'b'}});
 const before=c.state.interaction;c.accept({...f.snapshot,revision:2,actions:[{...f.snapshot.actions[0],notes:'external correction'}]});
 assert.deepEqual(c.state.interaction,before);assert.deepEqual(c.state.interaction.selection.ids,['a']);assert.equal(c.state.interaction.selection.keys.length,2);assert.equal(c.state.drafts.a.notes,'途中');assert.deepEqual(c.state.conflicts.a,['notes']);assert.throws(()=>c.state.interaction.selection.keys.push('bad'),TypeError);assert.throws(()=>{c.state.interaction.composition.key='b';},TypeError);
 c.dispatch({type:'composition.end'});c.editDraft('a',{notes:'完成'});c.composing('a',false);assert.equal(c.state.drafts.a.notes,'完成');assert.deepEqual(c.state.conflicts.a,['notes']);
});

test('gesture context and hover update only interaction state without rendering or copying full snapshots and view drafts',async()=>{
 const {createMovementModel}=await import('../../lib/ui/model/movement.ts'),movement=createMovementModel(),tree=createTreeDropModel();let renders=0;const metrics=[];
 const c=createUiController({call:async()=>{},ids:{next:()=>''},model:{...drafts,...operations,completionReview:createCompletionReviewModel(),autosave:createAutosaveModel(),movement,treeDrop:tree},interactionMetric:name=>metrics.push(name),view:{render:()=>renders++,message(){},review(){},closeReview(){}}});
 const actions=Array.from({length:1000},(_,i)=>({id:'a'+i,title:'Action '+i,notes:'',order:i,parent_id:null,status:'active',revision:1}));c.accept({revision:1,actions,projects:[],tags:[],perspectives:[]});
 c.dispatch({type:'date.error',id:'a5',field:'deferUntil',message:'Unfinished date'});c.dispatch({type:'view.set',field:'projectQuery',value:'unfinished picker'});c.dispatch({type:'catalog.submission',token:1,submission:{type:'tag',target:'a5',name:'exact input',contextToken:null,navigation:'{}'}});
 const index=movement.index(actions),context={actions,projects:[],tags:[],index,projectIndex:tree.index([]),tagIndex:tree.index([])};renders=0;c.dispatch({type:'gesture.context',context});c.dispatch({type:'gesture.begin',kind:'action',keys:['a0'],ids:['a0']});c.dispatch({type:'gesture.activate'});
 const data=c.state.data,draftState=c.state.drafts,view=c.state.interaction.view,selection=c.state.interaction.selection;c.dispatch({type:'gesture.target',target:{kind:'action',key:'a8',anchor:'a8',placement:'inside'}});const afterFirst=metrics.length;
 for(let n=0;n<20;n++)c.dispatch({type:'gesture.target',target:{kind:'action',key:'a8',anchor:'a8',placement:'inside'}});
 assert.equal(renders,0);assert.equal(metrics.length,afterFirst);assert.equal(c.state.data,data);assert.equal(c.state.drafts,draftState);assert.equal(c.state.interaction.view,view);assert.equal(c.state.interaction.selection,selection);assert.equal(c.state.interaction.view.dateErrors.a5.deferUntil,'Unfinished date');assert.equal(c.state.interaction.view.catalogSubmissions[1].name,'exact input');assert.throws(()=>{c.state.interaction.gesture.ids.push('bad');},TypeError);
});

test('pointer publication shares every unchanged field with large retained catalog proposals and errors, while later edits publish fresh values',async()=>{
 const {createMovementModel}=await import('../../lib/ui/model/movement.ts'),movement=createMovementModel(),tree=createTreeDropModel(),c=createUiController({call:async()=>{},ids:{next:()=>''},model:{...drafts,...operations,completionReview:createCompletionReviewModel(),...creationModel,movement,treeDrop:tree},view:{render(){},message(){},review(){},closeReview(){}}});
 const actions=Array.from({length:1000},(_,i)=>({id:'a'+i,title:'Action '+i,notes:'',order:i,parent_id:null,status:'active',revision:1})),projects=actions.map((_,i)=>({id:'p'+i,name:'Project '+i,parent_id:null,order:i}));
 c.accept({revision:1,actions,projects,tags:[],perspectives:[]});
 for(let i=0;i<1000;i++){c.editDraft('a'+i,{notes:'retained '+i});c.editCatalog('project:p'+i,{name:'proposal '+i});c.dispatch({type:'date.error',id:'a'+i,field:'dueDate',message:'Incomplete'});}
 c.accept({revision:2,actions:actions.slice(0,1),projects:[],tags:[],perspectives:[]});
 assert.equal(Object.keys(c.state.catalogDrafts).length,1000);assert.equal(Object.keys(c.state.catalogErrors).length,1000);assert.equal(Object.keys(c.state.saveErrors).length,999);
 const context={actions,projects,tags:[],index:movement.index(actions),projectIndex:tree.index(projects),tagIndex:tree.index([])};c.dispatch({type:'gesture.context',context});c.dispatch({type:'gesture.begin',kind:'action',keys:['a0'],ids:['a0']});c.dispatch({type:'gesture.activate'});const before={...c.state};
 for(let i=1;i<20;i++)c.dispatch({type:'gesture.target',target:{kind:'action',key:'a'+i,anchor:'a'+i,placement:'inside'}});
 for(const key of Object.keys(before))if(key!=='interaction')assert.equal(c.state[key],before[key],key+' must retain its published reference');
 assert.equal(c.state.interaction.view,before.interaction.view);c.editCatalog('project:p0',{name:'new correction'});assert.equal(c.state.catalogErrors['project:p0'],undefined);assert.equal(before.catalogErrors['project:p0'],'This project is no longer available. Your edits are retained.');assert.equal(c.state.catalogDrafts['project:p0'].name,'new correction');assert.equal(before.catalogDrafts['project:p0'].name,'proposal 0');
});
