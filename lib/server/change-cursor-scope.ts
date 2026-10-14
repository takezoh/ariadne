import { verifiedOwner, type VerifiedIdentity } from './auth';

/** Hash the live trusted owner in the server composition; tokens never choose a SQL owner. */
export async function changeCursorScope(identity: VerifiedIdentity): Promise<string> {
  const owner = verifiedOwner(identity);
  const source = new TextEncoder().encode(`action-tools/change-cursor/scope/v1\0${owner}`);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', source));
  let binary = '';
  for (const byte of digest) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}
