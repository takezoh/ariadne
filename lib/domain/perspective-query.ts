import type { Action, ActionStatus, PerspectiveQuery, PerspectiveQueryCondition, Project, Snapshot, SortKey, Tag } from '../data/types';
import { ActionError, project } from './core';

export type { PerspectiveFilter, PerspectiveQuery, PerspectiveQueryCondition } from '../data/types';

export const PERSPECTIVE_QUERY_LIMITS = Object.freeze({
  maxDepth: 32,
  maxNodes: 256,
  maxCandidates: 256,
  maxSortKeys: 8,
});

export type ProjectedPerspectiveAction = Action & Readonly<{ is_deferred: boolean }>;
export type PerspectiveProjection = ReturnType<typeof project>[number];
export type PerspectiveQueryCatalog = Readonly<{
  projects: readonly Project[];
  tags: readonly Tag[];
  action_tags: Snapshot['action_tags'];
}>;
export type PerspectiveReferences = Readonly<{
  project_ids: readonly string[];
  tag_ids: readonly string[];
}>;

type PlainRecord = Record<string, unknown>;
type QueryFrame = Readonly<{ value: unknown; depth: number }>;

const statuses = new Set<ActionStatus>(['active', 'on-hold', 'completed', 'dropped']);
const sortFields = new Set<SortKey['field']>(['due_at', 'defer_until', 'created_at', 'updated_at', 'title', 'status', 'flagged', 'order']);
const statusOrder: Readonly<Record<ActionStatus, number>> = Object.freeze({ active: 0, 'on-hold': 1, completed: 2, dropped: 3 });
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message = 'パースペクティブのクエリ形式が不正です。'): never {
  throw new ActionError('invalid_input', message);
}

function isPlainRecord(value: unknown): value is PlainRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function arrayValues(value: unknown): readonly unknown[] {
  const source = strictArray(value);
  return Array.from({ length: source.length }, (_, index) => checkedArrayValue(source, index));
}

function requireArray(value: unknown): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) invalid();
  return value;
}

function strictArray(value: unknown): readonly unknown[] {
  const source = requireArray(value);
  const keys = Reflect.ownKeys(source);
  if (keys.length !== source.length + 1 || keys[source.length] !== 'length') invalid();
  for (let index = 0; index < source.length; index++) {
    if (keys[index] !== String(index)) invalid();
    const descriptor = Object.getOwnPropertyDescriptor(source, String(index));
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) invalid();
  }
  return source;
}

function checkedArrayValue(value: readonly unknown[], index: number): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
  if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) invalid();
  return descriptor.value;
}

function exactKeys(record: PlainRecord, required: readonly string[], optional: readonly string[] = []): void {
  const keys = Reflect.ownKeys(record);
  if (keys.length > required.length + optional.length || keys.some(key => typeof key !== 'string')) invalid();
  const names = keys as string[];
  if (required.some(key => !Object.hasOwn(record, key)) || names.some(key => !required.includes(key) && !optional.includes(key))) invalid();
  for (const key of names) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) invalid();
  }
}

function requireRecord(value: unknown): PlainRecord {
  if (!isPlainRecord(value)) invalid();
  return value;
}

function validateNodeShape(node: unknown): Readonly<{ children: readonly unknown[]; childDepth: number; candidates: number }> {
  const record = requireRecord(node);
  const keys = Object.keys(record);
  if (keys.length === 1 && (keys[0] === 'and' || keys[0] === 'or')) {
    exactKeys(record, [keys[0]]);
    const children = requireArray(Object.getOwnPropertyDescriptor(record, keys[0])!.value);
    if (children.length === 0) invalid('and と or には1件以上の条件が必要です。');
    return { children, childDepth: 1, candidates: 0 };
  }
  if (keys.length === 1 && keys[0] === 'not') {
    exactKeys(record, ['not']);
    return { children: [Object.getOwnPropertyDescriptor(record, 'not')!.value], childDepth: 1, candidates: 0 };
  }

  const field = Object.getOwnPropertyDescriptor(record, 'field')?.value;
  const op = Object.getOwnPropertyDescriptor(record, 'op')?.value;
  if (field === 'project_id' || field === 'tag_id') {
    if (op === 'eq' || op === 'ne') exactKeys(record, ['field', 'op', 'value'], ['include_descendants']);
    else if (op === 'in' || op === 'not_in') exactKeys(record, ['field', 'op', 'values'], ['include_descendants']);
    else invalid();
    const includeDescendants = Object.getOwnPropertyDescriptor(record, 'include_descendants')?.value;
    if (Object.hasOwn(record, 'include_descendants') && typeof includeDescendants !== 'boolean') invalid();
    if (op === 'in' || op === 'not_in') {
      const children = requireArray(Object.getOwnPropertyDescriptor(record, 'values')?.value);
      return { children, childDepth: 0, candidates: children.length };
    }
    return { children: [], childDepth: 0, candidates: 1 };
  }
  if (field === 'status') {
    if (op === 'eq' || op === 'ne') exactKeys(record, ['field', 'op', 'value']);
    else if (op === 'in' || op === 'not_in') exactKeys(record, ['field', 'op', 'values']);
    else invalid();
    if (op === 'in' || op === 'not_in') {
      const children = requireArray(Object.getOwnPropertyDescriptor(record, 'values')?.value);
      return { children, childDepth: 0, candidates: children.length };
    }
    return { children: [], childDepth: 0, candidates: 1 };
  }
  if (field === 'flagged' || field === 'is_deferred') {
    if (op !== 'eq' && op !== 'ne') invalid();
    exactKeys(record, ['field', 'op', 'value']);
    return { children: [], childDepth: 0, candidates: 1 };
  }
  invalid();
}

function prevalidateBounds(value: unknown): void {
  const query = requireRecord(value);
  exactKeys(query, [], ['where', 'order_by']);
  let candidates = 0;
  if (Object.hasOwn(query, 'order_by')) {
    const sortKeys = requireArray(Object.getOwnPropertyDescriptor(query, 'order_by')!.value);
    if (sortKeys.length > PERSPECTIVE_QUERY_LIMITS.maxSortKeys) invalid('order_by のキー数が上限を超えています。');
    strictArray(sortKeys);
  }
  if (!Object.hasOwn(query, 'where')) return;

  const stack: QueryFrame[] = [{ value: Object.getOwnPropertyDescriptor(query, 'where')!.value, depth: 1 }];
  let nodes = 0;
  while (stack.length) {
    const { value: node, depth } = stack.pop()!;
    nodes++;
    if (nodes > PERSPECTIVE_QUERY_LIMITS.maxNodes) invalid('クエリ条件の数が上限を超えています。');
    if (depth > PERSPECTIVE_QUERY_LIMITS.maxDepth) invalid('クエリの深さが上限を超えています。');
    const shape = validateNodeShape(node);
    if (shape.candidates > PERSPECTIVE_QUERY_LIMITS.maxCandidates - candidates) invalid('条件候補数が上限を超えています。');
    candidates += shape.candidates;
    if (shape.childDepth === 0) {
      strictArray(shape.children);
      continue;
    }
    if (shape.children.length > PERSPECTIVE_QUERY_LIMITS.maxNodes - nodes - stack.length) invalid('クエリ条件の数が上限を超えています。');
    if (shape.children.length && depth + 1 > PERSPECTIVE_QUERY_LIMITS.maxDepth) invalid('クエリの深さが上限を超えています。');
    strictArray(shape.children);
    for (let index = shape.children.length - 1; index >= 0; index--) stack.push({ value: checkedArrayValue(shape.children, index), depth: depth + 1 });
  }
}

function uuid(value: unknown): string {
  if (typeof value !== 'string' || value.length !== 36 || !uuidPattern.test(value)) invalid('分類IDはUUIDで指定してください。');
  return value;
}

function classificationValue(value: unknown): string | null {
  return value === null ? null : uuid(value);
}

function normalizeCondition(value: unknown): PerspectiveQueryCondition {
  const record = requireRecord(value);
  if (Object.hasOwn(record, 'and')) return { and: arrayValues(record.and).map(normalizeCondition) };
  if (Object.hasOwn(record, 'or')) return { or: arrayValues(record.or).map(normalizeCondition) };
  if (Object.hasOwn(record, 'not')) return { not: normalizeCondition(record.not) };

  const field = record.field;
  const op = record.op;
  if (field === 'project_id' || field === 'tag_id') {
    const include_descendants = Object.hasOwn(record, 'include_descendants') ? record.include_descendants as boolean : true;
    if (op === 'eq' || op === 'ne') return { field, op, value: classificationValue(record.value), include_descendants };
    const values = arrayValues(record.values).map(classificationValue);
    return { field, op: op as 'in' | 'not_in', values, include_descendants };
  }
  if (field === 'status') {
    if (op === 'eq' || op === 'ne') {
      if (typeof record.value !== 'string' || record.value.length > 9 || !statuses.has(record.value as ActionStatus)) invalid('状態が不正です。');
      return { field, op, value: record.value as ActionStatus };
    }
    const values = arrayValues(record.values).map(item => {
      if (typeof item !== 'string' || item.length > 9 || !statuses.has(item as ActionStatus)) invalid('状態が不正です。');
      return item as ActionStatus;
    });
    return { field, op: op as 'in' | 'not_in', values };
  }
  if ((field === 'flagged' || field === 'is_deferred') && (op === 'eq' || op === 'ne')) {
    if (typeof record.value !== 'boolean') invalid('真偽値条件が不正です。');
    return { field, op, value: record.value };
  }
  return invalid();
}

function normalizeSortKey(value: unknown): SortKey {
  const record = requireRecord(value);
  exactKeys(record, ['field', 'direction'], ['nulls']);
  if (typeof record.field !== 'string' || record.field.length > 11 || !sortFields.has(record.field as SortKey['field'])) invalid('並べ替え項目が不正です。');
  if (record.direction !== 'asc' && record.direction !== 'desc') invalid('並べ替え方向が不正です。');
  const nulls = Object.hasOwn(record, 'nulls') ? record.nulls : 'last';
  if (nulls !== 'first' && nulls !== 'last') invalid('null の並べ替え位置が不正です。');
  return { field: record.field as SortKey['field'], direction: record.direction, nulls };
}

export function normalizePerspectiveQuery(value: unknown): PerspectiveQuery {
  prevalidateBounds(value);
  const record = value as PlainRecord;
  const query: { where?: PerspectiveQueryCondition; order_by?: readonly SortKey[] } = {};
  if (Object.hasOwn(record, 'where')) query.where = normalizeCondition(record.where);
  if (Object.hasOwn(record, 'order_by')) query.order_by = arrayValues(record.order_by).map(normalizeSortKey);
  return query;
}

export function perspectiveReferenceIds(value: unknown): PerspectiveReferences {
  return referenceIdsFromNormalized(normalizePerspectiveQuery(value));
}

function referenceIdsFromNormalized(query: PerspectiveQuery): PerspectiveReferences {
  const projects = new Set<string>();
  const tags = new Set<string>();
  const collect = (condition: PerspectiveQueryCondition): void => {
    if ('and' in condition) { condition.and.forEach(collect); return; }
    if ('or' in condition) { condition.or.forEach(collect); return; }
    if ('not' in condition) { collect(condition.not); return; }
    if (condition.field !== 'project_id' && condition.field !== 'tag_id') return;
    const values = 'values' in condition ? condition.values : [condition.value];
    const target = condition.field === 'project_id' ? projects : tags;
    values.forEach(item => { if (item !== null) target.add(item); });
  };
  if (query.where) collect(query.where);
  const sorted = (values: Set<string>) => [...values].sort(compareStrings);
  return { project_ids: sorted(projects), tag_ids: sorted(tags) };
}

export function validatePerspectiveQueryReferences(snapshot: PerspectiveQueryCatalog, value: unknown): PerspectiveQuery {
  const query = normalizePerspectiveQuery(value);
  const references = referenceIdsFromNormalized(query);
  const projectIds = new Set(snapshot.projects.map(item => item.id));
  const tagIds = new Set(snapshot.tags.map(item => item.id));
  for (const projectId of references.project_ids) if (!projectIds.has(projectId)) throw new ActionError('not_found', 'パースペクティブのプロジェクトがありません。', 404);
  for (const tagId of references.tag_ids) if (!tagIds.has(tagId)) throw new ActionError('not_found', 'パースペクティブのタグがありません。', 404);
  return query;
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function descendantsByTarget(nodes: readonly (Project | Tag)[], targetIds: readonly string[]): ReadonlyMap<string, ReadonlySet<string>> {
  const children = new Map<string, string[]>();
  const ids = new Set<string>();
  for (const node of nodes) {
    if (ids.has(node.id)) throw new ActionError('invalid_state', '分類IDが重複しています。');
    ids.add(node.id);
  }
  for (const node of nodes) {
    if (node.parent_id !== null && !ids.has(node.parent_id)) throw new ActionError('invalid_graph', '分類の親が存在しません。');
    if (node.parent_id !== null) {
      const group = children.get(node.parent_id) ?? [];
      group.push(node.id);
      children.set(node.parent_id, group);
    }
  }
  const result = new Map<string, ReadonlySet<string>>();
  for (const target of targetIds) {
    const included = new Set<string>();
    const active = new Set<string>();
    const visited = new Set<string>();
    const stack: { id: string; leaving: boolean }[] = [{ id: target, leaving: false }];
    while (stack.length) {
      const current = stack.pop()!;
      if (current.leaving) { active.delete(current.id); continue; }
      if (active.has(current.id)) throw new ActionError('cycle', '分類の階層が循環しています。');
      if (visited.has(current.id)) continue;
      active.add(current.id);
      visited.add(current.id);
      included.add(current.id);
      stack.push({ id: current.id, leaving: true });
      const nested = children.get(current.id) ?? [];
      for (let index = nested.length - 1; index >= 0; index--) stack.push({ id: nested[index], leaving: false });
    }
    result.set(target, included);
  }
  return result;
}

function descendantsForQuery(query: PerspectiveQuery, field: 'project_id' | 'tag_id'): readonly string[] {
  const values = new Set<string>();
  const collect = (condition: PerspectiveQueryCondition): void => {
    if ('and' in condition) { condition.and.forEach(collect); return; }
    if ('or' in condition) { condition.or.forEach(collect); return; }
    if ('not' in condition) { collect(condition.not); return; }
    if (condition.field !== field || !condition.include_descendants) return;
    const candidates = 'values' in condition ? condition.values : [condition.value];
    candidates.forEach(item => { if (item !== null) values.add(item); });
  };
  if (query.where) collect(query.where);
  return [...values];
}

function compileCondition(
  condition: PerspectiveQueryCondition,
  projectMemberships: ReadonlyMap<string, ReadonlySet<string>>,
  tagMemberships: ReadonlyMap<string, ReadonlySet<string>>,
  tagsByAction: ReadonlyMap<string, ReadonlySet<string>>,
): (action: ProjectedPerspectiveAction) => boolean {
  if ('and' in condition) {
    const children = condition.and.map(child => compileCondition(child, projectMemberships, tagMemberships, tagsByAction));
    return action => children.every(child => child(action));
  }
  if ('or' in condition) {
    const children = condition.or.map(child => compileCondition(child, projectMemberships, tagMemberships, tagsByAction));
    return action => children.some(child => child(action));
  }
  if ('not' in condition) {
    const child = compileCondition(condition.not, projectMemberships, tagMemberships, tagsByAction);
    return action => !child(action);
  }
  if (condition.field === 'project_id') {
    const candidates = 'values' in condition ? condition.values : [condition.value];
    const values = new Set<string>();
    let includesUnassigned = false;
    for (const item of candidates) {
      if (item === null) { includesUnassigned = true; continue; }
      const memberships = condition.include_descendants ? projectMemberships.get(item) : undefined;
      for (const descendant of memberships ?? [item]) values.add(descendant);
    }
    const negative = condition.op === 'ne' || condition.op === 'not_in';
    return action => {
      const positive = action.project_id === null ? includesUnassigned : values.has(action.project_id);
      return negative ? !positive : positive;
    };
  }
  if (condition.field === 'tag_id') {
    const candidates = 'values' in condition ? condition.values : [condition.value];
    const values = new Set<string>();
    let includesUntagged = false;
    for (const item of candidates) {
      if (item === null) { includesUntagged = true; continue; }
      const memberships = condition.include_descendants ? tagMemberships.get(item) : undefined;
      for (const descendant of memberships ?? [item]) values.add(descendant);
    }
    const negative = condition.op === 'ne' || condition.op === 'not_in';
    return action => {
      const actionTags = tagsByAction.get(action.id);
      let positive = includesUntagged && (!actionTags || actionTags.size === 0);
      if (!positive && actionTags) for (const tagId of actionTags) if (values.has(tagId)) { positive = true; break; }
      return negative ? !positive : positive;
    };
  }
  if (condition.field === 'status') {
    const values = new Set('values' in condition ? condition.values : [condition.value]);
    const negative = condition.op === 'ne' || condition.op === 'not_in';
    return action => negative ? !values.has(action.status) : values.has(action.status);
  }
  if (!('value' in condition)) invalid();
  const negative = condition.op === 'ne';
  return action => {
    const actual = condition.field === 'flagged' ? action.flagged : action.is_deferred;
    const positive = actual === condition.value;
    return negative ? !positive : positive;
  };
}

function prepareCondition(query: PerspectiveQuery, snapshot: PerspectiveQueryCatalog): (action: ProjectedPerspectiveAction) => boolean {
  const projectTargets = descendantsForQuery(query, 'project_id');
  const tagTargets = descendantsForQuery(query, 'tag_id');
  const projectMemberships = descendantsByTarget(snapshot.projects, projectTargets);
  const tagMemberships = descendantsByTarget(snapshot.tags, tagTargets);
  const tagsByAction = new Map<string, Set<string>>();
  for (const association of snapshot.action_tags) {
    const tags = tagsByAction.get(association.action_id) ?? new Set<string>();
    tags.add(association.tag_id);
    tagsByAction.set(association.action_id, tags);
  }
  return query.where ? compileCondition(query.where, projectMemberships, tagMemberships, tagsByAction) : () => true;
}

function sortValue(action: ProjectedPerspectiveAction, field: SortKey['field']): string | number | boolean | null {
  return action[field];
}

function compareSortValues(left: string | number | boolean | null, right: string | number | boolean | null, key: SortKey): number {
  if (left === null || right === null) {
    if (left === right) return 0;
    const nullResult = left === null ? -1 : 1;
    return (key.nulls ?? 'last') === 'first' ? nullResult : -nullResult;
  }
  let result: number;
  if (key.field === 'status') result = statusOrder[left as ActionStatus] - statusOrder[right as ActionStatus];
  else if (typeof left === 'string' && typeof right === 'string') result = compareStrings(left, right);
  else if (typeof left === 'number' && typeof right === 'number') result = left < right ? -1 : left > right ? 1 : 0;
  else result = left === right ? 0 : left === false || left === 0 ? -1 : 1;
  return key.direction === 'asc' ? result : -result;
}

function compareActions(left: ProjectedPerspectiveAction, right: ProjectedPerspectiveAction, keys: readonly SortKey[]): number {
  for (const key of keys) {
    const result = compareSortValues(sortValue(left, key.field), sortValue(right, key.field), key);
    if (result !== 0) return result;
  }
  return compareStrings(left.id, right.id);
}

function evaluateNormalizedPerspectiveQuery<T extends ProjectedPerspectiveAction>(
  snapshot: PerspectiveQueryCatalog,
  actions: readonly T[],
  query: PerspectiveQuery,
): readonly T[] {
  for (const action of actions) if (typeof action.is_deferred !== 'boolean') invalid('is_deferred の投影値が必要です。');
  const matches = prepareCondition(query, snapshot);
  const result = actions.filter(matches);
  if ('order_by' in query) result.sort((left, right) => compareActions(left, right, query.order_by!));
  return result;
}

export function evaluatePerspectiveQuery<T extends ProjectedPerspectiveAction>(
  snapshot: PerspectiveQueryCatalog,
  actions: readonly T[],
  value: unknown,
): readonly T[] {
  const query = validatePerspectiveQueryReferences(snapshot, value);
  return evaluateNormalizedPerspectiveQuery(snapshot, actions, query);
}

/** Evaluates a saved query against a fresh owner snapshot and its explicit read time. */
export function evaluatePerspective(snapshot: Snapshot, now: string, value: unknown): readonly PerspectiveProjection[] {
  const query = validatePerspectiveQueryReferences(snapshot, value);
  return evaluateNormalizedPerspectiveQuery(snapshot, project(snapshot, now), query);
}
