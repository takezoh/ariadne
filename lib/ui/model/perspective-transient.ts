export interface PerspectiveTransientEntry {
  expandedBodies: Readonly<Record<string, boolean>>;
  scrollTop: number;
}

export type PerspectiveTransientState = Readonly<Record<string, PerspectiveTransientEntry>>;

export function initialPerspectiveTransientState(): PerspectiveTransientState {
  return {};
}

export function setPerspectiveBodyExpanded(
  state: PerspectiveTransientState,
  perspectiveId: string,
  actionId: string,
  expanded: boolean,
): PerspectiveTransientState {
  if (!perspectiveId || !actionId) return state;
  const current = state[perspectiveId] ?? {expandedBodies: {}, scrollTop: 0};
  if (current.expandedBodies[actionId] === expanded) return state;
  return {
    ...state,
    [perspectiveId]: {
      ...current,
      expandedBodies: {...current.expandedBodies, [actionId]: expanded},
    },
  };
}

export function setPerspectiveScrollTop(
  state: PerspectiveTransientState,
  perspectiveId: string,
  scrollTop: number,
): PerspectiveTransientState {
  if (!perspectiveId || !Number.isFinite(scrollTop)) return state;
  const nextScrollTop = Math.max(0, scrollTop);
  const current = state[perspectiveId] ?? {expandedBodies: {}, scrollTop: 0};
  if (current.scrollTop === nextScrollTop) return state;
  return {...state, [perspectiveId]: {...current, scrollTop: nextScrollTop}};
}
