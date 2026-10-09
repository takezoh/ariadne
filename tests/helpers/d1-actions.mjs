import {actionCallForOwner,createD1ActionStore} from './owner-composition.mjs';
export {ActionError} from '../../lib/domain/core.ts';
export {requireOwner} from '../../lib/server/auth.ts';
export function actionCall(db,owner,name,args,clock=()=>new Date().toISOString()){return actionCallForOwner({store:createD1ActionStore(db),clock,newId:()=>crypto.randomUUID()},owner,name,args);}
