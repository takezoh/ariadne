import test from 'node:test';import assert from 'node:assert/strict';import {register} from 'node:module';
// Metadata reads require no storage; provide an empty Worker environment at its effect boundary.
register('data:text/javascript,'+encodeURIComponent("export function resolve(specifier,context,next){if(specifier==='cloudflare:workers')return {url:'data:text/javascript,export const env={};',shortCircuit:true};return next(specifier,context);}"),import.meta.url);
const {POST}=await import('../../app/mcp/route.ts');
function request(method,params={},headers={}){return new Request('https://local.invalid/mcp',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'test-owner','oai-authenticated-user-email':'test@example.invalid',...headers},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});}
test('private MCP authenticates before every JSON-RPC method and rejects unapproved transport',async()=>{
 for(const method of ['initialize','ping','tools/list','resources/list','resources/read']){
  const unauthenticated=await POST(new Request('https://local.invalid/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params:{}})}));
  assert.equal(unauthenticated.status,401,method);
 }
 const nullOrigin=await POST(request('tools/list',{}, {Origin:'null'}));
 assert.equal(nullOrigin.status,403);
 const badType=await POST(new Request('https://local.invalid/mcp',{method:'POST',headers:{'Content-Type':'text/plain','oai-authenticated-user-id':'test-owner','oai-authenticated-user-email':'test@example.invalid'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list',params:{}})}));
 assert.equal(badType.status,415);
});
test('MCP exposes one Ariadne launcher while list retains the shared resource',async()=>{
 const response=await POST(request('tools/list'));assert.equal(response.headers.get('cache-control'),'private, no-store');const tools=(await response.json()).result.tools;const open=tools.find(t=>t.name==='open_actions'),list=tools.find(t=>t.name==='list_actions');
 assert.deepEqual(open._meta['openai/ui'].entrypoints,[{type:'global'},{type:'thread'}]);assert.equal(open.title,'Ariadne');assert.equal(list._meta['openai/ui'],undefined);assert.equal(list._meta.ui.resourceUri,open._meta.ui.resourceUri);
 const resources=(await (await POST(request('resources/list'))).json()).result.resources;assert.equal(resources.length,2);assert(resources.some(r=>r.uri===open._meta.ui.resourceUri));
});
test('MCP resource declares supported host modes while retaining CSP and HTML identity',async()=>{
 const tools=(await (await POST(request('tools/list'))).json()).result.tools;const uri=tools.find(t=>t.name==='open_actions')._meta.ui.resourceUri;const response=await POST(request('resources/read',{uri}));const content=(await response.json()).result.contents[0];
 assert.equal(content.uri,uri);assert.equal(content.mimeType,'text/html;profile=mcp-app');assert.deepEqual(content._meta['openai/ui'].availableDisplayModes,['inline','fullscreen']);assert.deepEqual(content._meta.ui.csp,{connectDomains:[],resourceDomains:[]});assert.equal(content._meta.ui.prefersBorder,true);assert.match(content.text,/<!doctype html>/i);
});
test('MCP action titles and catalog names retain required semantics',async()=>{
 const tools=(await (await POST(request('tools/list'))).json()).result.tools;for(const name of ['add_action','rename_action']){const title=tools.find(t=>t.name===name).inputSchema.properties.title;assert.equal(title.maxLength,200);assert.equal(title.minLength,1);}assert.equal(tools.find(t=>t.name==='capture_intent').inputSchema.properties.title.minLength,1);assert.match(tools.find(t=>t.name==='apply_change').description,/tag_ids/);assert.match(tools.find(t=>t.name==='apply_change').description,/one request/);
});

test('MCP publishes exactly the current tool names without aliases',async()=>{
 const tools=(await (await POST(request('tools/list'))).json()).result.tools;
 assert.deepEqual(tools.map(t=>t.name).sort(),['add_action','apply_change','capture_intent','get_relevant_context','list_actions','list_perspectives','open_actions','open_verification','operation_status','preview_change','query_actions','query_perspective','rename_action','undo_change']);
});

test('MCP exposes bounded structural action_move without changing the tool-name surface',async()=>{const tools=(await (await POST(request('tools/list'))).json()).result.tools;const apply=tools.find(t=>t.name==='apply_change');assert(apply.inputSchema.properties.kind.enum.includes('action_move'));assert.match(apply.description,/action_move/);assert.match(apply.description,/placement/);});

test('MCP discovery distinguishes a Defer calendar date from an offset-bearing instant',async()=>{
 const tools=(await (await POST(request('tools/list'))).json()).result.tools;
 for(const name of ['preview_change','apply_change']){
  const tool=tools.find(t=>t.name===name),condition=tool.inputSchema.allOf.find(x=>x.if?.properties?.kind?.const==='defer'),payload=condition.then.properties.payload;
  assert.deepEqual(payload.required,['id']);assert.equal(payload.additionalProperties,false);
  assert.deepEqual(payload.oneOf,[{required:['date','timezone'],not:{required:['until']}},{required:['until'],not:{required:['date']}}]);
  assert(new RegExp(payload.properties.date.pattern).test('2026-10-10'));
  const instant=new RegExp(payload.properties.until.anyOf.find(x=>x.type==='string').pattern);
  assert(!instant.test('2026-10-10'));assert(!instant.test('2026-10-10T09:00:00'));assert(instant.test('2026-10-10T09:00:00+09:00'));assert(instant.test('2026-10-10T00:00:00.000Z'));
  assert.match(tool.description,/date/);assert.match(tool.description,/timezone/);assert.match(tool.description,/Never|never/);
 }
 const init=(await (await POST(request('initialize'))).json()).result;
 assert(init.instructions.includes('date:"2026-10-10",timezone:"Asia/Tokyo"'));assert(init.instructions.includes('Never put YYYY-MM-DD in until'));
});


test('private entry cannot expose discovery through a pre-auth debug branch',async()=>{
 const response=await POST(new Request('https://local.invalid/mcp',{method:'POST',headers:{'Content-Type':'application/json','x-debug':'true'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})}));
 assert.equal(response.status,401);const body=await response.json();assert.equal(body.result,undefined);
});
test('every private dispatcher method rejects unissued identity capabilities before parsing or private effects',async()=>{
 const {dispatchPrivateMcp}=await import('../../lib/mcp/private-dispatcher.ts');
 for(const owner of [null,'A',{owner:'A'}])for(const method of ['initialize','ping','tools/list','resources/list','resources/read','tools/call','notifications/initialized']){
  await assert.rejects(dispatchPrivateMcp(owner,{jsonrpc:'2.0',id:1,method}),e=>e.code==='unauthenticated');
 }
});
