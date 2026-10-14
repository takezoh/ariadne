import {delta} from '../../lib/domain/operations.ts';
import {fail} from '../../lib/domain/core.ts';
import {OPERATION_HISTORY_LIMIT} from '../../lib/application/ports.ts';
/** Semantic fake: no SQL, isolated owner snapshots, receipts and atomic CAS. */
export function memoryActionStore() {
 const owners=new Map(),receipts=new Map();
 const key=(owner,id)=>JSON.stringify([owner,id]);
 const empty=()=>({revision:0,catalog_identity_ledger:[],actions:[],projects:[],tags:[],action_tags:[],perspectives:[]});
 let lose=false;
 return {
  async readSnapshot(owner){if(!owners.has(owner))owners.set(owner,empty());return structuredClone(owners.get(owner));},
  async readChangeWindow(owner,afterRevision,throughRevision=null){
   const retained=[...receipts].filter(([receiptKey])=>JSON.parse(receiptKey)[0]===owner).map(([receiptKey,value])=>({operation_id:JSON.parse(receiptKey)[1],...value})).sort((a,b)=>a.revision_after-b.revision_after);
   return structuredClone({head_revision:owners.get(owner)?.revision??0,oldest_revision:retained[0]?.revision_after??null,operations:retained.filter(row=>row.revision_after>afterRevision&&(throughRevision===null||row.revision_after<=throughRevision))});
  },
  async readReceipt(owner,id){return structuredClone(receipts.get(key(owner,id))??null);},
  async hasUndo(owner,undoOf){return [...receipts].some(([k,r])=>JSON.parse(k)[0]===owner&&r.undo_of===undoOf);},
  async commit(r){
   const changes=delta(r.before,r.after),result={operationId:r.operationId,revision:r.before.revision+1,changedIds:changes.actions.map(x=>(x.after??x.before).id),...(r.resolved?{resolved:r.resolved}:{})};
   const prior=receipts.get(key(r.owner,r.operationId));
   if(prior){if(prior.canonical_payload!==r.payload)fail('idempotency_conflict','same ID, different input',409);return JSON.parse(prior.result);}
   if((owners.get(r.owner)?.revision??0)!==r.before.revision)fail('conflict','stale revision',409);
   owners.set(r.owner,structuredClone({...r.after,revision:r.before.revision+1}));
   receipts.set(key(r.owner,r.operationId),{canonical_payload:r.payload,result:JSON.stringify(result),delta:JSON.stringify(changes),revision_before:r.before.revision,revision_after:result.revision,committed_at:r.now,undo_of:r.undoOf});
   for(const [k,receipt] of receipts)if(JSON.parse(k)[0]===r.owner&&receipt.revision_after<=result.revision-OPERATION_HISTORY_LIMIT)receipts.delete(k);
   if(lose){lose=false;throw new Error('lost response after commit');}
   return structuredClone(result);
  },
  lose(){lose=true;}
 };
}
