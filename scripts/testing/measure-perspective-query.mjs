import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { canonical, project } from '../../lib/domain/core.ts';
import { MAX_BOUND_JSON_BYTES, MAX_COMMIT_PLAN_BYTES } from '../../lib/data/model/storage.ts';
import {
  PERSPECTIVE_QUERY_LIMITS,
  evaluatePerspective,
  evaluatePerspectiveQuery,
  normalizePerspectiveQuery,
} from '../../lib/domain/perspective-query.ts';

const now = '2026-10-14T12:00:00.000Z';
const warmups = 2;
const sampleCount = 5;
const sizes = [100, 1000, 5000];
const sortFields = ['due_at', 'defer_until', 'created_at', 'updated_at', 'title', 'status', 'flagged', 'order'];
const statusValues = ['active', 'on-hold', 'completed', 'dropped'];
const id = value => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
const timestamp = day => `2026-10-${String(day).padStart(2, '0')}T00:00:00.000Z`;

function catalogNodes(count, offset, label) {
  return Array.from({ length: count }, (_, index) => ({
    id: id(offset + index + 1),
    name: `${label} ${index + 1}`,
    description: '',
    parent_id: index === 0 ? null : index < 32 ? id(offset + index) : id(offset + (index % 31) + 1),
    order: index,
    revision: 1,
    created_at: timestamp(1),
    updated_at: timestamp(1),
  }));
}

function fixture(count) {
  const catalogCount = 256;
  const projects = catalogNodes(catalogCount, 100_000, 'Project');
  const tags = catalogNodes(catalogCount, 200_000, 'Tag');
  const actions = Array.from({ length: count }, (_, index) => ({
    id: id(index + 1),
    title: `Action ${String(index + 1).padStart(5, '0')}`,
    revision: 1,
    parent_id: null,
    project_id: projects[index % projects.length].id,
    status: statusValues[index % statusValues.length],
    due_at: index % 5 === 0 ? null : timestamp((index % 28) + 1),
    defer_until: index % 7 === 0 ? null : timestamp((index % 28) + 1),
    notes: '',
    order: index % 100,
    flagged: index % 3 === 0,
    created_at: timestamp((index % 28) + 1),
    updated_at: timestamp(((index + 1) % 28) + 1),
  }));
  const action_tags = actions.flatMap((action, index) => [
    { action_id: action.id, tag_id: tags[index % tags.length].id, revision: 1 },
    { action_id: action.id, tag_id: tags[(index * 7 + 1) % tags.length].id, revision: 1 },
  ]);
  return {
    revision: 1,
    catalog_identity_ledger: [],
    actions,
    projects,
    tags,
    action_tags,
    perspectives: [],
  };
}

function queryCases(snapshot) {
  const candidateIds = snapshot.tags.slice(0, PERSPECTIVE_QUERY_LIMITS.maxCandidates).map(item => item.id);
  const projectIds = snapshot.projects.slice(0, PERSPECTIVE_QUERY_LIMITS.maxCandidates).map(item => item.id);
  const wideLeaves = Array.from({ length: PERSPECTIVE_QUERY_LIMITS.maxNodes - 1 }, (_, index) => ({
    field: 'flagged', op: 'eq', value: index % 2 === 0,
  }));
  const boundedLeaves = Array.from({ length: PERSPECTIVE_QUERY_LIMITS.maxNodes - 1 }, (_, index) => ({
    field: 'project_id', op: 'not_in', values: index === 0 ? projectIds.slice(0, 2) : [projectIds[index + 1]],
  }));
  const allTrueLeaves = Array.from({ length: (PERSPECTIVE_QUERY_LIMITS.maxNodes - 2) / 2 }, () => ({
    not: { field: 'status', op: 'in', values: [] },
  }));
  allTrueLeaves.push({ field: 'status', op: 'in', values: statusValues });
  const boundedMaximumQuery = {
    where: { and: boundedLeaves },
    order_by: sortFields.map(field => ({ field, direction: 'asc' })),
  };
  const priorBoundedMaximumQuery = structuredClone(boundedMaximumQuery);
  priorBoundedMaximumQuery.where.and[0].values.reverse();
  const deeplyNested = Array.from({ length: PERSPECTIVE_QUERY_LIMITS.maxDepth - 1 }, () => 0)
    .reduce(condition => ({ not: condition }), { field: 'status', op: 'eq', value: 'active' });
  return [
    {
      name: 'representative',
      query: { where: { and: [
        { field: 'project_id', op: 'in', values: snapshot.projects.slice(0, 12).map(item => item.id) },
        { field: 'tag_id', op: 'in', values: snapshot.tags.slice(0, 12).map(item => item.id) },
        { field: 'status', op: 'in', values: ['active', 'on-hold'] },
        { field: 'is_deferred', op: 'eq', value: false },
      ] } },
    },
    { name: 'max-node-width', query: { where: { or: wideLeaves } } },
    {
      name: 'bounded-maximum-output',
      query: boundedMaximumQuery,
      priorQuery: priorBoundedMaximumQuery,
    },
    {
      name: 'all-true-full-leaf-evaluation',
      query: {
        where: { and: allTrueLeaves },
        order_by: sortFields.map(field => ({ field, direction: 'asc' })),
      },
    },
    { name: 'max-depth', query: { where: deeplyNested } },
    { name: 'max-set-candidates', query: { where: { field: 'tag_id', op: 'in', values: candidateIds } } },
    { name: 'max-sort-keys', query: { order_by: sortFields.map(field => ({ field, direction: 'asc' })) } },
  ];
}

function treeMetrics(condition) {
  let nodes = 0;
  let breadth = 0;
  let depth = 0;
  let candidates = 0;
  const stack = [{ condition, depth: 1 }];
  while (stack.length) {
    const item = stack.pop();
    nodes++;
    depth = Math.max(depth, item.depth);
    if ('and' in item.condition || 'or' in item.condition) {
      const children = item.condition.and ?? item.condition.or;
      breadth = Math.max(breadth, children.length);
      for (const child of children) stack.push({ condition: child, depth: item.depth + 1 });
    } else if ('not' in item.condition) stack.push({ condition: item.condition.not, depth: item.depth + 1 });
    else if ('values' in item.condition) candidates += item.condition.values.length;
    else candidates++;
  }
  return { nodes, max_depth: depth, max_breadth: breadth, predicate_candidates: candidates };
}

function syntheticStorageEnvelope(normalized, priorNormalized = null) {
  const filter = canonical(normalized);
  const before = {
    id: id(900_001), name: 'Measured perspective', description: '', filter: priorNormalized ? canonical(priorNormalized) : '{}', definition_version: 1,
    revision: 1, created_at: timestamp(1), updated_at: timestamp(1),
  };
  const after = { ...before, filter, revision: 2, updated_at: timestamp(2) };
  const delta = { perspectives: [{ before, after }], actions: [], projects: [], tags: [], action_tags: [] };
  const perspectiveBulkChanges = [{ before, after }];
  const deltaJsonBytes = Buffer.byteLength(JSON.stringify(delta));
  const bulkJsonBytes = Buffer.byteLength(JSON.stringify(perspectiveBulkChanges));
  return {
    canonical_filter_utf8_bytes: Buffer.byteLength(filter),
    perspective_delta_bound_json_utf8_bytes: deltaJsonBytes,
    perspective_bulk_changes_utf8_bytes: bulkJsonBytes,
    known_delta_and_bulk_plan_bytes: deltaJsonBytes + bulkJsonBytes,
    delta_bound_json_within_100k: deltaJsonBytes <= MAX_BOUND_JSON_BYTES,
    delta_bulk_components_within_512k: deltaJsonBytes + bulkJsonBytes <= MAX_COMMIT_PLAN_BYTES,
  };
}

function measure(run) {
  for (let index = 0; index < warmups; index++) run();
  const samples_ms = [];
  for (let index = 0; index < sampleCount; index++) {
    const started = performance.now();
    run();
    samples_ms.push(Number((performance.now() - started).toFixed(3)));
  }
  return { warmups, samples_ms };
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

const trackedSources = [
  'lib/data/types.ts',
  'lib/domain/core.ts',
  'lib/domain/perspective-query.ts',
  'lib/data/model/storage.ts',
  'scripts/testing/measure-perspective-query.mjs',
  'tests/domain/perspective-query.test.mjs',
  'tests/harness/architecture-fixtures.test.mjs',
  'tests/fixtures/perspective-query/pure.fixture',
  'tests/fixtures/perspective-query/effect.fixture',
  'docs/technical/perspective-query.md',
  'docs/technical/data-model.md',
];
const sources = {};
for (const path of trackedSources) sources[path] = await sha256(path);

const results = [];
for (const count of sizes) {
  const snapshot = fixture(count);
  const projected = project(snapshot, now);
  const cases = queryCases(snapshot).map(({ name, query, priorQuery }) => {
    const normalized = normalizePerspectiveQuery(query);
    const priorNormalized = priorQuery ? normalizePerspectiveQuery(priorQuery) : null;
    const matches = evaluatePerspectiveQuery(snapshot, projected, query);
    return {
      name,
      query,
      normalized,
      metrics: {
        ...(normalized.where ? treeMetrics(normalized.where) : { nodes: 0, max_depth: 0, max_breadth: 0, predicate_candidates: 0 }),
        sort_keys: normalized.order_by?.length ?? 0,
        normalized_json_bytes: Buffer.byteLength(JSON.stringify(normalized)),
        synthetic_storage_envelope: syntheticStorageEnvelope(normalized),
        ...(priorNormalized ? { synthetic_max_to_max_edit_envelope: syntheticStorageEnvelope(normalized, priorNormalized) } : {}),
        matching_rows: matches.length,
        rows_sorted: normalized.order_by === undefined ? 0 : matches.length,
      },
    };
  });
  results.push({
    fixture: {
      actions: count,
      projects: snapshot.projects.length,
      tags: snapshot.tags.length,
      classification_max_depth: 32,
      action_tag_associations: snapshot.action_tags.length,
      associations_per_action: 2,
      action_containment_depth: 1,
      projected_action_rows: projected.length,
    },
    projection_only: measure(() => project(snapshot, now)),
    queries: cases.map(({ name, query, metrics }) => ({
      name,
      ...metrics,
      projected_rows_kernel: measure(() => evaluatePerspectiveQuery(snapshot, projected, query)),
      full_explicit_time_wrapper: measure(() => evaluatePerspective(snapshot, now, query)),
    })),
  });
}

const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const storageBudgets = { max_bound_json_bytes: MAX_BOUND_JSON_BYTES, max_commit_plan_bytes: MAX_COMMIT_PLAN_BYTES };
const maxEmittedQueryBytes = Math.max(...results.flatMap(result => result.queries.map(query => query.normalized_json_bytes)));
const envelopes = results.flatMap(result => result.queries.flatMap(query => [query.synthetic_storage_envelope, ...(query.synthetic_max_to_max_edit_envelope ? [query.synthetic_max_to_max_edit_envelope] : [])]));
const maxSyntheticDeltaBytes = Math.max(...envelopes.map(envelope => envelope.perspective_delta_bound_json_utf8_bytes));
const maxKnownPlanBytes = Math.max(...envelopes.map(envelope => envelope.known_delta_and_bulk_plan_bytes));
process.stdout.write(JSON.stringify({
  generated_at: new Date().toISOString(),
  read_time: now,
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  source_identity: { git_head: head, sha256: sources },
  harness: { warmups, raw_samples: sampleCount, time_unit: 'milliseconds', measurement_clock: 'performance.now' },
  limits: PERSPECTIVE_QUERY_LIMITS,
  storage_budgets: storageBudgets,
  maximum_measured_normalized_query_bytes: maxEmittedQueryBytes,
  maximum_synthetic_perspective_delta_bytes: maxSyntheticDeltaBytes,
  maximum_synthetic_known_delta_and_bulk_bytes: maxKnownPlanBytes,
  storage_envelope_limitation: 'The AST is not persisted by the current v1 perspective row contract. Synthetic perspective-row delta and bulk envelopes show the escaped query contribution only; payload, result, markers, unrelated edits, and production storage acceptance are not covered.',
  results,
}, null, 2) + '\n');
