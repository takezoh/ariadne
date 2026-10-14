import { ActionError, fail, id, instant } from '../../domain/core';
import { persistedAction, persistedActionTag, persistedPerspective, persistedProject, persistedTag } from '../../domain/persisted-dto';
import type { Action, ActionTag, ChangeWindow, Perspective, Project, RetainedOperation, Tag } from '../types';

export const MAX_CHANGE_CURSOR_LENGTH = 512;
export const MAX_CHANGE_PAGE_BYTES = 1_048_576;
export const DEFAULT_CHANGE_PAGE_SIZE = 20;

export type ChangeCursor = Readonly<{
  v: 1;
  scope: string;
  position: number;
  through_revision: number | null;
}>;

export type EntityDelta<T> = Readonly<{ before: T | null; after: T | null }>;
export type ChangeOperation = Readonly<{
  operation_id: string;
  revision_before: number;
  revision_after: number;
  committed_at: string;
  undo_of: string | null;
  changes: Readonly<{
    actions: readonly EntityDelta<Action>[];
    projects: readonly EntityDelta<Project>[];
    tags: readonly EntityDelta<Tag>[];
    perspectives: readonly EntityDelta<Perspective>[];
    action_tags: readonly EntityDelta<ActionTag>[];
  }>;
}>;

export type ChangePage = Readonly<{
  schemaVersion: 2;
  changes: readonly ChangeOperation[];
  next_cursor: string;
  has_more: boolean;
  through_revision: number;
}>;

const base64Url = (bytes: Uint8Array) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
};

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function cursorJson(cursor: ChangeCursor) {
  return JSON.stringify({ v: cursor.v, scope: cursor.scope, position: cursor.position, through_revision: cursor.through_revision });
}

function validScope(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/u.test(value);
}

function nonnegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

/** Canonical compact token. Its scope is a fingerprint, never an authorization credential. */
export function encodeChangeCursor(scope: string, position: number, throughRevision: number | null = null): string {
  if (!validScope(scope) || !nonnegativeInteger(position) || (throughRevision !== null && (!nonnegativeInteger(throughRevision) || position > throughRevision))) {
    return fail('invalid_state', 'A change cursor cannot be encoded from invalid state.');
  }
  const bytes = new TextEncoder().encode(cursorJson({ v: 1, scope, position, through_revision: throughRevision }));
  const token = base64Url(bytes);
  if (token.length > MAX_CHANGE_CURSOR_LENGTH) return fail('invalid_state', 'The change cursor exceeds its size bound.');
  return token;
}

/** Reject noncanonical encodings, duplicate/unknown fields and unsupported token versions. */
export function decodeChangeCursor(value: unknown): ChangeCursor {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_CHANGE_CURSOR_LENGTH || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    return fail('invalid_cursor', 'The change cursor is invalid. Fetch a current snapshot and cursor to resync.');
  }
  try {
    const bytes = fromBase64Url(value);
    if (base64Url(bytes) !== value) throw new Error('noncanonical base64url');
    const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid object');
    const object = parsed as Record<string, unknown>;
    if (Object.keys(object).length !== 4 || Object.keys(object).some(key => !['v', 'scope', 'position', 'through_revision'].includes(key))) throw new Error('invalid fields');
    const cursor = { v: object.v, scope: object.scope, position: object.position, through_revision: object.through_revision };
    if (cursor.v !== 1 || !validScope(cursor.scope) || !nonnegativeInteger(cursor.position) || !(cursor.through_revision === null || nonnegativeInteger(cursor.through_revision))) throw new Error('invalid values');
    if (cursor.through_revision !== null && cursor.position > cursor.through_revision) throw new Error('invalid fence');
    if (cursorJson(cursor as ChangeCursor) !== json) throw new Error('noncanonical json');
    return cursor as ChangeCursor;
  } catch {
    return fail('invalid_cursor', 'The change cursor is invalid. Fetch a current snapshot and cursor to resync.');
  }
}

type JsonObject = Record<string, unknown>;
function record(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('invalid_state', `Retained ${label} is malformed.`);
  return value as JsonObject;
}
function entityDelta<T>(value: unknown, label: string, project: (item: unknown) => T, identity: (item: T) => string): EntityDelta<T> {
  const row = record(value, label);
  if (Object.keys(row).length !== 2 || !Object.hasOwn(row, 'before') || !Object.hasOwn(row, 'after')) return fail('invalid_state', `Retained ${label} is missing before/after values.`);
  const before = row.before === null ? null : project(row.before);
  const after = row.after === null ? null : project(row.after);
  if (!before && !after) return fail('invalid_state', `Retained ${label} has no entity identity.`);
  if (before && after && identity(before) !== identity(after)) return fail('invalid_state', `Retained ${label} changes identity.`);
  return { before, after };
}

function sorted<T>(values: unknown, label: string, project: (item: unknown) => T, identity: (item: T) => string): EntityDelta<T>[] {
  if (!Array.isArray(values)) return fail('invalid_state', `Retained ${label} collection is malformed.`);
  const rows = values.map(item => entityDelta(item, label, project, identity));
  const identities = rows.map(row => identity((row.after ?? row.before)!));
  if (new Set(identities).size !== identities.length) return fail('invalid_state', `Retained ${label} collection contains duplicate identities.`);
  return rows.sort((left, right) => {
    const a = identity((left.after ?? left.before)!); const b = identity((right.after ?? right.before)!);
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/** Explicitly project current persisted fields; derived views and internal markers never enter the feed. */
export function projectRetainedOperation(operation: RetainedOperation): ChangeOperation {
  if (!Number.isSafeInteger(operation.revision_before) || operation.revision_before < 0 || !Number.isSafeInteger(operation.revision_after) || operation.revision_after !== operation.revision_before + 1) {
    return fail('invalid_state', 'Retained operation revisions are not contiguous.');
  }
  let operationId: string, committedAt: string, undoOf: string | null;
  try {
    operationId = id(operation.operation_id); committedAt = instant(operation.committed_at)!;
    undoOf = operation.undo_of === null ? null : id(operation.undo_of);
  } catch { return fail('invalid_state', 'Retained operation metadata is malformed.'); }
  if (committedAt === null || (operation.undo_of !== null && undoOf === null)) return fail('invalid_state', 'Retained operation metadata is malformed.');
  let delta: unknown;
  try { delta = JSON.parse(operation.delta); } catch { return fail('invalid_state', 'Retained operation delta is malformed.'); }
  const changes = record(delta, 'operation delta');
  const collections = ['actions', 'projects', 'tags', 'perspectives', 'action_tags'];
  if (Object.keys(changes).length !== collections.length || collections.some(key => !Object.hasOwn(changes, key))) return fail('invalid_state', 'Retained operation delta collections are incomplete.');
  try { return {
    operation_id: operationId, revision_before: operation.revision_before, revision_after: operation.revision_after,
    committed_at: committedAt, undo_of: undoOf,
    changes: {
      actions: sorted(changes.actions, 'Action delta', persistedAction, item => item.id),
      projects: sorted(changes.projects, 'Project delta', persistedProject, item => item.id),
      tags: sorted(changes.tags, 'Tag delta', persistedTag, item => item.id),
      perspectives: sorted(changes.perspectives, 'Perspective delta', persistedPerspective, item => item.id),
      action_tags: sorted(changes.action_tags, 'Action Tag delta', persistedActionTag, item => `${item.action_id}:${item.tag_id}`),
    },
  }; } catch (error) {
    if (error instanceof ActionError && error.code !== 'invalid_state') return fail('invalid_state', 'Retained operation contains a row outside the current persisted schema.');
    throw error;
  }
}

function expired(): never {
  return fail('cursor_expired', 'This cursor predates retained history. Fetch list_actions, replace the local snapshot and cursor, then resume incremental reads.', 409);
}

function bytes(value: unknown) { return new TextEncoder().encode(JSON.stringify(value)).length; }

/** Validate retention continuity and page only whole operation records within the response byte bound. */
export function pageChangeWindow(window: ChangeWindow, cursor: ChangeCursor, scope: string, pageSize: number): ChangePage {
  const { head_revision: head, oldest_revision: oldest } = window;
  if (!nonnegativeInteger(head) || (oldest !== null && (!nonnegativeInteger(oldest) || oldest < 1)) || !validScope(scope)) return fail('invalid_state', 'Change history metadata is malformed.');
  if (cursor.scope !== scope || cursor.position > head || (cursor.through_revision !== null && cursor.through_revision > head)) {
    return fail('invalid_cursor', 'This cursor is invalid for the current authenticated owner or revision. Fetch a current snapshot and cursor to resync.');
  }
  const lowerBound = oldest === null ? 0 : Math.max(0, oldest - 1);
  if (cursor.position < lowerBound) return expired();
  const through = cursor.through_revision ?? head;
  if (!Array.isArray(window.operations) || window.operations.length > 100) return fail('invalid_state', 'Retained operation history exceeds its configured bound.');
  const rows = window.operations.map(projectRetainedOperation);
  let expectedRevision = cursor.position + 1;
  for (const row of rows) {
    if (row.revision_before !== expectedRevision - 1 || row.revision_after !== expectedRevision || row.revision_after > through) return fail('invalid_state', 'Retained operation history is not contiguous.');
    expectedRevision++;
  }
  if (expectedRevision <= through) return fail('invalid_state', 'Retained operation history contains a gap.');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return fail('invalid_input', 'page_size must be an integer from 1 through 100.');

  const makePage = (count: number): ChangePage => {
    const hasMore = count < rows.length;
    const position = hasMore ? rows[count - 1].revision_after : through;
    return {
      schemaVersion: 2,
      changes: rows.slice(0, count),
      next_cursor: encodeChangeCursor(scope, position, hasMore ? through : null),
      has_more: hasMore,
      through_revision: through,
    };
  };

  let count = 0;
  const wanted = Math.min(pageSize, rows.length);
  while (count < wanted) {
    const candidate = makePage(count + 1);
    if (bytes(candidate) > MAX_CHANGE_PAGE_BYTES) {
      if (count === 0) return fail('operation_too_large', 'One retained operation exceeds the change response limit; the cursor was not advanced.', 413);
      break;
    }
    count++;
  }
  const page = makePage(count);
  if (bytes(page) > MAX_CHANGE_PAGE_BYTES) return fail('operation_too_large', 'The change response exceeds its size limit; the cursor was not advanced.', 413);
  return page;
}

export function changeWindowInput(cursor: ChangeCursor) {
  return { afterRevision: cursor.position, throughRevision: cursor.through_revision } as const;
}

