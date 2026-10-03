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
   if(event.trusted&&typeof event.message?.id==='number'&&discarded.delete(event.message.id)){arm.discarded();return;}
   handler(event);
  });},
 };
}
