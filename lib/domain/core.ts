export class ActionError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}
export type Action = { id:string; title:string; revision:number; parent_id:string|null; project_id:string|null; status:'active'|'on-hold'|'completed'|'dropped'; due_at:string|null; defer_until:string|null; notes:string; order:number; flagged:boolean; created_at:string; updated_at:string };
export type Project = { id:string; order:number; name:string; description:string; parent_id:string|null; revision:number; created_at:string; updated_at:string };
export type Tag = { id:string; order:number; name:string; description:string; parent_id:string|null; revision:number; created_at:string; updated_at:string };
export type ActionTag = { action_id:string; tag_id:string; revision:number };
export type CatalogIdentityLedger = { kind:'project'|'tag'|'action_tag'|'perspective'; identity:string; revision:number };
export type PerspectiveFilter = {statuses?:Action['status'][];is_deferred?:boolean;flagged?:boolean;project_id?:string|null;tag_id?:string;include_descendants?:boolean};
export type Perspective = {id:string;name:string;description:string;filter:PerspectiveFilter;definition_version:1;revision:number;created_at:string;updated_at:string};
export type Snapshot = { revision:number; catalog_identity_ledger:CatalogIdentityLedger[]; actions:Action[]; projects:Project[]; tags:Tag[]; action_tags:ActionTag[]; perspectives:Perspective[] };
export type Change = {kind:string; payload:Record<string,unknown>};
export function fail(code:string,message:string,status=400):never {throw new ActionError(code,message,status);}
export function object(value:unknown):Record<string,unknown> {if(!value||typeof value!=='object'||Array.isArray(value))fail('invalid_input','入力の形式が不正です。');return value as Record<string,unknown>;}
export function exact(o:Record<string,unknown>,keys:string[]) {if(Object.keys(o).some(k=>!keys.includes(k)))fail('invalid_input','未知の入力項目があります。');}
/** Catalog names follow the current required-name contract. */
export function catalogName(v:unknown) {return text(v,200);}
export function text(v:unknown,max=200) {if(typeof v!=='string'||!v.trim()||v.length>max)fail('invalid_input','文字列の入力を確認してください。');return v.trim();}
/** Caller-controlled context is preserved exactly, including empty text and whitespace. */
export function description(v:unknown):string {if(typeof v!=='string'||v.length>65536)fail('invalid_input','説明は65536文字以内の文字列で指定してください。');return v;}
export function integer(v:unknown) {if(!Number.isSafeInteger(v)||Number(v)<0)fail('invalid_input','版が不正です。');return Number(v);}
export function actionTitle(v:unknown) {return text(v,200);}
export function initialTagIds(s:Snapshot,v:unknown):string[] {if(v===undefined)return [];if(!Array.isArray(v))fail('invalid_input','tag_ids must be an array.');const ids=v.map(id);if(new Set(ids).size!==ids.length)fail('invalid_input','tag_ids must be unique.');for(const gid of ids)if(!s.tags.some(x=>x.id===gid))fail('not_found','タグがありません。',404);return ids;}
export function id(v:unknown) {const s=text(v,80);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s))fail('invalid_input','IDが不正です。');return s;}
/** Classify every requested Action, including selected ancestors and descendants. */
export function classificationTargets(s:Snapshot,p:Record<string,unknown>):Action[] {if(Object.hasOwn(p,'id')===Object.hasOwn(p,'ids'))fail('invalid_input','Specify exactly one of id or ids.');if(Object.hasOwn(p,'id'))return [anyAction(s,p.id)];if(!Array.isArray(p.ids)||!p.ids.length)fail('invalid_input','ids must be a nonempty array.');const ids=p.ids.map(id);if(new Set(ids).size!==ids.length)fail('invalid_input','ids must be unique.');return ids.map(value=>anyAction(s,value));}
export function zone(v:unknown) {const s=text(v,100);try{new Intl.DateTimeFormat('en',{timeZone:s}).format(0);}catch{fail('invalid_input','タイムゾーンが不正です。');}return s;}
export function instant(v:unknown):string|null {if(v===null)return null;const s=text(v,100);const day=s.slice(0,10);if(!Number.isFinite(Date.parse(day+'T00:00:00Z'))||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day)fail('invalid_input','日付が不正です。');if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(Z|[+-]\d\d:\d\d)$/.test(s)||!Number.isFinite(Date.parse(s)))fail('invalid_input','日時にはタイムゾーンを含めてください。');return new Date(s).toISOString();}
export function dateDefer(date:unknown,tz:string|null) {if(!tz)fail('timezone_required','先にタイムゾーンを確認してください。');const d=text(date,10);if(!/^\d{4}-\d\d-\d\d$/.test(d))fail('invalid_input','日付が不正です。');const target=Date.parse(d+'T09:00:00Z');if(!Number.isFinite(target)||new Date(target).toISOString().slice(0,10)!==d)fail('invalid_input','日付が不正です。');
 const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 // Search possible offsets, rejecting nonexistent/ambiguous wall times.
 const matches:number[]=[];for(let offset=-14*60;offset<=14*60;offset+=15){const n=target-offset*60000;if(fmt.format(n)===d+' 09:00:00')matches.push(n);}
 if(matches.length!==1)fail('ambiguous_time','このローカル時刻を一意に解決できません。時刻を明示してください。');return new Date(matches[0]).toISOString();}
function action(s:Snapshot,v:unknown) {return anyAction(s,v);}
function anyAction(s:Snapshot,v:unknown) {const t=s.actions.find(t=>t.id===id(v));if(!t)fail('not_found','対象アクションがありません。',404);return t;}
type HierarchyNode={id:string;name:string;parent_id:string|null};
/** Root-first chain of a node and its ancestors; detects cycles in the stored hierarchy. */
export function hierarchyChain(nodes:HierarchyNode[],value:string):HierarchyNode[] {const out:HierarchyNode[]=[];const seen=new Set<string>();let cur=nodes.find(n=>n.id===value);while(cur){if(seen.has(cur.id))fail('cycle','階層が循環しています。');seen.add(cur.id);out.unshift(cur);cur=cur.parent_id?nodes.find(n=>n.id===cur!.parent_id):undefined;}return out;}
/** Derived display path (names joined by '/'); identity is always the stable ID. */
export function nodePath(nodes:HierarchyNode[],value:string):string|null {if(!nodes.some(n=>n.id===value))return null;return hierarchyChain(nodes,value).map(n=>n.name).join('/');}
/** The node itself plus every descendant, deduplicated. */
export function descendantIds(nodes:HierarchyNode[],value:string):string[] {const out=[value];for(let i=0;i<out.length;i++)for(const n of nodes)if(n.parent_id===out[i]&&!out.includes(n.id))out.push(n.id);return out;}
function validateNodes(nodes:HierarchyNode[],kind:string){const ids=new Set<string>(),keys=new Set<string>();for(const n of nodes){catalogName(n.name);if(ids.has(n.id))fail('invalid_state',kind+'のIDが重複しています。');ids.add(n.id);const key=JSON.stringify([n.parent_id,n.name]);if(keys.has(key))fail('invalid_state','同じ親の下に同名の'+kind+'は作成できません。');keys.add(key);}for(const n of nodes)if(n.parent_id!==null&&!ids.has(n.parent_id))fail('invalid_graph',kind+'の親が存在しません。');for(const n of nodes)hierarchyChain(nodes,n.id);}
export function catalogIdentityKey(_kind:CatalogIdentityLedger['kind'],identity:string){return identity;}
export function catalogIdentityRevision(s:Snapshot,kind:CatalogIdentityLedger['kind'],identity:string){return s.catalog_identity_ledger.find(x=>x.kind===kind&&x.identity===catalogIdentityKey(kind,identity))?.revision??0;}
export function catalogIdentityReserved(s:Snapshot,kind:'project'|'tag'|'perspective',identity:string){return s.catalog_identity_ledger.some(x=>x.kind===kind&&x.identity===identity);}
export function markCatalogIdentity(s:Snapshot,kind:CatalogIdentityLedger['kind'],identity:string,revision=s.revision+1){
 const key=catalogIdentityKey(kind,identity);let found=false;
 const ledger=s.catalog_identity_ledger.map(row=>{
  if(row.kind===kind&&row.identity===key){found=true;return {...row,revision};}
  return row;
 });
 if(!found)ledger.push({kind,identity:key,revision});
 return ledger;
}
/** Order is a nonnegative sibling rank, with ID as a deterministic tie breaker. */
export function actionOrder(value:unknown):number {if(!Number.isSafeInteger(value)||Number(value)<0)fail('invalid_input','順序は0以上の安全な整数で指定してください。');return Number(value);}
export function booleanFlag(value:unknown):boolean {if(typeof value!=='boolean')fail('invalid_input','Flagは真偽値で指定してください。');return value;}
function nextOrder(s:Snapshot,parent:string|null,projectId:string|null,exclude?:string):number {const peers=s.actions.filter(t=>t.id!==exclude&&t.parent_id===parent&&(parent!==null||t.project_id===projectId));return actionOrder(peers.length?peers.reduce((max,t)=>Math.max(max,t.order),0)+1:0);}
/** Render roots by project, then siblings by rank; descendants immediately follow parents. */
export function orderedActions(s:Snapshot):Action[] {const compare=(a:Action,b:Action)=>a.order-b.order||(a.id<b.id?-1:a.id>b.id?1:0);const children=new Map<string|null,Action[]>();for(const t of s.actions){const group=children.get(t.parent_id)??[];group.push(t);children.set(t.parent_id,group);}for(const group of children.values())group.sort(compare);const roots=children.get(null)??[];roots.sort((a,b)=>((a.project_id??'')<(b.project_id??'')?-1:(a.project_id??'')>(b.project_id??'')?1:0)||compare(a,b));const out:Action[]=[];const visit=(t:Action)=>{out.push(t);for(const child of children.get(t.id)??[])visit(child);};for(const root of roots)visit(root);return out;}
export function ancestors(s:Snapshot,t:Action) {const out:Action[]=[];let p=t.parent_id;while(p){const a=s.actions.find(x=>x.id===p);if(!a||out.some(x=>x.id===p)||a.id===t.id)fail('invalid_graph','親子関係が不正です。');out.push(a);p=a.parent_id;}return out;}
/** Saved views contain strict AND predicates, never a display or order override. */
export function perspectiveFilter(value:unknown):PerspectiveFilter {
 const input=object(value);exact(input,['statuses','is_deferred','flagged','project_id','tag_id','include_descendants']);
 const filter:PerspectiveFilter={};
 if('statuses' in input){if(!Array.isArray(input.statuses)||input.statuses.some(v=>!['active','on-hold','completed','dropped'].includes(v))||new Set(input.statuses).size!==input.statuses.length)fail('invalid_input','statusesは重複のない状態の配列で指定してください。');filter.statuses=[...input.statuses] as Action['status'][];}
 for(const key of ['is_deferred','flagged','include_descendants'] as const)if(key in input){if(typeof input[key]!=='boolean')fail('invalid_input',key+'は真偽値で指定してください。');filter[key]=input[key];}
 if('project_id' in input)filter.project_id=input.project_id===null?null:id(input.project_id);
 if('tag_id' in input)filter.tag_id=id(input.tag_id);
 return filter;
}
export function validatePerspectiveReferences(s:Snapshot,filter:PerspectiveFilter){
 if(filter.project_id&&!s.projects.some(x=>x.id===filter.project_id))fail('not_found','パースペクティブのプロジェクトがありません。',404);
 if(filter.tag_id&&!s.tags.some(x=>x.id===filter.tag_id))fail('not_found','パースペクティブのタグがありません。',404);
}
/** Filtering follows the existing projection order and leaves source state untouched. */
export function perspectiveActions(s:Snapshot,now:string,value:unknown){
 const filter=perspectiveFilter(value);validatePerspectiveReferences(s,filter);
 const projects=filter.project_id?(filter.include_descendants?descendantIds(s.projects,filter.project_id):[filter.project_id]):null;
 const tags=filter.tag_id?(filter.include_descendants?descendantIds(s.tags,filter.tag_id):[filter.tag_id]):null;
 return project(s,now).filter(t=>(filter.statuses===undefined||filter.statuses.includes(t.status))&&(filter.is_deferred===undefined||t.is_deferred===filter.is_deferred)&&(filter.flagged===undefined||t.flagged===filter.flagged)&&(!('project_id' in filter)||(filter.project_id===null?t.project_id===null:!!t.project_id&&projects!.includes(t.project_id)))&&(!tags||s.action_tags.some(x=>x.action_id===t.id&&tags.includes(x.tag_id))));
}
export function validateGraph(s:Snapshot) {
 for(const key of ['actions','projects','tags','action_tags','perspectives','catalog_identity_ledger'] as const)if(!Array.isArray(s[key]))fail('invalid_state','Current snapshots require every collection.');
 for(const row of [...s.projects,...s.tags])actionOrder(row.order);
 for(const row of s.catalog_identity_ledger)if(!Number.isSafeInteger(row.revision)||row.revision<0)fail('invalid_state','Identity revisions are required.');
 for(const t of s.actions){actionTitle(t.title);if(typeof t.notes!=='string')fail('invalid_state','Stored Action notes are required.');ancestors(s,t);actionOrder(t.order);booleanFlag(t.flagged);}
 validateNodes(s.projects,'プロジェクト');validateNodes(s.tags,'タグ');for(const node of [...s.projects,...s.tags])description(node.description);
 const perspectiveIds=new Set<string>();for(const view of s.perspectives){id(view.id);text(view.name);description(view.description);if(view.definition_version!==1)fail('invalid_state','パースペクティブ定義の版が不正です。');if(perspectiveIds.has(view.id))fail('invalid_state','パースペクティブIDが重複しています。');perspectiveIds.add(view.id);validatePerspectiveReferences(s,perspectiveFilter(view.filter));}
 for(const t of s.actions)if(t.project_id!==null&&!s.projects.some(p=>p.id===t.project_id))fail('invalid_graph','所属プロジェクトが存在しません。');
 for(const tt of s.action_tags)if(!s.actions.some(t=>t.id===tt.action_id)||!s.tags.some(g=>g.id===tt.tag_id))fail('invalid_graph','タグの関連が不正です。');
}
export function project(s:Snapshot,now:string) {validateGraph(s);return orderedActions(s).map(t=>{const reasons=[t,...ancestors(s,t)].filter(x=>x.defer_until&&x.defer_until>now).map(x=>({id:x.id,title:x.title,until:x.defer_until,ancestor:x.id!==t.id}));return {...t,is_deferred:reasons.length>0,view:t.status==='dropped'?'cancelled':t.status==='completed'?'completed':reasons.length?'deferred':'normal',defer_reasons:reasons,project_path:t.project_id?nodePath(s.projects,t.project_id):null,tags:s.action_tags.filter(tt=>tt.action_id===t.id).map(tt=>({id:tt.tag_id,name:s.tags.find(g=>g.id===tt.tag_id)!.name,path:nodePath(s.tags,tt.tag_id)})).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)};});}
/** Resolve a structural move against every saved sibling, including filtered rows. */
export function actionMoveEdits(s:Snapshot,value:unknown):{id:string;parent_id:string|null;order:number}[] {
 const p=object(value);exact(p,['ids','placement','anchor_id']);
 if(!Array.isArray(p.ids)||!p.ids.length)fail('invalid_input','Select at least one action to move.');
 const ids=p.ids.map(id);if(new Set(ids).size!==ids.length)fail('invalid_input','Moving action IDs must be unique.');
 const selected=ids.map(value=>anyAction(s,value)),selectedIds=new Set(ids);
 const roots=selected.filter(t=>!ancestors(s,t).some(a=>selectedIds.has(a.id))),rootIds=new Set(roots.map(t=>t.id));
 const placement=p.placement;if(!['before','after','inside','root'].includes(placement as string))fail('invalid_input','Choose a valid move destination.');
 if(placement==='root'&&'anchor_id' in p)fail('invalid_input','Top-level movement does not accept an anchor.');
 const anchor=placement==='root'?null:anyAction(s,p.anchor_id);
 if(anchor&&(rootIds.has(anchor.id)||ancestors(s,anchor).some(a=>rootIds.has(a.id))))fail('cycle','An action cannot move into its own subtree.');
 const compare=(a:Action,b:Action)=>a.order-b.order||(a.id<b.id?-1:a.id>b.id?1:0);
 const destinations:{parent:string|null;project:string|null;incoming:Action[]}[]=[];
 if(placement==='root')for(const root of roots){const group=destinations.find(g=>g.project===root.project_id);if(group)group.incoming.push(root);else destinations.push({parent:null,project:root.project_id,incoming:[root]});}
 else {
  const parent=placement==='inside'?anchor!.id:anchor!.parent_id,project=parent===null?anchor!.project_id:null;
  if(parent===null&&roots.some(t=>t.project_id!==project))fail('invalid_input','Root actions can only be reordered within their own Project.');
  destinations.push({parent,project,incoming:roots});
 }
 const edits:{id:string;parent_id:string|null;order:number}[]=[];
 for(const group of destinations){
  const siblings=s.actions.filter(t=>t.parent_id===group.parent&&(group.parent!==null||t.project_id===group.project)).sort(compare);
  const remaining=siblings.filter(t=>!rootIds.has(t.id));let index=remaining.length;
  if(placement==='before'||placement==='after'){index=remaining.findIndex(t=>t.id===anchor!.id);if(index<0)fail('invalid_input','The move anchor is not a destination sibling.');if(placement==='after')index++;}
  const arranged=[...remaining.slice(0,index),...group.incoming,...remaining.slice(index)];
  if(siblings.length===arranged.length&&siblings.every((t,i)=>t.id===arranged[i].id)&&group.incoming.every(t=>t.parent_id===group.parent))continue;
  for(const [order,t] of arranged.entries())if(t.parent_id!==group.parent||t.order!==order)edits.push({id:t.id,parent_id:group.parent,order});
 }
 return edits;
}
/** Durable catalog sibling order is independent of Action containment and membership. */
export function compareProjects(a:Project,b:Project):number {return a.order-b.order||(a.name<b.name?-1:a.name>b.name?1:0)||(a.id<b.id?-1:a.id>b.id?1:0);}
export function compareTags(a:Tag,b:Tag):number {return compareProjects(a,b);}
function nextCatalogOrder(nodes:(Project|Tag)[],parent:string|null,exclude?:string):number {const siblings=nodes.filter(row=>row.parent_id===parent&&row.id!==exclude);return actionOrder(siblings.length?Math.max(...siblings.map(row=>row.order))+1:0);}
function catalogMoveEdits(nodes:(Project|Tag)[],p:Record<string,unknown>):{id:string;parent_id:string|null;order:number}[] {
 exact(p,['id','parent_id','placement','anchor_id']);const target=nodes.find(row=>row.id===id(p.id));if(!target)fail('not_found','Catalog is unavailable.',404);
 if(Object.hasOwn(p,'parent_id')){if(Object.hasOwn(p,'placement')||Object.hasOwn(p,'anchor_id'))fail('invalid_input','parent_id is exclusive with relative placement.');const parent=p.parent_id===null?null:id(p.parent_id);if(parent&&!nodes.some(row=>row.id===parent))fail('not_found','Parent Catalog is unavailable.',404);if(parent&&descendantIds(nodes,target.id).includes(parent))fail('cycle','A Catalog cannot move into its own subtree.');return target.parent_id===parent?[]:[{id:target.id,parent_id:parent,order:nextCatalogOrder(nodes,parent,target.id)}];}
 if(!['before','after','inside','root'].includes(String(p.placement)))fail('invalid_input','Choose a valid Catalog placement.');const placement=p.placement;if(placement==='root'&&Object.hasOwn(p,'anchor_id'))fail('invalid_input','root forbids anchor_id.');const anchor=placement==='root'?null:nodes.find(row=>row.id===id(p.anchor_id));if(placement!=='root'&&!anchor)fail('not_found','Catalog destination is unavailable.',404);if(anchor&&descendantIds(nodes,target.id).includes(anchor.id))fail('cycle','A Catalog cannot move into its own subtree.');const parent=placement==='inside'?anchor!.id:anchor?.parent_id??null;
 const original=nodes.filter(row=>row.parent_id===parent).sort(compareProjects),arranged=original.filter(row=>row.id!==target.id);const index=placement==='before'?arranged.findIndex(row=>row.id===anchor!.id):placement==='after'?arranged.findIndex(row=>row.id===anchor!.id)+1:arranged.length;arranged.splice(index,0,target);if(target.parent_id===parent&&original.length===arranged.length&&original.every((row,i)=>row.id===arranged[i].id))return [];
 return arranged.flatMap((row,order)=>row.parent_id!==parent||row.order!==order?[{id:row.id,parent_id:parent,order}]:[]);
}
export function projectMoveEdits(s:Snapshot,p:Record<string,unknown>){return catalogMoveEdits(s.projects,p);}
export function tagMoveEdits(s:Snapshot,p:Record<string,unknown>){return catalogMoveEdits(s.tags,p);}
export function change(s:Snapshot,c:Change,now:string):Snapshot {
 validateGraph(s);
 const n=structuredClone(s),p=object(c.payload);const touched:Action[]=[];const touchedProjects:Project[]=[];const touchedTags:Tag[]=[];const get=()=>{const t=action(n,p.id);touched.push(t);return t;};const projectNode=(v:unknown)=>{const x=n.projects.find(x=>x.id===id(v));if(!x)fail('not_found','対象プロジェクトがありません。',404);return x;};const tagNode=(v:unknown)=>{const x=n.tags.find(x=>x.id===id(v));if(!x)fail('not_found','対象タグがありません。',404);return x;};
 // The operation revision identifies catalog mutations and guards Undo against ABA changes.
 const nextGeneration=()=>s.revision+1;
 const nullableKey=(key:string)=>{if(!(key in p))fail('invalid_input',key+' を指定してください（解除は null）。');return p[key]===null?null:id(p[key]);};
 if(c.kind==='add'){exact(p,['id','title','parent_id','project_id','notes','order','flagged','tag_ids']);const tags=initialTagIds(n,p.tag_ids);const tid=id(p.id);if(n.actions.some(t=>t.id===tid))fail('invalid_state','このアクションIDは既に使われています。');const parent=p.parent_id==null?null:id(p.parent_id);if(parent)action(n,parent);n.actions.push({id:tid,title:actionTitle(p.title),revision:1,parent_id:parent,status:'active',due_at:null,defer_until:null,notes:p.notes===undefined?'':typeof p.notes==='string'&&p.notes.length<=65536?p.notes:fail('invalid_input','メモが不正です。'),project_id:p.project_id==null?null:id(p.project_id),order:p.order===undefined?nextOrder(n,parent,p.project_id==null?null:id(p.project_id)):actionOrder(p.order),flagged:p.flagged===undefined?false:booleanFlag(p.flagged),created_at:now,updated_at:now});for(const gid of tags){n.action_tags.push({action_id:tid,tag_id:gid,revision:nextGeneration()});n.catalog_identity_ledger=markCatalogIdentity(n,'action_tag',tid+':'+gid);}}
 else if(c.kind==='structure'){exact(p,['inbox_action_id','actions']);const inbox=action(n,p.inbox_action_id);if(!Array.isArray(p.actions)||!p.actions.length)fail('invalid_input','構造化結果が不正です。');let interim=n;
  for(const [index,value] of p.actions.entries()){const a=object(value);exact(a,['id','title','parent_id','project_id','notes','order','flagged']);if(index===0){if(id(a.id)!==inbox.id)fail('invalid_input','最初のアクションはInboxアクションを使用してください。');interim=change(interim,{kind:'edit',payload:{...a,parent_id:undefined}},now);}else interim=change(interim,{kind:'add',payload:{...a,parent_id:null}},now);}
  for(const value of p.actions){const a=object(value);if(a.parent_id!==undefined){const t=anyAction(interim,a.id),parent=a.parent_id===null?null:id(a.parent_id);if(t.parent_id!==parent&&a.order===undefined)t.order=nextOrder(interim,parent,t.project_id,t.id);t.parent_id=parent;}}
  validateGraph(interim);return interim;
 }
 else if(c.kind==='action_move'){for(const edit of actionMoveEdits(n,p)){const t=anyAction(n,edit.id);t.parent_id=edit.parent_id;t.order=edit.order;touched.push(t);}}
 else if(c.kind==='edit'){exact(p,['id','title','notes','parent_id','due_at','defer_until','status','order','flagged']);const t=get();if(p.title!==undefined)t.title=actionTitle(p.title);if(p.notes!==undefined){if(typeof p.notes!=='string'||p.notes.length>65536)fail('invalid_input','メモが不正です。');t.notes=p.notes;}if(p.parent_id!==undefined){const parent=p.parent_id===null?null:id(p.parent_id);if(parent!==t.parent_id&&p.order===undefined)t.order=nextOrder(n,parent,t.project_id,t.id);t.parent_id=parent;}if(p.order!==undefined)t.order=actionOrder(p.order);if(p.flagged!==undefined)t.flagged=booleanFlag(p.flagged);if(p.due_at!==undefined)t.due_at=instant(p.due_at);if(p.defer_until!==undefined)t.defer_until=instant(p.defer_until);if(p.status!==undefined){if(p.status!=='active'&&p.status!=='on-hold'&&p.status!=='completed'&&p.status!=='dropped')fail('invalid_input','状態が不正です。');if(p.status==='completed')for(const descendant of n.actions.filter(x=>x.id!==t.id&&ancestors(n,x).some(a=>a.id===t.id))){if(descendant.status!=='completed'){descendant.status='completed';touched.push(descendant);}}t.status=p.status;}}
 else if(c.kind==='status'){exact(p,['id','status']);if(!('status' in p))fail('invalid_input','状態を指定してください。');return change(s,{kind:'edit',payload:p},now);}
 else if(c.kind==='defer'){exact(p,['id','until','date','timezone']);const t=get();if(p.date!==undefined&&p.until!==undefined)fail('invalid_input','日時と日付の両方は指定できません。');t.defer_until=p.date!==undefined?dateDefer(p.date,p.timezone===undefined?null:zone(p.timezone)):instant(p.until);}
 else if(c.kind==='release'){exact(p,['id']);return change(s,{kind:'edit',payload:{id:p.id,defer_until:null}},now);}
 else if(c.kind==='cancel'){exact(p,['id']);return change(s,{kind:'edit',payload:{id:p.id,status:'dropped'}},now);}
 else if(c.kind==='complete'){exact(p,['id']);return change(s,{kind:'edit',payload:{id:p.id,status:'completed'}},now);}
 else if(c.kind==='reopen'){exact(p,['id','reopen_ancestors']);const t=get();const chain=ancestors(n,t);if(p.reopen_ancestors!==undefined&&!Array.isArray(p.reopen_ancestors))fail('invalid_input','再開する親は配列で指定してください。');const confirmed=Array.isArray(p.reopen_ancestors)?p.reopen_ancestors:[];for(const value of confirmed){const ancestor=chain.find(x=>x.id===id(value));if(!ancestor)fail('invalid_input','指定したアクションは親ではありません。');if(ancestor.status!=='active'){ancestor.status='active';touched.push(ancestor);}}t.status='active';}
 else if(c.kind==='wait')fail('invalid_input','waitは廃止されました。status属性を更新してください。');
 else if(c.kind==='perspective_add'){exact(p,['id','name','description','filter']);const pid=id(p.id);if(n.perspectives.some(x=>x.id===pid)||catalogIdentityReserved(n,'perspective',pid))fail('invalid_state','このパースペクティブIDは既に使われています。');n.perspectives.push({id:pid,name:text(p.name),description:'description' in p?description(p.description):'',filter:perspectiveFilter(p.filter),definition_version:1,revision:nextGeneration(),created_at:now,updated_at:now});n.catalog_identity_ledger=markCatalogIdentity(n,'perspective',pid);}
 else if(c.kind==='perspective_edit'||c.kind==='perspective_remove'){exact(p,c.kind==='perspective_edit'?['id','name','description','filter']:['id']);const pid=id(p.id),view=n.perspectives.find(x=>x.id===pid);if(!view)fail('not_found','パースペクティブがありません。',404);if(c.kind==='perspective_remove')n.perspectives=n.perspectives.filter(x=>x.id!==pid);else {if(!('name' in p)&&!('filter' in p)&&!('description' in p))fail('invalid_input','更新項目を指定してください。');if('name' in p)view.name=text(p.name);if('description' in p)view.description=description(p.description);if('filter' in p)view.filter=perspectiveFilter(p.filter);view.revision=nextGeneration();view.updated_at=now;}n.catalog_identity_ledger=markCatalogIdentity(n,'perspective',pid);}
 else if(c.kind==='project_add'){exact(p,['id','name','description','parent_id']);const pid=id(p.id);if(n.projects.some(x=>x.id===pid)||catalogIdentityReserved(n,'project',pid))fail('invalid_state','このプロジェクトIDは既に使われています。');const parent=p.parent_id==null?null:id(p.parent_id);if(parent&&!n.projects.some(x=>x.id===parent))fail('not_found','親プロジェクトがありません。');n.projects.push({id:pid,name:catalogName(p.name),description:'description' in p?description(p.description):'',parent_id:parent,order:nextCatalogOrder(n.projects,parent),revision:nextGeneration(),created_at:now,updated_at:now});n.catalog_identity_ledger=markCatalogIdentity(n,'project',pid);}
 else if(c.kind==='project_edit'){exact(p,['id','name','description']);if(!('name' in p)&&!('description' in p))fail('invalid_input','更新項目を指定してください。');const x=projectNode(p.id);if('name' in p)x.name=catalogName(p.name);if('description' in p)x.description=description(p.description);touchedProjects.push(x);n.catalog_identity_ledger=markCatalogIdentity(n,'project',x.id);}
 else if(c.kind==='project_move'){for(const edit of projectMoveEdits(n,p)){const x=projectNode(edit.id);x.parent_id=edit.parent_id;x.order=edit.order;touchedProjects.push(x);n.catalog_identity_ledger=markCatalogIdentity(n,'project',x.id);}}
 else if(c.kind==='project_remove'){exact(p,['id']);const x=projectNode(p.id);if(n.perspectives.some(v=>v.filter.project_id===x.id))fail('related_perspectives','参照するパースペクティブの条件を先に変更してください。');if(n.projects.some(y=>y.parent_id===x.id))fail('related_actions','子プロジェクトを先に移動または削除してください。');if(n.actions.some(t=>t.project_id===x.id))fail('related_actions','このプロジェクトを参照するアクションの所属を先に解除してください。');n.catalog_identity_ledger=markCatalogIdentity(n,'project',x.id);n.projects=n.projects.filter(y=>y.id!==x.id);}
 else if(c.kind==='tag_add'){exact(p,['id','name','description','parent_id']);const gid=id(p.id);if(n.tags.some(x=>x.id===gid)||catalogIdentityReserved(n,'tag',gid))fail('invalid_state','このタグIDは既に使われています。');const parent=p.parent_id==null?null:id(p.parent_id);if(parent&&!n.tags.some(x=>x.id===parent))fail('not_found','親タグがありません。');n.tags.push({id:gid,name:catalogName(p.name),description:'description' in p?description(p.description):'',parent_id:parent,order:nextCatalogOrder(n.tags,parent),revision:nextGeneration(),created_at:now,updated_at:now});n.catalog_identity_ledger=markCatalogIdentity(n,'tag',gid);}
 else if(c.kind==='tag_edit'){exact(p,['id','name','description']);if(!('name' in p)&&!('description' in p))fail('invalid_input','更新項目を指定してください。');const x=tagNode(p.id);if('name' in p)x.name=catalogName(p.name);if('description' in p)x.description=description(p.description);touchedTags.push(x);n.catalog_identity_ledger=markCatalogIdentity(n,'tag',x.id);}
 else if(c.kind==='tag_move'){for(const edit of tagMoveEdits(n,p)){const x=tagNode(edit.id);x.parent_id=edit.parent_id;x.order=edit.order;touchedTags.push(x);n.catalog_identity_ledger=markCatalogIdentity(n,'tag',x.id);}}
 else if(c.kind==='tag_remove'){exact(p,['id']);const x=tagNode(p.id);if(n.perspectives.some(v=>v.filter.tag_id===x.id))fail('related_perspectives','参照するパースペクティブの条件を先に変更してください。');if(n.tags.some(y=>y.parent_id===x.id))fail('related_actions','子タグを先に移動または削除してください。');if(n.action_tags.some(tt=>tt.tag_id===x.id))fail('related_actions','このタグを参照するアクションの関連を先に解除してください。');n.catalog_identity_ledger=markCatalogIdentity(n,'tag',x.id);n.tags=n.tags.filter(y=>y.id!==x.id);}
 else if(c.kind==='action_project'){exact(p,['id','ids','project_id']);const targets=classificationTargets(n,p);const pid=nullableKey('project_id');if(pid&&!n.projects.some(x=>x.id===pid))fail('not_found','プロジェクトがありません。');for(const t of targets){if(t.project_id!==pid&&t.parent_id===null)t.order=nextOrder(n,null,pid,t.id);t.project_id=pid;touched.push(t);}}
 else if(c.kind==='action_tag'){exact(p,['id','ids','tag_id','enabled']);const targets=classificationTargets(n,p);const gid=id(p.tag_id);if(!n.tags.some(x=>x.id===gid))fail('not_found','タグがありません。');if(typeof p.enabled!=='boolean')fail('invalid_input','タグの操作が不正です。');for(const t of targets){const i=n.action_tags.findIndex(x=>x.action_id===t.id&&x.tag_id===gid);if(p.enabled&&i<0){n.action_tags.push({action_id:t.id,tag_id:gid,revision:nextGeneration()});n.catalog_identity_ledger=markCatalogIdentity(n,'action_tag',t.id+':'+gid);}if(!p.enabled&&i>=0){n.action_tags.splice(i,1);n.catalog_identity_ledger=markCatalogIdentity(n,'action_tag',t.id+':'+gid);}touched.push(t);}}
 else fail('unknown_kind','未対応の操作です。');
 for(const t of new Set(touched)){t.revision++;t.updated_at=now;}for(const x of new Set(touchedProjects)){x.revision=nextGeneration();x.updated_at=now;}for(const x of new Set(touchedTags)){x.revision=nextGeneration();x.updated_at=now;}validateGraph(n);return n;
}
export function canonical(v:unknown):string {if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';return JSON.stringify(v);}
