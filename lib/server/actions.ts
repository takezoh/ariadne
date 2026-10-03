import {database} from '../adapters/worker-database';
import {createD1ActionStore} from '../adapters/d1-action-store';
import {actionCall as invoke} from '../application/action-service';
export {ActionError} from '../domain/core';
export {requireOwner} from './auth';

export function actionCall(owner:string,name:string,args:unknown){return invoke({store:createD1ActionStore(database()),clock:()=>new Date().toISOString(),newId:()=>crypto.randomUUID()},owner,name,args);}
