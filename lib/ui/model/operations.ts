export interface RetainedRequest {name:string;args:Readonly<Record<string,unknown>>}
export interface OperationState {unknown:RetainedRequest|null;lastOperation:string|null}
export function retainRequest(name:string,args:Record<string,unknown>):RetainedRequest {
 // JSON is the wire contract; retain an independent exact payload before effects.
 return {name,args:JSON.parse(JSON.stringify(args)) as Record<string,unknown>};
}
export function operationSucceeded(state:OperationState,operationId:string|undefined):OperationState {
 return {unknown:null,lastOperation:operationId||state.lastOperation};
}
export function operationUnknown(state:OperationState,request:RetainedRequest):OperationState {
 return {...state,unknown:request};
}

/** Creation identity comes only from a confirmed receipt, never from its title. */
export function createdActionId(result:unknown):string|null {
 const actions=(result as {resolved?:{actions?:unknown}}|null)?.resolved?.actions;
 if(!Array.isArray(actions)||actions.length!==1)return null;
 const value=actions[0]?.id;
 return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)?value:null;
}
