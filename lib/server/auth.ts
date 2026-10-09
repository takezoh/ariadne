import {fail} from '../domain/core';

declare const identityBrand: unique symbol;
export type VerifiedIdentity = Readonly<{owner:string;[identityBrand]:true}>;
// Capabilities are issued only by this request boundary, not by structural casts.
const issued = new WeakSet<object>();
export function requireOwner(headers:Headers):VerifiedIdentity {
 const owner=headers.get('oai-authenticated-user-id');
 if(!owner||owner.trim()!==owner||owner.length>512||!headers.get('oai-authenticated-user-email'))fail('unauthenticated','ChatGPTへの接続が必要です。',401);
 const identity=Object.freeze({owner}) as VerifiedIdentity;issued.add(identity);return identity;
}
export function verifiedOwner(identity:VerifiedIdentity):string {
 if(!identity||!issued.has(identity))fail('unauthenticated','Verified request identity is required.',401);
 return identity.owner;
}
