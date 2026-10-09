import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import boundaries from './scripts/lint/boundaries.mjs';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // next's preset treats build/ as output; this project keeps Worker source there.
  globalIgnores([
    '.next/**', '.vinext/**', 'out/**', 'dist/**', '.wrangler/**',
    '.sites-runtime/**', 'coverage/**', 'next-env.d.ts',
    '!build/', '!build/**',
    // Negative fixtures intentionally violate architecture rules and are linted by the harness.
    'tests/fixtures/**',
  ]),
  {
    files: ['lib/**/*.{ts,mts,js,mjs}', 'app/**/*.{ts,tsx}', 'build/**/*.{ts,mjs}'],
    plugins: { architecture: boundaries },
    rules: { 'architecture/dependency-direction': 'error', 'architecture/raw-sql-location': 'error', 'architecture/capability-direction':'error', 'architecture/private-auth':'error','architecture/owner-sql':'error' },
  },
  {
    // Public/local MCP surfaces must not reach the private composition, adapters or D1.
    files: ['app/mcp/**/*.{ts,mts,js,mjs}', 'lib/mcp/**/*.{ts,mts,js,mjs}', 'build/local-mcp-vite.config.mjs'],
    plugins: { architecture: boundaries },
    rules: { 'architecture/private-composition': 'error' },
  },
  {
    files: ['lib/domain/**/*.{ts,js}', 'lib/ui/model/**/*.{ts,js}', 'lib/application/**/*.{ts,js}', 'lib/ui/controller.ts', 'lib/ui/application.{ts,js}', 'lib/ui/ports.ts'],
    rules: { 'architecture/pure-effects': 'error' },
  },
  {
    files: ['lib/domain/**/*.{ts,js}', 'lib/ui/model/**/*.{ts,js}'],
    rules: { 'no-param-reassign': ['error', { props: true }] },
  },
]);
