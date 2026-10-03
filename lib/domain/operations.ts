import {canonical,project,validateGraph,fail,exact,change,dateDefer,zone,id,nodePath,descendantIds,catalogIdentityRevision,markCatalogIdentity,type Snapshot,type Action,perspectiveActions,type Perspective,type Change} from './core';
import {assistanceInstructions} from './assistance';
export type Delta={perspectives:{before:Perspective|null;after:Perspective|null}[];actions:{before:Action|null;after:Action|null}[];projects:{before:Snapshot['projects'][number]|null;after:Snapshot['projects'][number]|null}[];tags:{before:Snapshot['tags'][number]|null;after:Snapshot['tags'][number]|null}[];action_tags:{before:Snapshot['action_tags'][number]|null;after:Snapshot['action_tags'][number]|null}[]};
/** Receipts must contain current rows; missing historical fields are rejected, never filled. */
export function validateDelta(d:Delta){
 const required={actions:['id','title','notes','revision','parent_id','project_id','status','due_at','defer_until','order','flagged','created_at','updated_at'],projects:['id','name','description','parent_id','order','revision','created_at','updated_at'],tags:['id','name','description','parent_id','order','revision','created_at','updated_at'],perspectives:['id','name','description','filter','definition_version','revision','created_at','updated_at'],action_tags:['action_id','tag_id','revision']};
 for(const key of Object.keys(required) as (keyof Delta)[]){if(!Array.isArray(d?.[key]))fail('invalid_state','Receipts require every current delta collection.');for(const item of d[key]){if(!item||!Object.hasOwn(item,'before')||!Object.hasOwn(item,'after')||(!item.before&&!item.after))fail('invalid_state','Receipt delta rows are incomplete.');for(const row of [item.before,item.after]){if(!row)continue;const value=row as unknown as Record<string,unknown>;if(required[key].some(field=>!Object.hasOwn(value,field)))fail('invalid_state','Receipt rows require all current fields.');if(key==='actions'){if(typeof value.title!=='string'||!value.title.trim())fail('invalid_state','Receipt Action titles are required.');}else if(key!=='action_tags'){if(typeof value.name!=='string'||!value.name.trim()||typeof value.description!=='string')fail('invalid_state','Receipt catalog names and descriptions are required.');}if((key==='actions'||key==='projects'||key==='tags')&&(!Number.isSafeInteger(value.order)||Number(value.order)<0))fail('invalid_state','Receipt order is required.');}}
 }
}
export function delta(before:Snapshot,after:Snapshot):Delta {
 validateGraph(before);validateGraph(after);
 const diff=<T>(a:T[],b:T[],key:(x:T)=>string)=>{const oldRows=new Map(a.map(x=>[key(x),x])),newRows=new Map(b.map(x=>[key(x),x]));return [...new Set([...oldRows.keys(),...newRows.keys()])].map(k=>({before:oldRows.get(k)??null,after:newRows.get(k)??null})).filter(x=>canonical(x.before)!==canonical(x.after));};
 return {perspectives:diff(before.perspectives,after.perspectives,x=>x.id),actions:diff(before.actions,after.actions,x=>x.id),projects:diff(before.projects,after.projects,x=>x.id),tags:diff(before.tags,after.tags,x=>x.id),action_tags:diff(before.action_tags,after.action_tags,x=>x.action_id+':'+x.tag_id)};
}
export function response(s:Snapshot,now:string,result:unknown=null){validateGraph(s);const actions=project(s,now);return {schemaVersion:2,revision:s.revision,actions,perspectives:s.perspectives,projects:s.projects.map(p=>({...p,path:nodePath(s.projects,p.id)})),tags:s.tags.map(g=>({...g,path:nodePath(s.tags,g.id)})),result,retrieved_at:now,storage:'Sites D1',proof_stage:'structured todo MVP',assistance_policy:assistanceInstructions,list_scopes:{flagged:actions.filter(t=>t.flagged&&t.view==='normal').map(t=>t.id),waiting:actions.filter(t=>t.status==='on-hold').map(t=>t.id),inbox:actions.filter(t=>(t.status==='active'||t.status==='on-hold')&&t.project_id===null).map(t=>t.id),normal:actions.filter(t=>t.view==='normal').map(t=>t.id),deferred:actions.filter(t=>t.view==='deferred').map(t=>t.id),completed:actions.filter(t=>t.view==='completed').map(t=>t.id),cancelled:actions.filter(t=>t.view==='cancelled').map(t=>t.id)}};}
/** Query actions by project and/or tag. Descendant expansion deduplicates actions that match more than once. */
export function queryResponse(s:Snapshot,now:string,filter:{project_id?:unknown;tag_id?:unknown;include_descendants?:unknown;status?:unknown;is_deferred?:unknown;flagged?:unknown}) {
 // Strict input: explicit null is rejected, include_descendants must be boolean when present.

 if('tag_id' in filter&&filter.tag_id===null)fail('invalid_input','tag_id はnullにできません。');
 if('include_descendants' in filter&&typeof filter.include_descendants!=='boolean')fail('invalid_input','include_descendants は真偽値で指定してください。');
 const project_id='project_id' in filter&&filter.project_id!==undefined&&filter.project_id!==null?id(filter.project_id):null;
 const unassigned='project_id' in filter&&filter.project_id===null;
 const status=filter.status;if(status!==undefined&&!['active','on-hold','completed','dropped'].includes(status as string))fail('invalid_input','状態が不正です。');
 if(filter.is_deferred!==undefined&&typeof filter.is_deferred!=='boolean')fail('invalid_input','is_deferred は真偽値で指定してください。');
 if(filter.flagged!==undefined&&typeof filter.flagged!=='boolean')fail('invalid_input','Flagは真偽値で指定してください。');
 const tag_id='tag_id' in filter&&filter.tag_id!==undefined?id(filter.tag_id):null;
 const include_descendants=filter.include_descendants===true;

 if(project_id&&!s.projects.some(p=>p.id===project_id))fail('not_found','プロジェクトがありません。',404);
 if(tag_id&&!s.tags.some(g=>g.id===tag_id))fail('not_found','タグがありません。',404);
 const pids=project_id?(include_descendants?descendantIds(s.projects,project_id):[project_id]):null;
 const gids=tag_id?(include_descendants?descendantIds(s.tags,tag_id):[tag_id]):null;
 const ids=new Set<string>();
 for(const t of s.actions){if(filter.flagged!==undefined&&t.flagged!==filter.flagged)continue;if(unassigned&&t.project_id!==null)continue;if(status!==undefined&&t.status!==status)continue;if(pids&&!(t.project_id&&pids.includes(t.project_id)))continue;if(gids&&!s.action_tags.some(tt=>tt.action_id===t.id&&gids.includes(tt.tag_id)))continue;ids.add(t.id);}
 return {schemaVersion:2,revision:s.revision,query:{project_id,tag_id,include_descendants,...(filter.flagged!==undefined?{flagged:filter.flagged}:{}),...(status!==undefined?{status}:{}),...(filter.is_deferred!==undefined?{is_deferred:filter.is_deferred}:{})},projects:s.projects.map(p=>({...p,path:nodePath(s.projects,p.id)})),tags:s.tags.map(g=>({...g,path:nodePath(s.tags,g.id)})),actions:project(s,now).filter(t=>ids.has(t.id)&&(filter.is_deferred===undefined||t.is_deferred===filter.is_deferred)),retrieved_at:now};
}
export function listPerspectives(s:Snapshot,now:string){return {schemaVersion:2,revision:s.revision,perspectives:s.perspectives,retrieved_at:now};}
export function queryPerspective(s:Snapshot,now:string,value:unknown){const pid=id(value),perspective=s.perspectives.find(x=>x.id===pid);if(!perspective)fail('not_found','パースペクティブがありません。',404);return {schemaVersion:2,revision:s.revision,perspective,actions:perspectiveActions(s,now,perspective.filter),retrieved_at:now};}
export function undo(s:Snapshot,d:Delta,now:string,originalRevisionAfter:number) {
 try{validateGraph(s);validateDelta(d);}catch{fail('undo_conflict','Undo requires current-schema state and receipt rows.',409);}
 const n=structuredClone(s);const nextGeneration=()=>s.revision+1;
 const identityUnchanged=(kind:'project'|'tag'|'action_tag'|'perspective',identity:string)=>{if(catalogIdentityRevision(n,kind,identity)!==originalRevisionAfter)fail('undo_conflict','対象の所属・階層に後続の変更があります。',409);};
 const referenceUnchanged=(kind:'project'|'tag',identity:string|null)=>{if(identity&&catalogIdentityRevision(n,kind,identity)>originalRevisionAfter)fail('undo_conflict','参照先に後続の変更があります。',409);};
 // Compare the exact stored action state; migration resets incompatible operation history.
 for(const item of d.actions){const ref=item.after??item.before!,actual=n.actions.find(x=>x.id===ref.id)??null;if(canonical(actual)!==canonical(item.after))fail('undo_conflict','アクションに後続の変更があります。',409);if(item.before){referenceUnchanged('project',item.before.project_id);const restored={...item.before,revision:(actual?.revision??0)+1,updated_at:now};n.actions=n.actions.filter(x=>x.id!==ref.id);n.actions.push(restored);}else if(actual){actual.status='dropped';actual.project_id=null;actual.revision++;actual.updated_at=now;}}

 for(const item of d.projects){const ref=item.after??item.before!,current=n.projects.find(x=>x.id===ref.id)??null;if(canonical(current)!==canonical(item.after))fail('undo_conflict','プロジェクトに後続の変更があります。',409);identityUnchanged('project',ref.id);if(item.before){referenceUnchanged('project',item.before.parent_id);n.projects=n.projects.filter(x=>x.id!==ref.id);n.projects.push({...item.before,revision:nextGeneration(),updated_at:now});}else if(current)n.projects=n.projects.filter(x=>x.id!==ref.id);n.catalog_identity_ledger=markCatalogIdentity(n,'project',ref.id,s.revision+1);}
 for(const item of d.tags){const ref=item.after??item.before!,current=n.tags.find(x=>x.id===ref.id)??null;if(canonical(current)!==canonical(item.after))fail('undo_conflict','タグに後続の変更があります。',409);identityUnchanged('tag',ref.id);if(item.before){referenceUnchanged('tag',item.before.parent_id);n.tags=n.tags.filter(x=>x.id!==ref.id);n.tags.push({...item.before,revision:nextGeneration(),updated_at:now});}else if(current)n.tags=n.tags.filter(x=>x.id!==ref.id);n.catalog_identity_ledger=markCatalogIdentity(n,'tag',ref.id,s.revision+1);}
 for(const item of d.action_tags){const ref=item.after??item.before!,identity=ref.action_id+':'+ref.tag_id,key=(x:Snapshot['action_tags'][number])=>x.action_id===ref.action_id&&x.tag_id===ref.tag_id,current=n.action_tags.find(key)??null;
  // A deleted destination tag drops only this restoration, not the whole Undo.
  if(item.before&&!n.tags.some(tag=>tag.id===ref.tag_id))continue;
  if(canonical(current)!==canonical(item.after))fail('undo_conflict','タグ関連に後続の変更があります。',409);identityUnchanged('action_tag',identity);if(item.before)referenceUnchanged('tag',item.before.tag_id);n.action_tags=n.action_tags.filter(x=>!key(x));if(item.before)n.action_tags.push({...item.before,revision:nextGeneration()});n.catalog_identity_ledger=markCatalogIdentity(n,'action_tag',identity,s.revision+1);}
 for(const item of d.perspectives){const ref=item.after??item.before!,current=n.perspectives.find(x=>x.id===ref.id)??null;if(canonical(current)!==canonical(item.after))fail('undo_conflict','パースペクティブに後続の変更があります。',409);identityUnchanged('perspective',ref.id);if(item.before){referenceUnchanged('project',item.before.filter.project_id??null);referenceUnchanged('tag',item.before.filter.tag_id??null);n.perspectives=n.perspectives.filter(x=>x.id!==ref.id);n.perspectives.push({...item.before,revision:nextGeneration(),updated_at:now});}else n.perspectives=n.perspectives.filter(x=>x.id!==ref.id);n.catalog_identity_ledger=markCatalogIdentity(n,'perspective',ref.id,s.revision+1);}
 try{validateGraph(n);}catch{fail('undo_conflict','関係の変更により取り消せません。',409);}return n;
}

function affectedCatalog<T extends {id:string;name:string;parent_id:string|null}>(before:T[],after:T[]) {
 const ids=new Set([...before,...after].map(x=>x.id));
 return [...ids].flatMap(id=>{
  const oldNode=before.find(x=>x.id===id)??null,newNode=after.find(x=>x.id===id)??null;
  const oldPath=nodePath(before,id),newPath=nodePath(after,id);
  if(canonical(oldNode)===canonical(newNode)&&oldPath===newPath)return [];
  const node=newNode??oldNode!;
  return [{...node,path:newPath??oldPath}];
 });
}

export function preview(s:Snapshot,requestedChange:Change,now:string) {
 let c=requestedChange;
  if(c.kind==='defer'&&c.payload.date!==undefined){exact(c.payload,['id','until','date','timezone']);if(c.payload.until!==undefined)fail('invalid_input','日時と日付の両方は指定できません。');c={kind:c.kind,payload:{id:c.payload.id,until:dateDefer(c.payload.date,c.payload.timezone===undefined?null:zone(c.payload.timezone))}};}
  const n=change(s,c,now);if(c.kind==='defer')c={kind:c.kind,payload:{id:c.payload.id,until:n.actions.find(t=>t.id===c.payload.id)!.defer_until}};const beforeById=new Map(project(s,now).map(t=>[t.id,t])),affected=project(n,now).filter(t=>canonical(t)!==canonical(beforeById.get(t.id)??null));
  const affected_projects=affectedCatalog(s.projects,n.projects);
  const affected_tags=affectedCatalog(s.tags,n.tags);
  return {schemaVersion:2,expectedRevision:s.revision,kind:c.kind,payload:c.payload,affected,affected_projects,affected_tags,affected_perspectives:delta(s,n).perspectives,warnings:affected.filter(t=>t.due_at&&t.defer_reasons.some(r=>r.until!>t.due_at!)).map(t=>({id:t.id,due_at:t.due_at,message:t.title+'：締切 '+t.due_at+' より後まで保留されます。'})),evaluatedAt:now};
}
