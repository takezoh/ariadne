import test from 'node:test';import assert from 'node:assert/strict';
import {createHostTransport} from '../../lib/ui/effects/host.ts';
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
test('inbound requests dispatch before a same-ID pending response and preserve string request IDs',async()=>{
 const f=fixture(),p=f.host.request('ui/initialize',{}),handled=[];f.host.registerRequestHandler((method,params)=>{handled.push({method,params});return {tools:[{name:'local'}]};});
 f.receive({trusted:true,message:{jsonrpc:'2.0',id:1,method:'tools/list',params:{}}});await Promise.resolve();await Promise.resolve();
 assert.deepEqual(handled,[{method:'tools/list',params:{}}]);assert.equal(f.timers.size,1);assert.deepEqual(f.sent.at(-1),{jsonrpc:'2.0',id:1,result:{tools:[{name:'local'}]}});
 f.receive({trusted:true,message:{jsonrpc:'2.0',id:1,result:{initialized:true}}});assert.deepEqual(await p,{initialized:true});
 f.receive({trusted:true,message:{jsonrpc:'2.0',id:'selection-1',method:'tools/call',params:{name:'get_selection_context'}}});await Promise.resolve();await Promise.resolve();assert.deepEqual(f.sent.at(-1),{jsonrpc:'2.0',id:'selection-1',result:{tools:[{name:'local'}]}});f.host.dispose();
});
test('malformed same-ID replies cannot settle pending requests and disposal suppresses queued handlers',async()=>{
 const f=fixture(),p=f.host.request('initialize',{});let settled=false;p.then(()=>{settled=true;},()=>{settled=true;});
 for(const message of [{jsonrpc:'2.0',id:1,method:null,result:'bad'},{jsonrpc:'2.0',id:1,method:7,result:'bad'},{jsonrpc:'2.0',id:1,result:'bad',error:{code:0,message:'also bad'}},{jsonrpc:'2.0',id:1,error:{code:'-32000',message:'bad'}}])f.receive({trusted:true,message});
 await Promise.resolve();assert.equal(settled,false);assert.equal(f.timers.size,1);f.receive({trusted:true,message:{jsonrpc:'2.0',id:1,result:'good'}});assert.equal(await p,'good');
 const queued=fixture();let calls=0;queued.host.registerRequestHandler(()=>{calls++;return {ok:true};});queued.receive({trusted:true,message:{jsonrpc:'2.0',id:'queued',method:'tools/call',params:{}}});queued.host.dispose();await Promise.resolve();await Promise.resolve();assert.equal(calls,0);assert.equal(queued.sent.length,0);
});
test('host adapter disposal rejects outstanding requests',async()=>{const f=fixture();const p=f.host.request('tools/call',{});const rejected=assert.rejects(p,{code:'outcome_unknown'});f.host.dispose();await rejected;assert.equal(f.timers.size,0)});
import {createDiscardingEffects} from '../../lib/ui/effects/verification.ts';
test('verification fixture discards exactly one trusted write response, while still executing request',()=>{
 let receive,armed=true;const sent=[],messages=[];let discarded=0;
 const effects=createDiscardingEffects({send:m=>sent.push(m),listen:fn=>{receive=fn;return ()=>{}},schedule:()=>0,cancel:()=>{}},{consume:()=>{const value=armed;armed=false;return value},discarded:()=>discarded++});
 effects.listen(event=>messages.push(event));effects.send({jsonrpc:'2.0',id:7,method:'tools/call',params:{name:'apply_change'}});assert.equal(sent.length,1);
 receive({trusted:false,message:{jsonrpc:'2.0',id:7,result:{ok:true}}});assert.equal(discarded,0);
 receive({trusted:true,message:{jsonrpc:'2.0',id:7,method:'tools/call',params:{name:'get_selection_context'}}});assert.equal(discarded,0);
 receive({trusted:true,message:{jsonrpc:'2.0',id:7,method:null,result:{bad:true}}});assert.equal(discarded,0);
 receive({trusted:true,message:{jsonrpc:'2.0',id:7,error:{code:'-32000',message:'bad'}}});assert.equal(discarded,0);
 receive({trusted:true,message:{jsonrpc:'2.0',id:7,result:{ok:true}}});assert.equal(discarded,1);receive({trusted:true,message:{jsonrpc:'2.0',id:7,result:{later:true}}});assert.equal(messages.length,5);
});
test('host context notification has separate direct partial subscription and disposal',()=>{
 const f=fixture(),contexts=[],snapshots=[];const stop=f.host.subscribeContext(value=>contexts.push(value));f.host.subscribe(value=>snapshots.push(value));
 f.receive({trusted:false,message:{jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{displayMode:'fullscreen'}}});
 f.receive({trusted:true,message:{jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{theme:'dark'}}});
 assert.deepEqual(contexts,[{theme:'dark'}]);assert.deepEqual(snapshots,[]);stop();f.receive({trusted:true,message:{jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{displayMode:'inline'}}});assert.equal(contexts.length,1);f.host.dispose();
});
