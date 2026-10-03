import { dirname, relative, resolve } from 'node:path';

const effectGlobals = new Set([
  'window', 'document', 'fetch', 'crypto', 'process', 'console', 'navigator',
  'localStorage', 'sessionStorage', 'performance', 'globalThis',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask',
]);

function globalReference(context, node) {
  let scope = context.sourceCode.getScope(node);
  while (scope) {
    const variable = scope.set.get(node.name);
    if (variable) return variable.defs.length === 0;
    scope = scope.upper;
  }
  return true;
}

const pureEffects = {
  meta: { type: 'problem', schema: [], messages: { effect: 'Pure logic cannot access {{name}}; inject the value or move the effect to an adapter.' } },
  create(context) {
    const report = (node, name) => context.report({ node, messageId: 'effect', data: { name } });
    return {
      Identifier(node) {
        if (!effectGlobals.has(node.name)) return;
        const parent = node.parent;
        if ((parent.type === 'MemberExpression' && parent.property === node && !parent.computed)
          || (['Property', 'MethodDefinition'].includes(parent.type) && parent.key === node && !parent.computed && !parent.shorthand)) return;
        if (globalReference(context, node)) report(node, node.name);
      },
      MemberExpression(node) {
        const name = node.computed && node.property.type === 'Literal' ? node.property.value : node.property.name;
        if (node.object.type === 'Identifier' && globalReference(context, node.object)
          && ((node.object.name === 'Date' && name === 'now') || (node.object.name === 'Math' && name === 'random'))) {
          report(node, `${node.object.name}.${name}`);
        }
      },
      NewExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'Date' && globalReference(context, node.callee)
          && (!node.arguments.length || node.arguments.some(arg => arg.type === 'SpreadElement'))) report(node, 'current time');
      },
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'Date' && globalReference(context, node.callee)) report(node, 'Date()');
      },
    };
  },
};

function layer(path) {
  if (path.startsWith('lib/domain/')) return 'domain';
  if (path.startsWith('lib/application/')) return 'application';
  if (path.startsWith('lib/ui/model/')) return 'ui-model';
  if (path === 'lib/ui/ports.ts') return 'ui-ports';
  if (['lib/ui/controller.ts', 'lib/ui/application.ts', 'lib/ui/application.js'].includes(path)) return 'ui-controller';
  return null;
}

function allowed(from, target) {
  const pure = target.startsWith('lib/domain/');
  if (from === 'domain') return pure;
  if (from === 'application') return pure || target.startsWith('lib/application/');
  if (from === 'ui-model') return pure || target.startsWith('lib/ui/model/');
  if (from === 'ui-ports') return pure || target.startsWith('lib/ui/model/') || target === 'lib/ui/ports.ts';
  if (from === 'ui-controller') return pure || target.startsWith('lib/ui/model/') || target === 'lib/ui/ports.ts';
  return true;
}

const dependencyDirection = {
  meta: { type: 'problem', schema: [], messages: { dependency: '{{from}} cannot depend on {{target}}; wire effects at the composition root.' } },
  create(context) {
    const cwd = context.cwd;
    const filename = context.filename;
    const from = layer(relative(cwd, filename).replaceAll('\\', '/'));
    if (!from) return {};
    function check(node, source) {
      if (typeof source !== 'string') return;
      const target = source.startsWith('@/') ? source.slice(2)
        : source.startsWith('.') ? relative(cwd, resolve(dirname(filename), source)).replaceAll('\\', '/')
          : source;
      const canonicalTarget = /\.(?:ts|mts|js|mjs)$/.test(target) ? target : target + '.ts';
      if (!allowed(from, canonicalTarget)) context.report({ node, messageId: 'dependency', data: { from, target: source } });
    }
    return {
      ImportDeclaration(node) { check(node, node.source.value); },
      ExportNamedDeclaration(node) { if (node.source) check(node, node.source.value); },
      ExportAllDeclaration(node) { check(node, node.source.value); },
      ImportExpression(node) { check(node, node.source.value); },
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'require') check(node, node.arguments[0]?.value);
      },
    };
  },
};

const boundaries = { rules: { 'pure-effects': pureEffects, 'dependency-direction': dependencyDirection } };

export default boundaries;
