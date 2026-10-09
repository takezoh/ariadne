import {test} from 'node:test';
import assert from 'node:assert/strict';
import {actionCallForOwner as actionCall} from '../helpers/owner-composition.mjs';
import {memoryActionStore} from '../helpers/memory-action-store.mjs';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const now='2026-10-03T00:00:00.000Z';
test('view validation precedes ID generation and deleted perspective IDs remain reserved across entity kinds',async()=>{
 const store=memoryActionStore(),values=[id(2),id(2),id(4)];let generated=0;
 const ports={store,clock:()=>now,newId:()=>values[generated++]};
 const call=(name,args)=>actionCall(ports,'A',name,args);
 const write=(operationId,expectedRevision,kind,payload)=>call('apply_change',{schemaVersion:2,operationId,expectedRevision,kind,payload});
 await assert.rejects(write(id(1),0,'perspective_add',{name:'View',filter:{tag_id:id(99)}}),e=>e.code==='not_found');assert.equal(generated,0);
 await assert.rejects(write(id(1),0,'perspective_add',{name:'View',filter:{sort:'title'}}),e=>e.code==='invalid_input');assert.equal(generated,0);
 const added=await write(id(1),0,'perspective_add',{name:'View',filter:{}});assert.deepEqual(added.result.resolved.perspective,{id:id(2)});
 await write(id(3),1,'perspective_remove',{id:id(2)});
 const action=await write(id(5),2,'add',{title:'New'});assert.equal(action.result.resolved.actions[0].id,id(4));assert.equal(generated,3);
 assert.deepEqual((await call('list_perspectives',{})).perspectives,[]);
});
