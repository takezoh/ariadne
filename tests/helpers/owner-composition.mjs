import {actionCall} from '../../lib/application/action-service.ts';
import {createOwnerBoundActionStore} from '../../lib/adapters/d1-action-store.ts';
import {requireOwner} from '../../lib/server/auth.ts';
export const identity = owner => requireOwner(new Headers({'oai-authenticated-user-id':owner,'oai-authenticated-user-email':'test@local.invalid'}));
export function createD1ActionStore(db) {
 const bound=owner=>createOwnerBoundActionStore(db,identity(owner));
 return {readSnapshot:owner=>bound(owner).readSnapshot(),readReceipt:(owner,op)=>bound(owner).readReceipt(op),hasUndo:(owner,op)=>bound(owner).hasUndo(op),commit:({owner,...command})=>bound(owner).commit(command)};
}
export function actionCallForOwner(ports,owner,name,args) {
 const store=ports.store;
 return actionCall({...ports,store:{readSnapshot:()=>store.readSnapshot(owner),readReceipt:op=>store.readReceipt(owner,op),hasUndo:op=>store.hasUndo(owner,op),commit:command=>store.commit({...command,owner})}},name,args);
}
