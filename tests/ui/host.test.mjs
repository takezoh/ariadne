import test from 'node:test';import assert from 'node:assert/strict';
import {createHostTransport} from '../../lib/ui/adapters/host.ts';
function fixture(){let receive;const sent=[],timers=new Map();let id=0;const host=createHostTransport({send:m=>sent.push(m),listen:fn=>{receive=fn;return ()=>{receive=()=>{};}},schedule:fn=>{timers.set(++id,fn);return id},cancel:id=>timers.delete(id)});return {host,sent,timers,receive:e=>receive(e)}}
test('host adapter ignores untrusted response and late timed out reply',async()=>{
 const f=fixture(),p=f.host.request('tools/call',{name:'add'});f.receive({trusted:false,message:{jsonrpc:'2.0',id:1,result:'spoof'}});assert.equal(f.timers.size,1);
 const rejected=assert.rejects(p,{code:'outcome_unknown'});[...f.timers.values()][0]();await rejected;
 let notification=0;f.host.subscribe(()=>notification++);f.receive({trusted:true,message:{jsonrpc:'2.0',id:1,result:'late'}});assert.equal(notification,0);f.host.dispose();
});
test('host adapter routes responses, notifications and releases timers',async()=>{
 const f=fixture(),p=f.host.request('initialize',{});f.receive({trusted:true,message:{jsonrpc:'2.0',id:1,result:{ok:true}}});assert.deepEqual(await p,{ok:true});assert.equal(f.timers.size,0);
 const received=[];const unsubscribe=f.host.subscribe(x=>received.push(x));f.receive({trusted:true,message:{jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:{revision:2}}}});assert.deepEqual(received,[{revision:2}]);unsubscribe();f.host.dispose();assert.rejects(f.host.request('x',{}),{code:'outcome_unknown'});
});
test('host adapter disposal rejects outstanding requests',async()=>{const f=fixture();const p=f.host.request('tools/call',{});const rejected=assert.rejects(p,{code:'outcome_unknown'});f.host.dispose();await rejected;assert.equal(f.timers.size,0)});
import {createDiscardingEffects} from '../../lib/ui/adapters/verification.ts';
test('verification fixture discards exactly one trusted write response, while still executing request',()=>{
 let receive,armed=true;const sent=[],messages=[];let discarded=0;
 const effects=createDiscardingEffects({send:m=>sent.push(m),listen:fn=>{receive=fn;return ()=>{}},schedule:()=>0,cancel:()=>{}},{consume:()=>{const value=armed;armed=false;return value},discarded:()=>discarded++});
 effects.listen(event=>messages.push(event));effects.send({jsonrpc:'2.0',id:7,method:'tools/call',params:{name:'apply_change'}});assert.equal(sent.length,1);
 receive({trusted:false,message:{id:7}});assert.equal(discarded,0);receive({trusted:true,message:{id:7}});assert.equal(discarded,1);receive({trusted:true,message:{id:7}});assert.equal(messages.length,2);
});
test('host context notification has separate direct partial subscription and disposal',()=>{
 const f=fixture(),contexts=[],snapshots=[];const stop=f.host.subscribeContext(value=>contexts.push(value));f.host.subscribe(value=>snapshots.push(value));
 f.receive({trusted:false,message:{jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{displayMode:'fullscreen'}}});
 f.receive({trusted:true,message:{jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{theme:'dark'}}});
 assert.deepEqual(contexts,[{theme:'dark'}]);assert.deepEqual(snapshots,[]);stop();f.receive({trusted:true,message:{jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{displayMode:'inline'}}});assert.equal(contexts.length,1);f.host.dispose();
});
