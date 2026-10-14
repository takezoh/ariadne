import type { HistoricalOperationDelta, OperationDelta, Perspective } from '../data/types';
import { defaultPerspectiveView, description, exact, fail, id, integer, instant, object, perspectiveFilter, text, validateCurrentPerspectiveRecord } from './core';

const legacyPerspectiveKeys=['id','name','description','filter','definition_version','revision','created_at','updated_at'] as const;
const deltaKeys=['perspectives','actions','projects','tags','action_tags'] as const;

function validatePerspectiveFields(row:Record<string,unknown>) {
 id(row.id);text(row.name);description(row.description);perspectiveFilter(row.filter);integer(row.revision);
 if(typeof row.created_at!=='string'||typeof row.updated_at!=='string')fail('invalid_state','Historical Perspectives require timestamp strings.');
 instant(row.created_at);instant(row.updated_at);
}

function decodeHistoricalPerspective(value:unknown):Perspective {
 const row=object(value);
 if(row.definition_version===1){
  exact(row,legacyPerspectiveKeys);validatePerspectiveFields(row);
  return {...structuredClone(row),view:defaultPerspectiveView(),definition_version:2} as unknown as Perspective;
 }
 if(row.definition_version===2)return validateCurrentPerspectiveRecord(row);
 fail('invalid_state','Unsupported historical Perspective version.');
}

/**
 * Read immutable operation history as current rows. Only the complete known v1
 * Perspective shape receives the migration's explicit legacy default.
 */
export function decodeHistoricalDelta(value:unknown):OperationDelta {
 try{
  const input=object(value);exact(input,deltaKeys);
  for(const key of deltaKeys)if(!Array.isArray(input[key]))fail('invalid_state','Operation delta collections are required.');
  const perspectives=(input.perspectives as unknown[]).map(value=>{
   const item=object(value);exact(item,['before','after']);
   if(!Object.hasOwn(item,'before')||!Object.hasOwn(item,'after')||(!item.before&&!item.after))fail('invalid_state','Operation delta Perspective endpoints are incomplete.');
   return {before:item.before===null?null:decodeHistoricalPerspective(item.before),after:item.after===null?null:decodeHistoricalPerspective(item.after)};
  });
  const clone=structuredClone(input) as unknown as HistoricalOperationDelta;
  return {...clone,perspectives} as OperationDelta;
 }catch{fail('invalid_state','The operation delta is not a recognized historical schema.');}
}
