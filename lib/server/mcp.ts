import {requireOwner} from './auth';
import {ActionError} from '../domain/core';
import {readGuardedJson} from '../http/request-guard';
import {dispatchPrivateMcp} from '../mcp/private-dispatcher';
const headers={"Cache-Control":"private, no-store"};
/** Each HTTP request obtains its identity before entering the private dispatcher. */
export async function POST(req:Request) {
 try {
  const owner=requireOwner(req.headers);
  return await dispatchPrivateMcp(owner,await readGuardedJson(req));
 }catch(e){
  return Response.json({jsonrpc:"2.0",id:null,error:{code:e instanceof ActionError?-32001:-32700,message:e instanceof ActionError?e.message:"Parse error"}},{status:e instanceof ActionError?e.status:400,headers});
 }
}
export function GET(){return new Response(null,{status:405,headers:{...headers,Allow:"POST"}});}
