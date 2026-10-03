import test from 'node:test';
import assert from 'node:assert/strict';
import { Linter } from 'eslint';
import { resolve } from 'node:path';
import boundaries from '../../scripts/lint/boundaries.mjs';

function lint(code, filename = 'lib/domain/sample.js') {
  return new Linter().verify(code, [{
    files: ['**/*.{js,ts}'],
    plugins: { architecture: boundaries },
    rules: { 'architecture/pure-effects': 'error', 'architecture/dependency-direction': 'error' },
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  }], { filename: resolve(filename) });
}

test('pure logic rejects effects including aliased clock and randomness', () => {
  for (const code of ['fetch("/");', 'window.parent.postMessage({});', 'const uuid = crypto.randomUUID;', 'Date.now();', 'Math["random"]();', 'new Date();', 'const now = Date.now;', 'Date("2026-01-01");', 'process.env.KEY;', 'console.log("x");', 'globalThis.fetch("/");']) {
    assert(lint(code).some(item => item.ruleId === 'architecture/pure-effects'), code);
  }
});

test('explicit time and deterministic operations are allowed', () => {
  assert.deepEqual(lint('export function project(now) { return new Date(now).toISOString(); }'), []);
  assert.deepEqual(lint('export const clone = value => structuredClone(value);'), []);
  assert.deepEqual(lint('export const f = value => value.document;'), []);
  assert.deepEqual(lint('export function f(fetch) { return fetch; }'), []);
});

test('dependency directions reject SQL and environment coupling', () => {
  for (const code of ['import x from "../adapters/d1-action-store";', 'export * from "@/lib/server/actions";', 'import "node:fs";', 'const db = import("cloudflare:workers");', 'export { x } from "../application/ports";']) {
    assert(lint(code).some(item => item.ruleId === 'architecture/dependency-direction'), code);
  }
  assert.deepEqual(lint('export * from "./core";'), []);
});

test('application/controller use ports and reject concrete adapters', () => {
  assert(lint('import x from "../adapters/d1-action-store";', 'lib/application/sample.js').some(item => item.ruleId === 'architecture/dependency-direction'));
  assert.deepEqual(lint('import x from "./ports"; export {x};', 'lib/application/sample.js'), []);
  assert(lint('import x from "./adapters/dom";', 'lib/ui/controller.ts').some(item => item.ruleId === 'architecture/dependency-direction'));
});

test('UI application state owner is protected by the same dependency boundary', () => {
  for (const filename of ['lib/ui/application.ts', 'lib/ui/application.js']) {
    assert(lint('import x from "./adapters/dom";', filename).some(item => item.ruleId === 'architecture/dependency-direction'));
    assert(lint('document.querySelector("button");', filename).some(item => item.ruleId === 'architecture/pure-effects'));
  }
});
