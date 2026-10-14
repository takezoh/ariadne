import { createHash, randomUUID } from 'node:crypto';
import { relative, resolve, sep } from 'node:path';

export const EVIDENCE_ROOT = '/home/davinci/evidence/issue20';
export const RESOURCE_URI = 'ui://action-tools/actions-v4.html';
// Keep this inventory aligned with every mutating tool in the private MCP registry.
export const WRITE_TOOLS = new Set(['capture_intent', 'apply_change', 'undo_change', 'add_action', 'rename_action']);
const CHANGE_KINDS = new Set([
  'add', 'structure_create', 'edit', 'status', 'defer', 'release', 'complete', 'cancel', 'reopen', 'action_move',
  'project_add', 'project_get_or_create', 'project_edit', 'project_move', 'project_remove', 'tag_add', 'tag_get_or_create', 'tag_edit', 'tag_move', 'tag_remove',
  'perspective_add', 'perspective_edit', 'perspective_remove', 'action_project', 'action_tag',
]);
const EDIT_FIELDS = new Set(['title', 'notes', 'parent_id', 'due_at', 'defer_until', 'order', 'flagged', 'status']);
const ENTITY_ID_KEYS = new Set(['id', 'action_id', 'project_id', 'tag_id', 'perspective_id', 'parent_id', 'anchor_id', 'inbox_action_id']);
const ENTITY_ID_ARRAY_KEYS = new Set(['ids', 'action_ids', 'project_ids', 'tag_ids', 'perspective_ids']);
const OWNER_KEYS = new Set(['owner', 'ownerid', 'owner_id', 'userid', 'user_id']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class HarnessError extends Error {
  constructor(message, outcome = { kind: 'rejected' }) {
    super(message);
    this.name = 'HarnessError';
    this.outcome = outcome;
  }
}

export function validateManifest(manifest, { repoRoot, evidenceRoot = EVIDENCE_ROOT } = {}) {
  if (!isRecord(manifest)) throw new HarnessError('Run manifest must be a JSON object.');
  const allowed = new Set(['schemaVersion', 'runId', 'purpose', 'dataClass', 'endpoint', 'ownerId', 'evidenceDir', 'capabilities', 'permittedTools', 'permittedResources', 'fixtures', 'writeKinds', 'writableActionIds', 'writeFields']);
  rejectUnknownKeys(manifest, allowed, 'manifest');
  if (manifest.schemaVersion !== 1) throw new HarnessError('Unsupported run manifest schemaVersion.');
  if (typeof manifest.runId !== 'string' || !/^[a-z][a-z0-9-]{2,79}$/.test(manifest.runId)) throw new HarnessError('runId must be a lowercase synthetic run identifier.');
  if (typeof manifest.purpose !== 'string' || !manifest.purpose.trim()) throw new HarnessError('Run manifest purpose is required.');
  if (manifest.dataClass !== 'synthetic') throw new HarnessError('Only synthetic run data is permitted.');
  if (typeof manifest.ownerId !== 'string' || !/^issue20-[a-z0-9][a-z0-9-]{1,55}$/.test(manifest.ownerId)) throw new HarnessError('ownerId must use the recorded issue20 synthetic-owner namespace.');
  if (typeof manifest.endpoint !== 'string') throw new HarnessError('A recorded MCP endpoint is required.');
  const endpoint = new URL(manifest.endpoint);
  if (endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1' || !endpoint.port || endpoint.pathname !== '/mcp' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new HarnessError('Endpoint must be a recorded http://127.0.0.1:<port>/mcp URL.');
  }
  if (typeof manifest.evidenceDir !== 'string' || !isAbsolute(manifest.evidenceDir)) throw new HarnessError('evidenceDir must be an absolute path.');
  const evidencePath = resolve(manifest.evidenceDir);
  const allowedRoot = resolve(evidenceRoot);
  if (!isWithin(evidencePath, allowedRoot)) throw new HarnessError(`Evidence must remain under ${allowedRoot}.`);
  if (repoRoot && isWithin(evidencePath, resolve(repoRoot))) throw new HarnessError('Evidence must be outside the repository.');
  if (!isRecord(manifest.capabilities)) throw new HarnessError('capabilities must be an object.');
  rejectUnknownKeys(manifest.capabilities, new Set(['mcpRead', 'mcpWrite', 'resources', 'uiIntervention', 'prepareFixture', 'snapshot', 'checkpoint']), 'capabilities');
  for (const key of ['mcpRead', 'mcpWrite', 'resources', 'uiIntervention', 'prepareFixture', 'snapshot', 'checkpoint']) {
    if (typeof manifest.capabilities[key] !== 'boolean') throw new HarnessError(`capabilities.${key} must be boolean.`);
  }
  if (!manifest.capabilities.mcpRead) throw new HarnessError('This bridge requires explicit MCP read capability.');
  if (manifest.capabilities.uiIntervention && (!manifest.capabilities.mcpWrite || !manifest.capabilities.resources)) throw new HarnessError('UI intervention requires MCP write and resource capabilities.');
  if (manifest.capabilities.prepareFixture && !manifest.capabilities.mcpWrite) throw new HarnessError('Fixture preparation requires explicit MCP write capability.');
  if (!Array.isArray(manifest.permittedTools) || manifest.permittedTools.some(name => typeof name !== 'string' || !/^[a-z][a-z0-9_]{0,79}$/.test(name)) || new Set(manifest.permittedTools).size !== manifest.permittedTools.length) {
    throw new HarnessError('permittedTools must be a unique list of generic tool names.');
  }
  if (!Array.isArray(manifest.permittedResources) || manifest.permittedResources.some(uri => typeof uri !== 'string' || !uri.startsWith('ui://action-tools/')) || new Set(manifest.permittedResources).size !== manifest.permittedResources.length) {
    throw new HarnessError('permittedResources must be a unique list of recorded action-tools UI resources.');
  }
  if (!isRecord(manifest.fixtures)) throw new HarnessError('fixtures must be an object.');
  rejectUnknownKeys(manifest.fixtures, new Set(['actions', 'projects', 'tags', 'perspectives']), 'fixtures');
  for (const type of ['actions', 'projects', 'tags', 'perspectives']) {
    const ids = manifest.fixtures[type];
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !UUID.test(id)) || new Set(ids).size !== ids.length) throw new HarnessError(`fixtures.${type} must be a unique list of UUIDs.`);
  }
  if (manifest.writeKinds !== undefined && (!Array.isArray(manifest.writeKinds) || manifest.writeKinds.some(kind => typeof kind !== 'string' || !CHANGE_KINDS.has(kind)) || new Set(manifest.writeKinds).size !== manifest.writeKinds.length)) {
    throw new HarnessError('writeKinds must be a unique list of supported apply_change kinds.');
  }
  if (manifest.writableActionIds !== undefined && (!Array.isArray(manifest.writableActionIds) || manifest.writableActionIds.some(id => typeof id !== 'string' || !UUID.test(id)) || new Set(manifest.writableActionIds).size !== manifest.writableActionIds.length)) {
    throw new HarnessError('writableActionIds must be a unique list of action UUIDs.');
  }
  if (manifest.writableActionIds && manifest.writableActionIds.some(id => !manifest.fixtures.actions.includes(id))) {
    throw new HarnessError('writableActionIds must be selected from this caller manifest’s recorded fixture actions.');
  }
  if (manifest.writeFields !== undefined) validateWriteFields(manifest.writeFields);
  if (!manifest.capabilities.mcpWrite && manifest.permittedTools.some(name => WRITE_TOOLS.has(name))) throw new HarnessError('A read-only manifest cannot permit write tools.');
  return manifest;
}

function validateWriteFields(value) {
  if (!isRecord(value)) throw new HarnessError('writeFields must map permitted change kinds or write tools to field-name lists.');
  const knownKeys = new Set([...CHANGE_KINDS, ...WRITE_TOOLS]);
  for (const [key, fields] of Object.entries(value)) {
    if (!knownKeys.has(key) || !Array.isArray(fields) || fields.some(field => typeof field !== 'string' || !/^[a-z][a-zA-Z0-9_]{0,79}$/.test(field)) || new Set(fields).size !== fields.length) {
      throw new HarnessError('writeFields entries must use supported kind/tool names and unique field-name lists.');
    }
    if (key === 'edit' && fields.some(field => !EDIT_FIELDS.has(field))) throw new HarnessError('writeFields.edit contains an unsupported action field.');
  }
}

function writeIdentity(args) {
  if (typeof args?.operationId === 'string') return { operationId: 'operationId', expectedRevision: 'expectedRevision' };
  return { operationId: 'request_id', expectedRevision: 'expected_revision' };
}

function validateOperationIdentity(args, identityKey, revisionKey) {
  if (!args || typeof args[identityKey] !== 'string' || !UUID.test(args[identityKey])) throw new HarnessError(`Write requires a caller-selected ${identityKey}.`);
  if (!Number.isSafeInteger(args[revisionKey]) || args[revisionKey] < 0) throw new HarnessError(`Write requires a nonnegative ${revisionKey}.`);
}

function validateWriteRequest(manifest, name, args) {
  if (!WRITE_TOOLS.has(name)) return;
  if (!manifest.capabilities.mcpWrite) throw new HarnessError('This run is read-only; write tool call rejected before HTTP.');
  if (name === 'apply_change') {
    const kind = args?.kind;
    if (manifest.writeKinds && !manifest.writeKinds.includes(kind)) throw new HarnessError(`apply_change kind ${String(kind)} is outside this caller’s writeKinds.`);
    const payload = args?.payload;
    if (!isRecord(payload)) throw new HarnessError('apply_change requires an object payload.');
    if (manifest.writableActionIds) {
      const targets = targetActionIds(kind, payload);
      if (targets.some(id => !manifest.writableActionIds.includes(id))) throw new HarnessError('Write target is outside this caller’s writableActionIds.');
    }
    validatePermittedFields(manifest, kind, Object.keys(payload).filter(key => key !== 'id'), 'apply_change');
  } else {
    if (name === 'rename_action' && manifest.writableActionIds && !manifest.writableActionIds.includes(args?.id)) throw new HarnessError('Write target is outside this caller’s writableActionIds.');
    const ignored = new Set(['schemaVersion', 'operationId', 'expectedRevision', 'request_id', 'expected_revision', 'id']);
    validatePermittedFields(manifest, name, Object.keys(isRecord(args) ? args : {}).filter(key => !ignored.has(key)), name);
  }
}

function validatePermittedFields(manifest, policyKey, fields, toolName) {
  if (manifest.writeFields === undefined) return;
  const allowed = manifest.writeFields[policyKey] ?? manifest.writeFields[toolName];
  if (!Array.isArray(allowed) || fields.some(field => !allowed.includes(field))) throw new HarnessError(`Write fields for ${policyKey} are outside this caller’s writeFields.`);
}

function targetActionIds(kind, payload) {
  if (['edit', 'status', 'defer', 'release', 'complete', 'cancel', 'reopen'].includes(kind)) return typeof payload.id === 'string' ? [payload.id] : [];
  if (kind === 'action_project' || kind === 'action_tag') return Array.isArray(payload.ids) ? payload.ids : (typeof payload.id === 'string' ? [payload.id] : []);
  if (kind === 'action_move') return Array.isArray(payload.ids) ? payload.ids : [];
  if (kind === 'structure_create') return typeof payload.inbox_action_id === 'string' ? [payload.inbox_action_id] : [];
  return [];
}

export function validateOperation(operation, manifest, identityLedger = emptyLedger(manifest)) {
  if (!isRecord(operation)) throw new HarnessError('Operation must be a JSON object.');
  if (hasOwnerKey(operation)) throw new HarnessError('Owner identity is fixed by the run manifest and cannot be supplied by an operation.');
  if (typeof operation.command !== 'string') throw new HarnessError('Operation command is required.');
  switch (operation.command) {
    case 'discover':
      rejectUnknownKeys(operation, new Set(['command']), 'operation');
      return;
    case 'call': {
      rejectUnknownKeys(operation, new Set(['command', 'name', 'arguments']), 'operation');
      if (typeof operation.name !== 'string' || !manifest.permittedTools.includes(operation.name)) throw new HarnessError('Tool is not permitted by this run manifest.');
      if (!isRecord(operation.arguments)) throw new HarnessError('arguments must be a JSON object.');
      if (hasOwnerKey(operation.arguments)) throw new HarnessError('Tool arguments cannot choose an owner.');
      if (WRITE_TOOLS.has(operation.name) && !manifest.capabilities.mcpWrite) throw new HarnessError('This run is read-only; write tool call rejected before HTTP.');
      validateRecordedIds(operation.arguments, identityLedger);
      validateWriteRequest(manifest, operation.name, operation.arguments);
      if (operation.name === 'operation_status' && (typeof operation.arguments.operationId !== 'string' || !identityLedger.operationIds.includes(operation.arguments.operationId))) throw new HarnessError('operationId must refer to a write request recorded by this run.');
      if (operation.name === 'apply_change') {
        if (!isRecord(operation.arguments) || typeof operation.arguments.operationId !== 'string' || !UUID.test(operation.arguments.operationId)) throw new HarnessError('apply_change requires its caller-selected operationId.');
        if (!Number.isSafeInteger(operation.arguments.expectedRevision) || operation.arguments.expectedRevision < 0) throw new HarnessError('apply_change requires a nonnegative expectedRevision.');
      }
      if (operation.name === 'capture_intent') validateOperationIdentity(operation.arguments, 'operationId', 'expectedRevision');
      if (operation.name === 'add_action' || operation.name === 'rename_action') validateOperationIdentity(operation.arguments, 'request_id', 'expected_revision');
      if (operation.name === 'undo_change') {
        if (typeof operation.arguments.operationId !== 'string' || !UUID.test(operation.arguments.operationId)) throw new HarnessError('undo_change requires its caller-selected operationId.');
        if (!Number.isSafeInteger(operation.arguments.expectedRevision) || operation.arguments.expectedRevision < 0) throw new HarnessError('undo_change requires a nonnegative expectedRevision.');
        if (!identityLedger.operationIds.includes(operation.arguments.undoOf)) throw new HarnessError('undoOf must refer to a write request recorded by this run.');
      }
      return;
    }
    case 'resource':
      rejectUnknownKeys(operation, new Set(['command', 'uri']), 'operation');
      if (!manifest.capabilities.resources) throw new HarnessError('Resource reads are disabled for this run.');
      if (typeof operation.uri !== 'string' || !manifest.permittedResources.includes(operation.uri)) throw new HarnessError('Resource URI is not permitted by this run manifest.');
      return;
    case 'prepare_fixture':
      rejectUnknownKeys(operation, new Set(['command']), 'operation');
      if (!manifest.capabilities.prepareFixture) throw new HarnessError('Fixture preparation is disabled for this run.');
      return;
    case 'ui_intervention':
      rejectUnknownKeys(operation, new Set(['command', 'actionId', 'notes', 'status']), 'operation');
      if (!manifest.capabilities.uiIntervention) throw new HarnessError('Generated UI intervention is disabled for this run.');
      if (typeof operation.actionId !== 'string' || !allEntityIds(identityLedger).has(operation.actionId)) throw new HarnessError('UI target action is not a recorded fixture or confirmed creation.');
      if (manifest.writableActionIds && !manifest.writableActionIds.includes(operation.actionId)) throw new HarnessError('UI target is outside this caller’s writableActionIds.');
      if (manifest.writeKinds && !manifest.writeKinds.includes('edit')) throw new HarnessError('UI intervention requires apply_change kind edit in this caller’s writeKinds.');
      if (manifest.writeFields !== undefined && !['notes', 'status'].every(field => manifest.writeFields.edit?.includes(field))) throw new HarnessError('UI intervention requires notes and status in this caller’s writeFields.edit.');
      if (typeof operation.notes !== 'string' || typeof operation.status !== 'string' || !['active', 'on-hold', 'completed', 'dropped'].includes(operation.status)) throw new HarnessError('UI intervention requires exact notes and a supported status.');
      return;
    case 'snapshot':
      rejectUnknownKeys(operation, new Set(['command', 'label']), 'operation');
      if (!manifest.capabilities.snapshot) throw new HarnessError('Snapshot capture is disabled for this run.');
      if (typeof operation.label !== 'string' || !/^[a-z][a-z0-9-]{0,59}$/.test(operation.label)) throw new HarnessError('Snapshot label must be a lowercase evidence identifier.');
      return;
    case 'checkpoint':
      rejectUnknownKeys(operation, new Set(['command', 'cursor', 'consumerOutputPath', 'contextPath']), 'operation');
      if (!manifest.capabilities.checkpoint) throw new HarnessError('Consumer checkpoints are disabled for this run.');
      if (typeof operation.cursor !== 'string' || !identityLedger.completedReadCursors.some(item => item.cursor === operation.cursor)) throw new HarnessError('Checkpoint cursor must come from an observed complete snapshot or terminal change-feed page.');
      if (typeof operation.consumerOutputPath !== 'string' || !isAbsolute(operation.consumerOutputPath) || typeof operation.contextPath !== 'string' || !isAbsolute(operation.contextPath)) throw new HarnessError('Checkpoint needs absolute output and context evidence paths.');
      return;
    default:
      throw new HarnessError(`Unsupported operation command: ${operation.command}`);
  }
}

export function classifyOutcome({ write = false, transportError, status, parseError, envelope, toolName }) {
  if (transportError) return { kind: write ? 'unknown' : 'transport_failure', reason: 'transport_error' };
  if (!Number.isInteger(status) || status < 200 || status >= 300) return { kind: write ? 'unknown' : 'http_failure', reason: 'http_status', status };
  if (parseError) return { kind: write ? 'unknown' : 'protocol_failure', reason: 'invalid_json' };
  if (envelope?.error) return { kind: write ? 'unknown' : 'protocol_failure', reason: 'jsonrpc_error', code: envelope.error.code ?? null };
  const result = envelope?.result;
  if (!result || typeof result !== 'object') return { kind: write ? 'unknown' : 'protocol_failure', reason: 'missing_result' };
  if (toolName && result.isError) {
    const code = result.structuredContent?.error?.code ?? null;
    return code === 'outcome_unknown' ? { kind: 'unknown', reason: 'domain_outcome_unknown', code } : { kind: 'domain_failure', reason: 'tool_error', code };
  }
  return { kind: 'success' };
}

export function serializeJsonRpc(id, method, params = {}) {
  return JSON.stringify({ jsonrpc: '2.0', id, method, params });
}

export function emptyLedger(manifest) {
  return {
    actions: [...(manifest.fixtures?.actions ?? [])],
    projects: [...(manifest.fixtures?.projects ?? [])],
    tags: [...(manifest.fixtures?.tags ?? [])],
    perspectives: [...(manifest.fixtures?.perspectives ?? [])],
    operationIds: [],
    cursors: [],
    completedReadCursors: [],
  };
}

export function createBridge(manifest, { fetchImpl = fetch, record = async () => {}, identityLedger = emptyLedger(manifest), persistIdentityLedger = async () => {}, now = () => new Date().toISOString() } = {}) {
  let sequence = 0;
  let lastDiscovery = null;

  async function request(method, params, { operation, toolName = null, write = false, channel = 'mcp' } = {}) {
    const id = ++sequence;
    const rawBody = serializeJsonRpc(id, method, params);
    const requestInfo = {
      method: 'POST', endpoint: manifest.endpoint,
      headers: {
        'Content-Type': 'application/json',
        'oai-authenticated-user-id': manifest.ownerId,
        'oai-authenticated-user-email': `${manifest.runId}@local.invalid`,
      },
      body: rawBody,
    };
    const callId = randomUUID();
    await record({ event: 'request', callId, at: now(), runId: manifest.runId, channel, operation: operation ?? null, request: requestInfo });
    let status = null, statusText = '', bodyText = '', envelope = null, parseError = false, transportError = false;
    try {
      const response = await fetchImpl(manifest.endpoint, {
        method: 'POST', headers: requestInfo.headers, body: rawBody, redirect: 'error', signal: AbortSignal.timeout(15000),
      });
      status = response.status;
      statusText = response.statusText;
      bodyText = await response.text();
      try { envelope = JSON.parse(bodyText); } catch { parseError = true; }
    } catch (error) {
      transportError = true;
      bodyText = '';
      statusText = error instanceof Error ? error.name : 'TransportError';
    }
    const outcome = classifyOutcome({ write, transportError, status, parseError, envelope, toolName });
    const responseInfo = transportError
      ? { transportError: statusText }
      : { status, statusText, bodyText, body: parseError ? null : envelope };
    await record({ event: 'response', callId, at: now(), runId: manifest.runId, channel, response: responseInfo, outcome });
    if (outcome.kind === 'success' && toolName) {
      const structured = envelope.result?.structuredContent;
      rememberCursor(identityLedger, toolName, structured);
      rememberCreatedIdentities(identityLedger, structured, callId);
      if (write) {
        if (operation?.arguments?.operationId && !identityLedger.operationIds.includes(operation.arguments.operationId)) {
          identityLedger.operationIds.push(operation.arguments.operationId);
        }
        await persistIdentityLedger(identityLedger);
      } else {
        await persistIdentityLedger(identityLedger);
      }
    }
    return { outcome, envelope, status, responseInfo, callId };
  }

  async function discover(operation = { command: 'discover' }) {
    const result = await request('tools/list', {}, { operation });
    if (result.outcome.kind === 'success') lastDiscovery = result.envelope.result;
    return result;
  }

  async function invokeTool(name, args, operation = { command: 'call', name, arguments: args }) {
    if (!manifest.permittedTools.includes(name)) throw new HarnessError('Tool is not permitted by this run manifest.');
    if (WRITE_TOOLS.has(name) && !manifest.capabilities.mcpWrite) throw new HarnessError('This run is read-only; write tool call rejected before HTTP.');
    if (hasOwnerKey(args)) throw new HarnessError('Tool arguments cannot choose an owner.');
    validateRecordedIds(args, identityLedger);
    validateWriteRequest(manifest, name, args);
    if (WRITE_TOOLS.has(name)) {
      const identity = writeIdentity(args);
      validateOperationIdentity(args, identity.operationId, identity.expectedRevision);
      if (!identityLedger.operationIds.includes(args[identity.operationId])) {
        identityLedger.operationIds.push(args[identity.operationId]);
        await persistIdentityLedger(identityLedger);
      }
    }
    const discovery = await discover({ ...operation, preflight: 'tools/list' });
    if (discovery.outcome.kind !== 'success') return discovery;
    const tools = discovery.envelope?.result?.tools;
    if (!Array.isArray(tools) || !tools.some(tool => tool?.name === name)) throw new HarnessError('Tool is not present in live tools/list discovery.');
    const result = await request('tools/call', { name, arguments: args }, { operation, toolName: name, write: WRITE_TOOLS.has(name) });
    return result;
  }

  async function readResource(uri, operation = { command: 'resource', uri }) {
    if (!manifest.capabilities.resources || !manifest.permittedResources.includes(uri)) throw new HarnessError('Resource URI is not permitted by this run manifest.');
    return request('resources/read', { uri }, { operation });
  }

  return {
    manifest,
    identityLedger,
    discover,
    invokeTool,
    readResource,
    request,
    get lastDiscovery() { return lastDiscovery; },
  };
}

export function rememberCreatedIdentities(ledger, structured, evidenceRef = null) {
  const resolved = structured?.result?.resolved ?? structured?.resolved ?? structured?.result?.result?.resolved;
  if (!resolved || typeof resolved !== 'object') return;
  for (const [field, type] of [['actions', 'actions'], ['project', 'projects'], ['tag', 'tags'], ['perspective', 'perspectives']]) {
    const candidates = field === 'actions' ? resolved.actions : [resolved[field]];
    if (!Array.isArray(candidates)) continue;
    for (const item of candidates) {
      if (typeof item?.id === 'string' && UUID.test(item.id) && !ledger[type].includes(item.id)) ledger[type].push(item.id);
    }
  }
  if (evidenceRef) ledger.lastConfirmedCreationEvidence = evidenceRef;
}

export function rememberCursor(ledger, toolName, structured) {
  if (!structured || typeof structured !== 'object') return;
  const candidates = [];
  const fullSnapshotTools = new Set(['list_actions', 'get_relevant_context', 'open_actions', 'open_verification']);
  if (fullSnapshotTools.has(toolName) && completeSnapshot(structured)) {
    candidates.push({ cursor: structured.change_cursor, source: 'full_snapshot', revision: structured.revision });
  }
  if (toolName === 'get_change_cursor' && typeof structured.cursor === 'string') candidates.push({ cursor: structured.cursor, source: 'cursor_read', revision: structured.revision });
  if (toolName === 'get_changes' && structured.has_more === false && Array.isArray(structured.changes) && typeof structured.next_cursor === 'string' && Number.isSafeInteger(structured.through_revision)) {
    candidates.push({ cursor: structured.next_cursor, source: 'terminal_change_page', revision: structured.through_revision });
  }
  for (const item of candidates) {
    if (!ledger.cursors.includes(item.cursor)) ledger.cursors.push(item.cursor);
    if (item.source !== 'cursor_read' && !ledger.completedReadCursors.some(previous => previous.cursor === item.cursor)) ledger.completedReadCursors.push(item);
  }
}

function completeSnapshot(value) {
  return typeof value.change_cursor === 'string' && Number.isSafeInteger(value.revision) && value.revision >= 0 &&
    ['actions', 'projects', 'tags', 'perspectives', 'action_tags'].every(key => Array.isArray(value[key]));
}

export function classifyToolResult(result) {
  return result?.outcome ?? { kind: 'unknown', reason: 'missing_outcome' };
}

function validateRecordedIds(value, ledger, key = '') {
  if (Array.isArray(value)) {
    for (const item of value) validateRecordedIds(item, ledger, key);
    return;
  }
  if (!isRecord(value)) {
    if (ENTITY_ID_KEYS.has(key) && value !== null && (typeof value !== 'string' || !allEntityIds(ledger).has(value))) throw new HarnessError(`Unrecorded entity identity supplied in ${key}.`);
    return;
  }
  for (const [childKey, child] of Object.entries(value)) {
    if (OWNER_KEYS.has(childKey.toLowerCase())) throw new HarnessError('Tool arguments cannot choose an owner.');
    if (ENTITY_ID_KEYS.has(childKey)) {
      const values = Array.isArray(child) ? child : [child];
      for (const id of values) if (id !== null && (typeof id !== 'string' || !allEntityIds(ledger).has(id))) throw new HarnessError(`Unrecorded entity identity supplied in ${childKey}.`);
    } else if (ENTITY_ID_ARRAY_KEYS.has(childKey)) {
      if (!Array.isArray(child) || child.some(id => typeof id !== 'string' || !allEntityIds(ledger).has(id))) throw new HarnessError(`Unrecorded entity identity supplied in ${childKey}.`);
    } else validateRecordedIds(child, ledger, childKey);
  }
}

function allEntityIds(ledger) {
  return new Set(['actions', 'projects', 'tags', 'perspectives'].flatMap(type => ledger[type] ?? []));
}

function hasOwnerKey(value) {
  if (Array.isArray(value)) return value.some(hasOwnerKey);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, child]) => OWNER_KEYS.has(key.toLowerCase()) || hasOwnerKey(child));
}

function rejectUnknownKeys(value, allowed, label) {
  const unexpected = Object.keys(value).filter(key => !allowed.has(key));
  if (unexpected.length) throw new HarnessError(`${label} has unsupported field(s): ${unexpected.join(', ')}.`);
}

function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function isAbsolute(value) { return typeof value === 'string' && (value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value)); }
function isWithin(path, root) { const rel = relative(root, path); return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)); }

export function sha256(value) {
  return createHash('sha256').update(Buffer.isBuffer(value) ? value : String(value)).digest('hex');
}
