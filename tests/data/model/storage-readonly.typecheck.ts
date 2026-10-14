import type { StoragePlan } from '../../../lib/data/model/storage';

export function assertStoragePlanIsDeeplyReadonly(plan: StoragePlan) {
  // @ts-expect-error A consumer cannot append changed actions to the plan.
  plan.changes.actions.push({ before: null, after: null });
  // @ts-expect-error A consumer cannot edit a planned row.
  plan.changes.actions[0].after!.title = 'mutated';
  // @ts-expect-error A consumer cannot alter nested perspective filter arrays.
  plan.changes.perspectives[0].after!.filter.statuses!.push('completed');
  // @ts-expect-error A consumer cannot change the write-table plan.
  plan.tables[0].changes[0].after!.id = 'mutated';
  // @ts-expect-error A consumer cannot change identity-marker rows.
  plan.markerChanges.push({ before: null, after: null });
}
