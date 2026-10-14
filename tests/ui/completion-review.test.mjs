import test from 'node:test';
import assert from 'node:assert/strict';
import {isCompletionIntent,projectCompletionReviewScope,sameCompletionReviewScope} from '../../lib/ui/model/completion-review.ts';

const snapshot={revision:7,actions:[
 {id:'root',title:'Parent',status:'active',parent_id:null},
 {id:'child',title:'Hidden child',status:'on-hold',parent_id:'root'},
 {id:'grandchild',title:'Completed grandchild',status:'completed',parent_id:'child'},
 {id:'sibling',title:'Sibling',status:'active',parent_id:null},
]};

test('completion projection recognizes complete, completed status and completed edit intents',()=>{
 for(const intent of [
  {expectedRevision:7,kind:'complete',payload:{id:'root'}},
  {expectedRevision:7,kind:'status',payload:{id:'root',status:'completed'}},
  {expectedRevision:7,kind:'edit',payload:{id:'root',status:'completed'}},
 ])assert.equal(isCompletionIntent(intent),true);
 for(const intent of [
  {expectedRevision:7,kind:'status',payload:{id:'root',status:'on-hold'}},
  {expectedRevision:7,kind:'edit',payload:{id:'root',title:'New title'}},
  {expectedRevision:7,kind:'defer',payload:{id:'root'}},
 ])assert.equal(isCompletionIntent(intent),false);
});

test('completion scope includes every descendant regardless of filter or existing status without mutating input',()=>{
 const before=structuredClone(snapshot),scope=projectCompletionReviewScope(snapshot,{expectedRevision:7,kind:'complete',payload:{id:'root'}});
 assert.deepEqual(scope,{expectedRevision:7,rootId:'root',descendants:[
  {id:'child',title:'Hidden child',status:'on-hold'},
  {id:'grandchild',title:'Completed grandchild',status:'completed'},
 ]});
 assert.deepEqual(snapshot,before);
 assert.equal(projectCompletionReviewScope(snapshot,{expectedRevision:7,kind:'complete',payload:{id:'sibling'}}),undefined);
});

test('review scope equality detects revision, membership, title and state changes',()=>{
 const intent={expectedRevision:7,kind:'status',payload:{id:'root',status:'completed'}},first=projectCompletionReviewScope(snapshot,intent);
 assert.equal(sameCompletionReviewScope(first,projectCompletionReviewScope(snapshot,intent)),true);
 assert.equal(sameCompletionReviewScope(first,projectCompletionReviewScope({...snapshot,revision:8}, {...intent,expectedRevision:8})),false);
 const changed={...snapshot,actions:snapshot.actions.map(row=>row.id==='child'?{...row,title:'Renamed'}:row)};
 assert.equal(sameCompletionReviewScope(first,projectCompletionReviewScope(changed,intent)),false);
});
