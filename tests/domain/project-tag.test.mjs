import {test} from 'node:test';
import assert from 'node:assert/strict';
import {change,project,nodePath,descendantIds} from '../../lib/domain/core.ts';
import {delta,undo,queryResponse,preview} from '../../lib/domain/operations.ts';
const now='2026-10-03T00:00:00.000Z';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const empty=()=>({revision:0,catalog_identity_ledger:[],actions:[],projects:[],tags:[],action_tags:[],perspectives:[]});
const apply=(s,kind,payload)=>{const after=change(s,{kind,payload},now);after.revision=s.revision+1;return after;};

test('project and tag hierarchies derive paths and reject cycles and dangling parents',()=>{
 let s=empty();
 s=apply(s,'project_add',{id:id(1),name:'仕事'});
 s=apply(s,'project_add',{id:id(2),name:'資料',parent_id:id(1)});
 s=apply(s,'project_add',{id:id(3),name:'Q4',parent_id:id(2)});
 assert.equal(nodePath(s.projects,id(3)),'仕事/資料/Q4');
 assert.deepEqual([...descendantIds(s.projects,id(1))].sort(),[id(1),id(2),id(3)].sort());
 assert.throws(()=>apply(s,'project_move',{id:id(1),parent_id:id(3)}),e=>e.code==='cycle');
 assert.throws(()=>apply(s,'project_add',{id:id(4),name:'x',parent_id:id(9)}),e=>e.code==='not_found');
 assert.throws(()=>apply(s,'project_move',{id:id(2),parent_id:id(2)}),e=>e.code==='cycle');
 assert.equal(s.projects.find(p=>p.id===id(3)).name,'Q4','local name only, path is derived');
 assert.equal(s.projects.length,3);
});

test('action associations validate references and are reversible',()=>{
 let s=empty();
 s=apply(s,'add',{id:id(10),title:'action'});
 s=apply(s,'project_add',{id:id(1),name:'P'});
 s=apply(s,'tag_add',{id:id(2),name:'T'});
 s=apply(s,'action_project',{id:id(10),project_id:id(1)});
 s=apply(s,'action_tag',{id:id(10),tag_id:id(2),enabled:true});
 assert.equal(s.actions[0].project_id,id(1));
 assert.equal(s.action_tags.length,1);
 assert.throws(()=>apply(s,'action_project',{id:id(10),project_id:id(9)}),e=>e.code==='not_found');
 assert.throws(()=>apply(s,'action_tag',{id:id(10),tag_id:id(9),enabled:true}),e=>e.code==='not_found');
 assert.throws(()=>apply(s,'action_tag',{id:id(9),tag_id:id(2),enabled:true}),e=>e.code==='not_found');
 s=apply(s,'action_project',{id:id(10),project_id:null});
 s=apply(s,'action_tag',{id:id(10),tag_id:id(2),enabled:false});
 assert.equal(s.actions[0].project_id,null);
 assert.equal(s.action_tags.length,0);
});

test('deletion refuses while children or action references remain',()=>{
 let s=empty();
 s=apply(s,'project_add',{id:id(1),name:'P'});
 s=apply(s,'project_add',{id:id(2),name:'C',parent_id:id(1)});
 s=apply(s,'tag_add',{id:id(3),name:'T'});
 s=apply(s,'add',{id:id(10),title:'t'});
 s=apply(s,'action_project',{id:id(10),project_id:id(2)});
 s=apply(s,'action_tag',{id:id(10),tag_id:id(3),enabled:true});
 assert.throws(()=>apply(s,'project_remove',{id:id(1)}),e=>e.code==='related_actions');
 assert.throws(()=>apply(s,'project_remove',{id:id(2)}),e=>e.code==='related_actions');
 assert.throws(()=>apply(s,'tag_remove',{id:id(3)}),e=>e.code==='related_actions');
 s=apply(s,'action_project',{id:id(10),project_id:null});
 s=apply(s,'action_tag',{id:id(10),tag_id:id(3),enabled:false});
 s=apply(s,'project_remove',{id:id(2)});
 s=apply(s,'project_remove',{id:id(1)});
 s=apply(s,'tag_remove',{id:id(3)});
 assert.equal(s.projects.length,0);
 assert.equal(s.tags.length,0);
 assert.equal(s.actions.length,1,'deletion never removes actions');
});

test('project and tag queries expand descendants and deduplicate actions',()=>{
 let s=empty();
 s=apply(s,'project_add',{id:id(1),name:'P'});
 s=apply(s,'project_add',{id:id(2),name:'C',parent_id:id(1)});
 s=apply(s,'tag_add',{id:id(3),name:'T'});
 s=apply(s,'tag_add',{id:id(4),name:'T2',parent_id:id(3)});
 s=apply(s,'add',{id:id(10),title:'a'});
 s=apply(s,'add',{id:id(11),title:'b'});
 s=apply(s,'action_project',{id:id(10),project_id:id(2)});
 s=apply(s,'action_project',{id:id(11),project_id:id(2)});
 s=apply(s,'action_tag',{id:id(10),tag_id:id(3),enabled:true});
 s=apply(s,'action_tag',{id:id(10),tag_id:id(4),enabled:true});
 const expanded=queryResponse(s,now,{project_id:id(1),include_descendants:true});
 assert.deepEqual([...expanded.actions.map(t=>t.id)].sort(),[id(10),id(11)].sort());
 const tagQuery=queryResponse(s,now,{tag_id:id(3),include_descendants:true});
 assert.equal(tagQuery.actions.length,1,'action matching two descendant tags is listed once');
 assert.equal(tagQuery.actions[0].id,id(10));
 assert.equal(queryResponse(s,now,{project_id:id(1)}).actions.length,0,'direct scope excludes child project actions');
 assert.equal(queryResponse(s,now,{}).actions.length,s.actions.length);
 assert.throws(()=>queryResponse(s,now,{project_id:id(9)}),e=>e.code==='not_found');
});

test('project and tag hierarchy never changes action state, dates or action parents',()=>{
 let s=empty();
 s=apply(s,'add',{id:id(10),title:'parent action'});
 s=apply(s,'add',{id:id(11),title:'child action',parent_id:id(10)});
 s=apply(s,'project_add',{id:id(1),name:'P'});
 s=apply(s,'tag_add',{id:id(2),name:'T'});
 s=apply(s,'action_project',{id:id(10),project_id:id(1)});
 s=apply(s,'action_project',{id:id(11),project_id:id(1)});
 s=apply(s,'action_tag',{id:id(11),tag_id:id(2),enabled:true});
 assert.equal(s.actions.find(t=>t.id===id(10)).status,'active');
 assert.equal(s.actions.find(t=>t.id===id(11)).status,'active');
 assert.equal(s.actions.find(t=>t.id===id(11)).defer_until,null);
 assert.equal(s.actions.find(t=>t.id===id(11)).parent_id,id(10),'action parent stays separate from project hierarchy');
 const projected=project(s,now).find(t=>t.id===id(11));
 assert.equal(projected.project_path,'P');
 assert.deepEqual(projected.tags.map(g=>g.path),['T']);
 assert.equal(projected.view,'normal');
});

test('cancelled action associations remain ordinary editable properties',()=>{
 let s=empty();
 s=apply(s,'add',{id:id(10),title:'cancelled action'});
 s=apply(s,'project_add',{id:id(1),name:'P'});
 s=apply(s,'tag_add',{id:id(2),name:'T'});
 s=apply(s,'tag_add',{id:id(3),name:'unused'});
 s=apply(s,'action_project',{id:id(10),project_id:id(1)});
 s=apply(s,'action_tag',{id:id(10),tag_id:id(2),enabled:true});
 s=apply(s,'cancel',{id:id(10)});
 s=apply(s,'action_project',{id:id(10),project_id:id(1)});
 s=apply(s,'action_tag',{id:id(10),tag_id:id(2),enabled:true});
 s=apply(s,'action_tag',{id:id(10),tag_id:id(3),enabled:false});
 s=apply(s,'action_project',{id:id(10),project_id:null});
 s=apply(s,'action_tag',{id:id(10),tag_id:id(2),enabled:false});
 assert.equal(s.actions[0].project_id,null);
 assert.equal(s.action_tags.length,0);
 s=apply(s,'action_tag',{id:id(10),tag_id:id(2),enabled:false});
});

test('preview includes descendant catalog nodes whose derived paths change only',()=>{
 let s=empty();
 s=apply(s,'project_add',{id:id(1),name:'Work'});
 s=apply(s,'project_add',{id:id(2),name:'Docs',parent_id:id(1)});
 s=apply(s,'project_add',{id:id(3),name:'Quarter',parent_id:id(2)});
 s=apply(s,'project_add',{id:id(4),name:'Unrelated'});
 s=apply(s,'tag_add',{id:id(5),name:'Context'});
 s=apply(s,'tag_add',{id:id(6),name:'Home',parent_id:id(5)});
 s=apply(s,'tag_add',{id:id(7),name:'Unrelated tag'});
 s=apply(s,'tag_add',{id:id(8),name:'Other'});
 const projectPreview=preview(s,{kind:'project_edit',payload:{id:id(1),name:'Office'}},now);
 assert.deepEqual(projectPreview.affected_projects.map(x=>x.id).sort(),[id(1),id(2),id(3)].sort());
 assert.equal(projectPreview.affected_projects.find(x=>x.id===id(3)).path,'Office/Docs/Quarter');
 assert(!projectPreview.affected_projects.some(x=>x.id===id(4)));
 const tagPreview=preview(s,{kind:'tag_move',payload:{id:id(5),parent_id:id(8)}},now);
 assert.deepEqual(tagPreview.affected_tags.map(x=>x.id).sort(),[id(5),id(6)].sort());
 assert.equal(tagPreview.affected_tags.find(x=>x.id===id(6)).path,'Other/Context/Home');
 assert(!tagPreview.affected_tags.some(x=>x.id===id(7)));
});

test('delta and Undo cover catalog changes without mutating frozen inputs',()=>{
 const before=empty();
 const added=apply(before,'project_add',{id:id(1),name:'P'}),projectDelta=delta(before,added);
 const frozen=Object.freeze(added),back=undo(frozen,projectDelta,now,added.revision);
 assert.equal(back.projects.length,0);
 assert.equal(back.catalog_identity_ledger.find(x=>x.kind==='project'&&x.identity===id(1)).revision,added.revision+1,'Undo keeps the ID reservation');
 assert.throws(()=>apply(back,'project_add',{id:id(1),name:'P'}),e=>e.code==='invalid_state');
 assert.equal(frozen.projects.length,1,'Undo does not mutate its input');
 const action=apply(empty(),'add',{id:id(10),title:'t'}),tag=apply(action,'tag_add',{id:id(2),name:'T'}),beforeRelation=tag;
 const afterRelation=apply(beforeRelation,'action_tag',{id:id(10),tag_id:id(2),enabled:true}),relationDelta=delta(beforeRelation,afterRelation);
 const withoutRelation=undo(afterRelation,relationDelta,now,afterRelation.revision);
 assert.equal(withoutRelation.action_tags.length,0);
});

test('Undo rejects when a project changed after the operation',()=>{
 let s=empty();
 s=apply(s,'project_add',{id:id(1),name:'P'});
 const d=delta(empty(),s);
 const later=apply(s,'project_edit',{id:id(1),name:'P2'});
 assert.throws(()=>undo(later,d,now,s.revision),e=>e.code==='undo_conflict');
});


test('project and tag IDs stay reserved after deletion and old Undo cannot erase a restored node',()=>{
 const first=apply(empty(),'project_add',{id:id(1),name:'P'}),addedDelta=delta(empty(),first);
 const removed=apply(first,'project_remove',{id:id(1)}),removedDelta=delta(first,removed);
 assert.throws(()=>apply(removed,'project_add',{id:id(1),name:'P'}),e=>e.code==='invalid_state','deleted UUID cannot be reused by a new request');
 const restored=undo(removed,removedDelta,now,removed.revision);
 assert.equal(restored.projects.length,1,'Undo may restore the original reserved identity');
 assert.throws(()=>undo(restored,addedDelta,now,first.revision),e=>e.code==='undo_conflict','a later restoration advances the identity ledger');
 const tagFirst=apply(empty(),'tag_add',{id:id(2),name:'T'}),tagRemoved=apply(tagFirst,'tag_remove',{id:id(2)});
 assert.throws(()=>apply(tagRemoved,'tag_add',{id:id(2),name:'T'}),e=>e.code==='invalid_state');
});

test('action_tag ABA is rejected even when the relation is absent again',()=>{
 const withAction=apply(empty(),'add',{id:id(10),title:'action'}),withTag=apply(withAction,'tag_add',{id:id(2),name:'T'});
 const attached=apply(withTag,'action_tag',{id:id(10),tag_id:id(2),enabled:true}),detach=apply(attached,'action_tag',{id:id(10),tag_id:id(2),enabled:false}),detachDelta=delta(attached,detach);
 const reattached=apply(detach,'action_tag',{id:id(10),tag_id:id(2),enabled:true}),absentAgain=apply(reattached,'action_tag',{id:id(10),tag_id:id(2),enabled:false});
 assert.equal(absentAgain.action_tags.length,0);
 assert.throws(()=>undo(absentAgain,detachDelta,now,detach.revision),e=>e.code==='undo_conflict');
});

test('catalog and query inputs reject missing, null and non-boolean values',()=>{
 let s=apply(empty(),'project_add',{id:id(1),name:'P'});
 s=apply(s,'project_add',{id:id(2),name:'C',parent_id:id(1)});
 s=apply(s,'tag_add',{id:id(3),name:'T'});
 s=apply(s,'add',{id:id(10),title:'action'});
 assert.throws(()=>apply(s,'project_move',{id:id(2)}),e=>e.code==='invalid_input','missing parent_id must not detach');
 assert.throws(()=>apply(s,'tag_move',{id:id(3)}),e=>e.code==='invalid_input');
 assert.throws(()=>apply(s,'action_project',{id:id(10)}),e=>e.code==='invalid_input','missing project_id must not detach');
 assert.equal(apply(s,'project_move',{id:id(2),parent_id:null}).projects.find(p=>p.id===id(2)).parent_id,null);
 assert.equal(apply(s,'action_project',{id:id(10),project_id:null}).actions.find(t=>t.id===id(10)).project_id,null);
 assert.deepEqual(queryResponse(s,now,{project_id:null}).actions.map(t=>t.id),s.actions.filter(t=>t.project_id===null).map(t=>t.id));
 assert.throws(()=>queryResponse(s,now,{tag_id:null}),e=>e.code==='invalid_input');
 assert.throws(()=>queryResponse(s,now,{project_id:id(1),include_descendants:null}),e=>e.code==='invalid_input');
 assert.throws(()=>queryResponse(s,now,{project_id:id(1),include_descendants:'yes'}),e=>e.code==='invalid_input');
});

test('preview reports catalog changes and path-only action effects',()=>{
 let s=apply(empty(),'project_add',{id:id(1),name:'P'});
 s=apply(s,'project_add',{id:id(2),name:'C',parent_id:id(1)});
 s=apply(s,'add',{id:id(10),title:'action'});
 s=apply(s,'action_project',{id:id(10),project_id:id(2)});
 const renamed=preview(s,{kind:'project_edit',payload:{id:id(2),name:'C2'}},now);
 assert.equal(renamed.affected_projects.length,1);
 assert.equal(renamed.affected_projects[0].path,'P/C2');
 assert.equal(renamed.affected.length,1,'action under the renamed project is affected by its path change');
 assert.equal(renamed.affected[0].project_path,'P/C2');
 const added=preview(s,{kind:'project_add',payload:{id:id(3),name:'D'}},now);
 assert.equal(added.affected.length,0);
 assert.equal(added.affected_projects[0].path,'D');
 const tagged=preview(s,{kind:'tag_add',payload:{id:id(4),name:'T'}},now);
 assert.equal(tagged.affected_tags.length,1);
 assert.equal(tagged.affected_tags[0].path,'T');
});

test('Undo drops a relation whose tag is missing and restores other changes',()=>{
 let before=apply(empty(),'add',{id:id(10),title:'before'});
 before=apply(before,'tag_add',{id:id(2),name:'deleted'});
 before=apply(before,'tag_add',{id:id(3),name:'surviving'});
 before=apply(before,'action_tag',{id:id(10),tag_id:id(2),enabled:true});
 before=apply(before,'action_tag',{id:id(10),tag_id:id(3),enabled:true});
 const after=apply(before,'edit',{id:id(10),title:'after'});
 after.action_tags=[];
 after.catalog_identity_ledger=after.catalog_identity_ledger.map(row=>row.kind==='action_tag'?{...row,revision:after.revision}:row);
 const removed=apply(after,'tag_remove',{id:id(2)}),saved=structuredClone(removed);
 const restored=undo(removed,delta(before,after),now,after.revision);
 assert.equal(restored.actions[0].title,'before');
 assert.deepEqual(restored.action_tags.map(row=>row.tag_id),[id(3)]);
 assert.deepEqual(removed,saved,'input snapshot remains unchanged');
});
