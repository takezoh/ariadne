import {test} from 'node:test';
import assert from 'node:assert/strict';
import {actionCallForOwner as actionCall} from '../helpers/owner-composition.mjs';
import {memoryActionStore} from '../helpers/memory-action-store.mjs';
const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const clock=()=> '2026-10-03T01:02:03.000Z';
function ports(store,values=[]){let i=0;return {store,clock,newId:()=>values[i++]??crypto.randomUUID(),idsUsed:()=>i};}

test('action IDs are generated separately from operation IDs and preview does not commit',async()=>{
 const store=memoryActionStore();let commits=0;const commit=store.commit;store.commit=r=>{commits++;return commit(r);};
 const p=ports(store,[uuid(2),uuid(3)]),operationId=uuid(1);
 const saved=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId,expectedRevision:0,kind:'add',payload:{title:'action'}});
 const actionId=saved.result.resolved.actions[0].id;
 assert.notEqual(actionId,operationId);assert.equal(saved.actions[0].id,actionId);assert.equal(commits,1);assert.equal((await store.readSnapshot('A')).actions[0].created_at,clock());
 assert.equal('catalog_identity_ledger' in saved,false);
 const before=await store.readSnapshot('A');await actionCall(p,'A','preview_change',{expectedRevision:1,kind:'edit',payload:{id:actionId,title:'draft'}});assert.deepEqual(await store.readSnapshot('A'),before);assert.equal(commits,1);
});

test('new entity IDs cannot be supplied by callers and validation precedes generation',async()=>{
 const store=memoryActionStore(),p=ports(store,[uuid(2)]);
 await assert.rejects(actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(1),expectedRevision:0,kind:'add',payload:{id:uuid(9),title:'action'}}),e=>e.code==='invalid_input');
 assert.equal(p.idsUsed(),0);assert.equal((await store.readSnapshot('A')).revision,0);
});

test('project get-or-create returns server IDs and matches trimmed case-sensitive natural keys',async()=>{
 const store=memoryActionStore(),p=ports(store,[uuid(2),uuid(3),uuid(4),uuid(5),uuid(6)]);
 const first=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(1),expectedRevision:0,kind:'project_get_or_create',payload:{name:'  Project  '}});
 assert.deepEqual(first.result.resolved.project,{id:uuid(2),created:true});
 const same=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(7),expectedRevision:1,kind:'project_get_or_create',payload:{name:'Project',parent_id:null}});
 assert.deepEqual(same.result.resolved.project,{id:uuid(2),created:false});
 assert.equal(same.projects.length,1);
 const caseDifferent=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(8),expectedRevision:2,kind:'project_get_or_create',payload:{name:'project'}});
 assert.equal(caseDifferent.result.resolved.project.created,true);
 await assert.rejects(actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(9),expectedRevision:3,kind:'project_add',payload:{id:uuid(10),name:'legacy'}}),e=>e.code==='invalid_input');
 const status=await actionCall(p,'A','operation_status',{operationId:uuid(1)});assert.deepEqual(status.result.resolved.project,{id:uuid(2),created:true});
});

test('generated UUID collision retries without reusing an active entity ID',async()=>{
 const store=memoryActionStore(),p=ports(store,[uuid(2),uuid(2),uuid(3)]);
 const first=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(1),expectedRevision:0,kind:'add',payload:{title:'first'}});
 const second=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(4),expectedRevision:1,kind:'add',payload:{title:'second'}});
 assert.equal(first.result.resolved.actions[0].id,uuid(2));assert.equal(second.result.resolved.actions[0].id,uuid(3));assert.equal(p.idsUsed(),3);
});

test('structure_create resolves unique local refs and preview IDs remain provisional',async()=>{
 const store=memoryActionStore(),p=ports(store,[uuid(2),uuid(3),uuid(4),uuid(5),uuid(6),uuid(7),uuid(8)]);
 const capture=await actionCall(p,'A','capture_intent',{schemaVersion:2,operationId:uuid(1),expectedRevision:0,title:'Original title',text:'Parent and child',source:'conversation'});
 const captureId=capture.result.resolved.actions[0].id;assert.notEqual(captureId,uuid(1));
 const payload={inbox_action_id:captureId,actions:[{ref:'parent',title:'Parent'},{ref:'child',title:'Child',parent_ref:'parent'}],dependencies:[]};
 await assert.rejects(actionCall(p,'A','preview_change',{expectedRevision:1,kind:'structure_create',payload}),e=>e.code==='invalid_input');
 const {dependencies:removed,...validPayload}=payload;assert.deepEqual(removed,[]);
 const preview=await actionCall(p,'A','preview_change',{expectedRevision:1,kind:'structure_create',payload:validPayload});
 assert.deepEqual(preview.payload,validPayload);assert.equal(preview.resolved.actions[0].id,captureId);assert.equal(preview.resolved.actions[0].preview_only,undefined);assert.equal(preview.resolved.actions[1].preview_only,true);assert.deepEqual(preview.resolved.actions.map(x=>x.ref),['parent','child']);
 assert.equal((await store.readSnapshot('A')).revision,1);
 const committed=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(9),expectedRevision:1,kind:'structure_create',payload:validPayload});
 const resolved=committed.result.resolved.actions;assert.deepEqual(resolved.map(x=>x.ref),['parent','child']);assert.equal(resolved[0].id,captureId);assert.notEqual(resolved[1].id,preview.resolved.actions[1].id);
 const parent=committed.actions.find(x=>x.id===resolved[0].id),child=committed.actions.find(x=>x.id===resolved[1].id);assert.equal(child.parent_id,parent.id);assert.equal(parent.notes,'Parent and child');assert.equal(parent.status,'active');assert.equal(committed.actions.length,2);
 const generatedBeforeReplay=p.idsUsed(),replay=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(9),expectedRevision:1,kind:'structure_create',payload:validPayload});assert.deepEqual(replay.result.resolved.actions,resolved);assert.equal(p.idsUsed(),generatedBeforeReplay);
 const nextCapture=await actionCall(p,'A','capture_intent',{schemaVersion:2,operationId:uuid(10),expectedRevision:2,title:'Another concern',text:'Another capture'});
 await assert.rejects(actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(12),expectedRevision:3,kind:'structure_create',payload:{inbox_action_id:nextCapture.result.resolved.actions[0].id,actions:[{id:uuid(13),ref:'same',title:'x'},{ref:'same',title:'y'}]}}),e=>e.code==='invalid_input');
});

test('query_actions reads the shared snapshot without writing and permits all actions',async()=>{
 const store=memoryActionStore(),p=ports(store);
 assert.deepEqual((await actionCall(p,'A','query_actions',{include_descendants:true})).actions,[]);
 await assert.rejects(actionCall(p,'A','query_actions',{project_id:uuid(10),extra:1}),e=>e.code==='invalid_input');
 const created=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(1),expectedRevision:0,kind:'project_get_or_create',payload:{name:'P'}});
 const result=await actionCall(p,'A','query_actions',{project_id:created.result.resolved.project.id,include_descendants:true});
 assert.equal(result.schemaVersion,2);assert.deepEqual(result.actions,[]);assert.equal((await store.readSnapshot('A')).revision,1);
});

test('missing identity and unknown arguments do not access storage',async()=>{
 const {requireOwner}=await import('../../lib/server/auth.ts');
 assert.throws(()=>requireOwner(new Headers()),e=>e.code==='unauthenticated');
 let reads=0;const p={store:{readSnapshot(){reads++;throw new Error('unexpected');}},clock,newId:()=>uuid(1)};
 await assert.rejects(actionCall(p,'A','list_actions',{owner:'B'}),e=>e.code==='invalid_input');assert.equal(reads,0);
});

test('client timezone resolves date preview to UTC without storing settings',async()=>{
 const store=memoryActionStore(),p=ports(store,[uuid(2)]);
 const created=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(1),expectedRevision:0,kind:'add',payload:{title:'action'}});
 const id=created.actions[0].id;
 await assert.rejects(actionCall(p,'A','preview_change',{expectedRevision:1,kind:'defer',payload:{id,date:'2026-10-04'}}),e=>e.code==='timezone_required');
 const preview=await actionCall(p,'A','preview_change',{expectedRevision:1,kind:'defer',payload:{id,date:'2026-10-04',timezone:'America/New_York'}});
 assert.deepEqual(preview.payload,{id,until:'2026-10-04T13:00:00.000Z'});
 const saved=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(3),expectedRevision:1,kind:preview.kind,payload:preview.payload});
 assert.equal(saved.actions[0].defer_until,preview.payload.until);
 for(const field of ['timezone','timezone_revision','catalog_revision'])assert.equal(field in await store.readSnapshot('A'),false);
 for(const field of ['initial_title','defer_zone'])assert.equal(field in saved.actions[0],false);
});

 test('capture_intent saves exact raw text as a normal Inbox action and replay preserves later changes',async()=>{
 const store=memoryActionStore(),p=ports(store,[uuid(2)]),raw='  ambiguous concern\nkeep spacing  ';
 const args={schemaVersion:2,operationId:uuid(1),expectedRevision:0,title:'User chosen title',text:raw};
 const saved=await actionCall(p,'A','capture_intent',args),action=saved.actions[0];
 assert.equal(action.title,'User chosen title');assert.equal(action.notes,raw);assert.equal(action.status,'active');assert.equal(action.project_id,null);assert.deepEqual(saved.list_scopes.inbox,[action.id]);assert.equal('captures' in saved,false);
 await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(3),expectedRevision:1,kind:'edit',payload:{id:action.id,title:'Clarified'}});
 const replay=await actionCall(p,'A','capture_intent',args);assert.equal(replay.actions[0].title,'Clarified');assert.equal(replay.revision,2);assert.equal(p.idsUsed(),1);
 await assert.rejects(actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(4),expectedRevision:2,kind:'add',payload:{title:'invalid',source_capture_id:action.id}}),e=>e.code==='invalid_input');
 await assert.rejects(actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(5),expectedRevision:2,kind:'wait',payload:{id:action.id,reason:'reply'}}),e=>e.code==='invalid_input');
 });

test('waiting updates obey revision CAS, preserve Defer and Undo restores active',async()=>{
 const store=memoryActionStore(),p=ports(store,[uuid(2)]);
 const initial=await actionCall(p,'A','capture_intent',{schemaVersion:2,operationId:uuid(1),expectedRevision:0,title:'Ask about delivery',text:'raw'}),id=initial.actions[0].id;
 const args={schemaVersion:2,operationId:uuid(3),expectedRevision:1,kind:'status',payload:{id,status:'on-hold'}};
 const waiting=await actionCall(p,'A','apply_change',args);assert.equal(waiting.actions[0].status,'on-hold');assert.deepEqual(waiting.list_scopes.waiting,[id]);
 await assert.rejects(actionCall(p,'A','apply_change',{...args,operationId:uuid(4)}),e=>e.code==='conflict');
 const restored=await actionCall(p,'A','undo_change',{schemaVersion:2,operationId:uuid(5),expectedRevision:2,undoOf:uuid(3)});assert.equal(restored.actions[0].status,'active');
 await assert.rejects(actionCall(p,'A','capture_intent',{schemaVersion:2,operationId:uuid(6),expectedRevision:3,text:'missing title'}),e=>e.code==='invalid_input');
 const structured=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(7),expectedRevision:3,kind:'status',payload:{id,status:'on-hold'}});
 const result=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(8),expectedRevision:structured.revision,kind:'structure_create',payload:{inbox_action_id:id,actions:[{ref:'existing',title:'Clarified'}]}});assert.equal(result.actions[0].status,'on-hold');assert.equal(result.actions[0].title,'Clarified');
});



test('generic queries combine status and independent defer filters and structure resolves later parent refs',async()=>{
 const store=memoryActionStore(),p=ports(store,[uuid(2),uuid(4)]);
 let saved=await actionCall(p,'A','capture_intent',{schemaVersion:2,operationId:uuid(1),expectedRevision:0,title:'first',text:'raw'});const id=saved.actions[0].id;
 saved=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(3),expectedRevision:1,kind:'edit',payload:{id,status:'dropped',defer_until:'2026-12-01T00:00:00Z'}});
 const query=await actionCall(p,'A','query_actions',{status:'dropped',is_deferred:true,project_id:null});assert.deepEqual(query.actions.map(t=>t.id),[id]);assert.equal(query.actions[0].is_deferred,true);
 assert.deepEqual((await actionCall(p,'A','query_actions',{status:'dropped',is_deferred:false})).actions,[]);
 saved=await actionCall(p,'A','apply_change',{schemaVersion:2,operationId:uuid(5),expectedRevision:2,kind:'structure_create',payload:{inbox_action_id:id,actions:[{ref:'child',title:'renamed',parent_ref:'later'},{ref:'later',title:'parent'}]}});
 const child=saved.actions.find(t=>t.id===id),parent=saved.actions.find(t=>t.id!==id);assert.equal(child.parent_id,parent.id);assert.equal(child.status,'dropped');
});

test('blank titles reject add, rename and structure without ID allocation or state changes',async()=>{
 const store=memoryActionStore(),p=ports(store);
 const first=await actionCall(p,'A','add_action',{schemaVersion:2,request_id:uuid(100),expected_revision:0,title:'Named'});const id=first.result.resolved.actions[0].id;assert.equal(first.actions[0].notes,'');
 const before=await store.readSnapshot('A'),used=p.idsUsed();
 const requests=[['add_action',{schemaVersion:2,request_id:uuid(101),expected_revision:1,title:''}],['rename_action',{schemaVersion:2,request_id:uuid(102),expected_revision:1,id,title:'  '}],['apply_change',{schemaVersion:2,operationId:uuid(103),expectedRevision:1,kind:'add',payload:{title:'',notes:'Notes alone'}}],['apply_change',{schemaVersion:2,operationId:uuid(104),expectedRevision:1,kind:'edit',payload:{id,title:''}}],['apply_change',{schemaVersion:2,operationId:uuid(105),expectedRevision:1,kind:'structure_create',payload:{inbox_action_id:id,actions:[{ref:'parent',title:'Valid'},{ref:'child',title:'',parent_ref:'parent'}]}}]];
 for(const [name,args] of requests){await assert.rejects(actionCall(p,'A',name,args),e=>e.code==='invalid_input');assert.equal(await store.readReceipt('A',args.request_id??args.operationId),null);}
 assert.equal(p.idsUsed(),used);assert.deepEqual(await store.readSnapshot('A'),before);
});

test('caller creates populated content and initial classification in one ordinary add request',async()=>{
 const store=memoryActionStore(),p=ports(store),write=(revision,kind,payload)=>actionCall(p,'A','apply_change',{schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:revision,kind,payload});
 const project=(await write(0,'project_get_or_create',{name:'Project'})).result.resolved.project.id;
 const tag=(await write(1,'tag_get_or_create',{name:'Tag'})).result.resolved.tag.id;
 let commits=0;const commit=store.commit;store.commit=request=>{commits++;return commit(request);};
 const result=await write(2,'add',{title:'  Read proposal  ',notes:'  Original\n日本語  ',project_id:project,tag_ids:[tag],flagged:true,order:12});
 assert.equal(commits,1);assert.equal(result.revision,3);assert.equal(result.actions.length,1);
 const action=result.actions[0];assert.equal(action.id,result.result.resolved.actions[0].id);assert.equal(action.title,'Read proposal');assert.equal(action.notes,'  Original\n日本語  ');assert.equal(action.project_id,project);assert.deepEqual(action.tags.map(x=>x.id),[tag]);assert.equal(action.flagged,true);assert.equal(action.order,12);
});
