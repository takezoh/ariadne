export interface PickerItem {id:string;name:string;path?:string}
/** Search only ranks presentation; UUID identity and caller text remain unchanged. */
export function createPickerModel(){
 function normalize(value:string){return value.normalize('NFKC').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[\u30a1-\u30f6]/g,char=>String.fromCharCode(char.charCodeAt(0)-96)).replace(/\s+/g,' ').trim();}
 function score(label:string,query:string){const text=normalize(label),needle=normalize(query);if(!needle)return 0;if(text===needle)return 10000;if(text.startsWith(needle))return 8000-text.length;const exact=text.indexOf(needle);if(exact>=0)return 6000-exact*20-text.length;let position=-1,gaps=0,first=-1;for(const char of needle){const next=text.indexOf(char,position+1);if(next<0)return null;if(first<0)first=next;if(position>=0)gaps+=next-position-1;position=next;}return 3000-gaps*15-first*20-text.length;}
 function search<T extends PickerItem>(items:readonly T[],query:string):T[]{const ranked=items.map((item,index)=>({item,index,rank:score(item.path||item.name,query)})).filter(row=>row.rank!==null);ranked.sort((a,b)=>Number(b.rank)-Number(a.rank)||(normalize(a.item.path||a.item.name)<normalize(b.item.path||b.item.name)?-1:normalize(a.item.path||a.item.name)>normalize(b.item.path||b.item.name)?1:0)||(a.item.id<b.item.id?-1:a.item.id>b.item.id?1:0));return ranked.map(row=>row.item);}
 return {normalize,score,search};
}
