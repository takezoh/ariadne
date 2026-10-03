import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigationModel} from '../../lib/ui/model/navigation.ts';
import {change,perspectiveActions} from '../../lib/domain/core.ts';
import {response,queryResponse} from '../../lib/domain/operations.ts';
const model=createNavigationModel(),now='2026-10-03T00:00:00Z',id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const ids=rows=>rows.map(row=>row.id);
function fixture(){let s={revision:0,actions:[],projects:[],tags:[],action_tags:[],perspectives:[],catalog_identity_ledger:[]};const apply=(kind,payload)=>{s={...change(s,{kind,payload},now),revision:s.revision+1};};
 apply('project_add',{id:id(1),name:'Work',description:' Exact\nproject description '});apply('project_add',{id:id(2),name:'Website',parent_id:id(1)});apply('tag_add',{id:id(3),name:'Focus'});apply('tag_add',{id:id(4),name:'Waiting',parent_id:id(3)});
 apply('add',{id:id(10),title:'Parent',project_id:id(1),flagged:true});apply('add',{id:id(11),title:'Child',parent_id:id(10),project_id:id(2)});apply('add',{id:id(12),title:'原文 Inbox',notes:'  exact 原文\n',flagged:true});apply('add',{id:id(13),title:'On hold',project_id:id(1),flagged:true});apply('status',{id:id(13),status:'on-hold'});apply('add',{id:id(14),title:'Completed',project_id:id(1)});apply('status',{id:id(14),status:'completed'});apply('add',{id:id(15),title:'Dropped'});apply('status',{id:id(15),status:'dropped'});
 apply('action_tag',{id:id(11),tag_id:id(3),enabled:true});apply('action_tag',{id:id(11),tag_id:id(4),enabled:true});apply('action_tag',{id:id(13),tag_id:id(4),enabled:true});apply('defer',{id:id(10),until:'2026-10-04T00:00:00Z'});
 return s;}

test('project/tag navigation matches authoritative queries and preserves direct membership, order and deduplication',()=>{
 const s=fixture(),wire=response(s,now),before=structuredClone(wire);
 for(const includeDescendants of [false,true])for(const includeDeferred of [true,false])for(const [view,classificationId] of [['projects',id(1)],['tags',id(3)]]){
  const selection={...model.initial(),view,classificationId,includeDescendants,includeDeferred};const actual=model.present(wire,selection).actions;
  const query={...(view==='projects'?{project_id:classificationId}:{tag_id:classificationId}),include_descendants:includeDescendants,...(includeDeferred?{}:{is_deferred:false})};const expected=queryResponse(s,now,query).actions.filter(a=>['active','on-hold'].includes(a.status));assert.deepEqual(ids(actual),ids(expected));assert.equal(new Set(ids(actual)).size,actual.length);
 }
 assert.deepEqual(wire,before);const unassigned=model.present(wire,{...model.initial(),view:'projects',classificationId:'unassigned',includeDeferred:true});assert.deepEqual(ids(unassigned.actions),[id(12)]);assert(unassigned.options.some(o=>o.id==='unassigned'));
 assert.equal(model.present(wire,{...model.initial(),view:'tags',classificationId:id(3),includeDeferred:true}).actions.some(a=>a.id===id(13)),false);assert.equal(model.present(wire,{...model.initial(),view:'tags',classificationId:id(3),includeDescendants:true,includeDeferred:true}).actions.some(a=>a.id===id(13)),true);
});
test('saved perspective matching has parity with domain AND predicates including omitted/empty status and false values',()=>{
 const s=fixture(),wire=response(s,now);
 const filters=[{}, {statuses:[]},{statuses:['completed','dropped']},{statuses:['active','on-hold']},{project_id:null},{project_id:id(1),include_descendants:true},{tag_id:id(3),include_descendants:true},{flagged:false},{is_deferred:false},{is_deferred:true},{project_id:id(1),tag_id:id(3),include_descendants:true,statuses:['active','on-hold'],flagged:false,is_deferred:true}];
 for(const filter of filters){const definition={id:id(30),name:'  名前 <img> ',description:'  raw\n<script> context </script> ',filter};const snapshot={...wire,perspectives:[definition]};const result=model.present(snapshot,{...model.initial(),view:'perspective',perspectiveId:definition.id});assert.deepEqual(ids(result.actions),ids(perspectiveActions(s,now,filter)));assert.equal(result.heading,definition.name);assert.equal(result.description,definition.description);assert.equal(result.unavailable,false);}
 const expired=response(s,'2026-10-05T00:00:00Z');assert.deepEqual(model.filterActions(expired,{is_deferred:true}),[]);assert.deepEqual(ids(model.filterActions(expired,{statuses:['completed']})),[id(14)]);
});
test('missing selected catalog, perspective or saved references fail closed without selecting all',()=>{
 const wire=response(fixture(),now);for(const view of ['projects','tags']){const selection={...model.initial(),view,classificationId:id(99)};const result=model.present(wire,selection);assert.equal(result.unavailable,true);assert.deepEqual(result.actions,[]);assert(result.options.some(o=>o.id===id(99)));assert.equal(selection.classificationId,id(99));}
 assert.equal(model.present(wire,{...model.initial(),view:'perspective',perspectiveId:id(99)}).unavailable,true);
 for(const filter of [{project_id:id(99)},{tag_id:id(99)}]){const result=model.present({...wire,perspectives:[{id:id(30),name:'Saved',filter}]},{...model.initial(),view:'perspective',perspectiveId:id(30)});assert.equal(result.unavailable,true);assert.deepEqual(result.actions,[]);}
});
test('history keeps completed/dropped state and default views include on hold without availability logic',()=>{
 const wire=response(fixture(),now),history=model.initial('history');assert.deepEqual(ids(model.present(wire,history).actions),[id(15),id(14)]);assert.deepEqual(ids(model.present(wire,{...history,statuses:['dropped']}).actions),[id(15)]);
 const project=model.present(wire,{...model.initial(),view:'projects',classificationId:id(1)});assert(project.actions.some(a=>a.status==='on-hold'));const flagged=model.present(wire,{...model.initial(),view:'flagged'});assert(flagged.actions.some(a=>a.status==='on-hold'));assert.equal(project.summary,'');
 assert.equal(model.initial().view,'inbox');const selected=model.select(model.initial(),{view:'projects',classificationId:id(1)}),copy=structuredClone(selected);assert.equal(model.select(selected,{view:'tags'}).classificationId,'all');assert.deepEqual(selected,copy);
});


test('each navigation destination restores its own selection and filters without broadening or mutating prior state',()=>{
 let selection=model.select(model.initial(),{view:'projects',classificationId:id(1),includeDescendants:true,statuses:['completed']});const project=structuredClone(selection);selection=model.select(selection,{view:'tags',classificationId:id(3),includeDeferred:true});selection=model.select(selection,{view:'perspective',perspectiveId:id(30)});selection=model.select(selection,{view:'history',statuses:['dropped']});selection=model.select(selection,{view:'inbox'});
 const returned=model.select(selection,{view:'projects'});assert.equal(returned.classificationId,id(1));assert.equal(returned.includeDescendants,true);assert.deepEqual(returned.statuses,['completed']);assert.deepEqual(project.statuses,['completed']);assert.equal(model.select(returned,{view:'tags'}).includeDeferred,true);assert.equal(model.select(returned,{view:'perspective'}).perspectiveId,id(30));assert.deepEqual(model.select(returned,{view:'history'}).statuses,['dropped']);
 const missing=model.present({...response(fixture(),now),projects:[]},returned);assert.equal(missing.unavailable,true);assert.deepEqual(missing.actions,[]);assert.equal(returned.classificationId,id(1));
});

test('all views create ordinary actions from explicit identities without inferring filter conditions',()=>{
 const wire=response(fixture(),now),initial=model.initial();for(const view of ['inbox','projects','tags','flagged','history','perspective']){const selection={...initial,view,statuses:[]};const root=model.creationContext(wire,selection);assert.equal(root.allowed,true);assert.equal(root.payload.project_id,null);assert.equal(root.payload.parent_id,undefined);}
 for(const [kind,target,field] of [['project',id(1),'project_id'],['tag',id(3),'tag_ids']]){const result=model.creationContext(wire,initial,{kind,id:target});assert.deepEqual(result.payload[field],field==='tag_ids'?[target]:target);}
 const parent=wire.actions[0],terminal={...wire,actions:[{...parent,status:'completed',project_id:id(1)}]};const child=model.creationContext(terminal,{...initial,view:'tags'},{kind:'action',id:parent.id,catalogId:id(3)});assert.equal(child.payload.parent_id,parent.id);assert.equal(child.payload.project_id,id(1));assert.deepEqual(child.payload.tag_ids,[id(3)]);assert.equal(child.payload.status,undefined);assert.equal(child.payload.defer_until,undefined);assert.deepEqual(model.creationContext(wire,initial,{kind:'action',id:id(99)}).payload,{title:'',notes:'',project_id:null});
});

test('independent display checks project every lifecycle subset and defer inclusion exactly without aliases',()=>{
 const snapshot=response(fixture(),now),all=['active','on-hold','completed','dropped'];
 for(let mask=0;mask<16;mask++)for(const includeDeferred of [false,true]){const statuses=all.filter((_,index)=>mask&(1<<index));const selection=model.select(model.initial(),{view:'projects',classificationId:id(1),statuses,includeDeferred});assert.deepEqual(ids(model.present(snapshot,selection).actions),ids(snapshot.actions.filter(a=>a.project_id===id(1)&&statuses.includes(a.status)&&(includeDeferred||!a.is_deferred))));assert.equal(model.creationContext(snapshot,selection).allowed,true);}
 const empty=model.select(model.initial('history'),{statuses:[]});assert.deepEqual(model.present(snapshot,empty).actions,[]);assert.deepEqual(model.displayOptions(empty),['completed','dropped']);const remembered=model.select(model.select(model.initial(),{view:'projects',statuses:['completed']}),{view:'tags'});const restored=model.select(remembered,{view:'projects'});restored.statuses.push('active');assert.deepEqual(remembered.remembered.projects.statuses,['completed']);const projected=model.displayFilter(restored);projected.statuses.pop();assert.deepEqual(restored.statuses,['completed','active']);const inbox=model.select(model.initial(),{statuses:[]});assert.deepEqual(ids(model.present(snapshot,inbox).actions),snapshot.list_scopes.inbox);
});
