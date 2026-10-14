import type {perspectiveView} from '../../domain/core';

export type PerspectiveView = ReturnType<typeof perspectiveView>;
export type PerspectiveCompletionLabel = PerspectiveView['completion_label'];
export type PerspectiveBodyState = Extract<PerspectiveView, {type: 'thread'}>['initial_body'];
export type PerspectiveGroup = Extract<PerspectiveView, {type: 'thread'}>['group'];

export interface PerspectiveViewAction {
  readonly id: string;
  readonly title: string;
  readonly notes?: string;
  readonly status: string;
  readonly order?: number;
  readonly parent_id?: string | null;
  readonly project_id?: string | null;
  readonly project_path?: string | null;
  readonly created_at?: string | null;
  readonly updated_at?: string | null;
  readonly due_at?: string | null;
  readonly flagged?: boolean;
  readonly tags?: readonly {
    readonly id: string;
    readonly name?: string;
    readonly path?: string;
  }[];
}

export interface PerspectiveViewCatalog {
  readonly id: string;
  readonly name: string;
  readonly path?: string;
  readonly order?: number;
  readonly parent_id?: string | null;
}

export interface PerspectiveViewSnapshot {
  readonly actions: readonly PerspectiveViewAction[];
  readonly projects?: readonly PerspectiveViewCatalog[];
}

export interface PerspectiveViewItem {
  readonly action: PerspectiveViewAction;
  readonly timestamp: string | null;
  readonly groupLabel: string;
  readonly containsIn: string;
  readonly containsChildren: boolean;
  readonly notesPreview: string;
  readonly expanded: boolean;
}

export interface PerspectiveViewGroup {
  readonly key: string;
  readonly label: string;
  readonly day: string | null;
  readonly items: readonly PerspectiveViewItem[];
}

export interface PerspectiveViewProjection {
  readonly available: boolean;
  readonly reason: string;
  readonly targetIds: readonly string[];
  readonly groups: readonly PerspectiveViewGroup[];
  readonly items: readonly PerspectiveViewItem[];
  readonly reorderCapability: boolean;
  readonly timestampMeaning: 'registration' | 'last update' | null;
}

const statusOrder = ['active', 'on-hold', 'completed', 'dropped'] as const;
const statusLabels: Readonly<Record<(typeof statusOrder)[number], string>> = {
  active: 'Active',
  'on-hold': 'On hold',
  completed: 'Completed',
  dropped: 'Dropped',
};

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === [...expected].sort()[index]);
}

function isCompletionLabel(value: unknown): boolean {
  return value === 'complete' || value === 'read' || value === 'acknowledge';
}

function isGroup(value: unknown): boolean {
  return value === 'none' || value === 'project' || value === 'status';
}

export function isPerspectiveView(value: unknown): value is PerspectiveView {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const view = value as Record<string, unknown>;
  if (view.type === 'tasklist') {
    return exactKeys(view, ['type', 'sort', 'direction', 'group', 'completion_label', 'show_notes']) &&
      ['action_order', 'title', 'created_at', 'updated_at', 'due_at'].includes(String(view.sort)) &&
      (view.direction === 'asc' || view.direction === 'desc') && isGroup(view.group) &&
      (view.sort !== 'action_order' || view.direction === 'asc') &&
      isCompletionLabel(view.completion_label) && typeof view.show_notes === 'boolean';
  }
  if (view.type === 'thread') {
    return exactKeys(view, ['type', 'sort', 'direction', 'group', 'completion_label', 'initial_body']) &&
      ['action_order', 'created_at', 'updated_at'].includes(String(view.sort)) &&
      (view.direction === 'asc' || view.direction === 'desc') && isGroup(view.group) &&
      (view.sort !== 'action_order' || view.direction === 'asc') &&
      isCompletionLabel(view.completion_label) &&
      (view.initial_body === 'collapsed' || view.initial_body === 'expanded');
  }
  if (view.type === 'timeline') {
    return exactKeys(view, ['type', 'timestamp', 'direction', 'group', 'completion_label', 'initial_body']) &&
      (view.timestamp === 'created_at' || view.timestamp === 'updated_at') &&
      (view.direction === 'asc' || view.direction === 'desc') &&
      (view.group === 'none' || view.group === 'day') && isCompletionLabel(view.completion_label) &&
      (view.initial_body === 'collapsed' || view.initial_body === 'expanded');
  }
  return false;
}

function validInstant(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
}

function compareCodepoint(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function localDay(instant: string, formatter: Intl.DateTimeFormat): string {
  const parts = formatter.formatToParts(new Date(instant));
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function notePreview(notes: string): string {
  let codepoints = 0;
  let end = 0;
  for (const character of notes) {
    if (codepoints === 280) return notes.slice(0, end) + '…';
    codepoints++;
    end += character.length;
  }
  return notes;
}

function containment(action: PerspectiveViewAction, byId: ReadonlyMap<string, PerspectiveViewAction>): string {
  const parent = action.parent_id ? byId.get(action.parent_id) : undefined;
  return parent ? 'Contains in: ' + (parent.title || 'Untitled action') : '';
}

function unavailable(reason: string): PerspectiveViewProjection {
  return {
    available: false,
    reason,
    targetIds: [],
    groups: [],
    items: [],
    reorderCapability: false,
    timestampMeaning: null,
  };
}

export function projectPerspectiveView(input: {
  matching: readonly PerspectiveViewAction[];
  snapshot: PerspectiveViewSnapshot;
  view: unknown;
  timezone: string;
  expandedBodyOverrides?: Readonly<Record<string, boolean>>;
}): PerspectiveViewProjection {
  if (!isPerspectiveView(input.view)) return unavailable('The saved view definition is not supported.');
  let timezone: string;
  try {
    timezone = new Intl.DateTimeFormat('en', {timeZone: input.timezone}).resolvedOptions().timeZone;
  } catch {
    return unavailable('The client timezone is not available.');
  }

  const view = input.view;
  const perspectiveView = view.type === 'timeline' ? view : null;
  const dayFormatter = perspectiveView?.group === 'day'
    ? new Intl.DateTimeFormat('en-CA', {timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit'})
    : null;
  const sort = view.type === 'timeline' ? view.timestamp : view.sort;
  const timestampMeaning = perspectiveView
    ? perspectiveView.timestamp === 'created_at' ? 'registration' : 'last update'
    : null;
  const unique = new Map<string, {action: PerspectiveViewAction; index: number}>();
  for (const [index, action] of input.matching.entries()) {
    if (!action || typeof action.id !== 'string' || !action.id || unique.has(action.id)) continue;
    unique.set(action.id, {action, index});
  }

  if (sort === 'created_at' || sort === 'updated_at' || sort === 'due_at') {
    for (const {action} of unique.values()) {
      if (sort === 'due_at') {
        const due = action.due_at;
        if (due !== null && due !== undefined && due !== '' && !validInstant(due)) {
          return unavailable('A required saved timestamp is invalid.');
        }
        continue;
      }
      const value = action[sort];
      if (value !== null && value !== undefined && !validInstant(value)) {
        return unavailable('A required saved timestamp is invalid.');
      }
    }
  }

  const direction = view.direction === 'asc' ? 1 : -1;
  const compareActions = (left: {action: PerspectiveViewAction; index: number}, right: {action: PerspectiveViewAction; index: number}) => {
    const a = left.action;
    const b = right.action;
    let compared = 0;
    if (sort === 'title') compared = compareCodepoint(a.title || '', b.title || '');
    else if (sort === 'action_order') compared = left.index - right.index;
    else if (sort === 'created_at' || sort === 'updated_at' || sort === 'due_at') {
      const av = a[sort];
      const bv = b[sort];
      const aMissing = av === null || av === undefined || av === '';
      const bMissing = bv === null || bv === undefined || bv === '';
      if (aMissing !== bMissing) return aMissing ? 1 : -1;
      if (!aMissing && !bMissing) compared = compareCodepoint(String(av), String(bv));
    }
    return compared ? compared * direction : compareCodepoint(a.id, b.id);
  };

  const sorted = [...unique.values()].sort(compareActions);
  const expandedOverrides = input.expandedBodyOverrides ?? {};
  const actionById = new Map(input.snapshot.actions.map(row => [row.id, row]));
  const projects = input.snapshot.projects ?? [];
  const projectById = new Map(projects.map(project => [project.id, project]));
  const containsChildren = new Set<string>();
  for (const action of input.snapshot.actions) {
    if (action.parent_id) containsChildren.add(action.parent_id);
  }
  const toItem = (action: PerspectiveViewAction, groupLabel: string): PerspectiveViewItem => {
    const timestampValue = sort === 'created_at' || sort === 'updated_at' ? action[sort] : null;
    const timestamp = validInstant(timestampValue) ? timestampValue : null;
    return {
      action,
      timestamp,
      groupLabel,
      containsIn: containment(action, actionById),
      containsChildren: containsChildren.has(action.id),
      notesPreview: notePreview(action.notes ?? ''),
      expanded: Object.hasOwn(expandedOverrides, action.id)
        ? expandedOverrides[action.id]
        : view.type !== 'tasklist' && view.initial_body === 'expanded',
    };
  };

  let groups: PerspectiveViewGroup[];
  if (perspectiveView?.group === 'day') {
    const byDay = new Map<string, {day: string | null; rows: typeof sorted}>();
    for (const row of sorted) {
      const raw = row.action[perspectiveView.timestamp];
      const day = validInstant(raw) && dayFormatter ? localDay(raw, dayFormatter) : null;
      const key = day === null ? 'missing' : day;
      const group = byDay.get(key) ?? {day, rows: []};
      group.rows.push(row);
      byDay.set(key, group);
    }
    const dayGroups = [...byDay.entries()].sort(([leftKey, left], [rightKey, right]) => {
      if (left.day === null || right.day === null) return left.day === right.day ? 0 : left.day === null ? 1 : -1;
      return compareCodepoint(left.day, right.day) * direction || compareCodepoint(leftKey, rightKey);
    });
    groups = dayGroups.map(([key, group]) => ({
      key: 'day:' + key,
      label: group.day ?? 'Unknown ' + timestampMeaning,
      day: group.day,
      items: group.rows.map(({action}) => toItem(action, group.day ?? 'Unknown ' + timestampMeaning)),
    }));
  } else if (view.group === 'project') {
    const byProject = new Map<string, PerspectiveViewAction[]>();
    for (const {action} of sorted) {
      const key = action.project_id ?? 'unassigned';
      const rows = byProject.get(key) ?? [];
      rows.push(action);
      byProject.set(key, rows);
    }
    const projectGroups = [...byProject.entries()].sort(([leftId], [rightId]) => {
      if (leftId === 'unassigned' || rightId === 'unassigned') return leftId === rightId ? 0 : leftId === 'unassigned' ? 1 : -1;
      const left = projectById.get(leftId);
      const right = projectById.get(rightId);
      return (left?.order ?? Number.MAX_SAFE_INTEGER) - (right?.order ?? Number.MAX_SAFE_INTEGER) || compareCodepoint(leftId, rightId);
    });
    groups = projectGroups.map(([id, rows]) => {
      const label = id === 'unassigned' ? 'Unassigned' : projectById.get(id)?.path || projectById.get(id)?.name || 'Unavailable project';
      return {key: 'project:' + id, label, day: null, items: rows.map(action => toItem(action, label))};
    });
  } else if (view.group === 'status') {
    const byStatus = new Map<string, PerspectiveViewAction[]>();
    for (const {action} of sorted) {
      const rows = byStatus.get(action.status) ?? [];
      rows.push(action);
      byStatus.set(action.status, rows);
    }
    groups = [...byStatus.entries()].sort(([left], [right]) =>
      statusOrder.indexOf(left as (typeof statusOrder)[number]) - statusOrder.indexOf(right as (typeof statusOrder)[number]) || compareCodepoint(left, right),
    ).map(([status, rows]) => {
      const label = statusLabels[status as keyof typeof statusLabels] ?? status;
      return {key: 'status:' + status, label, day: null, items: rows.map(action => toItem(action, label))};
    });
  } else {
    groups = [{key: 'all', label: '', day: null, items: sorted.map(({action}) => toItem(action, ''))}];
  }

  const items = groups.flatMap(group => group.items);
  return {
    available: true,
    reason: '',
    targetIds: items.map(item => item.action.id),
    groups,
    items,
    reorderCapability: view.type === 'tasklist' && view.sort === 'action_order' && view.direction === 'asc' && view.group === 'none',
    timestampMeaning,
  };
}
