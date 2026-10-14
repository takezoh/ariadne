import assert from 'node:assert/strict';
import {execFile,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {promisify} from 'node:util';
import {sourceIdentity} from './verification-source.mjs';

const execFileAsync=promisify(execFile);

// This harness only targets the established local Wrangler Worker and D1 binding.
const directPort=process.argv.slice(2).find(argument=>!argument.startsWith('--'));
if(directPort&&!/^\d{4,5}$/.test(directPort))throw Error('Expected a local Wrangler Worker port');
const diagnosticOnly=process.argv.includes('--diagnose-initialize');
const base='http://127.0.0.1:'+(directPort??'8787'),prefix='boundary-'+randomUUID(),ownerA=prefix+'-A',ownerB=prefix+'-B';
const evidence={source:sourceIdentity(),sourceCommit:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),environment:'local Wrangler Worker / D1 binding DB',endpoint:base,transport:directPort?'direct Wrangler-managed user Worker listener':'Wrangler dev proxy',bindingConfig:JSON.parse(readFileSync('dist/server/wrangler.json','utf8')).d1_databases,processEvidence:spawnSync('ps',['-eo','pid,ppid,args'],{encoding:'utf8'}).stdout.split('\n').filter(x=>/workerd serve|wrangler.*dev --config/.test(x)),serverLogPath:process.env.ACTION_TOOLS_SERVER_LOG_PATH||null,hostedAcceptance:'not_run',artifactSha256:createHash('sha256').update(readFileSync('dist/server/index.js')).digest('hex'),runMode:diagnosticOnly?'initialize-diagnostic':'full-contract',startedAt:new Date().toISOString(),httpObservations:[],transportFailures:[],scenarios:[]};
async function sql(command){
 const {stdout}=await execFileAsync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--persist-to','.wrangler/state','--config','dist/server/wrangler.json','--command',command],{encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});
 return stdout;
}
async function http(path,body,{owner=ownerA,headers={},raw=false}={}){
 const requestHeaders={'Content-Type':'application/json',...(owner?{'oai-authenticated-user-id':owner,'oai-authenticated-user-email':'fixture@local.invalid'}:{}),...headers},startedAt=new Date().toISOString(),started=performance.now(),requestBody=raw?body:JSON.stringify(body);
 let response;try{response=await fetch(base+path,{method:'POST',headers:requestHeaders,body:requestBody});}catch(error){evidence.transportFailures.push({startedAt,elapsedMs:Number((performance.now()-started).toFixed(2)),method:'POST',path,requestBytes:Buffer.byteLength(requestBody),requestSha256:createHash('sha256').update(requestBody).digest('hex'),requestHeaderNames:Object.keys(requestHeaders).sort(),errorName:error.name,errorCode:error.cause?.code||null,errorMessage:error.message});throw error;}
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
 await scenario('publish strict version-2 view schemas and caller guidance through MCP',async()=>{
  const initialized=await rpc('initialize',{protocolVersion:'2025-11-25'}),instructions=initialized.body.result.instructions;
  assert.equal(initialized.status,200);for(const text of ['version-2','Tasklist','Thread','Timeline','Omitted view on creation','omitted view on edit'])assert(instructions.includes(text),text);
  const definitions=(await rpc('tools/list')).body.result.tools,byName=Object.fromEntries(definitions.map(definition=>[definition.name,definition]));
  for(const name of ['list_perspectives','query_perspective'])assert(byName[name].description.includes('version-2'));
  assert(byName.query_perspective.description.includes('existing tree/sibling action order'));
  for(const name of ['apply_change','preview_change']){
   const inputSchema=byName[name].inputSchema,findViewSchema=kind=>inputSchema.allOf.find(branch=>branch.if?.properties?.kind?.const===kind)?.then?.properties?.payload?.properties?.view;
   const viewSchema=findViewSchema('perspective_add');assert.equal(viewSchema.oneOf.length,3,name);
   for(const branch of viewSchema.oneOf)assert.equal(branch.additionalProperties,false,name);
   assert(findViewSchema('perspective_edit'),name);
  }
  const state=await snapshot(ownerA);for(const text of ['version-2','Tasklist','Thread','Timeline'])assert(state.assistance_policy.includes(text),text);
 });
 const perspectiveOwner=prefix+'-perspective';
 await scenario('Worker D1 perspectives retain strict view definitions while queries preserve action membership and order',async()=>{
  const project=(await write(perspectiveOwner,'project_add',{name:'Perspective project'})).result.result.resolved.project.id,tag=(await write(perspectiveOwner,'tag_add',{name:'Perspective tag'})).result.result.resolved.tag.id;
  const first=await write(perspectiveOwner,'add',{title:'Alpha',order:0,flagged:true,project_id:project}),middle=await write(perspectiveOwner,'add',{title:'Mike',order:1,project_id:project}),last=await write(perspectiveOwner,'add',{title:'Zulu',order:2,project_id:project});
  const actionIds=[first.result.result.resolved.actions[0].id,middle.result.result.resolved.actions[0].id,last.result.result.resolved.actions[0].id],baseline=(await snapshot(perspectiveOwner)).actions.map(row=>row.id);
  await write(perspectiveOwner,'action_tag',{id:actionIds[0],tag_id:tag,enabled:true});
  const definitions=[
   {name:'Tasklist',filter:{},view:{type:'tasklist',sort:'title',direction:'desc',group:'project',completion_label:'read',show_notes:true}},
   {name:'Thread',filter:{},view:{type:'thread',sort:'updated_at',direction:'desc',group:'status',completion_label:'acknowledge',initial_body:'expanded'}},
   {name:'Timeline',filter:{},view:{type:'timeline',timestamp:'created_at',direction:'asc',group:'day',completion_label:'complete',initial_body:'collapsed'}},
   {name:'Flagged only',filter:{flagged:true},view:{type:'tasklist',sort:'action_order',direction:'asc',group:'none',completion_label:'complete',show_notes:false}},
  ];
  const saved=[];for(const definition of definitions){const added=await write(perspectiveOwner,'perspective_add',{name:definition.name,filter:definition.filter,...(definition.view?{view:definition.view}:{})});saved.push({id:added.result.result.resolved.perspective.id,request:added.request,definition});}
  const omitted=await write(perspectiveOwner,'perspective_add',{name:'Defaulted',filter:{}});saved.push({id:omitted.result.result.resolved.perspective.id,request:omitted.request,definition:{name:'Defaulted',filter:{}}});
  const defaultView={type:'tasklist',sort:'action_order',direction:'asc',group:'none',completion_label:'complete',show_notes:false};
  assert.deepEqual((await snapshot(perspectiveOwner)).perspectives.find(row=>row.id===saved[4].id).view,defaultView);
  const titles=new Map((await snapshot(perspectiveOwner)).actions.map(row=>[row.id,row.title])),tasklistSorted=[...actionIds].sort((a,b)=>titles.get(b).localeCompare(titles.get(a)));
  assert.notDeepEqual(baseline,tasklistSorted,'fixture must distinguish presentation sort from stored action order');
  for(const entry of saved){
   const read=await tool(perspectiveOwner,'query_perspective',{id:entry.id});assert(!read.error,JSON.stringify(read.error));
   const expected=entry.definition.filter.flagged?baseline.filter(id=>id===actionIds[0]):baseline;
   assert.deepEqual(read.actions.map(row=>row.id),expected,entry.definition.name+' keeps filter matches in shared action order');
   assert.deepEqual(read.perspective.view,entry.definition.view??defaultView);
  }
  const addReplay=await tool(perspectiveOwner,'apply_change',saved[4].request);assert.equal(addReplay.result.operationId,saved[4].request.operationId);assert.deepEqual(addReplay.perspectives.find(row=>row.id===saved[4].id).view,defaultView);
  const editOmitted={schemaVersion:2,operationId:randomUUID(),expectedRevision:(await snapshot(perspectiveOwner)).revision,kind:'perspective_edit',payload:{id:saved[0].id,name:'Tasklist renamed'}};
  await tool(perspectiveOwner,'apply_change',editOmitted);assert.deepEqual((await tool(perspectiveOwner,'query_perspective',{id:saved[0].id})).perspective.view,definitions[0].view);
  const invalid=[{...definitions[0].view,extra:true},{...definitions[0].view,direction:'sideways'},{...definitions[0].view,sort:'action_order'}];
  const beforeInvalid=durable(await snapshot(perspectiveOwner));for(const view of invalid){const request=await args(perspectiveOwner,'perspective_edit',{id:saved[0].id,view});assert.equal((await tool(perspectiveOwner,'apply_change',request)).error.code,'invalid_input');}
  const missingReference=await args(perspectiveOwner,'perspective_add',{name:'Bad reference',filter:{project_id:randomUUID()}});assert.equal((await tool(perspectiveOwner,'apply_change',missingReference)).error.code,'not_found');
  assert.deepEqual(durable(await snapshot(perspectiveOwner)),beforeInvalid);
  evidence.perspectiveDefinitions={owner:perspectiveOwner,definitionTypes:['tasklist','thread','timeline'],queryOrder:'unchanged tree/sibling order',viewOnlySettingsDoNotChangeMembership:true,creationOmissionDefault:defaultView,editOmissionRetainsView:true,invalidViewsRejected:true,missingFilterReferenceRejected:true};
 });
 await scenario('view-only Worker D1 writes preserve other rows, recover unknown replies, race by CAS and protect corrections on replay/Undo',async()=>{
  const tasklistId=(await tool(perspectiveOwner,'list_perspectives')).perspectives.find(row=>row.name==='Tasklist renamed').id;
  const timelineId=(await tool(perspectiveOwner,'list_perspectives')).perspectives.find(row=>row.name==='Timeline').id;
  const thread={type:'thread',sort:'created_at',direction:'desc',group:'status',completion_label:'read',initial_body:'expanded'};
  const before=await snapshot(perspectiveOwner),preview=await tool(perspectiveOwner,'preview_change',{expectedRevision:before.revision,kind:'perspective_edit',payload:{id:timelineId,view:thread}});
  assert(!preview.error,JSON.stringify(preview.error));assert.equal(preview.affected.length,0);assert.deepEqual(preview.affected_perspectives[0].after.view,thread);assert.deepEqual(durable(await snapshot(perspectiveOwner)),durable(before));
  const undoRequest={schemaVersion:2,operationId:randomUUID(),expectedRevision:before.revision,kind:'perspective_edit',payload:{id:timelineId,view:thread}};
  const missingReply=await http('/mcp',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'apply_change',arguments:undoRequest}},{owner:perspectiveOwner});await missingReply.arrayBuffer();
  assert.equal((await tool(perspectiveOwner,'operation_status',{operationId:undoRequest.operationId})).status,'applied');
  const replay=await tool(perspectiveOwner,'apply_change',undoRequest);assert.equal(replay.result.operationId,undoRequest.operationId);assert.deepEqual(replay.perspectives.find(row=>row.id===timelineId).view,thread);
  const undo=await tool(perspectiveOwner,'undo_change',{schemaVersion:2,operationId:randomUUID(),expectedRevision:(await snapshot(perspectiveOwner)).revision,undoOf:undoRequest.operationId});assert(!undo.error,JSON.stringify(undo.error));
  const timelineDefault={type:'timeline',timestamp:'created_at',direction:'asc',group:'day',completion_label:'complete',initial_body:'collapsed'};
  assert.deepEqual(undo.perspectives.find(row=>row.id===timelineId).view,timelineDefault);
  const raceBase=await snapshot(perspectiveOwner),raceView={schemaVersion:2,operationId:randomUUID(),expectedRevision:raceBase.revision,kind:'perspective_edit',payload:{id:timelineId,view:thread}},raceOther={...raceView,operationId:randomUUID(),payload:{id:timelineId,view:timelineDefault}};
  const raced=await Promise.all([tool(perspectiveOwner,'apply_change',raceView),tool(perspectiveOwner,'apply_change',raceOther)]);assert.equal(raced.filter(value=>!value.error).length,1);assert.equal(raced.find(value=>value.error)?.error.code,'conflict');
  const correction={type:'tasklist',sort:'title',direction:'desc',group:'status',completion_label:'acknowledge',show_notes:true};
  const oldOperation={schemaVersion:2,operationId:randomUUID(),expectedRevision:(await snapshot(perspectiveOwner)).revision,kind:'perspective_edit',payload:{id:tasklistId,view:thread}};
  const oldResult=await tool(perspectiveOwner,'apply_change',oldOperation);assert(!oldResult.error,JSON.stringify(oldResult.error));
  const later=await tool(perspectiveOwner,'apply_change',{schemaVersion:2,operationId:randomUUID(),expectedRevision:(await snapshot(perspectiveOwner)).revision,kind:'perspective_edit',payload:{id:tasklistId,view:correction}});assert(!later.error,JSON.stringify(later.error));
  const oldReplay=await tool(perspectiveOwner,'apply_change',oldOperation);assert.equal(oldReplay.result.operationId,oldOperation.operationId);assert.deepEqual(oldReplay.perspectives.find(row=>row.id===tasklistId).view,correction);
  const unsafeUndo=await tool(perspectiveOwner,'undo_change',{schemaVersion:2,operationId:randomUUID(),expectedRevision:(await snapshot(perspectiveOwner)).revision,undoOf:oldOperation.operationId});assert.equal(unsafeUndo.error.code,'undo_conflict');
  const unrelatedBefore=durable(await snapshot(perspectiveOwner)),triggerNames=[];
  const triggerStatements=[];
  for(const table of ['actions','projects','tags','action_tags'])for(const operation of ['INSERT','UPDATE','DELETE']){
   const trigger='view_guard_'+randomUUID().replaceAll('-','');triggerNames.push(trigger);const row=operation==='DELETE'?'OLD':'NEW';
   triggerStatements.push(`CREATE TRIGGER ${trigger} BEFORE ${operation} ON ${table} WHEN ${row}.owner='${perspectiveOwner}' BEGIN SELECT RAISE(ABORT,'view-only edit touched ${table}'); END;`);
  }
  try{
   await sql(triggerStatements.join('\n'));
   const viewOnly={schemaVersion:2,operationId:randomUUID(),expectedRevision:(await snapshot(perspectiveOwner)).revision,kind:'perspective_edit',payload:{id:tasklistId,view:{...correction,group:'project'}}};
   const savedView=await tool(perspectiveOwner,'apply_change',viewOnly);assert(!savedView.error,JSON.stringify(savedView.error));
   assert.deepEqual(durable(savedView).actions,durable(unrelatedBefore).actions);assert.deepEqual(durable(savedView).projects,durable(unrelatedBefore).projects);assert.deepEqual(durable(savedView).tags,durable(unrelatedBefore).tags);assert.deepEqual(durable(savedView).action_tags,durable(unrelatedBefore).action_tags);
   assert.deepEqual((await tool(perspectiveOwner,'query_perspective',{id:tasklistId})).perspective.view,{...correction,group:'project'});
  }finally{if(triggerNames.length)await sql(triggerNames.map(trigger=>`DROP TRIGGER IF EXISTS ${trigger};`).join('\n'));}
  evidence.perspectiveWrites={previewDoesNotWrite:true,missingReplyRecoveredByExactReplay:true,undoRestoresPriorView:true,casCompetition:'one winner',oldReplayKeepsLaterCorrection:true,undoProtectsLaterCorrection:true,viewOnlyBlockedWrites:['actions','projects','tags','action_tags'],workerBinding:'env.DB via Wrangler local D1'};
 });
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
  await sql(`CREATE TRIGGER ${trigger} BEFORE INSERT ON catalog_identity_ledger WHEN NEW.owner='${ownerA}' BEGIN SELECT RAISE(ABORT,'injected local failure'); END;`);
  try{
   const before=await snapshot(),request=await args(ownerA,'project_add',{name:'Atomic failure'}),result=await tool(ownerA,'apply_change',request);
   assert.equal(result.error.code,'outcome_unknown');assert.deepEqual(durable(await snapshot()),durable(before));
   assert.equal((await tool(ownerA,'operation_status',{operationId:request.operationId})).status,'not_observed');
  }finally{await sql(`DROP TRIGGER IF EXISTS ${trigger}`);}
 });
 await scenario('same entity/operation IDs and pruning remain isolated across two owners',async()=>{
  const id=randomUUID(),now='2026-10-09T00:00:00.000Z';
  await sql(`INSERT INTO actions(owner,id,title,revision,status,notes,"order",flagged,created_at,updated_at) VALUES('${ownerA}','${id}','A seeded',0,'active','',0,0,'${now}','${now}'),('${ownerB}','${id}','B seeded',0,'active','',0,0,'${now}','${now}');`);
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
