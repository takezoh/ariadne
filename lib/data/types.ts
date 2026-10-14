/** Shared data contracts. Keep this module free of runtime values and capabilities. */
export type DeepReadonly<T> = T extends readonly (infer Item)[] ? readonly DeepReadonly<Item>[] : T extends object ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> } : T;

export type ActionStatus = 'active' | 'on-hold' | 'completed' | 'dropped';

export type Action = Readonly<{
  id: string;
  title: string;
  revision: number;
  parent_id: string | null;
  project_id: string | null;
  status: ActionStatus;
  due_at: string | null;
  defer_until: string | null;
  notes: string;
  order: number;
  flagged: boolean;
  created_at: string;
  updated_at: string;
}>;

export type Project = Readonly<{
  id: string;
  order: number;
  name: string;
  description: string;
  parent_id: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}>;

export type Tag = Readonly<{
  id: string;
  order: number;
  name: string;
  description: string;
  parent_id: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}>;

export type ActionTag = Readonly<{ action_id: string; tag_id: string; revision: number }>;
export type CatalogIdentityLedger = Readonly<{
  kind: 'project' | 'tag' | 'action_tag' | 'perspective';
  identity: string;
  revision: number;
}>;

export type PerspectiveFilter = Readonly<{
  statuses?: readonly ActionStatus[];
  is_deferred?: boolean;
  flagged?: boolean;
  project_id?: string | null;
  tag_id?: string;
  include_descendants?: boolean;
}>;

export type PerspectiveCompletionLabel = 'complete' | 'read' | 'acknowledge';
export type PerspectiveBodyState = 'collapsed' | 'expanded';
export type PerspectiveGroup = 'none' | 'project' | 'status';
export type PerspectiveTasklistView = Readonly<{
  type: 'tasklist';
  sort: 'action_order' | 'title' | 'created_at' | 'updated_at' | 'due_at';
  direction: 'asc' | 'desc';
  group: PerspectiveGroup;
  completion_label: PerspectiveCompletionLabel;
  show_notes: boolean;
}>;
export type PerspectiveThreadView = Readonly<{
  type: 'thread';
  sort: 'action_order' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
  group: PerspectiveGroup;
  completion_label: PerspectiveCompletionLabel;
  initial_body: PerspectiveBodyState;
}>;
export type PerspectiveTimelineView = Readonly<{
  type: 'timeline';
  timestamp: 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
  group: 'none' | 'day';
  completion_label: PerspectiveCompletionLabel;
  initial_body: PerspectiveBodyState;
}>;
export type PerspectiveView = PerspectiveTasklistView | PerspectiveThreadView | PerspectiveTimelineView;

export type Perspective = Readonly<{
  id: string;
  name: string;
  description: string;
  filter: PerspectiveFilter;
  view: PerspectiveView;
  definition_version: 2;
  revision: number;
  created_at: string;
  updated_at: string;
}>;

/** Complete Perspective rows found only in immutable pre-view operation history. */
export type HistoricalPerspectiveV1 = Readonly<Omit<Perspective, 'view' | 'definition_version'> & { definition_version: 1 }>;
export type HistoricalPerspective = Perspective | HistoricalPerspectiveV1;
export type OperationDelta = Readonly<{
  perspectives: readonly Readonly<{ before: Perspective | null; after: Perspective | null }>[];
  actions: readonly Readonly<{ before: Action | null; after: Action | null }>[];
  projects: readonly Readonly<{ before: Project | null; after: Project | null }>[];
  tags: readonly Readonly<{ before: Tag | null; after: Tag | null }>[];
  action_tags: readonly Readonly<{ before: ActionTag | null; after: ActionTag | null }>[];
}>;
export type HistoricalOperationDelta = Readonly<
  Omit<OperationDelta, 'perspectives'> & {
    perspectives: readonly Readonly<{ before: HistoricalPerspective | null; after: HistoricalPerspective | null }>[];
  }
>;

export type Snapshot = Readonly<{
  revision: number;
  catalog_identity_ledger: readonly CatalogIdentityLedger[];
  actions: readonly Action[];
  projects: readonly Project[];
  tags: readonly Tag[];
  action_tags: readonly ActionTag[];
  perspectives: readonly Perspective[];
}>;

export type Change = Readonly<{ kind: string; payload: Readonly<Record<string, unknown>> }>;
export type Receipt = Readonly<{
  canonical_payload: string;
  result: string;
  delta: string;
  revision_after: number;
  undo_of: string | null;
}>;
export type OperationResolution = Readonly<{
  perspective?: Readonly<{ id: string }>;
  actions?: readonly Readonly<{ ref?: string; id: string }>[];
  project?: Readonly<{ id: string; created: boolean }>;
  tag?: Readonly<{ id: string; created: boolean }>;
}>;
export type OperationResult = Readonly<{
  operationId: string;
  revision: number;
  changedIds: readonly string[];
  resolved?: OperationResolution;
}>;
/** Owner identity is intentionally absent; trusted composition binds it outside the request. */
export type OwnerCommitRequest = Readonly<{
  operationId: string;
  payload: string;
  before: Snapshot;
  after: Snapshot;
  now: string;
  undoOf: string | null;
  resolved?: OperationResolution;
}>;
