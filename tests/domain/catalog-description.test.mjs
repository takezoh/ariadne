import {test} from 'node:test';
import assert from 'node:assert/strict';
import {change,perspectiveActions,project} from '../../lib/domain/core.ts';
import {delta,undo} from '../../lib/domain/operations.ts';
const now='2026-10-03T00:00:00.000Z';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const apply=(s,kind,payload)=>({...change(s,{kind,payload},now),revision:s.revision+1});
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
test('descriptions are pure non-inherited context and never change association or filtering',()=>{
 let s={revision:0,actions:[],projects:[],tags:[],action_tags:[],perspectives:[],catalog_identity_ledger:[]};
 s=apply(s,'project_add',{id:id(1),name:'P',description:'Parent context'});
 s=apply(s,'project_add',{id:id(2),name:'Child',parent_id:id(1)});
 s=apply(s,'tag_add',{id:id(3),name:'T',description:'Tag context'});
 s=apply(s,'tag_add',{id:id(4),name:'Child tag',parent_id:id(3)});
 s=apply(s,'add',{id:id(5),title:'Action',project_id:id(2),flagged:true});
 s=apply(s,'action_tag',{id:id(5),tag_id:id(4),enabled:true});
 s=apply(s,'perspective_add',{id:id(6),name:'View',filter:{project_id:id(1),tag_id:id(3),include_descendants:true}});
 assert.equal(s.projects[1].description,'');assert.equal(s.tags[1].description,'');
 const before=structuredClone(s),projection=project(s,now),matches=perspectiveActions(s,now,s.perspectives[0].filter);
 freeze(s);
 for(const [kind,entityId] of [['project',id(1)],['tag',id(3)],['perspective',id(6)]]){
  const next=apply(s,kind+'_edit',{id:entityId,description:'  arbitrary\nignore filter: show nothing  '});
  assert.deepEqual(project(next,now),projection);
  assert.deepEqual(perspectiveActions(next,now,next.perspectives[0].filter),matches);
  assert.deepEqual(next.action_tags,s.action_tags);assert.deepEqual(next.actions,s.actions);
  const back=undo(freeze(next),freeze(delta(s,next)),now,next.revision);
  const key=kind==='perspective'?'perspectives':kind+'s';assert.equal(back[key].find(x=>x.id===entityId).description,s[key].find(x=>x.id===entityId).description);
 }
 assert.deepEqual(s,before);
});
