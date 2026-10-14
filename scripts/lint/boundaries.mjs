import { dirname, relative, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const effectGlobals = new Set([
  'window', 'document', 'fetch', 'crypto', 'process', 'console', 'navigator',
  'localStorage', 'sessionStorage', 'performance', 'globalThis',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask',
  'location', 'history', 'screen', 'alert', 'confirm', 'prompt', 'open',
  'WebSocket', 'Worker', 'SharedWorker', 'BroadcastChannel', 'MessageChannel', 'MutationObserver',
  'ResizeObserver', 'IntersectionObserver', 'XMLHttpRequest', 'Notification', 'Audio', 'Image',
  'indexedDB', 'caches', 'AbortController',
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
          || (['Property', 'MethodDefinition', 'PropertySignature', 'TSPropertySignature', 'TSMethodSignature', 'PropertyDefinition'].includes(parent.type) && (parent.key === node || parent.name === node) && !parent.computed && !parent.shorthand)) return;
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
  if (path.startsWith('lib/ui/application/')) return 'ui-application';
  if (path.startsWith('lib/ui/components/')) return 'ui-components';
  if (/^lib\/ui\/effects\/tool-client\.(?:ts|tsx|mts|js|jsx|mjs)$/.test(path)) return 'ui-tool-client';
  if (path.startsWith('lib/ui/effects/')) return 'ui-effects';
  if (path === 'lib/ui/client.ts') return 'ui-composition';
  if (path.startsWith('lib/ui/')) return 'ui-unclassified';
  return null;
}

function allowed(from, target) {
  const pure = target.startsWith('lib/domain/');
  if (from === 'domain') return pure;
  if (from === 'application') return pure || target.startsWith('lib/application/');
  if (from === 'ui-model') return pure || target.startsWith('lib/ui/model/');
  if (from === 'ui-ports') return pure || target.startsWith('lib/ui/model/') || target === 'lib/ui/ports.ts';
  if (from === 'ui-application') return pure || target.startsWith('lib/ui/model/') || target === 'lib/ui/ports.ts' || target.startsWith('lib/ui/application/');
  if (from === 'ui-components') return pure || target.startsWith('lib/ui/model/') || target.startsWith('lib/ui/components/');
  if (from === 'ui-tool-client') return pure || target.startsWith('lib/ui/model/') || target === 'lib/ui/ports.ts' || /^lib\/ui\/effects\/tool-client\.(?:ts|tsx|mts|js|jsx|mjs)$/.test(target);
  if (from === 'ui-effects') return pure || target.startsWith('lib/ui/model/') || target === 'lib/ui/ports.ts' || target.startsWith('lib/ui/application/') || target.startsWith('lib/ui/components/') || target.startsWith('lib/ui/effects/');
  if (from === 'ui-composition') return pure || target.startsWith('lib/ui/');
  if (from === 'ui-unclassified') return false;
  return true;
}

const dependencyDirection = {
  meta: { type: 'problem', schema: [], messages: { dependency: '{{from}} cannot depend on {{target}}; wire effects at the composition root.' } },
  create(context) {
    const cwd = context.cwd;
    const filename = context.filename;
    const from = layer(relative(cwd, filename).replaceAll('\\', '/'));
    if (!from) return {};
    if(from==='ui-unclassified')return {Program(node){context.report({node,messageId:'dependency',data:{from,target:'unclassified UI source path'}});}};
    function check(node, source) {
      if (typeof source !== 'string') { context.report({node,messageId:'dependency',data:{from,target:'non-static module specifier'}});return; }
      const target = canonicalModuleTarget(cwd,filename,source);
      const canonicalTarget = target;
      if (!allowed(from, canonicalTarget)) context.report({ node, messageId: 'dependency', data: { from, target: source } });
    }
    return {
      ImportDeclaration(node) { check(node, node.source.value); },
      TSImportType(node) { check(node, node.argument?.type==='TSLiteralType'?node.argument.literal.value:node.argument?.value); },
      TSImportEqualsDeclaration(node) { if(node.moduleReference.type==='TSExternalModuleReference')check(node,node.moduleReference.expression.value); },
      ExportNamedDeclaration(node) { if (node.source) check(node, node.source.value); },
      ExportAllDeclaration(node) { check(node, node.source.value); },
      ImportExpression(node) { check(node, node.source.type==='Literal'?node.source.value:null); },
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'require') check(node, node.arguments[0]?.type==='Literal'?node.arguments[0].value:null);
      },
    };
  },
};

const uiModelCapabilities = new Set([
  'Document', 'Window', 'Node', 'Element', 'HTMLElement', 'HTMLInputElement',
  'HTMLTextAreaElement', 'HTMLButtonElement', 'HTMLFormElement', 'HTMLSelectElement',
  'HTMLCollection', 'HTMLCollectionOf', 'NodeList', 'NodeListOf', 'DocumentFragment',
  'SVGElement', 'SVGSVGElement', 'CSSStyleDeclaration', 'Event', 'MessageEvent', 'CustomEvent',
  'MouseEvent', 'KeyboardEvent', 'PointerEvent', 'DragEvent', 'FocusEvent', 'InputEvent',
  'CompositionEvent', 'AbortController', 'AbortSignal', 'MutationObserver', 'ResizeObserver',
  'IntersectionObserver', 'XMLHttpRequest', 'WebSocket', 'Worker', 'SharedWorker',
  'MessagePort', 'MessageChannel', 'BroadcastChannel', 'HostPort', 'HostEffects',
  'HostCommunicationPort', 'IdPort', 'UiViewPort', 'UiApplicationPorts', 'ToolClientPort',
  'TransportPort', 'ClockPort', 'TimerPort', 'StoragePort', 'FetchPort', 'Request', 'Response',
  'Headers', 'FormData', 'File', 'Blob', 'ReadableStream', 'WritableStream',
]);
const uiModelCapability = {
  meta: { type: 'problem', schema: [], messages: { capability: 'Pure UI model cannot expose or consume host/DOM capability {{name}}; use data-only values and keep effects behind adapters.' } },
  create(context) {
    if (!relative(context.cwd, context.filename).replaceAll('\\', '/').startsWith('lib/ui/model/')) return {};
    return { Identifier(node) { if (uiModelCapabilities.has(node.name)) context.report({ node, messageId: 'capability', data: { name: node.name } }); } };
  },
};

function resolvedTarget(cwd, filename, source) {
  if (typeof source !== 'string') return null;
  return source.startsWith('@/') ? source.slice(2)
    : source.startsWith('.') ? relative(cwd, resolve(dirname(filename), source)).replaceAll('\\', '/')
      : source;
}

function canonicalModuleTarget(cwd,filename,source){
  const raw=source.startsWith('@/')?source.slice(2):source.startsWith('.')?relative(cwd,resolve(dirname(filename),source)).replaceAll('\\','/'):source;
  if(!raw.startsWith('lib/')&&!raw.startsWith('app/')&&!raw.startsWith('build/'))return raw;
  const absolute=resolve(cwd,raw),extension=/\.(?:ts|tsx|mts|js|jsx|mjs)$/.exec(raw)?.[0];
  const candidates=extension?[absolute,...(extension==='.js'||extension==='.mjs'?[absolute.slice(0,-extension.length)+'.ts']:[])]:['.ts','.tsx','.mts','.js','.jsx','.mjs'].map(ext=>absolute+ext).concat(['index.ts','index.tsx','index.js'].map(name=>resolve(absolute,name)));
  const found=candidates.find(existsSync);
  return relative(cwd,found||(`${absolute}${extension?'':'.ts'}`)).replaceAll('\\','/');
}

/** Private resources that public/local surfaces must never reach. */
const privateTargets = [
  /^lib\/server\//, /^lib\/adapters\//, /^lib\/application\//,
  /^lib\/actions\.ts$/, /^lib\/database\.ts$/, /^lib\/mcp\/private-registry\.ts$/,
  /^app\/mcp\/route\.ts$/, /^cloudflare:workers$/, /^drizzle-orm/,
];
const publicSurfaces = path => path.startsWith('app/mcp/public/') || ['lib/mcp/public-registry.ts','lib/mcp/local-server.mjs','build/local-mcp-vite.config.mjs'].includes(path);

const privateComposition = {
  meta: { type: 'problem', schema: [], messages: { private: 'Public/local surface {{from}} cannot reach the private module {{target}}; use the authorized composition.' } },
  create(context) {
    const cwd = context.cwd, filename = context.filename;
    const from = relative(cwd, filename).replaceAll('\\', '/');
    if (!publicSurfaces(from)) return {};
    function check(node, source) {
      const target = resolvedTarget(cwd, filename, source);
      if (target && (privateTargets.some(pattern => pattern.test(target)) || !['lib/mcp/public-registry.ts','node:readline','node:path','vite'].includes(target))) context.report({ node, messageId: 'private', data: { from, target: source } });
    }
    return {
      ImportDeclaration(node) { check(node, node.source.value); },
      ExportNamedDeclaration(node) { if (node.source) check(node, node.source.value); },
      ExportAllDeclaration(node) { check(node, node.source.value); },
      ImportExpression(node) { check(node, node.source.value); },
      CallExpression(node) { if (node.callee.type === 'Identifier' && node.callee.name === 'require') check(node, node.arguments[0]?.value); },
      MemberExpression(node) {if(node.object.type==='Identifier'&&node.object.name==='process'&&['env','getBuiltinModule'].includes(node.property.name??node.property.value))context.report({node,messageId:'private',data:{from,target:'inherited environment / capabilities'}});},
    };
  },
};

/** Exact reviewed location for native SQL; every other module must use named domain operations. */
const sqlAllowlist = new Set(['lib/adapters/d1-action-store.ts']);

const rawSqlLocation = {
  meta: { type: 'problem', schema: [], messages: { sql: 'Raw SQL ({{what}}) is confined to the approved adapter; use a closed descriptor or a reviewed named operation.' } },
  create(context) {
    const cwd = context.cwd, filename = context.filename;
    const from = relative(cwd, filename).replaceAll('\\', '/');
    if(!/^(lib|app|build)\//.test(from))return {};
    const nativeAllowed=sqlAllowlist.has(from);
    const report = (node, what) => context.report({ node, messageId: 'sql', data: { what } });
    return {
      ImportDeclaration(node) { if (typeof node.source.value === 'string' && /^drizzle-orm/.test(node.source.value)) report(node, node.source.value); },
      MemberExpression(node) {
        const name = node.computed && node.property.type === 'Literal' ? node.property.value : node.property.name;
        if (name === 'prepare' && !nativeAllowed) report(node, name);
        if (name === 'raw' && !(node.object.type === 'Identifier' && node.object.name === 'String')) report(node, 'sql.raw');
        if (name === 'exec' && !nativeAllowed) report(node, name);
      },
    };
  },
};

// Privileged dependencies are permitted per edge, never by exempting an entire importer.
const capabilityEdges = new Map([
 ['app/mcp/route.ts',new Set(['lib/server/mcp'])],
 ['app/api/actions/route.ts',new Set(['lib/server/actions'])],
 ['lib/server/mcp.ts',new Set(['lib/server/auth','lib/mcp/private-dispatcher'])],
 ['lib/mcp/private-dispatcher.ts',new Set(['lib/server/actions','lib/server/auth','lib/mcp/private-registry'])],
 ['lib/server/actions.ts',new Set(['lib/adapters/worker-database','lib/adapters/d1-action-store','lib/server/auth'])],
 ['lib/adapters/d1-action-store.ts',new Set(['lib/server/auth'])],
 ['lib/database.ts',new Set(['lib/adapters/worker-database'])],
 ['lib/adapters/worker-database.ts',new Set(['cloudflare:workers'])],
 ['build/connector-preview-worker.mjs',new Set(['cloudflare:workers'])],
]);
const capabilityDirection = {
 meta:{type:'problem',schema:[],messages:{capability:'Private capability {{target}} is restricted to its exact trusted composition edge.'}},
 create(context){
  const file=relative(context.cwd,context.filename).replaceAll('\\','/');
  function check(node,source){
   const target=resolvedTarget(context.cwd,context.filename,source)?.replace(/\.(ts|js|mjs|mts)$/,'');
   if(target&&/^(lib\/adapters\/|lib\/server\/|lib\/database$|lib\/mcp\/private-(registry|dispatcher)$|cloudflare:workers$)/.test(target)&&!capabilityEdges.get(file)?.has(target))context.report({node,messageId:'capability',data:{target:source}});
  }
  return {ImportDeclaration(n){check(n,n.source.value);},ExportNamedDeclaration(n){if(n.source)check(n,n.source.value);},ExportAllDeclaration(n){check(n,n.source.value);},ImportExpression(n){check(n,n.source.value);},CallExpression(n){if(n.callee.type==='Identifier'&&n.callee.name==='require')check(n,n.arguments[0]?.value);}};
 }
};
function namedCall(node,name){return node?.type==='CallExpression'&&node.callee.type==='Identifier'&&node.callee.name===name;}
function identifier(node,name){return node?.type==='Identifier'&&node.name===name;}
function exportedFunction(program,name){return program.body.find(n=>n.type==='ExportNamedDeclaration'&&n.declaration?.type==='FunctionDeclaration'&&n.declaration.id?.name===name)?.declaration;}
function isOwnerGuard(node){
 const declaration=node?.type==='VariableDeclaration'&&node.kind==='const'&&node.declarations.length===1?node.declarations[0]:null;
 const call=declaration?.init,headers=call?.arguments?.[0];
 return identifier(declaration?.id,'owner')&&namedCall(call,'requireOwner')&&call.arguments.length===1&&headers?.type==='MemberExpression'&&!headers.computed&&identifier(headers.object,'req')&&identifier(headers.property,'headers');
}
const privateAuth = {
 meta:{type:'problem',schema:[],messages:{auth:'Private HTTP entry must only export the authenticated facade. The facade must obtain request identity before its sole private dispatch, and the dispatcher must validate that identity before any private method.'}},
 create(context){
  const file=relative(context.cwd,context.filename).replaceAll('\\','/');
  if(!['app/mcp/route.ts','lib/server/mcp.ts','lib/mcp/private-dispatcher.ts'].includes(file))return {};
  let dispatchCall=null,guardCall=null,validationCall=null;
  const report=node=>context.report({node,messageId:'auth'});
  return {
   Program(program){
    if(file==='app/mcp/route.ts'){
     // A declarative entry cannot add a pre-auth branch, alternate handler or private import.
     const valid=program.body.length===2&&program.body.every(node=>{
      if(node.type!=='ExportNamedDeclaration')return false;
      if(node.source)return resolvedTarget(context.cwd,context.filename,node.source.value)?.replace(/\.ts$/,'')==='lib/server/mcp'&&node.specifiers.length===2&&node.specifiers.every(s=>s.type==='ExportSpecifier'&&['POST','GET'].includes(s.local.name)&&s.exported.name===s.local.name)&&new Set(node.specifiers.map(s=>s.local.name)).size===2;
      const d=node.declaration;return d?.type==='VariableDeclaration'&&d.kind==='const'&&d.declarations.length===1&&identifier(d.declarations[0].id,'dynamic')&&d.declarations[0].init?.value==='force-dynamic';
     });
     if(!valid)report(program);return;
    }
    if(file==='lib/server/mcp.ts'){
     const post=exportedFunction(program,'POST'),body=post?.body?.body,attempt=body?.[0];
     const guard=attempt?.block?.body[0],ret=attempt?.block?.body[1];
     dispatchCall=ret?.type==='ReturnStatement'&&ret.argument?.type==='AwaitExpression'?ret.argument.argument:null;
     const parsed=dispatchCall?.arguments[1],reader=parsed?.type==='AwaitExpression'?parsed.argument:null;
     guardCall=guard?.declarations?.[0]?.init;
     if(!post?.async||post.params.length!==1||!identifier(post.params[0],'req')||body.length!==1||attempt.type!=='TryStatement'||attempt.block.body.length!==2||!isOwnerGuard(guard)||!namedCall(dispatchCall,'dispatchPrivateMcp')||dispatchCall.arguments.length!==2||!identifier(dispatchCall.arguments[0],'owner')||!namedCall(reader,'readGuardedJson')||reader.arguments.length!==1||!identifier(reader.arguments[0],'req'))report(program);
    }else{
     const dispatch=exportedFunction(program,'dispatchPrivateMcp'),first=dispatch?.body.body[0];
     validationCall=first?.type==='ExpressionStatement'?first.expression:null;
     if(!dispatch?.async||!identifier(dispatch.params[0],'owner')||!namedCall(validationCall,'verifiedOwner')||validationCall.arguments.length!==1||!identifier(validationCall.arguments[0],'owner'))report(program);
    }
   },
   Identifier(node){
    // No aliases, module-time capabilities, catch-path dispatch, or guard lookalikes.
    const protectedNames=file==='lib/server/mcp.ts'?['requireOwner','dispatchPrivateMcp']:file==='lib/mcp/private-dispatcher.ts'?['verifiedOwner','actionCall']:[];
    if(!protectedNames.includes(node.name))return;
    if(node.parent.type==='ImportSpecifier')return;
    if(node.name==='actionCall'){if(!namedCall(node.parent,'actionCall')||node.parent.callee!==node||!identifier(node.parent.arguments[0],'owner'))report(node);return;}
    const expected=node.name==='requireOwner'?guardCall:node.name==='dispatchPrivateMcp'?dispatchCall:validationCall;
    if(node.parent!==expected||expected?.callee!==node)report(node);
   }
  };
 }
};
const ownerSql = {
 meta:{type:'problem',schema:[],messages:{owner:'Native SQL must bind owner and scope SELECT/DELETE or INSERT/conflict keys to owner.'}},
 create(context){
  if(relative(context.cwd,context.filename).replaceAll('\\','/')!=='lib/adapters/d1-action-store.ts')return {};
  return {CallExpression(node){
   if(node.callee.type!=='MemberExpression'||node.callee.property.name!=='prepare')return;
   const arg=node.arguments[0],text=context.sourceCode.getText(arg);
   const bind=node.parent?.parent;
   const bound=bind?.type==='CallExpression'&&bind.arguments.some(a=>a.type==='Identifier'&&a.name==='owner');
   const read=/^['"`]SELECT /.test(text),remove=/^['"`]DELETE /.test(text),insert=/^['"`]INSERT /.test(text);
   const scope=(read||remove)?/WHERE owner=\?/.test(text):insert&&/\(owner,/.test(text)&&(!/ON CONFLICT/.test(text)||/ON CONFLICT\(owner,/.test(text));
   if(!bound||!scope)context.report({node,messageId:'owner'});
  }};
 }
};
const readonlyUiState = {
 meta:{type:'problem',schema:[],messages:{mutation:'The DOM adapter may read public UI state but must route state changes through typed controller events.'}},
 create(context){
  if(relative(context.cwd,context.filename).replaceAll('\\','/')!=='lib/ui/effects/dom.js')return {};
  const mutators=new Set(['push','pop','shift','unshift','splice','sort','reverse','copyWithin','fill','set','add','delete','clear']);
  const root=node=>node?.type==='MemberExpression'||node?.type==='OptionalMemberExpression'?root(node.object):node?.type==='Identifier'?node.name:null;
  const readonlyTarget=node=>root(node)==='state';
  return {
   VariableDeclarator(node){if(node.id.type==='Identifier'&&node.id.name==='state'&&!(node.init?.type==='MemberExpression'&&node.init.property.name==='state'))context.report({node,messageId:'mutation'});},
   AssignmentExpression(node){if(readonlyTarget(node.left))context.report({node,messageId:'mutation'});},
   UpdateExpression(node){if(readonlyTarget(node.argument))context.report({node,messageId:'mutation'});},
   UnaryExpression(node){if(node.operator==='delete'&&readonlyTarget(node.argument))context.report({node,messageId:'mutation'});},
   CallExpression(node){
    const callee=node.callee;
    if(callee.type==='MemberExpression'&&mutators.has(callee.property.name||callee.property.value)&&readonlyTarget(callee.object))context.report({node,messageId:'mutation'});
    if(callee.type==='MemberExpression'&&((callee.object.name==='Object'&&callee.property.name==='assign')||(callee.object.name==='Reflect'&&callee.property.name==='set'))&&readonlyTarget(node.arguments[0]))context.report({node,messageId:'mutation'});
   },
  };
 }
};
const boundaries = { rules: { 'pure-effects': pureEffects, 'ui-model-capability':uiModelCapability, 'dependency-direction': dependencyDirection, 'private-composition': privateComposition, 'raw-sql-location': rawSqlLocation, 'capability-direction':capabilityDirection, 'private-auth':privateAuth, 'owner-sql':ownerSql,'readonly-ui-state':readonlyUiState } };

export default boundaries;
