import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeDrafts,editDraft,discardDraft} from '../../lib/ui/model/drafts.ts';
test('dirty draft retains original revision and content on host refresh without mutating inputs',()=>{
 const actions=[{id:'a',title:'saved',notes:'',revision:1}];const initial=mergeDrafts({},actions);
 const dirty=editDraft(initial,'a',{title:'proposal'});const refreshed=mergeDrafts(dirty,[{...actions[0],title:'external',revision:2}]);
 assert.equal(refreshed.a.title,'proposal');assert.equal(refreshed.a.baseRevision,1);assert.equal(initial.a.title,'saved');assert.equal(actions[0].title,'saved');
 assert.equal(mergeDrafts(discardDraft(refreshed,'a'),[{...actions[0],title:'external',revision:2}]).a.title,'external');
});
test('clean drafts refresh and dirty drafts outside current snapshot remain retained',()=>{
 const initial=mergeDrafts({},[{id:'a',title:'old',notes:'',revision:1}]);const next=mergeDrafts(initial,[{id:'a',title:'new',notes:'',revision:2}]);assert.equal(next.a.title,'new');
 const dirty=editDraft(next,'a',{notes:'retained'});assert.equal(mergeDrafts(dirty,[]).a.notes,'retained');
});
import {retainRequest,operationUnknown,operationSucceeded} from '../../lib/ui/model/operations.ts';
test('unknown operation retains independent exact wire arguments and success preserves prior Undo ID',()=>{
 const args={operationId:'same',payload:{title:'original'}};const request=retainRequest('apply_change',args);args.payload.title='changed';
 assert.deepEqual(request.args,{operationId:'same',payload:{title:'original'}});
 const state={unknown:null,lastOperation:'previous'};assert.deepEqual(operationUnknown(state,request),{unknown:request,lastOperation:'previous'});assert.equal(state.unknown,null);
 assert.deepEqual(operationSucceeded(operationUnknown(state,request),undefined),state);
});
import {mutationBlocked,hasUnsavedChanges} from '../../lib/ui/model/controls.ts';
test('control decisions distinguish read-only history from outstanding mutation and unsaved input',()=>{
 assert.equal(mutationBlocked(false,null),false);assert.equal(mutationBlocked(true,null),true);assert.equal(mutationBlocked(false,{name:'add'}),true);
 assert.equal(hasUnsavedChanges(null,{},'',''),false);assert.equal(hasUnsavedChanges(null,{a:{dirty:true}},'',''),true);assert.equal(hasUnsavedChanges(null,{},'title',''),true);
});

import {draftPayload} from '../../lib/ui/model/drafts.ts';
test('draft submission changes only edited fields after unrelated rank and flag updates',()=>{
 const original={id:'a',title:'Original',notes:'Saved notes',order:0,flagged:false,revision:1};
 const dirty=editDraft(mergeDrafts({},[original]),'a',{title:'Proposal'});
 const refreshed=mergeDrafts(dirty,[{...original,order:7,flagged:true,revision:2}]);
 assert.deepEqual(draftPayload('a',refreshed.a),{id:'a',title:'Proposal'});
 const rank=editDraft(refreshed,'a',{order:3,flagged:false});assert.deepEqual(draftPayload('a',rank.a),{id:'a',title:'Proposal',order:3,flagged:false});
 assert.equal(dirty.a.order,0);assert.equal(dirty.a.flagged,false);
});

import {acknowledgeDraft,draftGroupPayload} from '../../lib/ui/model/drafts.ts';
import {editorSelection} from '../../lib/ui/model/controls.ts';
test('all raw editor inputs survive refresh while untouched saved fields merge and operation groups stay separate',()=>{
 const saved={id:'a',title:'saved',notes:'raw',order:0,flagged:false,parent_id:null,due_at:null,status:'active',revision:1};
 const initial=mergeDrafts({},[saved]);const dirty=editDraft(initial,'a',{parent_id:'p',due_at:'2026-10-',status:'on-hold',deferDate:'2026-',deferUntil:'incomplete',timezone:'Asia/Tokyo'});
 const next=mergeDrafts(dirty,[{...saved,title:'latest',notes:'new exact notes',order:9,flagged:true,revision:2}]);
 assert.equal(next.a.title,'latest');assert.equal(next.a.notes,'new exact notes');assert.equal(next.a.order,9);assert.equal(next.a.due_at,'2026-10-');assert.equal(next.a.baseRevision,1);
 assert.deepEqual(next.a.dirtyGroups,{edit:true,defer:true,status:true});assert.deepEqual(draftPayload('a',next.a),{id:'a',parent_id:'p',due_at:'2026-10-'});
 assert.deepEqual(draftGroupPayload('a',next.a,'defer'),{id:'a',date:'2026-',timezone:'Asia/Tokyo'});assert.deepEqual(draftGroupPayload('a',next.a,'status'),{id:'a',status:'on-hold'});assert.equal(initial.a.parent_id,null);
});
test('acknowledgment only clears captured matching fields and retains newer corrections and other groups',()=>{
 const initial=editDraft(mergeDrafts({},[{id:'a',title:'saved',notes:'',revision:1}]),'a',{title:'first',notes:'proposal',status:'on-hold',deferDate:'2026-'});
 const changed=editDraft(initial,'a',{title:'later'});const next=acknowledgeDraft(changed,'a',{title:'first',notes:'proposal'});
 assert.deepEqual(next.a.patch,{title:'later',status:'on-hold',deferDate:'2026-'});assert.equal(initial.a.patch.notes,'proposal');
 assert.deepEqual(editorSelection('a',mergeDrafts(next,[]),[],[]),{selectedId:'a',retainedIds:['a'],retainedSelected:true,targetAvailable:false,canMutate:false});
});

import {errorMessage,warningMessage,actionDepth} from '../../lib/ui/model/presentation.ts';
test('English error presentation distinguishes uncertainty, conflicts, validation and safe unknown fallback',()=>{
 assert.match(errorMessage('outcome_unknown'),/exact request.*retry the same request/);assert.match(errorMessage('revision_conflict'),/Refresh and review/);assert(!errorMessage('revision_conflict').includes('retry the same'));assert.match(errorMessage('invalid_input'),/nonnegative whole number/);assert.match(errorMessage('undo_conflict'),/cannot overwrite/);assert.match(errorMessage('timezone_required'),/09:00/);assert.match(errorMessage('future_error'),/review the current state/);assert.equal(/[ぁ-んァ-ン一-龯]/.test(errorMessage('future_error')),false);
 const warning={id:'a',due_at:'2026-10-04T00:00:00Z',message:'サーバー文言'};assert.equal(warningMessage(warning,[{id:'a',title:'原文'}]),'“原文” is deferred beyond its due time (2026-10-04T00:00:00Z).');assert.match(warningMessage({code:'unknown',message:'和文'},[]),/additional warning/);
});
test('containment depth is bounded and cycle safe without changing input order',()=>{
 const rows=[{id:'a',parent_id:null},{id:'b',parent_id:'a'},{id:'c',parent_id:'b'},{id:'d',parent_id:'c'},{id:'e',parent_id:'d'}];const copy=structuredClone(rows);assert.equal(actionDepth('a',rows),0);assert.equal(actionDepth('b',rows),1);assert.equal(actionDepth('e',rows),3);assert.equal(actionDepth('missing',rows),0);assert(actionDepth('a',[{id:'a',parent_id:'b'},{id:'b',parent_id:'a'}])<=3);assert.deepEqual(rows,copy);
});
