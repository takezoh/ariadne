import {test} from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {sqliteFixture} from '../helpers/sqlite-d1.mjs';
// Replace only the Worker binding; use the actual routes, composition and SQLite adapter.
const bindingKey='description-route-env';
globalThis[Symbol.for(bindingKey)]={};
register('data:text/javascript,'+encodeURIComponent(`export function resolve(specifier,context,next){if(specifier==='cloudflare:workers')return {url:'data:text/javascript,'+encodeURIComponent('export const env=globalThis[Symbol.for(${JSON.stringify(bindingKey)})];'),shortCircuit:true};return next(specifier,context);}`),import.meta.url);
const {POST:http}=await import('../../app/api/actions/route.ts');
const {POST:mcp}=await import('../../app/mcp/route.ts');
test('HTTP and MCP share exact description state, validation, replay and owner isolation',async t=>{
 const fixture=sqliteFixture();t.after(()=>{fixture.sql.close();delete globalThis[Symbol.for(bindingKey)].DB;});globalThis[Symbol.for(bindingKey)].DB=fixture.db;
 const headers=owner=>({'content-type':'application/json','oai-authenticated-user-id':owner,'oai-authenticated-user-email':'test@example.invalid'});
 const request=(body,owner='A')=>new Request('https://local.invalid/api/actions',{method:'POST',headers:headers(owner),body:JSON.stringify(body)});
 const web=async(name,args={},owner='A')=>{const result=await http(request({name,arguments:args},owner));return {status:result.status,data:await result.json()};};
 const rpc=async(name,args={},owner='A')=>{const result=await mcp(request({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}},owner));return (await result.json()).result;};
 const write=(revision,kind,payload)=>({schemaVersion:2,operationId:crypto.randomUUID(),expectedRevision:revision,kind,payload});
 let revision=0;
 for(const kind of ['project','tag','perspective']){
  const key=kind==='perspective'?'perspectives':kind+'s',raw='  exact\r\n日本語 🐈  ',create=kind==='perspective'?'perspective_add':kind+'_get_or_create';
  const saved=await web('apply_change',write(revision,create,{name:kind,description:raw,...(kind==='perspective'?{filter:{}}:{})}));
  assert.equal(saved.status,200);revision=saved.data.revision;const entity=saved.data[key][0];assert.equal(entity.description,raw);
  const read=await rpc('list_actions');assert.equal(read.structuredContent[key][0].description,raw);assert.deepEqual(JSON.parse(read.content[0].text),read.structuredContent);
  const args=write(revision,kind+'_edit',{id:entity.id,description:''}),edited=await rpc('apply_change',args);assert(!edited.isError);revision=edited.structuredContent.revision;
  assert.equal((await web('list_actions')).data[key][0].description,'');
  assert.equal((await rpc('apply_change',args)).structuredContent.revision,revision);
  const invalid=write(revision,kind+'_edit',{id:entity.id,description:null});
  assert.equal((await web('apply_change',invalid)).status,400);assert.equal((await rpc('apply_change',invalid)).structuredContent.error.code,'invalid_input');
  assert.deepEqual((await web('list_actions',{},'B')).data[key],[]);
 }
 const tools=await mcp(request({jsonrpc:'2.0',id:2,method:'tools/list'}));const definitions=(await tools.json()).result.tools;
 const operation=definitions.find(x=>x.name==='apply_change');assert(operation.description.includes('description?'));assert(operation.description.includes('65536 UTF-16'));
});
