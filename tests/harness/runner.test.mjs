import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { discoverTests, runTests, validateTestReport } from '../../scripts/testing/run-tests.mjs';
import { runChecks } from '../../scripts/check.mjs';

function fixture(t) {
  const root = mkdtempSync(resolve(tmpdir(), 'runner-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(resolve(root, 'tests/domain'), { recursive: true });
  mkdirSync(resolve(root, 'tests/ui'), { recursive: true });
  for (const name of ['domain/a.test.mjs', 'ui/b.test.ts', 'ui/helper.mjs']) writeFileSync(resolve(root, 'tests', name), '');
  return root;
}

test('runner discovers tests recursively and selects a whole suite without helpers', t => {
  const root = fixture(t);
  const readReport = () => [{file:resolve(root, 'tests/domain/a.test.mjs')},{}].map(report => JSON.stringify({...report,success:true,counts:{passed:1,failed:0,cancelled:0,skipped:0,todo:0}})).join('\n');
  assert.equal(discoverTests(resolve(root, 'tests')).length, 2);
  let observed;
  assert.equal(runTests(['domain'], { cwd: root, readReport, spawn(command, args) { observed = { command, args }; return { status: 0 }; } }), 0);
  assert.equal(observed.command, process.execPath);
  assert.deepEqual(observed.args.filter(arg => /\.test\./.test(arg)), [resolve(root, 'tests/domain/a.test.mjs')]);
  assert(observed.args.includes('--test-timeout=120000'));
});

test('runner rejects an empty or misspelled test selection', t => {
  const root = fixture(t);
  assert.throws(() => runTests(['domains'], { cwd: root, spawn() { assert.fail('must not start'); } }), /No tests matched/);
});

test('test failures and terminated child processes are failures', t => {
  const root = fixture(t);
  assert.equal(runTests([], { cwd: root, spawn: () => ({ status: 1 }) }), 1);
  assert.equal(runTests([], { cwd: root, spawn: () => ({ status: null, signal: 'SIGTERM' }) }), 1);
  assert.throws(() => runTests([], { cwd: root, spawn: () => ({ error: new Error('cannot start') }) }), /cannot start/);
});

test('check executes all gates and propagates every failed gate', () => {
  for (let failingGate = 0; failingGate < 3; failingGate++) {
    const calls = [];
    assert.equal(runChecks({ spawn(_command, args) { calls.push(args); return { status: calls.length - 1 === failingGate ? 1 : 0 }; }, log() {} }), 1);
    assert.equal(calls.length, 3);
    assert(calls[0].includes('--max-warnings=0'));
  }
  assert.equal(runChecks({ spawn: () => ({ status: 0 }), log() {} }), 0);
});

test('check handles launch failure and signal termination without hiding them', () => {
  assert.equal(runChecks({ spawn: () => ({ error: new Error('missing runtime') }), log() {} }), 1);
  assert.equal(runChecks({ spawn: () => ({ status: null, signal: 'SIGTERM' }), log() {} }), 1);
});

test('structured policy rejects empty files, missing reports, skips, TODOs and cancelled tests', () => {
  const file = '/fixture/a.test.mjs';
  const counts = {passed:1,failed:0,cancelled:0,skipped:0,todo:0};
  const valid = [{file,success:true,counts}, {success:true,counts}];
  assert.doesNotThrow(() => validateTestReport(valid, [file]));
  assert.throws(() => validateTestReport(valid.slice(1), [file]), /Tests must execute/);
  for (const field of ['failed','cancelled','skipped','todo']) {
    assert.throws(() => validateTestReport([{file,success:true,counts:{...counts,[field]:1}},valid[1]], [file]), /Tests must execute/);
  }
  assert.throws(() => validateTestReport([{file,success:true,counts:{...counts,passed:0}},valid[1]], [file]), /Tests must execute/);
});

test('real child processes cannot turn an empty or skipped test file green', t => {
  const root = fixture(t);
  symlinkSync(resolve('scripts'), resolve(root, 'scripts'), process.platform === 'win32' ? 'junction' : 'dir');
  const spawn = (command, args, options) => spawnSync(command, args, {...options, stdio:'pipe'});
  const path = resolve(root, 'tests/domain/a.test.mjs');
  assert.throws(() => runTests(['domain'], {cwd:root,spawn}), /Tests must execute/);
  writeFileSync(path, "import test from 'node:test'; test.skip('not executed', () => {});");
  assert.throws(() => runTests(['domain'], {cwd:root,spawn}), /Tests must execute/);
  writeFileSync(path, "import test from 'node:test'; import assert from 'node:assert/strict'; test('executed', () => assert.equal(1,1));");
  assert.equal(runTests(['domain'], {cwd:root,spawn}), 0);
});
