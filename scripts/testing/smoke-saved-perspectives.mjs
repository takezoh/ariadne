import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';
import {assistanceInstructions} from '../../lib/domain/assistance.ts';

const settle=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
const uid=index=>'00000000-0000-4000-8000-'+String(index+1).padStart(12,'0');

function fixtureSnapshot(){
 const projects=[{id:uid(900),name:'Work',path:'Work',order:0,parent_id:null,description:'',revision:1,created_at:'2026-10-01T00:00:00.000Z',updated_at:'2026-10-01T00:00:00.000Z'}];
 const longNotes='Exact first line\nhttps://example.invalid/reference.\n<script>literal</script> '+('長い内容 '.repeat(9000));
 const actions=[
  {id:uid(0),title:'Parent action',notes:'Parent notes',status:'active',view:'normal',order:0,parent_id:null,project_id:projects[0].id,project_path:'Work',created_at:'2026-10-02T01:00:00.000Z',updated_at:'2026-10-02T02:00:00.000Z',due_at:null,defer_until:null,defer_reasons:[],is_deferred:false,flagged:false,revision:1,tags:[]},
  {id:uid(1),title:'Child action',notes:longNotes,status:'on-hold',view:'normal',order:0,parent_id:uid(0),project_id:null,project_path:null,created_at:'2026-10-02T02:00:00.000Z',updated_at:'2026-10-02T03:00:00.000Z',due_at:null,defer_until:null,defer_reasons:[],is_deferred:false,flagged:false,revision:1,tags:[]},
  {id:uid(2),title:'Hidden completed descendant',notes:'Hidden notes',status:'completed',view:'completed',order:0,parent_id:uid(1),project_id:null,project_path:null,created_at:'2026-10-03T00:00:00.000Z',updated_at:'2026-10-03T01:00:00.000Z',due_at:null,defer_until:null,defer_reasons:[],is_deferred:false,flagged:false,revision:1,tags:[]},
  {id:uid(3),title:'Second active action',notes:'Short notes',status:'active',view:'normal',order:1,parent_id:null,project_id:null,project_path:null,created_at:'2026-10-03T00:00:00.000Z',updated_at:'2026-10-03T01:00:00.000Z',due_at:null,defer_until:null,defer_reasons:[],is_deferred:false,flagged:false,revision:1,tags:[]},
 ];
 const filter={statuses:['active','on-hold','completed']};
 const perspectives=[
  {id:uid(910),name:'Tasklist',description:'',filter,definition_version:2,revision:1,created_at:'2026-10-01T00:00:00.000Z',updated_at:'2026-10-01T00:00:00.000Z',view:{type:'tasklist',sort:'title',direction:'asc',group:'status',completion_label:'read',show_notes:true}},
  {id:uid(911),name:'Thread',description:'',filter,definition_version:2,revision:1,created_at:'2026-10-01T00:00:00.000Z',updated_at:'2026-10-01T00:00:00.000Z',view:{type:'thread',sort:'updated_at',direction:'desc',group:'project',completion_label:'acknowledge',initial_body:'collapsed'}},
  {id:uid(912),name:'Timeline',description:'',filter,definition_version:2,revision:1,created_at:'2026-10-01T00:00:00.000Z',updated_at:'2026-10-01T00:00:00.000Z',view:{type:'timeline',timestamp:'created_at',direction:'desc',group:'day',completion_label:'complete',initial_body:'collapsed'}},
 ];
 return {schemaVersion:2,revision:1,projects,tags:[],perspectives,actions,retrieved_at:'2026-10-04T00:00:00.000Z',storage:'Sites D1',proof_stage:'structured todo MVP',assistance_policy:assistanceInstructions};
}
function listScopes(actions){return {flagged:actions.filter(action=>action.flagged&&action.view==='normal').map(action=>action.id),waiting:actions.filter(action=>action.status==='on-hold').map(action=>action.id),inbox:actions.filter(action=>(action.status==='active'||action.status==='on-hold')&&action.project_id===null).map(action=>action.id),normal:actions.filter(action=>action.view==='normal').map(action=>action.id),deferred:actions.filter(action=>action.view==='deferred').map(action=>action.id),completed:actions.filter(action=>action.view==='completed').map(action=>action.id),cancelled:actions.filter(action=>action.view==='cancelled').map(action=>action.id)};}

async function testResource(endpoint,uri){
 const response=await fetch(new URL('/mcp',endpoint),{signal:AbortSignal.timeout(10000),method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'saved-view-smoke','oai-authenticated-user-email':'saved-view@local.invalid'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'resources/read',params:{uri}})});
 assert.equal(response.status,200);const envelope=await response.json();assert(!envelope.error);const html=envelope.result.contents[0].text;
 const state=fixtureSnapshot(),requests=[],receipts=new Map(),timers=new Map(),errors=[];let timerId=0;
 const snapshot=(result=null)=>({...structuredClone(state),list_scopes:listScopes(state.actions),result});
 const descendantsOf=rootId=>{const ids=new Set([rootId]),pending=[rootId];while(pending.length){const parent=pending.pop();for(const action of state.actions)if(action.parent_id===parent&&!ids.has(action.id)){ids.add(action.id);pending.push(action.id);}}return ids;};
 const completionAffected=rootId=>{const ids=descendantsOf(rootId);return state.actions.filter(action=>ids.has(action.id)&&(action.id===rootId||action.status!=='completed')).map(action=>({...action,status:'completed',view:'completed',revision:action.revision+1,updated_at:'2026-10-04T00:00:00.000Z'}));};
 assert(state.actions.every(action=>Number.isInteger(action.revision)&&typeof action.created_at==='string'&&Number.isFinite(Date.parse(action.created_at))&&typeof action.updated_at==='string'&&Number.isFinite(Date.parse(action.updated_at))),'normal built-resource fixtures must use persisted Action fields and real timestamps');
 assert(state.projects.every(project=>Number.isInteger(project.revision)&&typeof project.created_at==='string'&&typeof project.updated_at==='string'),'normal built-resource fixtures must use persisted Project fields');
 assert(state.perspectives.every(perspective=>Number.isInteger(perspective.revision)&&typeof perspective.created_at==='string'&&typeof perspective.updated_at==='string'),'normal built-resource fixtures must use persisted Perspective fields');
 const dom=new JSDOM(html,{url:'https://saved-view.invalid',runScripts:'dangerously',virtualConsole:(()=>{const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));return vc;})(),beforeParse(window){
  const nativeSet=window.setTimeout.bind(window),nativeClear=window.clearTimeout.bind(window);
  window.setTimeout=(callback,ms,...args)=>{if(ms===500||ms===20000){const id=++timerId;timers.set(id,()=>callback(...args));return id;}return nativeSet(callback,ms,...args);};window.clearTimeout=id=>{timers.delete(id);nativeClear(id);};
  window.confirm=()=>true;window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  window.postMessage=message=>{if(message.id==null)return;let result={};
   if(message.method==='ui/initialize')result={hostContext:{locale:'en-US',timeZone:'America/Los_Angeles'}};
   else if(message.method==='tools/call'){
    const {name,arguments:args={}}=message.params;requests.push({name,args:structuredClone(args)});
    if(name==='list_actions')result={structuredContent:snapshot()};
    else if(name==='operation_status'){const receipt=receipts.get(args.operationId);result={structuredContent:receipt?{schemaVersion:2,status:'applied',result:receipt}:{schemaVersion:2,status:'not_observed',result:null}};}
    else if(name==='preview_change'){
     const completion=args.kind==='complete'||args.kind==='status'&&args.payload?.status==='completed'||args.kind==='edit'&&args.payload?.status==='completed';
     result={structuredContent:{schemaVersion:2,expectedRevision:state.revision,kind:args.kind,payload:args.payload,affected:completion?completionAffected(args.payload.id):state.actions.filter(action=>action.id===args.payload.id),affected_projects:[],affected_tags:[],affected_perspectives:[],warnings:[],evaluatedAt:'2026-10-04T00:00:00.000Z'}};
    }
    else if(name==='apply_change'){
     const saved=receipts.get(args.operationId);
     if(saved)result={structuredContent:snapshot(saved)};
     else{
      const payload=args.payload||{},root=state.actions.find(action=>action.id===payload.id);let changedIds;
      if(args.kind==='complete'||args.kind==='status'&&payload.status==='completed'||args.kind==='edit'&&payload.status==='completed'){
       const ids=descendantsOf(payload.id);changedIds=state.actions.filter(action=>ids.has(action.id)&&(action.id===payload.id||action.status!=='completed')).map(action=>action.id);
       for(const action of state.actions)if(changedIds.includes(action.id)){action.status='completed';action.view='completed';action.revision++;action.updated_at='2026-10-04T00:00:00.000Z';}
      }else if(args.kind==='edit'){Object.assign(root,payload);root.revision++;root.updated_at='2026-10-04T00:00:00.000Z';changedIds=[root.id];}
      else assert.fail('Unexpected saved-view smoke write '+args.kind);
      state.revision++;const receipt={operationId:args.operationId,revision:state.revision,changedIds};receipts.set(args.operationId,receipt);result={structuredContent:snapshot(receipt)};
     }
    }else assert.fail('Unexpected saved-view smoke request '+name);
   }
   queueMicrotask(()=>window.dispatchEvent(new window.MessageEvent('message',{source:window,data:{jsonrpc:'2.0',id:message.id,result}})));
  };
 }});
 try{
  await settle();const document=dom.window.document,window=dom.window;
  const selectPerspective=id=>document.querySelector('[data-focus-key="perspective:'+uid(id)+'"]')?.click();
  for(const [id,type,label] of [[910,'tasklist','Mark read'],[911,'thread','Acknowledge'],[912,'timeline','Complete']]){
   selectPerspective(id);await settle();
   const rows=[...document.querySelectorAll('#actions .action-row[data-action-id]')];assert.deepEqual(new Set(rows.map(row=>row.dataset.actionId)),new Set([uid(0),uid(1),uid(2),uid(3)]));assert.equal(rows.length,4);
   assert.equal(requests.filter(request=>request.name==='apply_change').length,0,'view selection must not write');
   if(type==='tasklist'){assert.equal(document.querySelector('[data-action-id="'+uid(1)+'"] .perspective-notes').textContent.length,281);assert.equal(document.querySelector('#actions .perspective-completion').textContent,label);assert([...rows].every(row=>!row.draggable));assert([...rows].every(row=>{const grip=row.querySelector('.drag-handle');return !grip||grip.hidden&&!grip.onkeydown;}));}
   if(type==='thread'){assert.equal(document.querySelectorAll('#actions article.perspective-card').length,4);assert([...rows].every(row=>!row.draggable&&!row.querySelector('.drag-handle')));const child=document.querySelector('[data-action-id="'+uid(1)+'"]');assert.match(child.textContent,/Contains in: Parent action/);child.querySelector('.perspective-body-toggle').click();assert.equal(child.querySelector('.perspective-notes').textContent,state.actions[1].notes);assert.equal(child.querySelector('script'),null);assert.equal(child.querySelector('a').href,'https://example.invalid/reference');assert.equal(child.querySelector('a').rel,'noopener noreferrer');}
   if(type==='timeline'){assert.deepEqual([...document.querySelectorAll('#actions .perspective-group strong')].map(node=>node.textContent),['2026-10-02','2026-10-01']);assert(document.querySelector('[data-action-id="'+uid(1)+'"] .perspective-timestamp').textContent.includes('(America/Los_Angeles)'));}
  }
  selectPerspective(911);await settle();document.querySelector('[data-action-id="'+uid(0)+'"] .perspective-completion').click();await settle();
  let dialog=document.querySelector('dialog[role="alertdialog"]');assert(dialog?.open);assert.match(dialog.textContent,/Hidden completed descendant/);assert.equal(requests.filter(request=>request.name==='apply_change').length,0);
  const late={...state.actions[3],id:uid(4),title:'Added during review',parent_id:uid(0),order:1};state.actions.push(late);state.revision++;
  window.dispatchEvent(new window.MessageEvent('message',{source:window,data:{jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:snapshot()}}}));await settle();dialog.querySelector('.primary').click();await settle();
  assert.equal(requests.filter(request=>request.name==='apply_change').length,0,'a changed snapshot must require a fresh explicit confirmation');dialog=document.querySelector('dialog[role="alertdialog"]');assert.match(dialog.textContent,/Added during review/);
  if(uri.includes('verification'))document.getElementById('discardNext').checked=true;
  dialog.querySelector('.primary').click();await settle();
  if(uri.includes('verification')){
   assert.equal(state.actions.find(action=>action.id===uid(0)).status,'completed');for(const [id,callback] of [...timers]){timers.delete(id);callback();}await settle();assert.equal(document.getElementById('unknown').hidden,false);const first=requests.find(request=>request.name==='apply_change');assert(first);document.getElementById('retry').click();await settle();const writes=requests.filter(request=>request.name==='apply_change');assert.equal(writes.length,2);assert.deepEqual(writes[0].args,writes[1].args);assert.equal(state.revision,3,'retry of the identical receipt must not apply the cascade twice');
  }else assert.equal(requests.filter(request=>request.name==='apply_change').length,1);
  selectPerspective(912);await settle();assert(document.querySelector('[data-action-id="'+uid(0)+'"]'),'completed Actions remain revisitable through the saved filter');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS built saved Perspective resource',uri);
 }finally{dom.window.close();}
}

export async function smokeSavedPerspectives(endpoint='http://127.0.0.1:8787'){
 for(const uri of ['ui://action-tools/actions-v4.html','ui://action-tools/actions-verification-v4.html'])await testResource(endpoint,uri);
}
