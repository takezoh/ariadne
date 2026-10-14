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
    files: ['lib/**/*.{ts,tsx,mts,js,jsx,mjs}', 'app/**/*.{ts,tsx}', 'build/**/*.{ts,mjs}'],
    plugins: { architecture: boundaries },
    rules: { 'architecture/dependency-direction': 'error', 'architecture/data-type-only': 'error', 'architecture/raw-sql-location': 'error', 'architecture/capability-direction':'error', 'architecture/private-auth':'error','architecture/owner-sql':'error' },
  },
  {
    files: ['lib/ui/effects/dom.js'],
    plugins: { architecture: boundaries },
    rules: { 'architecture/readonly-ui-state': 'error' },
  },
  {
    // Public/local MCP surfaces must not reach the private composition, adapters or D1.
    files: ['app/mcp/**/*.{ts,mts,js,mjs}', 'lib/mcp/**/*.{ts,mts,js,mjs}', 'build/local-mcp-vite.config.mjs'],
    plugins: { architecture: boundaries },
    rules: { 'architecture/private-composition': 'error' },
  },
  {
    files: ['lib/data/**/*.{ts,tsx,mts,js,jsx,mjs}', 'lib/domain/**/*.{ts,tsx,mts,js,jsx,mjs}', 'lib/ui/model/**/*.{ts,tsx,mts,js,jsx,mjs}', 'lib/application/**/*.{ts,tsx,mts,js,jsx,mjs}', 'lib/ui/effects/tool-client.{ts,tsx,mts,js,jsx,mjs}', 'lib/ui/application/**/*.{ts,tsx,mts,js,jsx,mjs}', 'lib/ui/components/**/*.{ts,tsx,mts,js,jsx,mjs}', 'lib/ui/ports.{ts,tsx,mts,js,jsx,mjs}'],
    rules: { 'architecture/pure-effects': 'error' },
  },
  {
    files: ['lib/ui/model/**/*.{ts,tsx,mts,js,jsx,mjs}'],
    rules: { 'architecture/ui-model-capability': 'error' },
  },
  {
    files: ['lib/data/**/*.{ts,tsx,mts,js,jsx,mjs}', 'lib/domain/**/*.{ts,tsx,mts,js,jsx,mjs}', 'lib/ui/model/**/*.{ts,tsx,mts,js,jsx,mjs}'],
    rules: { 'no-param-reassign': ['error', { props: true }] },
  },
]);
