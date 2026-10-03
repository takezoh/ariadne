import type {HostPort} from './ports';
export interface ToolResult {isError?:boolean;structuredContent?: unknown;content?:Array<{type:string;text?:string}>}
/** Application orchestration; host shape and transport failure remain behind the port. */
export function createToolClient(host:HostPort,ready:Promise<unknown>,presentError?:(code:unknown)=>string){
 return async function call(name:string,args:unknown):Promise<unknown>{
  await ready;
  const result=await host.request('tools/call',{name,arguments:args}) as ToolResult|undefined;
  if(result?.isError){
   const detail=(result.structuredContent as {error?:{message?:string;code?:string}}|undefined)?.error;
   throw Object.assign(new Error(presentError?.(detail?.code||'outcome_unknown')||'Could not complete this operation. Your input is retained.'),{code:detail?.code||'outcome_unknown'});
  }
  if(!result||!result.structuredContent||typeof result.structuredContent!=='object'||Array.isArray(result.structuredContent))throw Object.assign(new Error('The save result could not be verified.'),{code:'outcome_unknown'});
  return result.structuredContent;
 };
}
