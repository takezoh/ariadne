import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, readdir, realpath, lstat, access } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { sourceIdentity } from './verification-source.mjs';
import {
  EVIDENCE_ROOT, RESOURCE_URI, HarnessError, classifyToolResult, createBridge,
  emptyLedger, sha256, validateManifest, validateOperation,
} from './caller-value-bridge.mjs';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_NOTES = 'Plan to publish on Friday after validating source figures.';
const CALLER_CONTEXT = 'Keep the next step brief. Do not reorganize unrelated actions.';
const CALLER_OBJECTIVE = 'Resume and suggest the next useful step.';

async function readManifest(path) {
  if (!isAbsolute(path)) throw new HarnessError('Manifest path must be absolute.');
  const manifestPath = resolve(path);
  const stat = await lstat(manifestPath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new HarnessError('Manifest must be a regular file, not a symlink.');
  const bytes = await readFile(manifestPath);
  let manifest;
  try { manifest = JSON.parse(bytes.toString('utf8')); } catch { throw new HarnessError('Manifest is not valid JSON.'); }
  validateManifest(manifest, { repoRoot: REPOSITORY_ROOT, evidenceRoot: EVIDENCE_ROOT });
  await ensureSafeDirectory(manifest.evidenceDir);
  return { manifest, manifestPath, manifestSha256: sha256(bytes) };
}

async function ensureSafeDirectory(path) {
  const allowedRoot = await realpath(EVIDENCE_ROOT);
  const requested = resolve(path);
  if (!within(requested, allowedRoot) || within(requested, REPOSITORY_ROOT)) throw new HarnessError('Evidence path is outside the permitted external synthetic evidence root.');
  const relativePath = relative(allowedRoot, requested);
  let current = allowedRoot;
  for (const part of relativePath ? relativePath.split(sep) : []) {
    current = join(current, part);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new HarnessError('Evidence paths cannot contain symlinks or non-directory components.');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      await mkdir(current, { mode: 0o700 });
    }
  }
  return requested;
}

async function ensureChildDirectory(root, name) {
  if (!/^[a-z][a-z0-9-]{0,39}$/.test(name)) throw new HarnessError('Invalid evidence directory name.');
  const target = join(root, name);
  await ensureSafeDirectory(target);
  return target;
}

async function makeEvidenceWriter(evidenceDir, manifestSha256) {
  const eventsDirectory = await ensureChildDirectory(evidenceDir, 'events');
  let sequence = 0;
  return async entry => {
    const filename = `${String(++sequence).padStart(5, '0')}-${Date.now()}-${randomUUID()}.json`;
    const path = join(eventsDirectory, filename);
    const file = await open(path, 'wx', 0o600);
    try {
      await file.writeFile(`${JSON.stringify({ manifestSha256, ...entry }, null, 2)}\n`);
      await file.sync();
    } finally { await file.close(); }
    return path;
  };
}

async function writeUniqueJson(directory, filename, value) {
  if (!/^[a-z0-9][a-z0-9.-]{0,119}\.json$/.test(filename)) throw new HarnessError('Invalid evidence filename.');
  const path = join(directory, filename);
  const file = await open(path, 'wx', 0o600);
  try {
    await file.writeFile(`${JSON.stringify(value, null, 2)}\n`);
    await file.sync();
  } finally { await file.close(); }
  return path;
}

async function persistLedger(evidenceDir, ledger) {
  const directory = await ensureChildDirectory(evidenceDir, 'ledger');
  const filename = `${Date.now()}-${randomUUID()}.json`;
  await writeUniqueJson(directory, filename, ledger);
}

async function loadLedger(manifest, evidenceDir) {
  const ledger = emptyLedger(manifest);
  const directory = join(evidenceDir, 'ledger');
  try {
    const names = (await readdir(directory)).filter(name => name.endsWith('.json')).sort();
    for (const name of names) {
      const entry = JSON.parse(await readFile(join(directory, name), 'utf8'));
      for (const type of ['actions', 'projects', 'tags', 'perspectives', 'operationIds', 'cursors']) {
        for (const value of entry[type] ?? []) if (typeof value === 'string' && !ledger[type].includes(value)) ledger[type].push(value);
      }
      for (const value of entry.completedReadCursors ?? []) {
        if (value && typeof value.cursor === 'string' && typeof value.source === 'string' && Number.isSafeInteger(value.revision) && !ledger.completedReadCursors.some(item => item.cursor === value.cursor)) {
          ledger.completedReadCursors.push(value);
        }
      }
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return ledger;
}

async function createRuntime(manifest, manifestSha256) {
  const ledger = await loadLedger(manifest, manifest.evidenceDir);
  const record = await makeEvidenceWriter(manifest.evidenceDir, manifestSha256);
  const persist = value => persistLedger(manifest.evidenceDir, value);
  const bridge = createBridge(manifest, { record, identityLedger: ledger, persistIdentityLedger: persist });
  return { bridge, ledger, record };
}

function resultData(result) { return result?.envelope?.result?.structuredContent; }

function requireSuccess(result, label) {
  if (classifyToolResult(result).kind !== 'success') throw new HarnessError(`${label} did not complete successfully; preserve the exact request and inspect its recorded outcome.`, classifyToolResult(result));
  return resultData(result);
}

async function invokeFixtureTool(bridge, name, args, step) {
  const operation = { command: 'prepare_fixture', step, name, arguments: args };
  return bridge.invokeTool(name, args, operation);
}

async function prepareFixture(manifest, bridge, record) {
  const scenarios = await ensureChildDirectory(manifest.evidenceDir, 'scenarios');
  const target = join(scenarios, 'prepared.json');
  try { await access(target); throw new HarnessError('prepared.json already exists; use the recorded fixture instead of creating duplicate writes.'); }
  catch (error) { if (error instanceof HarnessError) throw error; if (error?.code !== 'ENOENT') throw error; }

  const initial = requireSuccess(await invokeFixtureTool(bridge, 'list_actions', {}, 'check-empty-owner'), 'Initial list_actions');
  if (initial.revision !== 0 || initial.actions?.length || initial.projects?.length || initial.tags?.length || initial.perspectives?.length) {
    throw new HarnessError('Fixture preparation requires a new empty synthetic owner at revision 0.');
  }

  const root = requireSuccess(await invokeFixtureTool(bridge, 'apply_change', {
    schemaVersion: 2, operationId: randomUUID(), expectedRevision: initial.revision,
    kind: 'add', payload: { title: 'Publish river-quality memo', notes: FIXTURE_NOTES },
  }, 'create-parent'), 'Parent creation');
  const parentId = root.result?.resolved?.actions?.[0]?.id;
  if (!parentId) throw new HarnessError('Parent creation result did not identify a saved action.');

  const graph = requireSuccess(await invokeFixtureTool(bridge, 'apply_change', {
    schemaVersion: 2, operationId: randomUUID(), expectedRevision: root.revision,
    kind: 'structure_create', payload: {
      inbox_action_id: parentId,
      actions: [
        { ref: 'publish', title: 'Publish river-quality memo' },
        { ref: 'validate', title: 'Validate source figures', parent_ref: 'publish' },
        { ref: 'caveat', title: 'Draft caveat paragraph', parent_ref: 'publish' },
      ],
    },
  }, 'create-children'), 'Child creation');
  const resolved = graph.result?.resolved?.actions ?? [];
  const byRef = new Map(resolved.map(item => [item.ref, item.id]));
  const validationId = byRef.get('validate');
  const caveatId = byRef.get('caveat');
  if (byRef.get('publish') !== parentId || !validationId || !caveatId) throw new HarnessError('Structure result did not identify each fixture action.');

  const unrelated = requireSuccess(await invokeFixtureTool(bridge, 'apply_change', {
    schemaVersion: 2, operationId: randomUUID(), expectedRevision: graph.revision,
    kind: 'add', payload: { title: 'Renew library card', notes: 'Check renewal requirements when convenient.' },
  }, 'create-unrelated-action'), 'Unrelated action creation');
  const unrelatedId = unrelated.result?.resolved?.actions?.[0]?.id;
  if (!unrelatedId) throw new HarnessError('Unrelated action creation result did not identify a saved action.');
  const baseline = requireSuccess(await invokeFixtureTool(bridge, 'list_actions', {}, 'capture-baseline'), 'Baseline list_actions');
  const fixtures = { parent: parentId, validation: validationId, caveat: caveatId, unrelated: unrelatedId };
  const prepared = {
    schemaVersion: 1,
    runId: manifest.runId,
    environment: 'built local Worker env.DB through Wrangler local D1; synthetic trusted headers',
    source: sourceIdentity(),
    builtWorkerSha256: await fileSha256(resolve(REPOSITORY_ROOT, 'dist/server/index.js')),
    ownerId: manifest.ownerId,
    fixtures,
    revision: baseline.revision,
    snapshot: baseline,
    changeCursor: baseline.change_cursor,
    priorContext: CALLER_CONTEXT,
    objective: CALLER_OBJECTIVE,
    preparedAt: new Date().toISOString(),
    actualCallerResults: 'pending; preparation does not establish VALUE acceptance',
  };
  await record({ event: 'scenario_artifact', at: new Date().toISOString(), runId: manifest.runId, artifact: 'prepared.json', summary: { revision: baseline.revision, fixtures } });
  const path = await writeUniqueJson(scenarios, 'prepared.json', prepared);
  return { ok: true, outcome: { kind: 'success' }, artifact: path, prepared };
}

async function captureSnapshot(manifest, bridge, label) {
  const result = await bridge.invokeTool('list_actions', {}, { command: 'snapshot', label, name: 'list_actions', arguments: {} });
  const snapshot = requireSuccess(result, 'Snapshot list_actions');
  const directory = await ensureChildDirectory(manifest.evidenceDir, 'snapshots');
  const path = await writeUniqueJson(directory, `${label}.json`, { schemaVersion: 1, runId: manifest.runId, source: sourceIdentity(), snapshot });
  return { ok: true, outcome: { kind: 'success' }, artifact: path, revision: snapshot.revision, changeCursor: snapshot.change_cursor, snapshot };
}

export function extractResourceHtml(contents) {
  if (!Array.isArray(contents)) return null;
  const match = contents.find(item => item !== null && typeof item === 'object' && !Array.isArray(item) && typeof item.text === 'string' &&
    (item.uri === RESOURCE_URI || item.type === 'text'));
  return match?.text ?? null;
}

async function finalizeCheckpoint(manifest, ledger, operation) {
  const outputPath = await validateEvidenceFile(manifest.evidenceDir, operation.consumerOutputPath, 'consumer output');
  const contextPath = await validateEvidenceFile(manifest.evidenceDir, operation.contextPath, 'consumer context');
  const [outputBytes, contextBytes] = await Promise.all([readFile(outputPath), readFile(contextPath)]);
  if (!outputBytes.length || !contextBytes.length) throw new HarnessError('Checkpoint output and context files must be nonempty.');
  const checkpoints = await ensureChildDirectory(manifest.evidenceDir, 'checkpoints');
  const checkpoint = {
    schemaVersion: 1,
    runId: manifest.runId,
    processedCursor: operation.cursor,
    consumerOutput: { path: relative(manifest.evidenceDir, outputPath), sha256: sha256(outputBytes) },
    context: { path: relative(manifest.evidenceDir, contextPath), sha256: sha256(contextBytes) },
    finalizedAt: new Date().toISOString(),
    meaning: 'Local caller checkpoint written after successful processing and output; retrieval alone is not a checkpoint.',
  };
  const path = await writeUniqueJson(checkpoints, `${Date.now()}-${randomUUID()}.json`, checkpoint);
  return { ok: true, outcome: { kind: 'success' }, artifact: path, checkpoint };
}

async function validateEvidenceFile(evidenceDir, filePath, description) {
  if (!isAbsolute(filePath)) throw new HarnessError(`${description} path must be absolute.`);
  const resolved = resolve(filePath);
  if (!within(resolved, evidenceDir)) throw new HarnessError(`${description} must stay within the recorded evidence directory.`);
  const stat = await lstat(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new HarnessError(`${description} must be a regular file.`);
  return await realpath(resolved);
}

async function uiIntervention(manifest, bridge, record, operation) {
  const initialList = await bridge.readResource(RESOURCE_URI, { command: 'ui_intervention', phase: 'resource-read', uri: RESOURCE_URI });
  if (initialList.outcome.kind !== 'success') throw new HarnessError('Generated UI resource retrieval failed.', initialList.outcome);
  const contents = initialList.envelope?.result?.contents;
  const html = extractResourceHtml(contents);
  if (typeof html !== 'string' || !html.includes('<script>')) throw new HarnessError('resources/read did not return generated UI HTML.');
  const resourceSha256 = sha256(Buffer.from(html, 'utf8'));
  const jsdomErrors = [];
  const uiEvents = [];
  const pending = new Set();
  let toolCalls = 0;
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => jsdomErrors.push(error.message));
  const dom = new JSDOM(html, {
    url: 'https://generated-ui.invalid/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.confirm = () => true;
      window.HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
      window.HTMLDialogElement.prototype.close = function close() { this.open = false; };
      window.postMessage = message => {
        const request = structuredClone(message);
        uiEvents.push({ type: 'host-message', method: request?.method ?? null, id: request?.id ?? null });
        if (request?.id == null) {
          void record({ event: 'ui_host_notification', at: new Date().toISOString(), runId: manifest.runId, message: request });
          return;
        }
        const task = (async () => {
          let response;
          if (request?.jsonrpc !== '2.0' || typeof request.method !== 'string') {
            response = { jsonrpc: '2.0', id: request?.id, error: { code: -32600, message: 'Invalid UI request.' } };
          } else if (request.method === 'ui/initialize') {
            response = { jsonrpc: '2.0', id: request.id, result: { hostContext: { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] } } };
          } else if (request.method === 'ui/request-display-mode') {
            response = { jsonrpc: '2.0', id: request.id, result: { mode: request.params?.mode === 'fullscreen' ? 'fullscreen' : 'inline' } };
          } else if (request.method === 'tools/call') {
            toolCalls++;
            const name = request.params?.name;
            const args = request.params?.arguments ?? {};
            const result = await bridge.invokeTool(name, args, { command: 'ui_intervention', phase: 'generated-ui-tools-call', name, arguments: args });
            response = result.outcome.kind === 'success'
              ? { jsonrpc: '2.0', id: request.id, result: result.envelope.result }
              : { jsonrpc: '2.0', id: request.id, error: { code: -32000, message: `Recorded UI tool outcome: ${result.outcome.kind}` } };
          } else {
            response = { jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Unsupported local UI host method.' } };
          }
          window.dispatchEvent(new window.MessageEvent('message', { source: window.parent, data: response }));
        })();
        pending.add(task);
        task.finally(() => pending.delete(task));
      };
    },
  });
  const waitFor = async (predicate, label) => {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (predicate()) return;
      await new Promise(resolvePromise => setTimeout(resolvePromise, 25));
    }
    throw new HarnessError(`Timed out waiting for generated UI: ${label}.`);
  };
  const waitForUiTool = async (previousCount, label) => {
    await waitFor(() => toolCalls > previousCount && pending.size === 0, label);
    if (jsdomErrors.length) throw new HarnessError(`Generated UI raised an unexpected error: ${jsdomErrors.join('; ')}`);
  };
  const savedSnapshot = async () => requireSuccess(await bridge.invokeTool('list_actions', {}, { command: 'ui_intervention', phase: 'verify-independent-read', name: 'list_actions', arguments: {} }), 'Independent UI readback');
  try {
    await waitFor(() => pending.size === 0 && dom.window.document.querySelector(`[data-action-id="${operation.actionId}"] .action-select`), 'initial snapshot and target row');
    const document = dom.window.document;
    const row = document.querySelector(`[data-action-id="${operation.actionId}"] .action-select`);
    row.click();
    uiEvents.push({ type: 'click-action', actionId: operation.actionId });
    await waitFor(() => !document.getElementById('editor')?.hidden && document.getElementById('editNotes')?.value !== undefined, 'selected action editor');
    const notes = document.getElementById('editNotes');
    const beforeNotesCalls = toolCalls;
    notes.value = operation.notes;
    notes.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    notes.dispatchEvent(new dom.window.Event('blur'));
    uiEvents.push({ type: 'input', field: 'notes', actionId: operation.actionId, value: operation.notes });
    uiEvents.push({ type: 'blur', field: 'notes', actionId: operation.actionId });
    await waitForUiTool(beforeNotesCalls, 'notes save response');
    let persisted = await savedSnapshot();
    assert.equal(persisted.actions.find(action => action.id === operation.actionId)?.notes, operation.notes, 'notes must persist through generated UI and MCP');

    const beforeStatusCalls = toolCalls;
    const statusButton = document.querySelector(`[data-status="${operation.status}"]`);
    if (!statusButton) throw new HarnessError(`Generated UI is missing status control ${operation.status}.`);
    statusButton.click();
    uiEvents.push({ type: 'click-status', status: operation.status, actionId: operation.actionId });
    await waitForUiTool(beforeStatusCalls, 'status save response');
    persisted = await savedSnapshot();
    assert.equal(persisted.actions.find(action => action.id === operation.actionId)?.status, operation.status, 'status must persist through generated UI and MCP');
    if (jsdomErrors.length) throw new HarnessError(`Generated UI raised an unexpected error: ${jsdomErrors.join('; ')}`);

    const directory = await ensureChildDirectory(manifest.evidenceDir, 'scenarios');
    const path = await writeUniqueJson(directory, 'ui-intervention.json', {
      schemaVersion: 1,
      runId: manifest.runId,
      resource: { uri: RESOURCE_URI, sha256: resourceSha256, byteLength: Buffer.byteLength(html) },
      events: uiEvents,
      toolsCallCount: toolCalls,
      generatedUiErrors: jsdomErrors,
      verified: { actionId: operation.actionId, notes: operation.notes, status: operation.status, revision: persisted.revision },
      fidelity: 'Generated HTML and tools/call use the recorded local Worker; JSDOM host initialization is synthetic and is not a physical human or ChatGPT Work observation.',
    });
    await record({ event: 'scenario_artifact', at: new Date().toISOString(), runId: manifest.runId, artifact: 'ui-intervention.json', summary: { resourceSha256, toolsCallCount: toolCalls, revision: persisted.revision } });
    return { ok: true, outcome: { kind: 'success' }, artifact: path, resourceSha256, revision: persisted.revision, verified: { actionId: operation.actionId, status: operation.status, notesSha256: sha256(operation.notes) } };
  } finally { dom.window.close(); }
}

async function fileSha256(path) { return sha256(await readFile(path)); }
function within(path, root) { const rel = relative(root, path); return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)); }
async function readStdin() { const chunks = []; for await (const chunk of process.stdin) chunks.push(chunk); return Buffer.concat(chunks).toString('utf8'); }
function parseArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--manifest' || !isAbsolute(argv[1])) throw new HarnessError('Usage: node scripts/testing/caller-value.mjs --manifest <absolute-run-manifest> < operation.json');
  return argv[1];
}

export async function runCliOperation(manifest, bridge, record, operation) {
  const ledger = bridge.identityLedger;
  validateOperation(operation, manifest, ledger);
  switch (operation.command) {
    case 'discover': {
      const result = await bridge.discover(operation);
      return { ok: result.outcome.kind === 'success', outcome: result.outcome, response: result.envelope ?? null };
    }
    case 'call': {
      const result = await bridge.invokeTool(operation.name, operation.arguments, operation);
      return { ok: result.outcome.kind === 'success', outcome: result.outcome, response: result.envelope?.result ?? null, httpStatus: result.status };
    }
    case 'resource': {
      const result = await bridge.readResource(operation.uri, operation);
      return { ok: result.outcome.kind === 'success', outcome: result.outcome, response: result.envelope?.result ?? null, httpStatus: result.status };
    }
    case 'prepare_fixture': return prepareFixture(manifest, bridge, record);
    case 'ui_intervention': return uiIntervention(manifest, bridge, record, operation);
    case 'snapshot': return captureSnapshot(manifest, bridge, operation.label);
    case 'checkpoint': return finalizeCheckpoint(manifest, ledger, operation);
    default: throw new HarnessError(`Unsupported operation: ${operation.command}`);
  }
}

async function main() {
  const manifestPath = parseArgs(process.argv.slice(2));
  const { manifest, manifestSha256 } = await readManifest(manifestPath);
  const { bridge, record } = await createRuntime(manifest, manifestSha256);
  const rawOperation = await readStdin();
  if (Buffer.byteLength(rawOperation) > 1024 * 1024) throw new HarnessError('Operation input exceeds the 1 MiB limit.');
  let operation;
  try { operation = JSON.parse(rawOperation); } catch { throw new HarnessError('stdin must contain exactly one JSON operation.'); }
  await record({ event: 'operation_input', at: new Date().toISOString(), runId: manifest.runId, operation });
  try {
    const output = await runCliOperation(manifest, bridge, record, operation);
    await record({ event: 'operation_result', at: new Date().toISOString(), runId: manifest.runId, command: operation.command, outcome: output.outcome, summary: summarize(output) });
    process.stdout.write(`${JSON.stringify(output)}\n`);
    if (!output.ok) process.exitCode = 2;
  } catch (error) {
    const outcome = error instanceof HarnessError ? error.outcome : { kind: 'harness_failure' };
    await record({ event: 'operation_result', at: new Date().toISOString(), runId: manifest.runId, command: operation?.command ?? null, outcome, error: error instanceof Error ? error.message : 'Unknown harness failure' });
    process.stdout.write(`${JSON.stringify({ ok: false, outcome, error: error instanceof Error ? error.message : 'Unknown harness failure' })}\n`);
    process.exitCode = 2;
  }
}

function summarize(output) {
  if (output.artifact) return { artifact: output.artifact, revision: output.revision ?? output.prepared?.revision ?? null };
  if (output.response?.structuredContent) return { revision: output.response.structuredContent.revision ?? null };
  return {};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    const outcome = error instanceof HarnessError ? error.outcome : { kind: 'harness_failure' };
    process.stdout.write(`${JSON.stringify({ ok: false, outcome, error: error instanceof Error ? error.message : 'Unknown harness failure' })}\n`);
    process.exitCode = 2;
  });
}
