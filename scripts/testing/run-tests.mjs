import { readdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

export function discoverTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? discoverTests(path)
      : entry.isFile() && /\.test\.(?:mjs|ts|mts)$/.test(entry.name) ? [path] : [];
  }).sort();
}

export function runTests(selectors = [], { cwd = fileURLToPath(new URL('../../', import.meta.url)), coverage = false, spawn = spawnSync, readReport = readFileSync } = {}) {
  const testsRoot = resolve(cwd, 'tests');
  const files = discoverTests(testsRoot).filter(path => !selectors.length || selectors.some(selector => {
    const pathFromTests = relative(testsRoot, path).replaceAll('\\', '/');
    return pathFromTests === selector || pathFromTests.startsWith(`${selector}/`);
  }));
  if (!files.length) throw new Error(`No tests matched: ${selectors.join(', ') || 'tests/'}`);
  const reportDirectory = mkdtempSync(resolve(tmpdir(), 'test-report-'));
  const reportPath = resolve(reportDirectory, 'summary.jsonl');
  const environment = { ...process.env };
  delete environment.NODE_TEST_CONTEXT;
  try {
    const result = spawn(process.execPath, [
      '--import', pathToFileURL(resolve(cwd, 'scripts/testing/register-loader.mjs')).href,
      '--test', '--test-reporter=spec', '--test-reporter-destination=stdout',
      `--test-reporter=${pathToFileURL(resolve(cwd, 'scripts/testing/summary-reporter.mjs')).href}`,
      `--test-reporter-destination=${reportPath}`, '--test-timeout=120000',
      ...(coverage ? ['--experimental-test-coverage'] : []),
      ...files,
    ], { cwd, env: environment, stdio: 'inherit', timeout: 300000 });
    if (result.error) throw result.error;
    if (result.status !== 0 || result.signal) return result.status || 1;
    const summaries = readReport(reportPath, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    validateTestReport(summaries, files);
    return 0;
  } finally {
    rmSync(reportDirectory, { recursive: true, force: true });
  }
}

export function validateTestReport(summaries, files) {
  const complete = summaries.filter(summary => !summary.file).at(-1);
  const reports = [complete, ...files.map(file => summaries.find(summary => summary.file === file))];
  if (reports.some(report => !report || !report.success || !report.counts || !Number.isSafeInteger(report.counts.passed)
    || report.counts.passed < 1 || report.counts.failed !== 0 || report.counts.cancelled !== 0
    || report.counts.skipped !== 0 || report.counts.todo !== 0)) {
    throw new Error('Tests must execute in every selected file with no failures, cancellations, skips or TODOs.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  process.exitCode = runTests(args.filter(arg => arg !== '--coverage'), { coverage: args.includes('--coverage') });
}
