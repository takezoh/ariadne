import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {sourceIdentity} from './verification-source.mjs';

// This harness only targets the established local Wrangler Worker and D1 binding.
const directPort=process.argv.slice(2).find(argument=>!argument.startsWith('--'));
if(directPort&&!/^\d{4,5}$/.test(directPort))throw Error('Expected a local Wrangler Worker port');
const diagnosticOnly=process.argv.includes('--diagnose-initialize');
const base='http://127.0.0.1:'+(directPort??'8787'),prefix='boundary-'+randomUUID(),ownerA=prefix+'-A',ownerB=prefix+'-B';
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
async function rpc(method,params={},options={}){const response=await http('/mcp',{jsonrpc:'2.0',id:1,method,params},options);if(response.status===202)return {status:response.status,body:null};const text=await response.text();try{return {status:response.status,contentType:response.headers.get('content-type')||'',body:JSON.parse(text)};}catch{return {status:response.status,contentType:response.headers.get('content-type')||'',body:null,bodyClass:text.toLowerCase().startsWith('your worker restarted mid-request')?'worker-restarted-mid-request':'non-json',bodyLength:Buffer.byteLength(text),bodySha256:createHash('sha256').update(text).digest('hex')};}}
async function tool(owner,name,args={}){const r=await rpc('tools/call',{name,arguments:args},{owner});assert.equal(r.status,200);return r.body.result.structuredContent;}
async function snapshot(owner=ownerA){const r=await tool(owner,'list_actions');assert(!r.error,JSON.stringify(r));return r;}
function durable(snapshot){const {retrieved_at,...state}=snapshot;void retrieved_at;return state;}
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
 evidence.result='passed';
 }
}catch(error){evidence.result='failed';evidence.failure={message:error.message,stack:error.stack};throw error;}
finally{evidence.completedAt=new Date().toISOString();const defaultFile=directPort?'docs/evidence/20261009-local-worker-security-direct.json':'docs/evidence/20261009-local-worker-security.json',file=resolve(process.env.ACTION_TOOLS_EVIDENCE_PATH||defaultFile);if(existsSync(file)){const prior=JSON.parse(readFileSync(file,'utf8'));evidence.priorAttempts=[...(prior.priorAttempts??[]),{...prior,priorAttempts:undefined}];}mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify(evidence,null,2)+'\n');}
