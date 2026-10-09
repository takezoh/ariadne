import {fail} from '../domain/core';

/** Largest accepted request body; enforced against the actual bytes, not only Content-Length. */
export const MAX_REQUEST_BODY_BYTES = 1048576;

export type RequestGuardOptions = {
  /** Trusted canonical origins. Defaults to the request's own origin. */
  allowedOrigins?: readonly string[];
  /** Actual body-size ceiling in bytes. */
  maxBytes?: number;
};

/** Parse an HTTP media type exactly; parameters are allowed, lookalike substrings are not. */
export function mediaType(value: string | null): string {
  if (value === null) return '';
  const separator = value.indexOf(';');
  return (separator === -1 ? value : value.slice(0, separator)).trim().toLowerCase();
}

/** Approved origins for a request: an explicit trusted list, otherwise the request's own origin. */
export function approvedOrigins(req: Request, allowedOrigins?: readonly string[]): readonly string[] {
  return allowedOrigins ?? [new URL(req.url).origin];
}

/** Reject an unapproved Origin, including the literal `null`; an absent Origin is not identity. */
export function requireApprovedOrigin(req: Request, allowedOrigins?: readonly string[]): void {
  const origin = req.headers.get('origin');
  if (origin === null) return;
  if (origin === 'null' || !approvedOrigins(req, allowedOrigins).includes(origin)) {
    fail('origin_rejected', 'この画面から再操作してください。', 403);
  }
}

/**
 * Shared transport guard for Remote MCP and the Web action API: approved Origin, exact JSON
 * media type and the actual body size. Authentication remains a separate composition step and
 * is required whether or not an Origin is present.
 */
export async function readGuardedJson(req: Request, options: RequestGuardOptions = {}): Promise<unknown> {
  const maxBytes = options.maxBytes ?? MAX_REQUEST_BODY_BYTES;
  requireApprovedOrigin(req, options.allowedOrigins);
  if (mediaType(req.headers.get('content-type')) !== 'application/json') {
    fail('unsupported_media_type', 'JSONで送信してください。', 415);
  }
  const declared = req.headers.get('content-length');
  if (declared !== null && Number(declared) > maxBytes) {
    fail('payload_too_large', '要求が大きすぎます。', 413);
  }
  const reader=req.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
  if(reader)try{
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
      if(size>maxBytes){await reader.cancel();fail('payload_too_large','要求が大きすぎます。',413);}chunks.push(value);
    }
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    fail('invalid_input', 'JSONを解釈できません。', 400);
  }
}
