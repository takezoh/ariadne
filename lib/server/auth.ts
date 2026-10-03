import {fail} from '../domain/core';
export function requireOwner(headers:Headers) {const owner=headers.get('oai-authenticated-user-id');if(!owner||!headers.get('oai-authenticated-user-email'))fail('unauthenticated','ChatGPTへの接続が必要です。',401);return owner;}

