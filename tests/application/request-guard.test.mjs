import test from 'node:test';import assert from 'node:assert/strict';
import {readGuardedJson} from '../../lib/http/request-guard.ts';
test('actual UTF-8 body budget cancels streaming input before materializing an oversized request',async()=>{
 let reads=0,cancelled=false;
 const body=new ReadableStream({pull(controller){reads++;controller.enqueue(new TextEncoder().encode('界'.repeat(20)));},cancel(){cancelled=true;}});
 const request=new Request('https://local.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body,duplex:'half'});
 await assert.rejects(readGuardedJson(request,{maxBytes:100}),e=>e.code==='payload_too_large');
 assert(cancelled);assert(reads<=3);
});
test('guards approve absent or same Origin and exact JSON media type with parameters',async()=>{
 for(const origin of [undefined,'https://local.invalid']){
  const request=new Request('https://local.invalid',{method:'POST',headers:{'Content-Type':'Application/JSON; charset=utf-8',...(origin?{Origin:origin}:{})},body:'{}'});
  assert.deepEqual(await readGuardedJson(request),{});
 }
});
