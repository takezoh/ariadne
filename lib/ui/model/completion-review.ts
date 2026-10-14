export interface CompletionAction {
  readonly id: string;
  readonly title: string;
  readonly status?: string;
  readonly parent_id?: string | null;
}

export interface CompletionSnapshot {
  readonly revision: number;
  readonly actions: readonly CompletionAction[];
}

export interface CompletionIntent {
  readonly expectedRevision: number;
  readonly kind: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface CompletionReviewScope {
  readonly expectedRevision: number;
  readonly rootId: string;
  readonly descendants: readonly {id: string; title: string; status: string}[];
}

export function isCompletionIntent(intent: CompletionIntent): boolean {
  return intent.kind === 'complete' ||
    ((intent.kind === 'status' || intent.kind === 'edit') && intent.payload.status === 'completed');
}

export function projectCompletionReviewScope(
  snapshot: CompletionSnapshot,
  intent: CompletionIntent,
): CompletionReviewScope | undefined {
  if (!isCompletionIntent(intent)) return;
  const rootId = typeof intent.payload.id === 'string' ? intent.payload.id : '';
  if (!rootId) return;

  const children = new Map<string, CompletionAction[]>();
  for (const action of snapshot.actions) {
    if (!action.parent_id) continue;
    const rows = children.get(action.parent_id) ?? [];
    rows.push(action);
    children.set(action.parent_id, rows);
  }

  const descendants: {id: string; title: string; status: string}[] = [];
  const seen = new Set<string>([rootId]);
  const pending = [rootId];
  while (pending.length) {
    for (const child of children.get(pending.pop()!) ?? []) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      pending.push(child.id);
      descendants.push({id: child.id, title: child.title || 'Untitled action', status: child.status || 'unknown'});
    }
  }

  return descendants.length
    ? {expectedRevision: intent.expectedRevision, rootId, descendants}
    : undefined;
}

export function sameCompletionReviewScope(
  left: CompletionReviewScope | undefined,
  right: CompletionReviewScope | undefined,
): boolean {
  if (!left || !right || left.expectedRevision !== right.expectedRevision || left.rootId !== right.rootId ||
    left.descendants.length !== right.descendants.length) return left === right;
  return left.descendants.every((action, index) => {
    const next = right.descendants[index];
    return action.id === next.id && action.title === next.title && action.status === next.status;
  });
}

export function createCompletionReviewModel() {
  return {isCompletionIntent, projectScope: projectCompletionReviewScope, sameScope: sameCompletionReviewScope};
}
