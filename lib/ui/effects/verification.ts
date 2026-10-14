import type {HostEffects,HostMessage} from '../ports';
/** Explicitly armed verification fixture discards one response, never the write. */
export function createDiscardingEffects(effects:HostEffects,arm:{consume():boolean;discarded():void}):HostEffects {
 const discarded=new Set<number>();
 return {...effects,
  send(message){const request=message as HostMessage&{params?:{name?:string}};
   if(request.method==='tools/call'&&typeof request.id==='number'&&['add_action','apply_change','capture_intent','undo_change'].includes(request.params?.name||'')&&arm.consume())discarded.add(request.id);
   effects.send(message);
  },
  listen(handler){return effects.listen(event=>{
   const message=event.message,hasResult=Boolean(message&&Object.hasOwn(message,'result')),hasError=Boolean(message&&Object.hasOwn(message,'error')),error=message?.error as {code?:unknown;message?:unknown}|undefined,validError=Boolean(error&&Number.isInteger(error.code)&&typeof error.message==='string');
   if(event.trusted&&message?.jsonrpc==='2.0'&&!Object.hasOwn(message,'method')&&typeof message.id==='number'&&hasResult!==hasError&&(!hasError||validError)&&discarded.delete(message.id)){arm.discarded();return;}
   handler(event);
  });},
 };
}
