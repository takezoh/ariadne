export type TreeKind='action'|'project'|'tag';
export interface DropNode {id:string;parent_id?:string|null;order?:number}
export interface DropGeometry {kind:TreeKind|'group';id:string;key:string;left:number;top:number;bottom:number;catalogId:string|null;last:boolean;title?:{left:number;right:number;top:number;bottom:number}|null}
export interface DropIndex {byId:Map<string,DropNode>;ancestors:Map<string,DropNode[]>;children:Map<string|null,DropNode[]>}
function createIndex(nodes:readonly DropNode[]):DropIndex {
 const byId=new Map(nodes.map(node=>[node.id,node])),children=new Map<string|null,DropNode[]>();
 for(const node of nodes){const parent=node.parent_id??null;const rows=children.get(parent)||[];rows.push(node);children.set(parent,rows);}
 const ancestors=new Map<string,DropNode[]>();
 for(const node of nodes){const path:DropNode[]=[],seen=new Set<string>();let parent=node.parent_id??null;while(parent&&byId.has(parent)&&!seen.has(parent)){seen.add(parent);const value=byId.get(parent)!;path.unshift(value);parent=value.parent_id??null;}ancestors.set(node.id,path);}
 return {byId,ancestors,children};
}
/** Coordinate conversion only; movement policy stays in pure UI/domain models. */
export function createTreeDropModel(){
 function index(nodes:readonly DropNode[]):DropIndex{return createIndex(nodes);}
 function chain(nodes:readonly DropNode[],id:string,prepared=createIndex(nodes)){return [...(prepared.ancestors.get(id)||[]),...(prepared.byId.has(id)?[prepared.byId.get(id)!]:[])];}
 function hit(rows:readonly DropGeometry[],bounds:{left:number;right:number},x:number,y:number){
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<bounds.left||x>bounds.right)return null;
  let low=0,high=rows.length-1,candidate=-1;
  while(low<=high){const mid=(low+high)>>1;if(rows[mid].top<=y){candidate=mid;low=mid+1;}else high=mid-1;}
  if(candidate<0)return null;const row=rows[candidate];return y<=row.bottom+(row.last?8:0)?row:null;
 }
 function resolve(source:TreeKind,row:DropGeometry,x:number,y:number,startX:number,snapshot:{actions:readonly DropNode[];projects:readonly DropNode[];tags:readonly DropNode[]},prepared?:DropIndex){
  const edge=Math.min(8,(row.bottom-row.top)*.2),title=row.title,center=title&&x>=title.left&&x<=title.right&&y>=title.top+(title.bottom-title.top)*.25&&y<=title.bottom-(title.bottom-title.top)*.25,placement=x<row.left?(row.last||y>=(row.top+row.bottom)/2?'after':'before'):center?'inside':y<row.top+edge?'before':y>row.bottom-edge?'after':'inside';
  if(placement==='inside'){
   if(source==='action'&&row.kind==='action')return {kind:'action',placement:'inside',anchor:row.id,key:row.key,depth:0};
   if(source==='action'&&(row.kind==='project'||row.kind==='tag'||row.kind==='group'&&row.id==='unassigned'))return {kind:'classification',catalogKind:row.kind==='tag'?'tag':'project',id:row.id,key:row.key};
   if(source===row.kind){const nodes=source==='project'?snapshot.projects:snapshot.tags;return {kind:source,placement:'inside',anchor:row.id,parent_id:row.id,key:row.key,depth:chain(nodes,row.id,prepared||createIndex(nodes)).length};}
   return null;
  }
  if(source!=='action'&&row.last&&placement==='after'&&x<=row.left+12)return {kind:source,placement:'root',parent_id:null,key:row.key,depth:0};
  const nodes=source==='action'?snapshot.actions:source==='project'?snapshot.projects:snapshot.tags,id=source==='action'?(row.kind==='action'?row.id:null):row.kind===source?row.id:row.kind==='action'?row.catalogId:null;
  if(!id)return null;
  const active=prepared||createIndex(nodes),ancestors=chain(nodes,id,active);if(!ancestors.length)return null;
  const current=ancestors.length-1,delta=Math.round((x-startX)/18),depth=x<=row.left+12?0:Math.max(0,Math.min(current,current+delta));
  if(depth===0&&row.last&&placement==='after')return {kind:source,placement:'root',parent_id:null,key:row.key,depth};
  const anchor=ancestors[depth];return {kind:source,placement:depth<current?'after':placement,anchor:anchor.id,parent_id:anchor.parent_id??null,key:row.key,depth};
 }
 function fingerprint(nodes:readonly (DropNode&{order?:number})[],id:string,anchor?:string,root=false,prepared=createIndex(nodes)){
  const source=prepared.byId.get(id),target=prepared.byId.get(anchor||''),sourceAncestors=new Set((prepared.ancestors.get(id)||[]).map(node=>node.id)),targetAncestors=new Set((prepared.ancestors.get(anchor||'')||[]).map(node=>node.id));
  return JSON.stringify(nodes.filter(node=>node.id===id||node.id===anchor||sourceAncestors.has(node.id)||prepared.ancestors.get(node.id)?.some(parent=>parent.id===id)||targetAncestors.has(node.id)||node.parent_id===source?.parent_id||node.parent_id===target?.parent_id||node.parent_id===target?.id||root&&!node.parent_id).map(node=>[node.id,node.parent_id??null,node.order??null]).sort((a,b)=>String(a[0])<String(b[0])?-1:1));
 }
 return {index,chain,hit,resolve,fingerprint};
}
