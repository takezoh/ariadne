/** D1 composition entry for integration callers; HTTP routes use server/actions. */
import {actionCall as invoke} from './application/action-service';
import {createD1ActionStore} from './adapters/d1-action-store';
export {ActionError} from './domain/core';
export type {Action} from './domain/core';
export {requireOwner} from './server/auth';

export function actionCall(db:D1Database,owner:string,name:string,args:unknown,clock=()=>new Date().toISOString()){return invoke({store:createD1ActionStore(db),clock,newId:()=>crypto.randomUUID()},owner,name,args);}
