import {database} from '../adapters/worker-database';
import {createOwnerBoundActionStore} from '../adapters/d1-action-store';
import {actionCall as invoke} from '../application/action-service';
export {ActionError} from '../domain/core';
export {requireOwner} from './auth';
import type {VerifiedIdentity} from './auth';

/** Trusted composition root: bind the verified identity before invoking the application. */
export function actionCall(owner:VerifiedIdentity,name:string,args:unknown){return invoke({store:createOwnerBoundActionStore(database(),owner),clock:()=>new Date().toISOString(),newId:()=>crypto.randomUUID()},name,args);}
