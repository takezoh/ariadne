import {createInterface} from 'node:readline';
import {publicCall,publicDefinitions,PUBLIC_SERVER_INFO} from './public-registry.ts';
// Stdio transport has no credential, environment, network or database capability.
const lines=createInterface({input:process.stdin,crlfDelay:Infinity});
for await(const line of lines){
 let id=null;
 try{
  const request=JSON.parse(line);id=request.id??null;
  if(request.jsonrpc!=='2.0'||typeof request.method!=='string')throw Error('Invalid request');
  if(request.id===undefined)continue;
  let result;
  switch(request.method){
   case 'initialize':result={protocolVersion:'2025-11-25',capabilities:{tools:{}},serverInfo:PUBLIC_SERVER_INFO};break;
   case 'ping':result={};break;
   case 'tools/list':result={tools:publicDefinitions};break;
   case 'resources/list':result={resources:[]};break;
   case 'resources/templates/list':result={resourceTemplates:[]};break;
   case 'tools/call':{const value=publicCall(request.params?.name,request.params?.arguments??{});result={content:[{type:'text',text:JSON.stringify(value)}],structuredContent:value};break;}
   default:throw Error('Method not found');
  }
  process.stdout.write(JSON.stringify({jsonrpc:'2.0',id,result})+'\n');
 }catch{process.stdout.write(JSON.stringify({jsonrpc:'2.0',id,error:{code:-32600,message:'Invalid public request'}})+'\n');}
}
