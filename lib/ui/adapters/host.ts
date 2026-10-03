import type {HostEffects,HostPort,HostContext,DisplayMode,DisplayState,HostInitializeResult} from '../ports';
/** Factory is intentionally closed: its runtime dependencies are explicit ports. */
export function createHostTransport(effects: HostEffects): HostPort {
 let sequence=0,disposed=false;
 const pending=new Map<number,{resolve:(result: unknown)=>void;reject:(error: Error)=>void;timer:unknown}>();
 const subscribers=new Set<(snapshot: unknown)=>void>();
 const contextSubscribers=new Set<(context: Partial<HostContext>)=>void>();
 const failure=(message: string)=>Object.assign(new Error(message),{code:'outcome_unknown'});
 const stop=effects.listen(({trusted,message:m})=>{
  if(!trusted||!m||m.jsonrpc!=='2.0')return;
  const entry=typeof m.id==='number'?pending.get(m.id):undefined;
  if(entry){effects.cancel(entry.timer);pending.delete(m.id!);if(m.error)entry.reject(failure('The host request failed. Your input is retained.'));else entry.resolve(m.result);}
  else if(m.id===undefined&&m.method==='ui/notifications/tool-result')for(const subscriber of subscribers)subscriber(m.params?.structuredContent);
  else if(m.id===undefined&&m.method==='ui/notifications/host-context-changed'&&m.params&&typeof m.params==='object')for(const subscriber of contextSubscribers)subscriber(m.params as Partial<HostContext>);
 });
 return {
  request(method,params){if(disposed)return Promise.reject(failure('Connection closed.'));return new Promise((resolve,reject)=>{
   const id=++sequence,timer=effects.schedule(()=>{pending.delete(id);reject(failure('The result is unknown. Your input is retained.'));},20000);
   pending.set(id,{resolve,reject,timer});
   try{effects.send({jsonrpc:'2.0',id,method,params});}catch{effects.cancel(timer);pending.delete(id);reject(failure('Could not send the request. Your input is retained.'));}
  });},
  notify(method,params){if(!disposed)effects.send({jsonrpc:'2.0',method,params});},
  subscribe(handler){subscribers.add(handler);return ()=>{subscribers.delete(handler);};},
  subscribeContext(handler){contextSubscribers.add(handler);return ()=>{contextSubscribers.delete(handler);};},
  dispose(){disposed=true;stop();for(const entry of pending.values()){effects.cancel(entry.timer);entry.reject(failure('Connection closed.'));}pending.clear();subscribers.clear();contextSubscribers.clear();},
 };
}

/** Display effects are independent from action writes and never create operation IDs. */
export function createDisplayBridge(transport:HostPort,model:{mergeHostContext:(current:HostContext,patch:unknown)=>HostContext},publish:(state:DisplayState)=>void) {
 const state:DisplayState={context:{},contextVersion:0,pending:null,error:null};let disposed=false;
 function context(patch:unknown){state.context=model.mergeHostContext(state.context,patch);if(patch&&typeof patch==='object'&&['inline','fullscreen','pip'].includes(String((patch as Partial<HostContext>).displayMode)))state.contextVersion++;publish(state);}
 const unsubscribe=transport.subscribeContext(context);
 return {state,
  initialize(result:HostInitializeResult){if(result?.hostContext)context(result.hostContext);},
  async request(mode:DisplayMode){
   if(disposed||state.pending)return false;
   if(!['inline','fullscreen'].includes(mode)||!state.context.availableDisplayModes?.includes(mode)){state.error='This display mode is not available.';publish(state);return false;}
   const version=state.contextVersion;state.pending=mode;state.error=null;publish(state);
   try{const result=await transport.request('ui/request-display-mode',{mode}) as {mode?:unknown}|null;
    if(!result||!['inline','fullscreen','pip'].includes(String(result.mode)))throw new Error('The display response could not be verified.');
    if(!disposed&&version===state.contextVersion)state.context=model.mergeHostContext(state.context,{displayMode:result.mode});
    return !disposed;
   }catch{if(!disposed)state.error='Could not switch display. Your current view and unsaved input are retained.';return false;}
   finally{state.pending=null;if(!disposed)publish(state);}
  },
  dispose(){disposed=true;unsubscribe();},
 };
}
