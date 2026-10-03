export type TreeKind='action'|'project'|'tag';
export interface DropNode {id:string;parent_id?:string|null}
export interface DropGeometry {kind:TreeKind|'group';id:string;key:string;top:number;bottom:number;left:number;title?:{left:number;right:number;top:number;bottom:number};catalogId?:string|null;last:boolean}
/** Geometry arrives through a port; semantic ancestry comes from the full snapshot. */
export function createTreeDropModel(){
 function chain(nodes:readonly DropNode[],id:string){const result:DropNode[]=[],seen=new Set<string>();let node=nodes.find(n=>n.id===id);while(node&&!seen.has(node.id)){seen.add(node.id);result.unshift(node);node=nodes.find(n=>n.id===node!.parent_id);}return result;}
 function hit(rows:readonly DropGeometry[],bounds:{left:number;right:number},x:number,y:number){if(!Number.isFinite(x)||!Number.isFinite(y)||x<bounds.left||x>bounds.right)return null;return rows.find(row=>y>=row.top&&y<=row.bottom+(row.last?8:0))||null;}
 function resolve(source:TreeKind,row:DropGeometry,x:number,y:number,startX:number,snapshot:{actions:readonly DropNode[];projects:readonly DropNode[];tags:readonly DropNode[]}){
  const edge=Math.min(8,(row.bottom-row.top)*.2),title=row.title,center=title&&x>=title.left&&x<=title.right&&y>=title.top+(title.bottom-title.top)*.25&&y<=title.bottom-(title.bottom-title.top)*.25,placement=x<row.left?(row.last||y>=(row.top+row.bottom)/2?'after':'before'):center?'inside':y<row.top+edge?'before':y>row.bottom-edge?'after':'inside';
  if(placement==='inside'){
   if(source==='action'&&row.kind==='action')return {kind:'action',placement:'inside',anchor:row.id,key:row.key,depth:0};
   if(source==='action'&&(row.kind==='project'||row.kind==='tag'||row.kind==='group'&&row.id==='unassigned'))return {kind:'classification',catalogKind:row.kind==='tag'?'tag':'project',id:row.id,key:row.key};
   if(source===row.kind)return {kind:source,placement:'inside',anchor:row.id,parent_id:row.id,key:row.key,depth:chain(source==='project'?snapshot.projects:snapshot.tags,row.id).length};
   return null;
  }
  if(source!=='action'&&row.last&&placement==='after'&&x<=row.left+12)return {kind:source,placement:'root',parent_id:null,key:row.key,depth:0};
  const nodes=source==='action'?snapshot.actions:source==='project'?snapshot.projects:snapshot.tags,id=source==='action'?(row.kind==='action'?row.id:null):row.kind===source?row.id:row.kind==='action'?row.catalogId:null;
  if(!id)return null;
  const ancestors=chain(nodes,id);if(!ancestors.length)return null;
  const current=ancestors.length-1,delta=Math.round((x-startX)/18),depth=x<=row.left+12?0:Math.max(0,Math.min(current,current+delta));
  if(depth===0&&row.last&&placement==='after')return {kind:source,placement:'root',parent_id:null,key:row.key,depth};
  const anchor=ancestors[depth];return {kind:source,placement:depth<current?'after':placement,anchor:anchor.id,parent_id:anchor.parent_id??null,key:row.key,depth};
 }
 function fingerprint(nodes:readonly (DropNode&{order?:number})[],id:string,anchor?:string,root=false){const source=nodes.find(n=>n.id===id),target=nodes.find(n=>n.id===anchor);return JSON.stringify(nodes.filter(n=>n.id===id||n.id===anchor||chain(nodes,n.id).some(a=>a.id===id)||chain(nodes,id).some(a=>a.id===n.id)||chain(nodes,anchor||'').some(a=>a.id===n.id)||n.parent_id===source?.parent_id||n.parent_id===target?.parent_id||n.parent_id===target?.id||root&&!n.parent_id).map(n=>[n.id,n.parent_id??null,n.order??null]).sort((a,b)=>String(a[0])<String(b[0])?-1:1));}
 return {chain,hit,resolve,fingerprint};
}
