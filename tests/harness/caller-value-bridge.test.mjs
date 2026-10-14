import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WRITE_TOOLS, classifyOutcome, createBridge, emptyLedger, rememberCursor, validateManifest, validateOperation,
} from '../../scripts/testing/caller-value-bridge.mjs';
import { extractResourceHtml } from '../../scripts/testing/caller-value.mjs';

const rootAction = '10000000-0000-4000-8000-000000000001';
const childAction = '10000000-0000-4000-8000-000000000002';
const siblingAction = '10000000-0000-4000-8000-000000000003';

function manifest(overrides = {}) {
  return {
    schemaVersion: 1,
    runId: 'caller-value-test',
    purpose: 'test the caller-value bridge boundary',
    dataClass: 'synthetic',
    endpoint: 'http://127.0.0.1:37009/mcp',
    ownerId: 'issue20-test-owner',
    evidenceDir: '/home/davinci/evidence/issue20/tests/caller-value-test',
    capabilities: { mcpRead: true, mcpWrite: false, resources: false, uiIntervention: false, prepareFixture: false, snapshot: false, checkpoint: false },
    permittedTools: ['list_actions'],
    permittedResources: [],
    fixtures: { actions: [rootAction, childAction, siblingAction], projects: [], tags: [], perspectives: [] },
    ...overrides,
  };
}

test('read-only manifests reject every published mutating tool, including capture_intent', () => {
  for (const tool of WRITE_TOOLS) {
    assert.throws(() => validateManifest(manifest({ permittedTools: ['list_actions', tool] })), /read-only manifest cannot permit write tools/, tool);
  }
  assert.deepEqual([...WRITE_TOOLS].sort(), ['add_action', 'apply_change', 'capture_intent', 'rename_action', 'undo_change']);
});

test('producer manifest narrows apply_change kind, action target and editable fields', () => {
  const scoped = manifest({
    capabilities: { mcpRead: true, mcpWrite: true, resources: false, uiIntervention: false, prepareFixture: false, snapshot: false, checkpoint: false },
    permittedTools: ['list_actions', 'apply_change'],
    writeKinds: ['edit'],
    writableActionIds: [childAction],
    writeFields: { edit: ['notes', 'status'] },
  });
  validateManifest(scoped);
  const ledger = emptyLedger(scoped);
  const operation = (payload, kind = 'edit') => ({
    command: 'call', name: 'apply_change', arguments: {
      schemaVersion: 2, operationId: '20000000-0000-4000-8000-000000000001', expectedRevision: 3, kind, payload,
    },
  });

  assert.doesNotThrow(() => validateOperation(operation({ id: childAction, notes: 'exact saved proposal', status: 'on-hold' }), scoped, ledger));
  assert.throws(() => validateOperation(operation({ id: childAction, title: 'Rename is outside this caller scope' }), scoped, ledger), /writeFields/);
  assert.throws(() => validateOperation(operation({ id: siblingAction, notes: 'wrong action' }), scoped, ledger), /writableActionIds/);
  assert.throws(() => validateOperation(operation({ id: childAction, notes: 'wrong kind' }, 'add'), scoped, ledger), /writeKinds/);
});

test('writeKinds accepts every current apply_change creation kind', () => {
  assert.doesNotThrow(() => validateManifest(manifest({
    capabilities: { mcpRead: true, mcpWrite: true, resources: false, uiIntervention: false, prepareFixture: false, snapshot: false, checkpoint: false },
    permittedTools: ['apply_change'],
    writeKinds: ['project_get_or_create', 'tag_get_or_create'],
  })));
});

test('only a complete snapshot or terminal feed page makes a checkpointable cursor', () => {
  const ledger = emptyLedger(manifest());
  rememberCursor(ledger, 'get_change_cursor', { revision: 4, cursor: 'baseline-only' });
  assert(ledger.cursors.includes('baseline-only'));
  assert.equal(ledger.completedReadCursors.length, 0);
  const checkpointManifest = manifest({ capabilities: { mcpRead: true, mcpWrite: false, resources: false, uiIntervention: false, prepareFixture: false, snapshot: true, checkpoint: true } });
  const checkpointOperation = { command: 'checkpoint', cursor: 'baseline-only', consumerOutputPath: '/tmp/output.json', contextPath: '/tmp/context.json' };
  assert.throws(() => validateOperation(checkpointOperation, checkpointManifest, ledger), /complete snapshot or terminal change-feed page/);

  rememberCursor(ledger, 'get_changes', { changes: [], has_more: true, through_revision: 4, next_cursor: 'split-page' });
  assert.equal(ledger.completedReadCursors.length, 0);
  rememberCursor(ledger, 'get_changes', { changes: [], has_more: false, through_revision: 4, next_cursor: 'terminal-page' });
  assert.deepEqual(ledger.completedReadCursors.at(-1), { cursor: 'terminal-page', source: 'terminal_change_page', revision: 4 });

  rememberCursor(ledger, 'list_actions', {
    revision: 5, change_cursor: 'full-state', actions: [], projects: [], tags: [], perspectives: [], action_tags: [],
  });
  assert.deepEqual(ledger.completedReadCursors.at(-1), { cursor: 'full-state', source: 'full_snapshot', revision: 5 });
  assert.doesNotThrow(() => validateOperation({ ...checkpointOperation, cursor: 'full-state' }, checkpointManifest, ledger));
});

test('all mutating tool transport failures retain unknown-outcome classification', () => {
  for (const toolName of WRITE_TOOLS) {
    assert.deepEqual(classifyOutcome({ write: WRITE_TOOLS.has(toolName), toolName, transportError: true }), { kind: 'unknown', reason: 'transport_error' }, toolName);
  }
});

test('generated MCP UI resource accepts the production TextResourceContents shape', () => {
  const html = '<!doctype html><html><body><script>window.ready = true;</script></body></html>';
  assert.equal(extractResourceHtml([{ uri: 'ui://action-tools/actions-v4.html', mimeType: 'text/html', text: html }]), html);
  assert.equal(extractResourceHtml([{ uri: 'ui://other/resource', mimeType: 'text/html', text: html }]), null);
});

test('remote endpoints, caller-selected owners and unrecorded identities cannot enter the bridge', () => {
  assert.throws(() => validateManifest(manifest({ endpoint: 'https://example.invalid/mcp' })), /Endpoint must/);
  assert.throws(() => validateManifest(manifest({ endpoint: 'http://127.0.0.1:37009/mcp?target=elsewhere' })), /Endpoint must/);
  const scoped = manifest();
  assert.throws(() => validateOperation({ command: 'call', name: 'list_actions', arguments: { owner: 'someone-else' } }, scoped), /cannot be supplied/);
  const query = manifest({ permittedTools: ['query_actions'] });
  assert.throws(() => validateOperation({ command: 'call', name: 'query_actions', arguments: { project_id: '10000000-0000-4000-8000-000000000099' } }, query), /Unrecorded entity/);
});

test('the transport persists and records the exact write intent before a missing response', async () => {
  const scoped = manifest({
    capabilities: { mcpRead: true, mcpWrite: true, resources: false, uiIntervention: false, prepareFixture: false, snapshot: false, checkpoint: false },
    permittedTools: ['apply_change'],
    writeKinds: ['edit'], writableActionIds: [childAction], writeFields: { edit: ['notes'] },
  });
  validateManifest(scoped);
  const args = Object.freeze({
    schemaVersion: 2, operationId: '20000000-0000-4000-8000-000000000003', expectedRevision: 3,
    kind: 'edit', payload: Object.freeze({ id: childAction, notes: 'Exact synthetic note: "quote"\n日本語' }),
  });
  const saved = [], events = [], sent = [];
  const bridge = createBridge(scoped, {
    persistIdentityLedger: async value => saved.push(structuredClone(value)),
    record: async value => events.push(structuredClone(value)),
    fetchImpl: async (endpoint, options) => {
      assert.equal(endpoint, scoped.endpoint);
      assert.equal(options.headers['oai-authenticated-user-id'], scoped.ownerId);
      const request = JSON.parse(options.body);
      sent.push(request);
      if (request.method === 'tools/list') return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { tools: [{ name: 'apply_change' }] } }));
      assert(saved.some(row => row.operationIds.includes(args.operationId)), 'the operation identity must survive response loss');
      assert(events.some(row => row.event === 'request' && JSON.parse(row.request.body).method === 'tools/call'), 'the full request must be recorded before dispatch');
      throw new TypeError('synthetic response loss');
    },
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await bridge.invokeTool('apply_change', args);
    assert.equal(result.outcome.kind, 'unknown');
  }
  const writes = sent.filter(row => row.method === 'tools/call');
  assert.equal(writes.length, 2);
  assert.deepEqual(writes.map(row => row.params), [{ name: 'apply_change', arguments: args }, { name: 'apply_change', arguments: args }]);
  assert.equal(bridge.identityLedger.operationIds.length, 1);
  assert(events.filter(row => row.event === 'response' && row.outcome.kind === 'unknown').length === 2);
});
