import test from 'node:test';import assert from 'node:assert/strict';
import {createToolClient} from '../../lib/ui/controller.ts';
test('tool client waits for initialize and exposes structured snapshot',async()=>{
 let initialize;const ready=new Promise(resolve=>initialize=resolve);const calls=[];
 const call=createToolClient({request:async(...args)=>{calls.push(args);return {structuredContent:{revision:3}}}},ready);
 const result=call('list_actions',{});await Promise.resolve();assert.equal(calls.length,0);initialize();assert.deepEqual(await result,{revision:3});assert.deepEqual(calls,[['tools/call',{name:'list_actions',arguments:{}}]]);
});
test('tool client preserves definite domain rejection and treats missing classification as unknown',async()=>{
 for(const [response,code] of [[{isError:true,structuredContent:{error:{message:'revision changed',code:'revision_conflict'}}},'revision_conflict'],[{isError:true,content:[{type:'text',text:'gateway failed'}]},'outcome_unknown']]){
  const call=createToolClient({request:async()=>response},Promise.resolve());await assert.rejects(call('apply_change',{}),{code});
 }
});
test('tool client classifies absent or malformed successful wire content as outcome unknown',async()=>{
 for(const response of [undefined,{}, {structuredContent:null},{structuredContent:'bad'},{structuredContent:[]}]){const call=createToolClient({request:async()=>response},Promise.resolve());await assert.rejects(call('apply_change',{}),{code:'outcome_unknown'});}
});

import {errorMessage} from '../../lib/ui/model/presentation.ts';
test('tool client presents typed English errors and never exposes server messages',async()=>{
 for(const code of ['revision_conflict','invalid_input','outcome_unknown','future_code']){const call=createToolClient({request:async()=>({isError:true,structuredContent:{error:{code,message:'内部の和文と個人情報'}},content:[{type:'text',text:'別の和文'}]})},Promise.resolve(),errorMessage);await assert.rejects(call('apply_change',{}),error=>error.code===code&&error.message===errorMessage(code)&&!error.message.includes('和文'));}
});
