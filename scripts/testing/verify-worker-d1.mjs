import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {register} from 'node:module';
import {sourceIdentity} from './verification-source.mjs';
register('./typescript-loader.mjs',import.meta.url);
const {persistedSnapshot}=await import('../../lib/domain/persisted-dto.ts');

// This harness only targets the established local Wrangler Worker and D1 binding.
const directPort=process.argv.slice(2).find(argument=>!argument.startsWith('--'));
if(directPort&&!/^\d{4,5}$/.test(directPort))throw Error('Expected a local Wrangler Worker port');
const diagnosticOnly=process.argv.includes('--diagnose-initialize');
const base='http://127.0.0.1:'+(directPort??'8787'),prefix='boundary-'+randomUUID(),ownerA=prefix+'-A',ownerB=prefix+'-B',cursorOwner=prefix+'-cursor',cursorOwnerB=prefix+'-cursor-B';
const evidence={source:sourceIdentity(),sourceCommit:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),environment:'local Wrangler Worker / D1 binding DB',endpoint:base,transport:directPort?'direct Wrangler-managed user Worker listener':'Wrangler dev proxy',bindingConfig:JSON.parse(readFileSync('dist/server/wrangler.json','utf8')).d1_databases,processEvidence:spawnSync('ps',['-eo','pid,ppid,args'],{encoding:'utf8'}).stdout.split('\n').filter(x=>/workerd serve|wrangler.*dev --config/.test(x)),serverLogPath:process.env.ACTION_TOOLS_SERVER_LOG_PATH||null,hostedAcceptance:'not_run',artifactSha256:createHash('sha256').update(readFileSync('dist/server/index.js')).digest('hex'),runMode:diagnosticOnly?'initialize-diagnostic':'full-contract',startedAt:new Date().toISOString(),httpObservations:[],scenarios:[]};
function sql(command){
 const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--persist-to','.wrangler/state','--config','dist/server/wrangler.json','--command',command],{encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,result.stderr);return result.stdout;
}
async function http(path,body,{owner=ownerA,headers={},raw=false}={}){
 const requestHeaders={'Content-Type':'application/json',...(owner?{'oai-authenticated-user-id':owner,'oai-authenticated-user-email':'fixture@local.invalid'}:{}),...headers},startedAt=new Date().toISOString(),started=performance.now();
 const response=await fetch(base+path,{method:'POST',headers:requestHeaders,body:raw?body:JSON.stringify(body)});
 if(diagnosticOnly||response.status>=500){
  const responseText=await response.clone().text(),contentType=response.headers.get('content-type')||'',lower=responseText.toLowerCase();
  const bodyClass=lower.startsWith('your worker restarted mid-request')?'worker-restarted-mid-request':contentType.includes('json')?'json':contentType.includes('html')?'html':responseText.length===0?'empty':'other';
  evidence.httpObservations.push({startedAt,elapsedMs:Number((performance.now()-started).toFixed(2)),method:'POST',path,status:response.status,contentType,requestHeaderNames:Object.keys(requestHeaders).sort(),bodyClass,bodyLength:Buffer.byteLength(responseText),bodySha256:createHash('sha256').update(responseText).digest('hex')});
 }
 return response;
}
async function rpc(method,params={},options={}){const response=await http('/mcp',{jsonrpc:'2.0',id:1,method,params},options);if(response.status===202)return {status:response.status,body:null};const text=await response.text();try{return {status:response.status,contentType:response.headers.get('content-type')||'',contentEncoding:response.headers.get('content-encoding')||'identity',wireBodyBytes:Buffer.byteLength(text),body:JSON.parse(text)};}catch{return {status:response.status,contentType:response.headers.get('content-type')||'',body:null,bodyClass:text.toLowerCase().startsWith('your worker restarted mid-request')?'worker-restarted-mid-request':'non-json',bodyLength:Buffer.byteLength(text),bodySha256:createHash('sha256').update(text).digest('hex')};}}
async function tool(owner,name,args={}){const r=await rpc('tools/call',{name,arguments:args},{owner});assert.equal(r.status,200);return r.body.result.structuredContent;}
async function snapshot(owner=ownerA){const r=await tool(owner,'list_actions');assert(!r.error,JSON.stringify(r));return r;}
function durable(snapshot){const {retrieved_at,...state}=snapshot;void retrieved_at;return state;}
function cursorToken(encoded,changes={}){const value=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));return Buffer.from(JSON.stringify({...value,...changes})).toString('base64url');}
function persistedState(value){return persistedSnapshot({actions:value.actions,projects:value.projects,tags:value.tags,perspectives:value.perspectives,action_tags:value.action_tags});}
function entityKey(collection,row){return collection==='action_tags'?`${row.action_id}:${row.tag_id}`:row.id;}
async function undo(owner,target){const request={schemaVersion:2,operationId:randomUUID(),expectedRevision:(await snapshot(owner)).revision,undoOf:target.request.operationId},result=await tool(owner,'undo_change',request);assert(!result.error,JSON.stringify(result.error));}
function assertUndoInverse(operations,target,collection,identity){
 const applied=operations.find(row=>row.operation_id===target.request.operationId),undone=operations.find(row=>row.undo_of===target.request.operationId);
 assert(applied,`missing ${collection} target operation ${target.request.operationId}`);assert(undone,`missing ${collection} Undo operation ${target.request.operationId}`);
 const find=row=>row.changes[collection].find(delta=>entityKey(collection,delta.after??delta.before)===identity),before=find(applied),after=find(undone);
 assert(before,`missing ${collection} target delta`);assert(after,`missing ${collection} Undo delta`);
 assert.deepEqual(after.before,before.after,`${collection} Undo must start from the target's after-state`);
 const stable=value=>{
  if(!value)return value;
  const {revision,updated_at,...persisted}=value;void revision;void updated_at;return persisted;
 };
 assert.deepEqual(stable(after.after),stable(before.before),`${collection} Undo must restore the target's prior persisted state`);
 return {collection,targetOperationId:target.request.operationId,undoOperationId:undone.operation_id,restoredState:'exact except generated revision/updated_at metadata'};
}
function applyOperation(cache,operation){
 for(const collection of ['actions','projects','tags','perspectives','action_tags'])for(const delta of operation.changes[collection]){
  const identity=entityKey(collection,delta.after??delta.before),index=cache[collection].findIndex(row=>entityKey(collection,row)===identity),current=index<0?null:cache[collection][index];
  assert.deepEqual(current,delta.before,`${collection} before-state at revision ${operation.revision_after}`);
  if(delta.after===null){if(index>=0)cache[collection].splice(index,1);}else if(index<0)cache[collection].push(delta.after);else cache[collection][index]=delta.after;
 }
}
function sortPersisted(cache){for(const collection of ['actions','projects','tags','perspectives','action_tags'])cache[collection].sort((left,right)=>entityKey(collection,left).localeCompare(entityKey(collection,right)));return cache;}
async function args(owner,kind,payload){return {schemaVersion:2,operationId:randomUUID(),expectedRevision:(await snapshot(owner)).revision,kind,payload};}
async function write(owner,kind,payload){const request=await args(owner,kind,payload),result=await tool(owner,'apply_change',request);assert(!result.error,JSON.stringify(result.error));return {request,result};}
async function scenario(name,fn){await fn();evidence.scenarios.push({name,result:'passed'});console.log('passed: '+name);}
try{
 if(diagnosticOnly){
  const response=await rpc('initialize',{protocolVersion:'2025-11-25'});
  evidence.diagnosticProbe={request:{method:'POST',path:'/mcp',jsonrpcMethod:'initialize',contentType:'application/json',headerNames:['content-type','oai-authenticated-user-email','oai-authenticated-user-id'],credentialValuesPersisted:false},response:{status:response.status,contentType:response.contentType,bodyClass:response.body?'json':response.bodyClass,jsonrpc:response.body?.jsonrpc,id:response.body?.id,hasResult:Boolean(response.body?.result),protocolVersion:response.body?.result?.protocolVersion,serverInfo:response.body?.result?.serverInfo,errorCode:response.body?.error?.code}};
  evidence.result=response.status===200&&response.body?'diagnostic_passed':'diagnostic_inconclusive';
 }else{
 await scenario('authenticate every private JSON-RPC method without session bypass',async()=>{
  for(const method of ['initialize','ping','tools/list','resources/list','resources/templates/list','resources/read','tools/call','notifications/initialized']){
   assert.equal((await rpc(method,{}, {owner:null})).status,401,method);
   assert.equal((await rpc(method,{}, {owner:null,headers:{'Mcp-Session-Id':'previous-session'}})).status,401,method);
  }
  assert.equal((await rpc('initialize')).status,200);assert.equal((await rpc('tools/list',{}, {owner:ownerB})).status,200);
  const resources=(await rpc('resources/list')).body.result.resources;
  for(const resource of resources)assert((await rpc('resources/read',{uri:resource.uri})).body.result.contents[0].text.length>0);
  const tools=(await rpc('tools/list')).body.result.tools;
  assert(tools.some(item=>item.name==='get_change_cursor'),'missing get_change_cursor');assert(tools.some(item=>item.name==='get_changes'),'missing get_changes');
  assert.deepEqual(tools.find(item=>item.name==='get_change_cursor').inputSchema.properties,{});
  assert.equal(tools.find(item=>item.name==='get_changes').inputSchema.properties.page_size.maximum,100);
  assert.equal((await rpc('notifications/initialized')).status,202);
 });
 await scenario('shared Origin/media type/actual UTF-8 size guards and strict caller fields',async()=>{
  for(const path of ['/mcp','/api/actions']){
   const body=path==='/mcp'?{jsonrpc:'2.0',id:1,method:'ping'}:{name:'list_actions'};
   for(const origin of ['null','https://evil.invalid'])assert.equal((await http(path,body,{headers:{Origin:origin}})).status,403);
   assert.equal((await http(path,body,{headers:{'Content-Type':'application/json-evil'}})).status,415);
   assert.equal((await http(path,'{"notes":"'+'界'.repeat(350000)+'"}',{raw:true})).status,413);
   assert.equal((await http(path,'{',{raw:true})).status,400);
   assert.equal((await http(path,body,{owner:null})).status,401);
  }
  assert.equal((await tool(ownerA,'list_actions',{owner:ownerB})).error.code,'invalid_input');
 });
 const injection="quote ' ; -- /* SELECT */ 界 😀";
 let created;
 await scenario('bound owner, SQL-like exact data, identical replay and conflicting input',async()=>{
  created=await write(ownerA,'add',{title:injection,notes:injection});
  const id=created.result.result.resolved.actions[0].id;
  assert.equal((await snapshot()).actions.find(x=>x.id===id).notes,injection);
  assert.equal((await snapshot(ownerB)).actions.length,0);
  assert.equal((await tool(ownerB,'operation_status',{operationId:created.request.operationId})).status,'not_observed');
  const replay=await tool(ownerA,'apply_change',created.request);assert.deepEqual(replay.result,created.result.result);
  assert.equal((await tool(ownerA,'apply_change',{...created.request,payload:{title:'changed'}})).error.code,'idempotency_conflict');
  const b=await tool(ownerB,'apply_change',created.request);assert(!b.error);assert.equal(b.revision,1);
  await write(ownerA,'edit',{id,title:'Later correction'});
  const oldReplay=await tool(ownerA,'apply_change',created.request);assert.equal(oldReplay.actions.find(x=>x.id===id).title,'Later correction');
 });
 await scenario('CAS competition, discarded response recovery and conflict-aware Undo',async()=>{
  const request=await args(ownerA,'add',{title:'race'}),other={...request,operationId:randomUUID(),payload:{title:'other'}};
  const results=await Promise.all([tool(ownerA,'apply_change',request),tool(ownerA,'apply_change',other)]);
  assert.equal(results.filter(x=>!x.error).length,1);assert.equal(results.find(x=>x.error).error.code,'conflict');
  const lost=await args(ownerA,'add',{title:'discarded response'});
  const response=await http('/mcp',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'apply_change',arguments:lost}});await response.arrayBuffer();
  // Deliberately do not interpret the write reply; recover only through the receipt and exact replay.
  assert.equal((await tool(ownerA,'operation_status',{operationId:lost.operationId})).status,'applied');
  const current=await snapshot(),replay=await tool(ownerA,'apply_change',lost);assert.equal(replay.revision,current.revision);
  const undo={schemaVersion:2,operationId:randomUUID(),expectedRevision:current.revision,undoOf:created.request.operationId};
  assert.equal((await tool(ownerA,'undo_change',undo)).error.code,'undo_conflict');
  const good={...undo,operationId:randomUUID(),undoOf:lost.operationId};assert(!(await tool(ownerA,'undo_change',good)).error);
  assert.equal((await snapshot()).actions.find(x=>x.id===created.result.result.resolved.actions[0].id).title,'Later correction');
 });
 await scenario('parent plus six notes succeeds atomically; UTF-8 and generated delta over-budget reject before write',async()=>{
  const root=await write(ownerA,'add',{title:'Parent'}),id=root.result.result.resolved.actions[0].id;
  const small={inbox_action_id:id,actions:[{ref:'root',title:'Parent'},...Array.from({length:6},(_,i)=>({ref:'child'+i,title:'Child '+i,parent_ref:'root',notes:'n'.repeat(7000)}))]};
  const made=await write(ownerA,'structure_create',small);assert.equal(made.result.result.resolved.actions.length,7);
  const historicalBefore=await snapshot(),historical=await args(ownerA,'structure_create',{...small,actions:small.actions.map((x,i)=>i?{...x,notes:'あ'.repeat(65536)}:x)});
  const historicalResponse=await http('/mcp',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'apply_change',arguments:historical}});
  assert.equal(historicalResponse.status,413);await historicalResponse.arrayBuffer();
  assert.deepEqual(durable(await snapshot()),durable(historicalBefore));
  const individual=await args(ownerA,'add',{title:'Long child',parent_id:id,notes:'あ'.repeat(65536)});
  assert.equal((await tool(ownerA,'apply_change',individual)).error.code,'operation_too_large');
  assert.equal((await tool(ownerA,'operation_status',{operationId:individual.operationId})).status,'not_observed');
  assert.deepEqual(durable(await snapshot()),durable(historicalBefore));
  evidence.historicalCase={children:6,noteCodeUnitsEach:65536,noteUTF8BytesEach:196608,atomicEnvelope:'HTTP 413 before service',individualPreparation:'operation_too_large before batch',noWrite:true};
  const before=await snapshot(),large=await args(ownerA,'structure_create',{...small,actions:small.actions.map((x,i)=>i?{...x,notes:'界'.repeat(12000)}:x)});
  assert.equal((await tool(ownerA,'apply_change',large)).error.code,'operation_too_large');assert.deepEqual(durable(await snapshot()),durable(before));
  assert.equal((await tool(ownerA,'operation_status',{operationId:large.operationId})).status,'not_observed');
  const unicode=await write(ownerA,'add',{title:'UTF-8',notes:'界'.repeat(18000)}),unicodeId=unicode.result.result.resolved.actions[0].id,beforeDelta=await snapshot();
  const tooMuchDelta=await args(ownerA,'edit',{id:unicodeId,notes:'海'.repeat(18000)});
  assert.equal((await tool(ownerA,'apply_change',tooMuchDelta)).error.code,'operation_too_large');assert.deepEqual(durable(await snapshot()),durable(beforeDelta));
  const completed=await write(ownerA,'complete',{id});assert.equal(completed.result.actions.filter(x=>x.parent_id===id).every(x=>x.status==='completed'),true);
 });
 await scenario('real D1 mid-batch failure rolls back graph, revision, receipt and identity markers',async()=>{
  const trigger='boundary_failure_'+randomUUID().replaceAll('-','');
  sql(`CREATE TRIGGER ${trigger} BEFORE INSERT ON catalog_identity_ledger WHEN NEW.owner='${ownerA}' BEGIN SELECT RAISE(ABORT,'injected local failure'); END;`);
  try{
   const before=await snapshot(),request=await args(ownerA,'project_add',{name:'Atomic failure'}),result=await tool(ownerA,'apply_change',request);
   assert.equal(result.error.code,'outcome_unknown');assert.deepEqual(durable(await snapshot()),durable(before));
   assert.equal((await tool(ownerA,'operation_status',{operationId:request.operationId})).status,'not_observed');
  }finally{sql(`DROP TRIGGER ${trigger}`);}
 });
 await scenario('same entity/operation IDs and pruning remain isolated across two owners',async()=>{
  const id=randomUUID(),now='2026-10-09T00:00:00.000Z';
  sql(`INSERT INTO actions(owner,id,title,revision,status,notes,"order",flagged,created_at,updated_at) VALUES('${ownerA}','${id}','A seeded',0,'active','',0,0,'${now}','${now}'),('${ownerB}','${id}','B seeded',0,'active','',0,0,'${now}','${now}');`);
  await write(ownerA,'edit',{id,title:'A changed'});assert.equal((await snapshot(ownerB)).actions.find(x=>x.id===id).title,'B seeded');
  const keep=await write(ownerB,'tag_add',{name:'B retained'});
  for(let i=0;i<101;i++)await write(ownerA,'edit',{id,title:'A '+i});
  assert.equal((await tool(ownerA,'operation_status',{operationId:created.request.operationId})).status,'not_observed');
  assert.equal((await tool(ownerB,'operation_status',{operationId:created.request.operationId})).status,'applied');
  const undo={schemaVersion:2,operationId:randomUUID(),expectedRevision:(await snapshot(ownerB)).revision,undoOf:keep.request.operationId};assert(!(await tool(ownerB,'undo_change',undo)).error);
 });
 await scenario('action_move direct apply matches preview state, returns a receipt, replays exactly and undoes through Worker D1',async()=>{
  // Isolate ordinary movement from the earlier oversized-note and pruning fixtures.
  const moveOwner=prefix+'-move';
  const first=await write(moveOwner,'add',{title:'Move fixture first'}),second=await write(moveOwner,'add',{title:'Move fixture second'}),third=await write(moveOwner,'add',{title:'Move fixture hidden sibling'});
  const firstId=first.result.result.resolved.actions[0].id,secondId=second.result.result.resolved.actions[0].id,thirdId=third.result.result.resolved.actions[0].id;
  const before=await snapshot(moveOwner),payload={ids:[firstId],placement:'after',anchor_id:secondId},preview=await tool(moveOwner,'preview_change',{expectedRevision:before.revision,kind:'action_move',payload});
  assert(!preview.error,JSON.stringify(preview));
  const beforeSiblings=before.actions.filter(row=>row.parent_id===null&&row.project_id===null).map(row=>row.id),expectedSiblings=beforeSiblings.filter(id=>id!==firstId),anchorIndex=expectedSiblings.indexOf(secondId);expectedSiblings.splice(anchorIndex+1,0,firstId);
  const request={schemaVersion:2,operationId:randomUUID(),expectedRevision:before.revision,kind:'action_move',payload},applied=await tool(moveOwner,'apply_change',request);
  assert(!applied.error,JSON.stringify(applied.error));assert.equal(applied.result.operationId,request.operationId);
  const movedRows=durable(applied).actions.filter(row=>[firstId,secondId,thirdId].includes(row.id)),afterSiblings=durable(applied).actions.filter(row=>row.parent_id===null&&row.project_id===null).map(row=>row.id),previewRows=preview.affected;
  assert.deepEqual(afterSiblings,expectedSiblings);assert.equal(movedRows.find(row=>row.id===firstId).parent_id,null);assert.deepEqual(previewRows.map(row=>row.id).sort(),[firstId,secondId].sort());assert.deepEqual(previewRows.map(row=>[row.id,row.parent_id,row.order]).sort(),movedRows.filter(row=>row.id!==thirdId).map(row=>[row.id,row.parent_id,row.order]).sort());assert.deepEqual(movedRows.find(row=>row.id===thirdId),before.actions.find(row=>row.id===thirdId));
  const receipt=await tool(moveOwner,'operation_status',{operationId:request.operationId});assert.equal(receipt.status,'applied');assert.equal(receipt.result.operationId,request.operationId);
  const replay=await tool(moveOwner,'apply_change',request);assert.deepEqual(durable(replay),durable(applied));
  const undo={schemaVersion:2,operationId:randomUUID(),expectedRevision:(await snapshot(moveOwner)).revision,undoOf:request.operationId};const undone=await tool(moveOwner,'undo_change',undo);assert(!undone.error,JSON.stringify(undone.error));
  const restored=durable(undone).actions.filter(row=>row.parent_id===null&&row.project_id===null).map(row=>row.id);assert.deepEqual(restored,beforeSiblings);
  assert.equal(preview.kind,'action_move');evidence.actionMove={operationId:request.operationId,previewExpectedRevision:preview.expectedRevision,appliedRevision:applied.revision,receipt:receipt.status,undoRevision:undone.revision,fullSnapshot:true,workerBinding:'env.DB via Wrangler local D1'};
 });
 await scenario('opaque cursors bootstrap and reconstruct every persisted collection across fenced pages, replay and Undo',async()=>{
  const initial=await snapshot(cursorOwner),baseline=initial.change_cursor,live=await tool(cursorOwner,'get_change_cursor');
  assert.deepEqual(JSON.parse(Buffer.from(baseline,'base64url').toString('utf8')),JSON.parse(Buffer.from(live.cursor,'base64url').toString('utf8')));
  const empty=await tool(cursorOwner,'get_changes',{cursor:baseline});assert.deepEqual(empty.changes,[]);assert.equal(empty.has_more,false);assert.equal(JSON.parse(Buffer.from(empty.next_cursor,'base64url').toString('utf8')).through_revision,null);
  assert.notEqual(empty.next_cursor,(await tool(cursorOwnerB,'get_change_cursor')).cursor);
  assert.equal((await tool(cursorOwnerB,'get_changes',{cursor:empty.next_cursor})).error.code,'invalid_cursor');
  const actionCreated=await write(cursorOwner,'add',{title:'Cursor action',notes:' exact raw notes ',tag_ids:[]}),actionId=actionCreated.result.result.resolved.actions[0].id;
  const project=(await write(cursorOwner,'project_add',{name:'Cursor project',description:'project context'})).result.result.resolved.project.id;
  const tag=(await write(cursorOwner,'tag_add',{name:'Cursor tag',description:'tag context'})).result.result.resolved.tag.id;
  const perspective=(await write(cursorOwner,'perspective_add',{name:'Cursor view',description:'view context',filter:{project_id:project,tag_id:tag,statuses:['active']}})).result.result.resolved.perspective.id;
  const actionTagCreate=await write(cursorOwner,'action_tag',{id:actionId,tag_id:tag,enabled:true});
  await write(cursorOwner,'action_project',{id:actionId,project_id:project});
  const actionEdit=await write(cursorOwner,'edit',{id:actionId,title:'Cursor action corrected',notes:' corrected exact ',flagged:true,due_at:'2026-10-20T12:00:00Z'});
  await write(cursorOwner,'project_edit',{id:project,description:'updated project context'});
  await write(cursorOwner,'tag_edit',{id:tag,description:'updated tag context'});
  await write(cursorOwner,'perspective_edit',{id:perspective,description:'updated view context'});
  const associationRemoved=await write(cursorOwner,'action_tag',{id:actionId,tag_id:tag,enabled:false});
  await undo(cursorOwner,associationRemoved);
  await write(cursorOwner,'action_tag',{id:actionId,tag_id:tag,enabled:false});
  await write(cursorOwner,'action_project',{id:actionId,project_id:null});
  const perspectiveRemoved=await write(cursorOwner,'perspective_remove',{id:perspective});
  await undo(cursorOwner,perspectiveRemoved);
  await write(cursorOwner,'perspective_remove',{id:perspective});
  const projectRemoved=await write(cursorOwner,'project_remove',{id:project});
  await undo(cursorOwner,projectRemoved);
  await write(cursorOwner,'project_remove',{id:project});
  const tagRemoved=await write(cursorOwner,'tag_remove',{id:tag});
  await undo(cursorOwner,tagRemoved);
  await write(cursorOwner,'tag_remove',{id:tag});
  const actionCancelled=await write(cursorOwner,'cancel',{id:actionId});
  await undo(cursorOwner,actionCancelled);
  await write(cursorOwner,'cancel',{id:actionId});
  const current=await snapshot(cursorOwner),fenceRevision=current.revision,firstPage=await tool(cursorOwner,'get_changes',{cursor:baseline,page_size:2});
  assert(firstPage.has_more);assert.equal(firstPage.through_revision,fenceRevision);
  assert.deepEqual(await tool(cursorOwner,'get_changes',{cursor:baseline,page_size:2}),firstPage);
  const concurrent=await write(cursorOwner,'add',{title:'After page fence'}),concurrentId=concurrent.result.result.resolved.actions[0].id;
  const cache=persistedState(initial),operationIds=new Set();let page=firstPage,pages=1;
  while(true){
   for(const operation of page.changes){assert(!operationIds.has(operation.operation_id));operationIds.add(operation.operation_id);applyOperation(cache,operation);}
   assert.equal(page.through_revision,fenceRevision);
   if(!page.has_more)break;
   const nextCursor=page.next_cursor;
   page=await tool(cursorOwner,'get_changes',{cursor:nextCursor,page_size:2});
   assert.deepEqual(await tool(cursorOwner,'get_changes',{cursor:nextCursor,page_size:2}),page);pages++;
  }
  assert.equal(pages>1,true);
  assert.equal(JSON.parse(Buffer.from(page.next_cursor,'base64url').toString('utf8')).position,fenceRevision);
  assert.equal(JSON.parse(Buffer.from(page.next_cursor,'base64url').toString('utf8')).through_revision,null);
  assert.deepEqual(sortPersisted(cache),sortPersisted(persistedState(current)));
  const latest=await snapshot(cursorOwner),replay=await tool(cursorOwner,'apply_change',actionCreated.request);assert.equal(replay.revision,latest.revision);assert.equal(replay.actions.find(row=>row.id===actionId).title,'Cursor action corrected');
  const history=await tool(cursorOwner,'get_changes',{cursor:baseline,page_size:100});
  assert(history.changes.some(row=>row.operation_id===projectRemoved.request.operationId&&row.changes.projects.some(item=>item.before?.id===project&&item.after===null)));
  assert(history.changes.some(row=>row.undo_of===projectRemoved.request.operationId&&row.changes.projects.some(item=>item.before===null&&item.after?.id===project)));
  assert(history.changes.some(row=>row.operation_id===actionTagCreate.request.operationId&&row.changes.action_tags.some(item=>item.before===null&&item.after?.action_id===actionId)));
  assert(history.changes.some(row=>row.operation_id===associationRemoved.request.operationId&&row.changes.action_tags.some(item=>item.before?.tag_id===tag&&item.after===null)));
  const undoInverses=[
   assertUndoInverse(history.changes,actionCancelled,'actions',actionId),
   assertUndoInverse(history.changes,projectRemoved,'projects',project),
   assertUndoInverse(history.changes,tagRemoved,'tags',tag),
   assertUndoInverse(history.changes,perspectiveRemoved,'perspectives',perspective),
   assertUndoInverse(history.changes,associationRemoved,'action_tags',`${actionId}:${tag}`)
  ];
  assert.equal(current.actions.find(row=>row.id===actionId).status,'dropped');
  assert.equal((await tool(cursorOwner,'operation_status',{operationId:actionEdit.request.operationId})).status,'applied');
  const afterTerminal=await tool(cursorOwner,'get_changes',{cursor:page.next_cursor});assert.deepEqual(afterTerminal.changes.map(row=>row.revision_after),[fenceRevision+1]);assert.equal(afterTerminal.changes[0].changes.actions[0].after.id,concurrentId);
  assert.equal((await snapshot(cursorOwner)).actions.some(row=>row.id===concurrentId),true);
  evidence.cursorReconstruction={baselineRevision:initial.revision,fencedRevision:fenceRevision,pages,operationCount:operationIds.size,concurrentRevision:concurrent.result.revision,persistedCollections:['actions','projects','tags','perspectives','action_tags'],sameProjector:'lib/domain/persisted-dto.ts',replayCurrentCorrection:true,undoInverses};
 });
 await scenario('terminal and empty H+1, read nonmutation, cursor failures, and logical page versus MCP body bytes',async()=>{
  const owner=prefix+'-cursor-edge',before=await snapshot(owner),baseline=before.change_cursor,empty=await tool(owner,'get_changes',{cursor:baseline});
  const unchanged=durable(await snapshot(owner));assert.equal(unchanged.revision,0);assert.deepEqual(unchanged,durable(before));
  const later=await write(owner,'add',{title:'H plus one'}),next=await tool(owner,'get_changes',{cursor:empty.next_cursor});assert.deepEqual(next.changes.map(row=>row.revision_after),[1]);
  const badTokens=['!',Buffer.from('{"v":1,"scope":"bad","position":0,"through_revision":null}').toString('base64url'),cursorToken(baseline,{position:5})];
  for(const cursor of badTokens)assert.equal((await tool(owner,'get_changes',{cursor})).error.code,'invalid_cursor');
  const other=await tool(cursorOwnerB,'get_change_cursor');assert.equal((await tool(owner,'get_changes',{cursor:other.cursor})).error.code,'invalid_cursor');
  const byteOwner=prefix+'-cursor-bytes',byteProject=(await write(byteOwner,'project_add',{name:'Byte page'})).result.result.resolved.project.id;
  const byteStart=(await tool(byteOwner,'get_change_cursor')).cursor;
  for(let index=0;index<14;index++)await write(byteOwner,'project_edit',{id:byteProject,description:`${String(index).padStart(2,'0')}${'x'.repeat(39_998)}`});
  const byteRpc=await rpc('tools/call',{name:'get_changes',arguments:{cursor:byteStart,page_size:100}},{owner:byteOwner,headers:{'Accept-Encoding':'identity'}}),bytePage=byteRpc.body.result.structuredContent;
  const logicalPageBytes=Buffer.byteLength(JSON.stringify(bytePage)),wirePayload=byteRpc.body.result.content.find(item=>item.type==='text')?.text;
  assert.equal(byteRpc.status,200);assert.equal(byteRpc.contentEncoding,'identity');assert.equal(wirePayload,JSON.stringify(bytePage));assert(bytePage.has_more);assert(bytePage.changes.length<14);
  assert(logicalPageBytes<=1_048_576);assert(byteRpc.wireBodyBytes>logicalPageBytes);assert(byteRpc.wireBodyBytes>1_048_576);
  const afterRead=durable(await snapshot(owner));assert.equal(afterRead.revision,later.result.revision);assert.equal((await tool(owner,'operation_status',{operationId:later.request.operationId})).status,'applied');
  evidence.cursorReadIntegrity={emptyRevision:0,laterRevision:1,malformedTokens:badTokens.length,wrongOwner:true,future:true,bytePageOperations:bytePage.changes.length,logicalChangePageBytes:logicalPageBytes,logicalPageLimitBytes:1_048_576,actualMcpJsonRpcBodyBytes:byteRpc.wireBodyBytes,responseContentEncoding:byteRpc.contentEncoding,wireBodyExceedsLogicalPageLimit:byteRpc.wireBodyBytes>1_048_576,wireContainsDuplicatePayload:byteRpc.wireBodyBytes>logicalPageBytes,noReadMutation:true};
 });
 await scenario('retention accepts the oldest valid position and rejects expired cursors and retained holes/malformed rows',async()=>{
  const pruneOwner=prefix+'-cursor-prune',start=await tool(pruneOwner,'get_change_cursor');
  for(let index=0;index<101;index++)await write(pruneOwner,'add',{title:`Retained ${index}`});
  assert.equal((await tool(pruneOwner,'get_changes',{cursor:start.cursor})).error.code,'cursor_expired');
  const oldestValid=cursorToken(start.cursor,{position:1,through_revision:null});
  const oldestPage=await tool(pruneOwner,'get_changes',{cursor:oldestValid,page_size:1});assert.equal(oldestPage.changes[0].revision_after,2);
  const malformedOwner=prefix+'-cursor-malformed',first=await write(malformedOwner,'add',{title:'Malformed source'});await write(malformedOwner,'add',{title:'Later'});
  sql(`UPDATE operations SET delta='{"actions":[]}' WHERE owner='${malformedOwner}' AND operation_id='${first.request.operationId}';`);
  const malformedCursor=(await tool(malformedOwner,'get_change_cursor')).cursor;
  assert.equal((await tool(malformedOwner,'get_changes',{cursor:cursorToken(malformedCursor,{position:0})})).error.code,'invalid_state');
  const gapOwner=prefix+'-cursor-gap';await write(gapOwner,'add',{title:'Gap one'});await write(gapOwner,'add',{title:'Gap two'});await write(gapOwner,'add',{title:'Gap three'});
  sql(`DELETE FROM operations WHERE owner='${gapOwner}' AND revision_after=2;`);
  const gapCursor=(await tool(gapOwner,'get_change_cursor')).cursor;
  assert.equal((await tool(gapOwner,'get_changes',{cursor:cursorToken(gapCursor,{position:0})})).error.code,'invalid_state');
  evidence.cursorRetention={retainedLimit:100,headRevision:101,oldestValidPosition:1,expiredPosition:0,malformedDelta:'invalid_state',retainedGap:'invalid_state'};
 });
 evidence.result='passed';
 }
}catch(error){evidence.result='failed';evidence.failure={message:error.message,stack:error.stack};throw error;}
finally{evidence.completedAt=new Date().toISOString();const defaultFile=directPort?'docs/evidence/20261009-local-worker-security-direct.json':'docs/evidence/20261009-local-worker-security.json',file=resolve(process.env.ACTION_TOOLS_EVIDENCE_PATH||defaultFile);if(existsSync(file)){const prior=JSON.parse(readFileSync(file,'utf8'));evidence.priorAttempts=[...(prior.priorAttempts??[]),{...prior,priorAttempts:undefined}];}mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify(evidence,null,2)+'\n');}
