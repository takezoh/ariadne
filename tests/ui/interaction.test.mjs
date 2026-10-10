import test from 'node:test';
import assert from 'node:assert/strict';
import {initialInteraction,interactionTransition} from '../../lib/ui/model/interaction.ts';
import {gestureTransition} from '../../lib/ui/model/gesture.ts';
import {createMovementModel} from '../../lib/ui/model/movement.ts';
import {createTreeDropModel} from '../../lib/ui/model/tree-drop.ts';
const movement=createMovementModel(),tree=createTreeDropModel();
const context=(actions,previous)=>({actions,projects:[],tags:[],index:movement.index(actions,previous),projectIndex:tree.index([]),tagIndex:tree.index([])});
const actions=[{id:'a',order:0,parent_id:null},{id:'b',order:1,parent_id:null},{id:'unrelated',order:0,parent_id:null,project_id:'other'}];
test('occurrence range and remap retain two Tag rows and one persistence identity without mutation',()=>{
 const entries=[{key:'tag:one:action:a',id:'a',kind:'action'},{key:'tag:two:action:a',id:'a',kind:'action'}],initial=initialInteraction(),before=structuredClone(initial);
 const first=interactionTransition(initial,{type:'occurrence.range',key:entries[0].key,range:false,entries}),both=interactionTransition(first,{type:'occurrence.range',key:entries[1].key,range:true,entries});
 assert.deepEqual(both.selection.keys,entries.map(e=>e.key));assert.deepEqual(both.selection.ids,['a']);assert.deepEqual(initial,before);assert.deepEqual(first.selection.keys,[entries[0].key]);
 const mapped=interactionTransition(both,{type:'interaction.remap',from:'action:a',to:'action:saved'});assert.deepEqual(mapped.selection.keys,['tag:one:action:saved','tag:two:action:saved']);assert.deepEqual(both.selection.keys,entries.map(e=>e.key));
});
test('gesture transitions preserve inputs, reuse target decisions, ignore unrelated regions and reject related changes',()=>{
 const ctx=context(actions),begin=gestureTransition(null,{type:'gesture.begin',kind:'action',keys:['tag:one:action:a','tag:two:action:a'],ids:['a','a']},ctx).state,original=structuredClone(begin);
 const active=gestureTransition(begin,{type:'gesture.activate'},ctx).state,target={kind:'action',key:'b',anchor:'b',placement:'inside'},hover=gestureTransition(active,{type:'gesture.target',target},ctx);
 assert.deepEqual(begin,original);assert.deepEqual(active.ids,['a']);assert.deepEqual(active.keys,['tag:one:action:a','tag:two:action:a']);assert(hover.state.intent.allowed);
 assert.deepEqual(gestureTransition(hover.state,{type:'gesture.target',target:{...target}},ctx).metrics,[]);
 const unrelated=context(actions.map(a=>a.id==='unrelated'?{...a,parent_id:'external-parent'}:a),ctx.index),updated=gestureTransition(hover.state,{type:'gesture.context'},unrelated).state;assert.equal(updated.issue,null);
 const related=context(actions.map(a=>a.id==='b'?{...a,parent_id:'unrelated'}:a),unrelated.index);assert.match(gestureTransition(updated,{type:'gesture.context'},related).state.issue,/destination changed/);
 assert.equal(gestureTransition(updated,{type:'gesture.cancel'},related).state,null);
});

test('view transitions retain exact date proposals, picker context and catalog submission across unrelated interactions',async()=>{
 const {initialViewState,viewTransition}=await import('../../lib/ui/model/view-state.ts'),{createDateInputModel}=await import('../../lib/ui/model/date-input.ts'),date=createDateInputModel();let view=initialViewState();
 const pair=date.pair('',value=>value);view=viewTransition(view,{type:'date.pair',id:'local:action:1',kind:'due',pair:{...pair,date:'2026-10-10',time:'23',error:'Incomplete date/time'}});view=viewTransition(view,{type:'date.error',id:'local:action:1',field:'due_at',message:'Incomplete date/time'});view=viewTransition(view,{type:'view.set',field:'projectQuery',value:' exact query '});view=viewTransition(view,{type:'catalog.submission',token:1,submission:{type:'project',target:null,name:' exact name ',contextToken:null,navigation:'{}'}});
 const before=structuredClone(view),next=viewTransition(view,{type:'view.collapse',key:'project:p'});assert.deepEqual(view,before);assert.equal(next.duePairs,view.duePairs);assert.equal(next.catalogSubmissions,view.catalogSubmissions);assert.equal(next.projectQuery,' exact query ');
 const remapped=viewTransition(next,{type:'view.remap',from:'local:action:1',to:'saved'});assert.equal(remapped.duePairs.saved.time,'23');assert.equal(remapped.dateErrors.saved.due_at,'Incomplete date/time');assert.equal(remapped.duePairs['local:action:1'],undefined);assert.equal(next.duePairs['local:action:1'].time,'23');
});

test('catalog acknowledgment correlates submission and preserves newer composer and selection intentions',async()=>{
 const {initialViewState,viewTransition,catalogAcknowledgmentPlan}=await import('../../lib/ui/model/view-state.ts');let view=initialViewState();view=viewTransition(view,{type:'view.navigation',patch:{view:'projects',classificationId:'all'}});view=viewTransition(view,{type:'view.set',field:'collapsed',value:['project:parent']});view=viewTransition(view,{type:'view.set',field:'catalogContext',value:{type:'project',target:null,parentId:'parent',token:7}});view=viewTransition(view,{type:'view.set',field:'catalogComposerOpen',value:true});
 const submitted={type:'project',target:null,name:'submitted',contextToken:7,navigation:JSON.stringify(view.navigation),direct:true,selectionVersion:view.selectionVersion};view=viewTransition(view,{type:'catalog.submission',token:9,submission:submitted});const created={type:'project',id:'created',sequence:1,token:9},nodes=[{id:'parent',parent_id:null},{id:'created',parent_id:'parent'}],before=structuredClone(view);
 const plan=catalogAcknowledgmentPlan(view,created,nodes,'submitted');assert.deepEqual(view,before);assert.deepEqual(plan.select,{kind:'project',id:'created'});assert.deepEqual(plan.state.collapsed,[]);assert.equal(plan.state.catalogSubmissions[9],undefined);assert.equal(plan.state.navigation.classificationId,'created');
 const later=viewTransition(view,{type:'view.selection',catalog:'project:other'});assert.equal(catalogAcknowledgmentPlan(later,created,nodes,'submitted').select,null);
 const ordinary=viewTransition(view,{type:'catalog.submission',token:9,submission:{...submitted,direct:false}});assert.equal(catalogAcknowledgmentPlan(ordinary,created,nodes,'newer unfinished name').hideComposer,false);assert.equal(catalogAcknowledgmentPlan(ordinary,created,nodes,'submitted').hideComposer,true);assert.equal(catalogAcknowledgmentPlan(view,{...created,available:false},nodes,'submitted').select,null);
});
