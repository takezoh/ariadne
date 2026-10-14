import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPerspectiveView} from '../../lib/ui/model/perspective-view.ts';

const id=value=>`00000000-0000-4000-8000-${String(value).padStart(12,'0')}`;
const action=(number,patch={})=>({id:id(number),title:`Action ${number}`,notes:`notes ${number}`,status:'active',order:number,parent_id:null,project_id:null,created_at:'2026-10-01T09:00:00.000Z',updated_at:'2026-10-01T09:00:00.000Z',due_at:null,...patch});
const project={id:id(40),name:'Work',path:'Work',order:1,parent_id:null};
const snapshot=actions=>({actions,projects:[project]});
const tasklist={type:'tasklist',sort:'action_order',direction:'asc',group:'none',completion_label:'complete',show_notes:true};

test('saved views preserve the exact matching UUID set and source records',()=>{
 const parent=action(1,{title:'Context',status:'completed',project_id:project.id});
 const first=action(2,{title:'Zulu',parent_id:parent.id,created_at:'2026-10-02T09:00:00.000Z',updated_at:'2026-10-03T09:00:00.000Z',due_at:'2026-10-04T09:00:00.000Z'});
 const second=action(3,{title:'Alpha',project_id:project.id,created_at:'2026-10-02T09:00:00.000Z',updated_at:null,status:'completed',notes:'  exact\nnotes  '});
 const matching=[first,second,first],source=snapshot([parent,first,second]),before=structuredClone(source);
 const views=[tasklist,{type:'thread',sort:'action_order',direction:'asc',group:'project',completion_label:'read',initial_body:'collapsed'},{type:'timeline',timestamp:'created_at',direction:'asc',group:'day',completion_label:'acknowledge',initial_body:'expanded'}];
 for(const view of views){const result=projectPerspectiveView({matching,snapshot:source,view,timezone:'America/Los_Angeles'});assert.equal(result.available,true);assert.deepEqual([...result.targetIds].sort(),[first.id,second.id].sort());assert.equal(new Set(result.targetIds).size,2);assert.deepEqual(source,before);assert.equal(result.items.some(item=>item.action.id===parent.id),false);}
 const thread=projectPerspectiveView({matching,snapshot:source,view:views[1],timezone:'UTC'});assert.equal(thread.items.find(item=>item.action.id===first.id).containsIn,'Contains in: Context');assert.equal(thread.items.find(item=>item.action.id===first.id).groupLabel,'Unassigned');assert.equal(thread.items.find(item=>item.action.id===second.id).action.notes,'  exact\nnotes  ');
 const timeline=projectPerspectiveView({matching,snapshot:source,view:views[2],timezone:'America/Los_Angeles'});assert.equal(timeline.timestampMeaning,'registration');assert.deepEqual(timeline.groups.map(group=>group.label),['2026-10-02']);
});

test('saved sorts use stable UUID ties, keep missing dates last, and apply direction only to values',()=>{
 const tiedHigh=action(9,{title:'same',created_at:'2026-10-02T09:00:00Z',due_at:'2026-10-02T09:00:00Z'});
 const tiedLow=action(4,{title:'same',created_at:'2026-10-02T09:00:00Z',due_at:'2026-10-02T09:00:00Z'});
 const missing=action(1,{title:'same',created_at:null,due_at:null});
 const source=snapshot([tiedHigh,missing,tiedLow]);
 for(const direction of ['asc','desc']){
  const result=projectPerspectiveView({matching:source.actions,snapshot:source,view:{...tasklist,sort:'created_at',direction},timezone:'UTC'});
  assert.deepEqual(result.targetIds,[tiedLow.id,tiedHigh.id,missing.id]);
 }
 const title=projectPerspectiveView({matching:source.actions,snapshot:source,view:{...tasklist,sort:'title',direction:'desc'},timezone:'UTC'});
 assert.deepEqual(title.targetIds,[missing.id,tiedLow.id,tiedHigh.id]);
});

test('project, status, and timezone-day buckets use fixed labels and stable group order',()=>{
 const rows=[action(1,{project_id:null,status:'dropped',created_at:null}),action(2,{project_id:project.id,status:'completed',created_at:'2026-10-02T03:00:00Z'}),action(3,{project_id:project.id,status:'active',created_at:'2026-10-02T23:00:00Z'})];
 const source=snapshot(rows);
 const projects=projectPerspectiveView({matching:rows,snapshot:source,view:{...tasklist,sort:'title',group:'project'},timezone:'UTC'});
 assert.deepEqual(projects.groups.map(group=>group.label),['Work','Unassigned']);
 const statuses=projectPerspectiveView({matching:rows,snapshot:source,view:{type:'thread',sort:'action_order',direction:'asc',group:'status',completion_label:'complete',initial_body:'collapsed'},timezone:'UTC'});
 assert.deepEqual(statuses.groups.map(group=>group.label),['Active','Completed','Dropped']);
 const timeline=projectPerspectiveView({matching:rows,snapshot:source,view:{type:'timeline',timestamp:'created_at',direction:'asc',group:'day',completion_label:'complete',initial_body:'collapsed'},timezone:'America/Los_Angeles'});
 assert.deepEqual(timeline.groups.map(group=>group.label),['2026-10-01','2026-10-02','Unknown registration']);
 assert.equal(timeline.groups[0].items[0].timestamp,'2026-10-02T03:00:00Z');
});

test('Thread and Timeline derive initial expansion from the saved definition and readonly overrides',()=>{
 const rows=[action(1,{notes:'long enough to expand'}),action(2,{notes:'another note'})],source=snapshot(rows),view={type:'thread',sort:'action_order',direction:'asc',group:'none',completion_label:'complete',initial_body:'expanded'};
 const overrides={ [rows[0].id]:false, [rows[1].id]:true },before=structuredClone(overrides);
 const result=projectPerspectiveView({matching:rows,snapshot:source,view,timezone:'UTC',expandedBodyOverrides:overrides});
 assert.deepEqual(result.items.map(item=>item.expanded),[false,true]);assert.deepEqual(overrides,before);
 const defaults=projectPerspectiveView({matching:rows,snapshot:source,view:{...view,initial_body:'collapsed'},timezone:'UTC'});
 assert.deepEqual(defaults.items.map(item=>item.expanded),[false,false]);
});

test('invalid definitions, timezones, and malformed required timestamps fail closed',()=>{
 const row=action(1),source=snapshot([row]);
 assert.equal(projectPerspectiveView({matching:[row],snapshot:source,view:{...tasklist,group:'reply'},timezone:'UTC'}).available,false);
 assert.equal(projectPerspectiveView({matching:[row],snapshot:source,view:{...tasklist,direction:'desc'},timezone:'UTC'}).available,false);
 assert.equal(projectPerspectiveView({matching:[row],snapshot:source,view:tasklist,timezone:'Not/AZone'}).available,false);
 const malformed=action(2,{updated_at:'not-a-timestamp'});
 const result=projectPerspectiveView({matching:[malformed],snapshot:snapshot([malformed]),view:{type:'timeline',timestamp:'updated_at',direction:'desc',group:'none',completion_label:'complete',initial_body:'collapsed'},timezone:'UTC'});
 assert.equal(result.available,false);assert.deepEqual(result.targetIds,[]);
});
