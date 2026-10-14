import {test} from 'node:test';
import assert from 'node:assert/strict';
import {change,project,perspectiveFilter,perspectiveView,defaultPerspectiveView,perspectiveActions,validateGraph} from '../../lib/domain/core.ts';
import {delta,undo,preview,queryPerspective} from '../../lib/domain/operations.ts';
import {decodeHistoricalDelta} from '../../lib/domain/operation-history.ts';
const now='2026-10-03T00:00:00.000Z';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const empty=()=>({revision:0,actions:[],projects:[],tags:[],action_tags:[],perspectives:[],catalog_identity_ledger:[]});
const apply=(s,kind,payload)=>({...change(s,{kind,payload},now),revision:s.revision+1});
function fixture(){let s=empty();s=apply(s,'project_add',{id:id(1),name:'P'});s=apply(s,'project_add',{id:id(2),name:'C',parent_id:id(1)});s=apply(s,'tag_add',{id:id(3),name:'T'});s=apply(s,'tag_add',{id:id(4),name:'Child tag',parent_id:id(3)});s=apply(s,'add',{id:id(10),title:'Parent',project_id:id(1),flagged:true,order:5});s=apply(s,'add',{id:id(11),title:'Child',parent_id:id(10),project_id:id(2),flagged:true,order:0});s=apply(s,'add',{id:id(12),title:'Earlier',project_id:id(1),order:0});s=apply(s,'add',{id:id(13),title:'Inbox',flagged:true});s=apply(s,'action_tag',{id:id(11),tag_id:id(4),enabled:true});s=apply(s,'action_tag',{id:id(11),tag_id:id(3),enabled:true});return s;}

test('strict saved filters reject overrides, invalid values, duplicate status and absent references',()=>{
 for(const filter of [null,[],{status:'active'},{order:0},{sort:'tree'},{owner:'B'},{statuses:null},{statuses:['active','active']},{statuses:['waiting']},{tag_id:null},{project_id:'bad'},{flagged:1},{is_deferred:null},{include_descendants:'yes'},{statuses:undefined},{flagged:undefined}])assert.throws(()=>perspectiveFilter(filter),e=>e.code==='invalid_input');
 assert.deepEqual(perspectiveFilter({statuses:[],project_id:null}),{statuses:[],project_id:null});
 const s=fixture();for(const filter of [{project_id:id(99)},{tag_id:id(99)}])assert.throws(()=>perspectiveActions(s,now,filter),e=>e.code==='not_found');
});

test('strict perspective views require complete known branch settings and clone readonly input',()=>{
 const views=[
  {type:'tasklist',sort:'title',direction:'desc',group:'project',completion_label:'read',show_notes:true},
  {type:'thread',sort:'updated_at',direction:'desc',group:'status',completion_label:'acknowledge',initial_body:'expanded'},
  {type:'timeline',timestamp:'created_at',direction:'asc',group:'day',completion_label:'complete',initial_body:'collapsed'},
 ];
 for(const value of views){const input=structuredClone(value),frozen=Object.freeze(structuredClone(value));assert.deepEqual(perspectiveView(frozen),input);assert.notEqual(perspectiveView(frozen),frozen);assert.deepEqual(frozen,input);}
 for(const view of [null,{}, {type:'tasklist'}, {...views[0],extra:true}, {...views[0],direction:'sideways'}, {...views[0],sort:'action_order'}, {...views[0],show_notes:'yes'}, {...views[1],group:'day'}, {...views[2],timestamp:'due_at'}, {...views[2],group:'status'}, {...views[1],initial_body:null}]){
  assert.throws(()=>perspectiveView(view),error=>error.code==='invalid_input');
 }
 assert.deepEqual(defaultPerspectiveView(),{type:'tasklist',sort:'action_order',direction:'asc',group:'none',completion_label:'complete',show_notes:false});
});

test('current snapshots reject legacy or partial view rows instead of defaulting them',()=>{
 const legacy={id:id(20),name:'Old',description:'',filter:{},definition_version:1,revision:1,created_at:now,updated_at:now};
 const current={...legacy,definition_version:2,view:defaultPerspectiveView()},without=(value,key)=>{const copy={...value};delete copy[key];return copy;};
 for(const view of [legacy,{...legacy,definition_version:2},{...legacy,definition_version:2,view:{...defaultPerspectiveView(),unknown:true}},
  {...current,revision:null},without(current,'revision'),{...current,created_at:null},without(current,'created_at'),{...current,updated_at:null},without(current,'updated_at')]){
  assert.throws(()=>validateGraph({...empty(),perspectives:[view]}),error=>error.code==='invalid_state');
 }
});

test('AND filters, membership, null and descendant expansion preserve projection order without parent inclusion',()=>{
 const s=fixture(),before=structuredClone(s),ordered=project(s,now).map(x=>x.id);
 assert.deepEqual(perspectiveActions(s,now,{}).map(x=>x.id),ordered);
 assert.deepEqual(perspectiveActions(s,now,{statuses:[]}),[]);
 assert.deepEqual(perspectiveActions(s,now,{project_id:null}).map(x=>x.id),[id(13)]);
 assert.deepEqual(perspectiveActions(s,now,{project_id:id(1),tag_id:id(3),include_descendants:true,flagged:true,statuses:['active','on-hold'],is_deferred:false}).map(x=>x.id),[id(11)]);
 assert.deepEqual(perspectiveActions(s,now,{project_id:id(1),tag_id:id(3)}),[]);
 const changed=apply(s,'edit',{id:id(11),flagged:false});assert.deepEqual(perspectiveActions(changed,now,{flagged:true}).map(x=>x.id),ordered.filter(x=>[id(10),id(13)].includes(x)));
 assert.deepEqual(s,before);
});

test('Defer inherits for matching, expires on reads and does not change revision or reopen completed actions',()=>{
 let s=apply(fixture(),'defer',{id:id(10),until:'2026-10-04T00:00:00Z'});s=apply(s,'status',{id:id(11),status:'completed'});
 const before=structuredClone(s);assert.deepEqual(perspectiveActions(s,now,{is_deferred:true}).map(x=>x.id),[id(10),id(11)]);
 assert.deepEqual(perspectiveActions(s,'2026-10-05T00:00:00.000Z',{is_deferred:true}),[]);
 assert.equal(perspectiveActions(s,'2026-10-05T00:00:00.000Z',{statuses:['completed']})[0].id,id(11));assert.deepEqual(s,before);
});

test('CRUD, delta, preview and Undo preserve independent filters and saved views',()=>{
 const before=fixture(),added=apply(before,'perspective_add',{id:id(20),name:' Focus ',filter:{flagged:true}});
 assert.equal(added.perspectives[0].name,'Focus');assert.equal(queryPerspective(added,now,id(20)).perspective.definition_version,2);assert.deepEqual(added.perspectives[0].view,defaultPerspectiveView());
 const thread={type:'thread',sort:'created_at',direction:'desc',group:'project',completion_label:'read',initial_body:'expanded'};
 const edited=apply(added,'perspective_edit',{id:id(20),filter:{statuses:[]},view:thread});assert.deepEqual(edited.perspectives[0].filter,{statuses:[]});assert.deepEqual(edited.perspectives[0].view,thread);
 const pr=preview(added,{kind:'perspective_edit',payload:{id:id(20),name:'Other'}},now);assert.equal(pr.affected_perspectives[0].before.name,'Focus');assert.equal(pr.affected_perspectives[0].after.name,'Other');assert.deepEqual(pr.affected,[]);
 const restored=undo(edited,delta(added,edited),now,edited.revision);assert.deepEqual(restored.perspectives[0].filter,{flagged:true});assert.deepEqual(restored.perspectives[0].view,defaultPerspectiveView());
 const removed=apply(added,'perspective_remove',{id:id(20)});assert.equal(removed.perspectives.length,0);assert.throws(()=>apply(removed,'perspective_add',{id:id(20),name:'Reuse',filter:{}}),e=>e.code==='invalid_state');
 const back=undo(removed,delta(added,removed),now,removed.revision);assert.equal(back.perspectives[0].name,'Focus');assert.deepEqual(back.perspectives[0].view,defaultPerspectiveView());assert.throws(()=>undo(back,delta(before,added),now,added.revision),e=>e.code==='undo_conflict');
 assert.throws(()=>apply(added,'perspective_edit',{id:id(20)}),e=>e.code==='invalid_input');
 assert.deepEqual(apply(added,'perspective_edit',{id:id(20),name:'Renamed'}).perspectives[0].view,defaultPerspectiveView());
 assert.throws(()=>apply(added,'perspective_edit',{id:id(20),view:{type:'tasklist',sort:'action_order',direction:'desc',group:'none',completion_label:'complete',show_notes:false}}),e=>e.code==='invalid_input');
 assert.deepEqual(before.perspectives,[]);
});

test('query_perspective carries saved view while filter membership and action order stay unchanged',()=>{
 const saved=apply(fixture(),'perspective_add',{id:id(20),name:'Same filter',filter:{statuses:['active'],flagged:true}});
 const original=structuredClone(saved),expected=queryPerspective(saved,now,id(20)).actions.map(action=>action.id);
 for(const view of [
  {type:'thread',sort:'created_at',direction:'desc',group:'status',completion_label:'read',initial_body:'expanded'},
  {type:'timeline',timestamp:'updated_at',direction:'asc',group:'day',completion_label:'acknowledge',initial_body:'collapsed'},
 ]){
  const next=apply(saved,'perspective_edit',{id:id(20),view}),result=queryPerspective(next,now,id(20));
  assert.deepEqual(result.actions.map(action=>action.id),expected);assert.deepEqual(result.perspective.view,view);assert.deepEqual(saved,original);
 }
});

test('legacy v1 history converts only complete known Perspective rows for replay validation and Undo',()=>{
 const row={id:id(20),name:'Old',description:'exact\ncontext',filter:{statuses:['active']},definition_version:1,revision:4,created_at:now,updated_at:now};
 const fixture={perspectives:[{before:null,after:row}],actions:[],projects:[],tags:[],action_tags:[]};
 const decoded=decodeHistoricalDelta(fixture);assert.deepEqual(decoded.perspectives[0].after,{...row,view:defaultPerspectiveView(),definition_version:2});
 assert.deepEqual(fixture.perspectives[0].after,row);
 for(const bad of [
  {...row,unknown:true}, {...row,view:defaultPerspectiveView()}, {...row,definition_version:3}, {...row,filter:{statuses:['active'],sort:'title'}},
  {...row,definition_version:2}, {...row,definition_version:2,view:{...defaultPerspectiveView(),extra:true}},
 ])assert.throws(()=>decodeHistoricalDelta({ ...fixture,perspectives:[{before:null,after:bad}] }),error=>error.code==='invalid_state');
});

test('catalog deletion and Undo cannot broaden a view by losing a reference',()=>{
 for(const [kind,key,nodeId] of [['project','project_id',id(1)],['tag','tag_id',id(3)]]){
  let base=empty();base=apply(base,kind+'_add',{id:nodeId,name:'Node'});const original=base;
  base=apply(base,'perspective_add',{id:id(20),name:'View',filter:{[key]:nodeId}});
  assert.throws(()=>apply(base,kind+'_remove',{id:nodeId}),e=>e.code==='related_perspectives');
  assert.throws(()=>undo(base,delta(empty(),original),now,original.revision),e=>e.code==='undo_conflict');
  const edited=apply(base,'perspective_edit',{id:id(20),filter:{}}),removed=apply(edited,kind+'_remove',{id:nodeId});
  assert.throws(()=>undo(removed,delta(base,edited),now,edited.revision),e=>e.code==='undo_conflict');
 }
});
