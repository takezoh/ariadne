import { actionCall, ActionError } from "@/lib/server/actions";
import { verifiedOwner, type VerifiedIdentity } from "@/lib/server/auth";
import { privateDefinitions, privateResources } from "@/lib/mcp/private-registry";
import { UI_URI, widgetHtml } from "@/lib/widget";
import { VERIFICATION_UI_URI, verificationWidgetHtml } from "@/lib/verification-widget";
import { assistanceInstructions } from "@/lib/assistance";
import { z, ZodError } from "zod";
const headers={"Cache-Control":"private, no-store"};
function reply(id:unknown,result:unknown){return Response.json({jsonrpc:"2.0",id,result},{headers});}
/** Every private method requires a capability issued by the request authentication boundary. */
export async function dispatchPrivateMcp(owner:VerifiedIdentity,raw:unknown) {
 verifiedOwner(owner);
 let id:unknown=null;
 try{
  const body=z.object({
   jsonrpc:z.literal("2.0"),
   method:z.string(),
   id:z.union([z.string(),z.number(),z.null()]).optional(),
   params:z.object({protocolVersion:z.string().optional(),name:z.string().optional(),arguments:z.unknown().optional(),uri:z.string().optional()}).passthrough().optional(),
  }).strict().parse(raw);
  id=body.id??null;
  const p=body.params??{};
  if(body.method.startsWith("notifications/"))return new Response(null,{status:202,headers});
  if(body.method==="initialize")return reply(id,{protocolVersion:["2025-03-26","2025-06-18","2025-11-25"].includes(p.protocolVersion??"")?p.protocolVersion:"2025-11-25",capabilities:{tools:{},resources:{}},serverInfo:{name:"action-tools",version:"0.2.0"},instructions:assistanceInstructions});
  if(body.method==="ping")return reply(id,{});
  if(body.method==="tools/list")return reply(id,{tools:privateDefinitions});
  if(body.method==="resources/list")return reply(id,{resources:privateResources});
  if(body.method==="resources/templates/list")return reply(id,{resourceTemplates:[]});
  if(body.method==="resources/read" && (p.uri===UI_URI||p.uri===VERIFICATION_UI_URI))return reply(id,{contents:[{uri:p.uri,mimeType:"text/html;profile=mcp-app",text:p.uri===VERIFICATION_UI_URI?verificationWidgetHtml:widgetHtml,_meta:{"openai/ui":{availableDisplayModes:["inline","fullscreen"]},ui:{prefersBorder:true,csp:{connectDomains:[],resourceDomains:[]}},"openai/widgetDescription":"Structured actions: normal, deferred, completed, details and safe editing."}}]});
  if(body.method==="tools/call"){
   try {const data=await actionCall(owner,p.name??"",p.arguments??{});return reply(id,{content:[{type:"text",text:JSON.stringify(data)}],structuredContent:data});}
   catch(e){if(!(e instanceof ActionError||e instanceof ZodError))console.error("storage unavailable");return reply(id,{isError:true,structuredContent:{error:{code:e instanceof ActionError?e.code:e instanceof ZodError?"invalid_input":"outcome_unknown",message:e instanceof ActionError?e.message:"結果を確認し、同じ要求を再試行してください。"}},content:[{type:"text",text:e instanceof ActionError?e.code+": "+e.message:e instanceof ZodError?"invalid_input: 入力内容を確認してください。":"結果不明です。同じ入力を保ち、一覧を取得して確認してください。"}]});}
  }
  return Response.json({jsonrpc:"2.0",id,error:{code:-32601,message:"Method not found"}},{headers});
 }catch(e){return Response.json({jsonrpc:"2.0",id,error:{code:e instanceof ActionError?-32001:-32700,message:e instanceof ActionError?e.message:"Parse error"}},{status:e instanceof ActionError?e.status:400,headers});}
}
