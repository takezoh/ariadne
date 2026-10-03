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
  ]),
  {
    files: ['lib/**/*.{ts,mts,js,mjs}'],
    plugins: { architecture: boundaries },
    rules: { 'architecture/dependency-direction': 'error' },
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
