import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';
import ts from 'typescript';

const root = fileURLToPath(new URL('../../', import.meta.url));

async function isFile(url) {
  try { return (await stat(fileURLToPath(url))).isFile(); }
  catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

export async function resolve(specifier, context, nextResolve) {
  const target = specifier.startsWith('@/')
    ? pathToFileURL(resolvePath(root, specifier.slice(2)))
    : specifier.startsWith('.') && context.parentURL?.startsWith('file:')
      ? new URL(specifier, context.parentURL)
      : null;
  if (target) {
    for (const suffix of ['', '.ts', '.mts', '.js', '.mjs', '/index.ts', '/index.js']) {
      const candidate = new URL(target.href + suffix);
      if (await isFile(candidate)) return nextResolve(candidate.href, context);
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!/\.(?:ts|mts)$/.test(url)) return nextLoad(url, context);
  const source = await readFile(new URL(url), 'utf8');
  const result = ts.transpileModule(source, {
    fileName: fileURLToPath(url),
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      sourceMap: false,
      inlineSourceMap: true,
      inlineSources: true,
    },
    reportDiagnostics: true,
  });
  const errors = result.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error) ?? [];
  if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCanonicalFileName: name => name,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
  }));
  return { format: 'module', source: result.outputText, shortCircuit: true };
}
