import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function runChecks({ cwd = fileURLToPath(new URL('../', import.meta.url)), spawn = spawnSync, log = console.log } = {}) {
  const checks = [
    ['lint', ['node_modules/eslint/bin/eslint.js', '.', '--max-warnings=0']],
    ['typecheck', ['node_modules/typescript/bin/tsc', '--noEmit']],
    ['test', ['scripts/testing/run-tests.mjs']],
  ];
  const results = checks.map(([name, args]) => {
    log(`\n[check] ${name}`);
    const result = spawn(process.execPath, args, { cwd, stdio: 'inherit' });
    const status = result.error || result.signal ? 1 : result.status ?? 1;
    if (result.error) log(result.error.message);
    return { name, status };
  });
  log('\n' + results.map(({ name, status }) => `${name}: ${status === 0 ? 'passed' : 'failed'}`).join('\n'));
  return results.some(item => item.status !== 0) ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runChecks();
}
