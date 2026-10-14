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

export type PerspectiveQueryField = 'project_id' | 'tag_id' | 'status' | 'flagged' | 'is_deferred';
export type PerspectiveQueryOperator = 'eq' | 'ne' | 'in' | 'not_in';
export type PerspectiveQueryCondition =
  | Readonly<{ and: readonly PerspectiveQueryCondition[] }>
  | Readonly<{ or: readonly PerspectiveQueryCondition[] }>
  | Readonly<{ not: PerspectiveQueryCondition }>
  | Readonly<{ field: 'project_id' | 'tag_id'; op: 'eq' | 'ne'; value: string | null; include_descendants?: boolean }>
  | Readonly<{ field: 'project_id' | 'tag_id'; op: 'in' | 'not_in'; values: readonly (string | null)[]; include_descendants?: boolean }>
  | Readonly<{ field: 'status'; op: 'eq' | 'ne'; value: ActionStatus }>
  | Readonly<{ field: 'status'; op: 'in' | 'not_in'; values: readonly ActionStatus[] }>
  | Readonly<{ field: 'flagged' | 'is_deferred'; op: 'eq' | 'ne'; value: boolean }>;
export type PerspectiveQuery = Readonly<{
  where?: PerspectiveQueryCondition;
  order_by?: readonly SortKey[];
}>;
export type SortKey = Readonly<{
  field: 'due_at' | 'defer_until' | 'created_at' | 'updated_at' | 'title' | 'status' | 'flagged' | 'order';
  direction: 'asc' | 'desc';
  nulls?: 'first' | 'last';
}>;

export type Perspective = Readonly<{
  id: string;
  name: string;
  description: string;
  filter: PerspectiveFilter;
  definition_version: 1;
  revision: number;
  created_at: string;
  updated_at: string;
}>;

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
/** Owner-bound retained operation rows used to build an incremental read page. */
export type RetainedOperation = Readonly<{
  operation_id: string;
  revision_before: number;
  revision_after: number;
  committed_at: string;
  undo_of: string | null;
  delta: string;
}>;
export type ChangeWindow = Readonly<{
  head_revision: number;
  oldest_revision: number | null;
  operations: readonly RetainedOperation[];
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
