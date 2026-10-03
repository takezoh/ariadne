export function mutationBlocked(busy:boolean,unknown:unknown):boolean {return busy||Boolean(unknown);}
export function hasUnsavedChanges(unknown:unknown,drafts:Readonly<Record<string,{dirty:boolean}>>,title:string,capture:string):boolean {
 return Boolean(unknown)||Object.values(drafts).some(draft=>draft.dirty)||Boolean(title)||Boolean(capture);
}

/** Selection is independent from membership; missing targets retain an accessible proposal route. */
export function editorSelection(selectedId:string|null,drafts:Readonly<Record<string,{dirty:boolean}>>,actionIds:readonly string[],visibleIds:readonly string[]) {
 const retainedIds=Object.keys(drafts).filter(id=>drafts[id].dirty&&!visibleIds.includes(id));
 return {selectedId,retainedIds,retainedSelected:Boolean(selectedId&&retainedIds.includes(selectedId)),targetAvailable:Boolean(selectedId&&actionIds.includes(selectedId)),canMutate:Boolean(selectedId&&actionIds.includes(selectedId))};
}
