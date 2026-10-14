import {actionCall} from '../../lib/application/action-service.ts';
import {createOwnerBoundActionStore} from '../../lib/adapters/d1-action-store.ts';
import {requireOwner} from '../../lib/server/auth.ts';
import {createHash} from 'node:crypto';
export const identity = owner => requireOwner(new Headers({'oai-authenticated-user-id':owner,'oai-authenticated-user-email':'test@local.invalid'}));
export function createD1ActionStore(db) {
 const bound=owner=>createOwnerBoundActionStore(db,identity(owner));
 return {readSnapshot:owner=>bound(owner).readSnapshot(),readChangeWindow:(owner,after,through)=>bound(owner).readChangeWindow(after,through),readReceipt:(owner,op)=>bound(owner).readReceipt(op),hasUndo:(owner,op)=>bound(owner).hasUndo(op),commit:({owner,...command})=>bound(owner).commit(command)};
}
export function actionCallForOwner(ports,owner,name,args) {
 const store=ports.store;
 const ownerScope=()=>createHash('sha256').update('action-tools/change-cursor/scope/v1\0').update(owner).digest('base64url');
 return actionCall({...ports,store:{readSnapshot:()=>store.readSnapshot(owner),readChangeWindow:(after,through)=>store.readChangeWindow(owner,after,through),readReceipt:op=>store.readReceipt(owner,op),hasUndo:op=>store.hasUndo(owner,op),commit:command=>store.commit({...command,owner})},changeCursorScope:ports.changeCursorScope?()=>ports.changeCursorScope(owner):async()=>ownerScope()},name,args);
}
