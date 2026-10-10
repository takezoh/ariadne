import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Linter,ESLint} from 'eslint';
import {resolve} from 'node:path';
import ts from 'typescript';
import boundaries from '../../scripts/lint/boundaries.mjs';
function lint(code,filename){
 return new Linter().verify(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ESNext}}).outputText,[{files:['**/*.{js,ts,mjs}'],plugins:{architecture:boundaries},rules:Object.fromEntries(Object.keys(boundaries.rules).map(key=>['architecture/'+key,'error'])),languageOptions:{ecmaVersion:'latest',sourceType:'module'}}],{filename:resolve(filename)});
}
const reports=(messages,rule)=>messages.some(item=>item.ruleId==='architecture/'+rule);
test('negative dependencies include extensionless aliases, re-exports and indirect capability shims',()=>{
 for(const source of ["import {x} from '@/lib/server/actions';x();","export * from '@/lib/adapters/d1-action-store';","export * from '@/lib/domain/shim';"]){assert(reports(lint(source,'lib/mcp/public-registry.ts'),'private-composition'));}
 assert(reports(lint("export * from '@/lib/adapters/d1-action-store';",'lib/domain/shim.ts'),'capability-direction'));
 assert(reports(lint("import {x} from '../adapters/d1-action-store';x();",'lib/application/sample.ts'),'dependency-direction'));
});
test('negative native SQL aliases and computed calls fail outside exact adapter',()=>{
 for(const source of ["db.prepare('SELECT 1');","connection['prepare']('SELECT 1');","import {sql as q} from 'drizzle-orm';q.raw('x');","connection.exec('x');"]){assert(reports(lint(source,'app/sample.ts'),'raw-sql-location'),source);}
});
async function actualLint(code,filePath){const [result]=await new ESLint({cwd:process.cwd()}).lintText(code,{filePath});return result.messages;}
test('actual repository config rejects direct D1 imports in both HTTP entries',async()=>{
 for(const path of ['app/mcp/route.ts','app/api/actions/route.ts']){
  const original=readFileSync(path,'utf8');
  assert(!reports(await actualLint(original,path),'capability-direction'));
  for(const source of ["@/lib/adapters/worker-database","@/lib/adapters/d1-action-store.ts","@/lib/database"]){
   const mutant=`import * as direct from '${source}';\n${original}\nvoid direct;\n`;
   assert(reports(await actualLint(mutant,path),'capability-direction'),path+': '+source);
  }
 }
});
test('actual repository config rejects pre-auth private dispatch and alternate entry handlers',async()=>{
 const path='app/mcp/route.ts',original=readFileSync(path,'utf8');
 const legacyBypass=`import {privateDefinitions} from '@/lib/mcp/private-registry';
 export const dynamic='force-dynamic';
 export async function POST(req){let id=null;try{
  if(req.headers.get('x-debug'))return Response.json({tools:privateDefinitions});
  const owner=requireOwner(req.headers);const body={};
  return actionCall(owner,'list_actions',body);
 }catch{return Response.json({id});}}`;
 for(const mutant of [legacyBypass,original+"export function PUT(){return Response.json({});}",original.replace('POST,GET','POST')])assert(reports(await actualLint(mutant,path),'private-auth'));
 const boundary=readFileSync('lib/server/mcp.ts','utf8');
 assert(!reports(await actualLint(boundary,'lib/server/mcp.ts'),'private-auth'));
 for(const mutant of [
  boundary.replace('const owner=requireOwner(req.headers);','const owner="A";'),
  boundary.replace('dispatchPrivateMcp(owner,','dispatchPrivateMcp("A",'),
  boundary.replace('const owner=requireOwner(req.headers);',"if(req.headers.get('x-debug'))return Response.json({tools:privateDefinitions});\n  const owner=requireOwner(req.headers);"),
  boundary.replace('return await dispatchPrivateMcp(owner,await readGuardedJson(req));',"return await dispatchPrivateMcp(owner,await readGuardedJson(req));").replace('}catch(e){',"}catch(e){ return dispatchPrivateMcp(owner,{});"),
 ])assert(reports(await actualLint(mutant,'lib/server/mcp.ts'),'private-auth'));
 const leaked=boundary.replace("import {requireOwner}","import {privateDefinitions} from '../mcp/private-registry';\nimport {requireOwner}");
 assert(reports(await actualLint(leaked,'lib/server/mcp.ts'),'capability-direction'));
});
test('actual repository config requires runtime capability validation before private dispatcher branches',async()=>{
 const path='lib/mcp/private-dispatcher.ts',source=readFileSync(path,'utf8');
 assert(!reports(await actualLint(source,path),'private-auth'));
 for(const mutant of [source.replace(' verifiedOwner(owner);',''),source.replace('actionCall(owner,','actionCall("A",'),source.replace(' verifiedOwner(owner);'," if(raw)return Response.json({tools:privateDefinitions});\n verifiedOwner(owner);")])assert(reports(await actualLint(mutant,path),'private-auth'));
});
test('removing owner WHERE, owner bind, or conflict key from actual adapter fails the gate',()=>{
 const source=readFileSync('lib/adapters/d1-action-store.ts','utf8');
 assert(!reports(lint(source,'lib/adapters/d1-action-store.ts'),'owner-sql'));
 for(const mutant of [source.replace('WHERE owner=? AND operation_id=?','WHERE operation_id=?'),source.replace('.bind(owner,operationId)','.bind(operationId)'),source.replace('ON CONFLICT(owner,','ON CONFLICT(')])assert(reports(lint(mutant,'lib/adapters/d1-action-store.ts'),'owner-sql'));
});
test('runtime sql.raw remains forbidden inside reviewed adapter',()=>{
 const source="import {sql} from 'drizzle-orm';sql.raw('arbitrary');";
 // The reviewed adapter may build closed native statements, never a raw ORM escape hatch.
 assert(reports(lint(source,'lib/adapters/d1-action-store.ts'),'owner-sql')||reports(lint(source,'lib/adapters/d1-action-store.ts'),'raw-sql-location'));
});
test('DOM adapter public state is read-only and changes use controller events',async()=>{
 const path='lib/ui/adapters/dom.js',source=readFileSync(path,'utf8');
 assert(!reports(await actualLint(source,path),'readonly-ui-state'));
 for(const mutant of [
  source.replace('function render(){','function render(){state.selectedId="changed";'),
  source.replace('function render(){','function render(){state.drafts.id.title="changed";'),
  source.replace('function render(){','function render(){state.batch++;'),
  source.replace('function render(){','function render(){state.batchIds.push("id");'),
  source.replace('function render(){','function render(){Object.assign(state.drafts.id,{title:"changed"});'),
 ])assert(reports(await actualLint(mutant,path),'readonly-ui-state'));
});
