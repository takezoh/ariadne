import { actionOrder, actionTitle, booleanFlag, catalogName, description, fail, id, instant, integer, object, perspectiveFilter } from './core';
import type { Action, ActionTag, Perspective, Project, Snapshot, Tag } from '../data/types';

function requireFields(row: Record<string, unknown>, fields: readonly string[]) {
  if (fields.some(field => !Object.hasOwn(row, field))) fail('invalid_state', 'Persisted row is missing a current-schema field.');
}

function nullableId(value: unknown): string | null {
  return value === null ? null : id(value);
}

function timestamp(value: unknown): string {
  const result = instant(value);
  if (result === null) fail('invalid_state', 'Persisted timestamp cannot be null.');
  return result;
}

/** Select only the current persisted Action columns and apply their domain validators. */
export function persistedAction(value: unknown): Action {
  const row = object(value);
  requireFields(row, ['id', 'title', 'revision', 'parent_id', 'project_id', 'status', 'due_at', 'defer_until', 'notes', 'order', 'flagged', 'created_at', 'updated_at']);
  if (!['active', 'on-hold', 'completed', 'dropped'].includes(String(row.status))) fail('invalid_state', 'Persisted Action status is invalid.');
  const dueAt = instant(row.due_at), deferUntil = instant(row.defer_until);
  if (typeof row.notes !== 'string') fail('invalid_state', 'Persisted Action notes are invalid.');
  return {
    id: id(row.id), title: actionTitle(row.title), revision: integer(row.revision),
    parent_id: nullableId(row.parent_id), project_id: nullableId(row.project_id), status: row.status as Action['status'],
    due_at: dueAt, defer_until: deferUntil, notes: row.notes, order: actionOrder(row.order), flagged: booleanFlag(row.flagged),
    created_at: timestamp(row.created_at), updated_at: timestamp(row.updated_at),
  };
}

function persistedCatalog<T extends Project | Tag>(value: unknown): T {
  const row = object(value);
  requireFields(row, ['id', 'order', 'name', 'description', 'parent_id', 'revision', 'created_at', 'updated_at']);
  return {
    id: id(row.id), order: actionOrder(row.order), name: catalogName(row.name), description: description(row.description),
    parent_id: nullableId(row.parent_id), revision: integer(row.revision), created_at: timestamp(row.created_at), updated_at: timestamp(row.updated_at),
  } as T;
}

export function persistedProject(value: unknown): Project { return persistedCatalog<Project>(value); }
export function persistedTag(value: unknown): Tag { return persistedCatalog<Tag>(value); }

export function persistedPerspective(value: unknown): Perspective {
  const row = object(value);
  requireFields(row, ['id', 'name', 'description', 'filter', 'definition_version', 'revision', 'created_at', 'updated_at']);
  if (row.definition_version !== 1) fail('invalid_state', 'Persisted Perspective definition version is invalid.');
  return {
    id: id(row.id), name: catalogName(row.name), description: description(row.description), filter: perspectiveFilter(row.filter),
    definition_version: 1, revision: integer(row.revision), created_at: timestamp(row.created_at), updated_at: timestamp(row.updated_at),
  };
}

export function persistedActionTag(value: unknown): ActionTag {
  const row = object(value);
  requireFields(row, ['action_id', 'tag_id', 'revision']);
  return { action_id: id(row.action_id), tag_id: id(row.tag_id), revision: integer(row.revision) };
}

/** Canonical persisted-field projection used by snapshot bootstrap and retained feed reconstruction. */
export function persistedSnapshot(snapshot: Snapshot): Pick<Snapshot, 'actions' | 'projects' | 'tags' | 'perspectives' | 'action_tags'> {
  return {
    actions: snapshot.actions.map(persistedAction),
    projects: snapshot.projects.map(persistedProject),
    tags: snapshot.tags.map(persistedTag),
    perspectives: snapshot.perspectives.map(persistedPerspective),
    action_tags: snapshot.action_tags.map(persistedActionTag),
  };
}
