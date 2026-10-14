import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePickerIndex,projectActionInspector,projectActionRow,projectCatalogInspector,projectCatalogMoveDestinations,projectCatalogRow,projectDateInputs,projectMoveDestinations,projectPickerOptions,projectSavedComparison,resolveChoice} from '../../lib/ui/model/ui-projections.ts';

const pair=(date,time='',extra={})=>({date,time,value:date?date+'T'+time:'',error:'',timeEdited:false,badDate:false,badTime:false,...extra});

test('date projection combines retained edits with saved fallbacks without changing either input',()=>{
 const duePair=pair('2026-10-12','13:17',{timeEdited:true}),savedPair=pair('2026-10-13','09:00');
 const input={dueValue:'2026-10-01T09:00:00Z',deferValue:'2026-10-02T09:00:00Z',dueEdited:true,deferEdited:false,duePair,pair:value=>value?.includes('02')?savedPair:pair('2026-10-01','09:00')};
 const before=structuredClone({duePair,savedPair}),projection=projectDateInputs(input);
 assert.deepEqual(projection,{due:duePair,defer:savedPair,dueDate:duePair.date,dueTime:duePair.time,deferDate:savedPair.date,deferTime:savedPair.time});
 assert.deepEqual({duePair,savedPair},before);
});

test('date projection omits invalid date and time controls independently',()=>{
 const projection=projectDateInputs({dueValue:null,deferValue:null,dueEdited:false,deferEdited:false,pair:()=>pair('','',{badDate:true,badTime:false})});
 assert.equal(Object.hasOwn(projection,'dueDate'),false);assert.equal(projection.dueTime,'');
 assert.equal(Object.hasOwn(projection,'deferDate'),false);assert.equal(projection.deferTime,'');
});

test('picker index normalization covers empty, lower, current, and stale positions',()=>{
 assert.deepEqual([-1,0,2,9].map(index=>normalizePickerIndex(index,3)),[-1,0,2,2]);
 assert.equal(normalizePickerIndex(0,0),-1);
});

test('choice projection retains a valid destination and selects a deterministic fallback',()=>{
 assert.equal(resolveChoice('b',['a','b']),'b');
 assert.equal(resolveChoice('missing',['a','b']),'a');
 assert.equal(resolveChoice('missing',[]),'');
});

test('saved conflict projection resolves persisted catalog IDs to labels without mutating records',()=>{
 const action={id:'a',title:'Saved title',notes:'',order:2,flagged:false,revision:3,status:'active',project_id:'p',tags:[{id:'t'},{id:'missing'}],due_at:null,defer_until:'2026-10-14T09:00:00Z'};
 const projects=[{id:'p',name:'Project',path:'Root / Project'}],tags=[{id:'t',name:'Tag',path:'Root / Tag'}],before=structuredClone({action,projects,tags});
 assert.equal(projectSavedComparison(['project_id','tag_ids','title','due_at','deferUntil'],action,projects,tags),[
  'Saved Project: Root / Project','Saved Tags: Unavailable tag, Root / Tag','Saved Title: Saved title','Saved Due: Empty','Saved Defer: 2026-10-14T09:00:00Z',
 ].join('\n'));
 assert.equal(projectSavedComparison(['project_id'],{...action,project_id:null},projects,tags),'Saved Project: Unassigned');
 assert.deepEqual({action,projects,tags},before);
});


test('action row projection derives badges, accessible title, and stable interaction signature without mutation',()=>{
 const action={id:'child',title:'  Review   notes ',notes:'',order:2,flagged:true,revision:3,status:'on-hold',project_id:'p',tags:[{id:'t',name:'Design',path:'Work / Design'}],due_at:'2026-10-14T09:00:00Z',parent_id:'parent',defer_reasons:[{id:'parent',title:'Launch',until:'2026-10-15T09:00:00Z',ancestor:true}]};
 const parent={id:'parent',title:'Launch',notes:'',order:1,flagged:false,revision:2,status:'active',project_id:null,tags:[],due_at:null};
 const entry={key:'action:child',level:1,parentKey:'action:parent'};
 const input={entry,action,actions:[parent,action],draft:{...action,title:'  Updated   notes '},tree:false,visibleActionIds:['child'],batchSelected:true,active:false,formattedDue:'Oct 14'};
 const before=structuredClone(input),row=projectActionRow(input);
 assert.equal(row.title,'  Updated   notes ');
 assert.equal(row.accessibleTitle,'  Review   notes ');
 assert.deepEqual(row.badges.map(badge=>badge.text),['In Launch','On hold','Later','Due Oct 14','Work / Design']);
 assert.equal(row.batchSelected,true);assert.equal(row.active,false);assert.equal(typeof row.signature,'string');
 assert.deepEqual(input,before);
 assert.equal(projectActionRow(input).signature,row.signature);
 assert.notEqual(projectActionRow({...input,batchSelected:false}).signature,row.signature);
});

test('catalog row projection reflects draft, collapsed state, and selection as presentation data',()=>{
 const entry={key:'project:p',kind:'project',id:'p',level:1,label:'Work / Planning',expandable:true},collapsed=['project:p'];
 const input={entry,collapsed,draft:{name:'Quarterly planning',description:''},selected:true},before=structuredClone(input);
 const row=projectCatalogRow(input);
 assert.deepEqual(row,{signature:row.signature,title:'Quarterly planning',collapsed:true,selected:true,batchSelected:false});
 assert.notEqual(projectCatalogRow({...input,selected:false}).signature,row.signature);
 assert.deepEqual(input,before);
});

test('action inspector projection joins saved labels, retained edits, date state, and ancestor controls',()=>{
 const action={id:'a',title:'Saved',notes:'saved notes',order:1,flagged:false,revision:3,status:'active',project_id:'p',tags:[{id:'t'}],due_at:'2026-10-14T09:00:00Z',defer_reasons:[{id:'parent',title:'Release',until:'2026-10-20T09:00:00Z',ancestor:true}]};
 const draft={title:'Edited',notes:'unsaved notes',flagged:true,status:'active',project_id:'p',tag_ids:['t'],due_at:'2026-10-15T09:00:00Z',defer_until:null};
 const projects=[{id:'p',name:'Plan',parent_id:null}],tags=[{id:'t',name:'Urgent',parent_id:null}];
 const dates={due:pair('2026-10-15','09:00'),defer:pair('','')},before=structuredClone({action,draft,projects,tags,dates});
 const view=projectActionInspector({id:'a',draft,action,targetAvailable:true,conflicts:['title','project_id'],projects,tags,dates,projectPickerFocused:false,formatInstant:value=>'formatted '+value});
 assert.equal(view.title,'Edited');assert.equal(view.notes,'unsaved notes');assert.equal(view.flagged,true);assert.equal(view.lifecycle,'Active');
 assert.equal(view.projectValue,'Plan');assert.deepEqual(view.tags,[{id:'t',label:'Urgent',focusKey:'tag:a:t'}]);
 assert.equal(view.dateSummary,'Parent Release · Deferred until: formatted 2026-10-20T09:00:00Z');
 assert.deepEqual(view.releases,[{id:'parent',label:'Parent Release · Clear Defer'}]);
 assert.equal(view.savedCompare,'Saved Title: Saved\nSaved Project: Plan');
 assert.deepEqual({action,draft,projects,tags,dates},before);
 assert.equal(projectActionInspector({id:'a',draft,action,targetAvailable:false,conflicts:[],projects,tags,dates,projectPickerFocused:true,formatInstant:String}).projectValue,undefined);
 const missing=projectActionInspector({id:'a',draft:{...draft,project_id:'missing'},action,targetAvailable:true,conflicts:[],projects,tags,dates,projectPickerFocused:false,formatInstant:String});assert.equal(missing.projectValue,'Unassigned');
});

test('catalog inspector projection keeps edit state while exposing validation and retry decisions',()=>{
 const record={id:'child',name:'Current',description:'',parent_id:'parent'},draft={name:'Edited',description:'Draft'};
 const nodes=[{id:'parent',name:'Work',description:'',parent_id:null,path:'Work'},record],validation={name:'Name is required'};
 const input={kind:'project',id:'child',temporary:false,draft,record,nodes,conflicts:[],error:'Name is required',unknown:false,busy:false,recoveryRequired:false,validation};
 const before=structuredClone(input),view=projectCatalogInspector(input);
 assert.deepEqual(view,{kind:'project',temporary:false,exists:true,draft:{name:'Edited',description:'Draft'},missingMessage:'This project is no longer available. Your edits are retained.',parentText:'Parent: Work',nameErrorText:'Name is required',descriptionErrorText:'',conflict:false,problemText:'',savedCompare:'',showRetry:true,retryDisabled:false});
 assert.deepEqual(input,before);
 const recovery=projectCatalogInspector({...input,error:'Server unavailable',validation:{},unknown:true,recoveryRequired:true});
 assert.equal(recovery.showRetry,false);assert.equal(recovery.retryDisabled,true);assert.equal(recovery.problemText,'Server unavailable');
});

test('picker and move projections preserve deterministic choices and display labels',()=>{
 const records=[{id:'p',name:'Planning',parent_id:null},{id:'t',name:'Urgent',parent_id:null}],draft={title:'Edited',notes:'',status:'active',project_id:'p',tag_ids:['t']};
 const options=projectPickerOptions('project',[{id:'',name:'Unassigned'},{id:'p',name:'Planning'}],records,draft,1);
 assert.deepEqual(options.map(({label,selected,active})=>({label,selected,active})),[{label:'Unassigned',selected:false,active:false},{label:'Planning',selected:true,active:true}]);
 const actions=[{id:'a',title:'Saved',status:'active'},{id:'b',title:'Second',status:'active'},{id:'a',title:'Duplicate',status:'active'}];
 assert.deepEqual(projectMoveDestinations(actions,{a:{title:'Edited'},b:{title:'Second'}}),[{id:'a',label:'Edited'},{id:'b',label:'Second'}]);
 assert.deepEqual(projectCatalogMoveDestinations([{id:'p',name:'Plan',path:'Work / Plan'}]),[{id:'p',label:'Work / Plan'}]);
});
