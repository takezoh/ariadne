import test from 'node:test';
import assert from 'node:assert/strict';
import {projectSelectionContext,selectionContextFingerprint,eligibleSelectedActions} from '../../lib/ui/model/selection-context.ts';
import {initialInteraction,interactionTransition} from '../../lib/ui/model/interaction.ts';

const actionId='11111111-1111-4111-8111-111111111111';
const otherActionId='22222222-2222-4222-8222-222222222222';
const projectId='33333333-3333-4333-8333-333333333333';
const tagId='44444444-4444-4444-8444-444444444444';
const deletedId='55555555-5555-4555-8555-555555555555';
const snapshot={revision:9,actions:[{id:actionId,title:'Saved action',notes:'private notes'},{id:otherActionId,title:'Active only',notes:'more private notes'}],projects:[{id:projectId,name:'Work',description:'private project description'}],tags:[{id:tagId,name:'Focus',description:'private tag description'}],perspectives:[{id:'66666666-6666-4666-8666-666666666666',name:'Private perspective',description:'hidden'}]};
const navigation={view:'projects',classificationId:projectId,perspectiveId:null,includeDescendants:false,statuses:['active'],includeDeferred:false};

test('selection context groups saved entities, preserves occurrence identity, and excludes private or draft fields',()=>{
 const rows=[
  {key:'tag:focus:action:'+actionId,kind:'action',id:actionId,catalogId:tagId},
  {key:'tag:later:action:'+actionId,kind:'action',id:actionId,catalogId:deletedId},
  {key:'project:'+projectId,kind:'project',id:projectId,catalogId:projectId},
  {key:'local:action:17',kind:'action',id:'local:action:17',localUnsaved:true,opaqueKey:'local-occurrence-1'},
  {key:'tag:'+deletedId,kind:'tag',id:deletedId,catalogId:deletedId},
 ];
 const selection={keys:rows.map(row=>row.key),ids:[actionId],occurrences:rows,anchor:null,active:null,activeOccurrence:null};
 const before=structuredClone({snapshot,navigation,selection});
 const context=projectSelectionContext({instanceId:'widget-instance',contextVersion:4,snapshot,navigation,selection,activeOccurrence:{key:'active:'+otherActionId,kind:'action',id:otherActionId}});
 assert.equal(context.schemaVersion,1);assert.equal(context.instanceId,'widget-instance');assert.equal(context.contextVersion,4);assert.equal(context.snapshotRevision,9);
 assert.deepEqual(context.view,{kind:'projects',classificationId:projectId,perspectiveId:null});
 assert.deepEqual(context.active,{kind:'action',availability:'available',id:otherActionId,title:'Active only',occurrences:[{key:'active:'+otherActionId}]});
 assert.deepEqual(context.selected,[
  {kind:'action',availability:'available',id:actionId,title:'Saved action',occurrences:[{key:'tag:focus:action:'+actionId,catalogId:tagId},{key:'tag:later:action:'+actionId,catalogId:deletedId}]},
  {kind:'project',availability:'available',id:projectId,name:'Work',occurrences:[{key:'project:'+projectId,catalogId:projectId}]},
  {kind:'action',availability:'local_unsaved',occurrences:[{key:'local-occurrence-1'}]},
  {kind:'tag',availability:'deleted',id:deletedId,occurrences:[{key:'tag:'+deletedId,catalogId:deletedId}]},
 ]);
 const encoded=JSON.stringify(context);for(const secret of ['private notes','private project description','private tag description','Private perspective','local:action:17'])assert.equal(encoded.includes(secret),false,secret);
 assert.deepEqual({snapshot,navigation,selection},before);assert.equal(selectionContextFingerprint(context),selectionContextFingerprint(structuredClone(context)));
});

test('availability never infers active or selected state before a confirmed snapshot',()=>{
 const selection={keys:['row'],ids:['a'],occurrences:[{key:'row',kind:'action',id:'a'}],anchor:null,active:'row',activeOccurrence:{key:'row',kind:'action',id:'a'}};
 const context=projectSelectionContext({instanceId:'widget-instance',contextVersion:0,snapshot:null,navigation,selection,activeOccurrence:selection.activeOccurrence});
 assert.equal(context.availability,'unavailable');assert.equal(context.snapshotRevision,null);assert.equal(context.active,null);assert.deepEqual(context.selected,[]);
});

test('classification identity is resolved only in the active catalog view',()=>{
 const both={...snapshot,projects:[{id:projectId,name:'Project'}],tags:[{id:projectId,name:'Tag'}]};
 for(const view of ['projects','tags']){const context=projectSelectionContext({instanceId:'widget-instance',contextVersion:1,snapshot:both,navigation:{...navigation,view},selection:initialInteraction().selection,activeOccurrence:null});assert.equal(context.view.classificationId,projectId);}
 const unavailable=projectSelectionContext({instanceId:'widget-instance',contextVersion:1,snapshot,navigation:{...navigation,view:'tags'},selection:initialInteraction().selection,activeOccurrence:null});assert.equal(unavailable.view.classificationId,null);
});

test('Action-only mutation eligibility rejects every mixed, local, missing, or absent selection',()=>{
 const actionRows=[{key:'a-one',kind:'action',id:actionId},{key:'a-two',kind:'action',id:actionId}];
 const selection=occurrences=>({keys:occurrences.map(row=>row.key),ids:[...new Set(occurrences.filter(row=>row.kind==='action').map(row=>row.id))],occurrences,anchor:null,active:null,activeOccurrence:null});
 assert.deepEqual(eligibleSelectedActions(selection(actionRows),snapshot,{}),{allowed:true,ids:[actionId],reason:''});
 for(const rows of [[...actionRows,{key:'project',kind:'project',id:projectId}],[{key:'local',kind:'action',id:'local:1',localUnsaved:true}],[{key:'missing',kind:'action',id:deletedId}]])assert.equal(eligibleSelectedActions(selection(rows),snapshot,{}).allowed,false);
 assert.equal(eligibleSelectedActions(selection(actionRows),null,{}).allowed,false);
 assert.equal(eligibleSelectedActions(selection(actionRows),snapshot,{[actionId]:{}}).allowed,false);
});

test('visible pruning follows the current outline order and retains active separately',()=>{
 const rows=[{key:'action:one',kind:'action',id:actionId},{key:'project:'+projectId,kind:'project',id:projectId,catalogId:projectId}];
 let state=initialInteraction();state=interactionTransition(state,{type:'occurrence.replace',keys:['project:'+projectId,'action:one'],ids:[actionId],occurrences:[rows[1],rows[0]]});
 state=interactionTransition(state,{type:'occurrence.activate',key:'gone',occurrence:{key:'gone',kind:'action',id:otherActionId}});
 const visible=interactionTransition(state,{type:'occurrence.visible',entries:rows});
 assert.deepEqual(visible.selection.keys,rows.map(row=>row.key));assert.deepEqual(visible.selection.occurrences.map(row=>row.key),rows.map(row=>row.key));assert.equal(visible.selection.activeOccurrence.id,otherActionId);
});
