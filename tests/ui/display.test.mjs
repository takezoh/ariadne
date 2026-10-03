import test from 'node:test';import assert from 'node:assert/strict';
import {mergeHostContext,displayAvailability} from '../../lib/ui/model/display.ts';
import {createDisplayBridge} from '../../lib/ui/adapters/host.ts';
test('display context merges direct partial updates without changing omitted mode or mutating input',()=>{
 const initial={displayMode:'inline',availableDisplayModes:['inline','fullscreen'],theme:'light'};const next=mergeHostContext(initial,{theme:'dark',displayMode:'sidebar',availableDisplayModes:['fullscreen','invented']});
 assert.deepEqual(next,{...initial,theme:'dark'});assert.equal(initial.theme,'light');assert.deepEqual(displayAvailability({}),{mode:null,canInline:false,canFullscreen:false});
 const updated=mergeHostContext(next,{availableDisplayModes:[]});assert.deepEqual(updated.availableDisplayModes,[]);assert.equal(updated.displayMode,'inline');
});
function fixture(){let receive,resolve,reject;const calls=[],published=[];const transport={subscribeContext:fn=>{receive=fn;return ()=>{receive=()=>{}}},request:(method,params)=>{calls.push({method,params});return new Promise((yes,no)=>{resolve=yes;reject=no})}};const bridge=createDisplayBridge(transport,{mergeHostContext},state=>published.push(structuredClone(state)));return {bridge,calls,published,receive:value=>receive(value),resolve:value=>resolve(value),reject:value=>reject(value)};}
test('display bridge initializes host context and accepts actual response mode independently of target',async()=>{
 const f=fixture();f.bridge.initialize({hostContext:{displayMode:'inline',availableDisplayModes:['inline','fullscreen']}});const pending=f.bridge.request('fullscreen');assert.equal(f.bridge.state.pending,'fullscreen');assert.deepEqual(f.calls,[{method:'ui/request-display-mode',params:{mode:'fullscreen'}}]);f.resolve({mode:'inline'});assert.equal(await pending,true);assert.equal(f.bridge.state.context.displayMode,'inline');assert.equal(f.bridge.state.pending,null);
});
test('new host notification defeats older mode reply and partial updates preserve capabilities',async()=>{
 const f=fixture();f.bridge.initialize({hostContext:{displayMode:'inline',availableDisplayModes:['inline','fullscreen'],theme:'light'}});const pending=f.bridge.request('fullscreen');f.receive({displayMode:'inline',theme:'dark'});f.resolve({mode:'fullscreen'});await pending;assert.equal(f.bridge.state.context.displayMode,'inline');assert.equal(f.bridge.state.context.theme,'dark');assert.deepEqual(f.bridge.state.context.availableDisplayModes,['inline','fullscreen']);
});
test('unsupported capability never requests and malformed or rejected reply preserves acknowledged mode',async()=>{
 const f=fixture();f.bridge.initialize({hostCapabilities:{availableDisplayModes:['inline','fullscreen']}});assert.equal(await f.bridge.request('fullscreen'),false);assert.equal(f.calls.length,0);
 f.bridge.initialize({hostContext:{displayMode:'inline',availableDisplayModes:['inline','fullscreen']}});let pending=f.bridge.request('fullscreen');assert.equal(await f.bridge.request('inline'),false);f.resolve({mode:'sidebar'});assert.equal(await pending,false);assert.equal(f.bridge.state.context.displayMode,'inline');assert.match(f.bridge.state.error,/Could not switch display/);
 pending=f.bridge.request('fullscreen');f.reject(new Error('host refused'));assert.equal(await pending,false);assert.equal(f.bridge.state.context.displayMode,'inline');assert.match(f.bridge.state.error,/Could not switch display/);f.bridge.dispose();assert.equal(await f.bridge.request('fullscreen'),false);
});

test('theme-only update during pending display request does not suppress authoritative mode response',async()=>{
 const f=fixture();f.bridge.initialize({hostContext:{displayMode:'inline',availableDisplayModes:['inline','fullscreen'],theme:'light'}});const pending=f.bridge.request('fullscreen');f.receive({theme:'dark'});f.resolve({mode:'fullscreen'});await pending;assert.equal(f.bridge.state.context.displayMode,'fullscreen');assert.equal(f.bridge.state.context.theme,'dark');
});
