import test from 'node:test';import assert from 'node:assert/strict';
import {mergeHostContext,displayAvailability,formatTimestamp} from '../../lib/ui/model/display.ts';
import {createDisplayBridge} from '../../lib/ui/effects/host.ts';
test('display context merges direct partial updates without changing omitted mode or mutating input',()=>{
 const initial={displayMode:'inline',availableDisplayModes:['inline','fullscreen'],theme:'light'};const next=mergeHostContext(initial,{theme:'dark',displayMode:'sidebar',availableDisplayModes:['fullscreen','invented']});
 assert.deepEqual(next,{...initial,theme:'dark'});assert.equal(initial.theme,'light');assert.deepEqual(displayAvailability({}),{mode:null,canInline:false,canFullscreen:false});
 const updated=mergeHostContext(next,{availableDisplayModes:[]});assert.deepEqual(updated.availableDisplayModes,[]);assert.equal(updated.displayMode,'inline');
});
test('host safe-area insets accept finite nonnegative values, preserve partial state and reset explicitly to zero',()=>{
 const insets={top:12,right:8,bottom:24,left:4},initial=mergeHostContext({}, {safeAreaInsets:insets});
 assert.deepEqual(initial.safeAreaInsets,insets);assert.notEqual(initial.safeAreaInsets,insets);
 const malformed=[{top:1,right:-1,bottom:2,left:3},{top:1,right:2,bottom:Infinity,left:3},{top:1,right:2,bottom:3,left:'4'}];
 for(const safeAreaInsets of malformed){const next=mergeHostContext(initial,{safeAreaInsets});assert.deepEqual(next.safeAreaInsets,insets);assert.notEqual(next,initial);}
 const reset=mergeHostContext(initial,{safeAreaInsets:{top:0,right:0,bottom:0,left:0}});assert.deepEqual(reset.safeAreaInsets,{top:0,right:0,bottom:0,left:0});
 assert.deepEqual(initial.safeAreaInsets,insets);
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

test('saved UTC instants format by explicit locale and timezone across a DST jump',()=>{
 const before=formatTimestamp('2026-03-08T09:00:00.000Z','en-US','America/Los_Angeles'),after=formatTimestamp('2026-03-08T10:00:00.000Z','en-US','America/Los_Angeles');
 assert.match(before,/Mar 8, 2026, 1:00 AM/);assert.match(after,/Mar 8, 2026, 3:00 AM/);assert.match(formatTimestamp('2026-03-08T09:00:00.000Z','fr-FR','Europe/Paris'),/8 mars 2026.*10:00/);
 assert.equal(formatTimestamp(undefined,'en-US','UTC'),'—');assert.equal(formatTimestamp('2026-03-08','en-US','UTC'),'—');assert.equal(formatTimestamp('2026-02-30T09:00:00Z','en-US','UTC'),'—');assert.equal(formatTimestamp('2026-03-08T09:00:00','en-US','UTC'),'—');
});
