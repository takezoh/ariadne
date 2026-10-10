import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
function stateWrites(source){
 const filename='adapter.js',options={allowJs:true,noLib:true,noResolve:true},host=ts.createCompilerHost(options),file=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);host.getSourceFile=name=>name===filename?file:undefined;host.fileExists=name=>name===filename;host.readFile=name=>name===filename?source:undefined;
 const program=ts.createProgram([filename],options,host),checker=program.getTypeChecker(),aliases=new Map(),writes=[];
 const scan=node=>{if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer)aliases.set(checker.getSymbolAtLocation(node.name),node.initializer);node.forEachChild(scan);};scan(file);
 function derived(node,seen=new Set()){
  if(ts.isIdentifier(node)){if(node.text==='state')return true;const symbol=checker.getSymbolAtLocation(node);if(!symbol||seen.has(symbol))return false;return aliases.has(symbol)&&derived(aliases.get(symbol),new Set([...seen,symbol]));}
  if(ts.isPropertyAccessExpression(node)||ts.isElementAccessExpression(node))return derived(node.expression,seen);
  if(ts.isParenthesizedExpression(node))return derived(node.expression,seen);
  if(ts.isConditionalExpression(node))return derived(node.whenTrue,seen)||derived(node.whenFalse,seen);
  if(ts.isBinaryExpression(node)&&[ts.SyntaxKind.BarBarToken,ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind))return derived(node.left,seen)||derived(node.right,seen);
  return false;
 }
 const visit=node=>{
  if(ts.isBinaryExpression(node)&&node.operatorToken.kind>=ts.SyntaxKind.FirstAssignment&&node.operatorToken.kind<=ts.SyntaxKind.LastAssignment&&!ts.isIdentifier(node.left)&&derived(node.left))writes.push(node.getText(file));
  if(ts.isDeleteExpression(node)&&derived(node.expression))writes.push(node.getText(file));
  if((ts.isPrefixUnaryExpression(node)||ts.isPostfixUnaryExpression(node))&&[ts.SyntaxKind.PlusPlusToken,ts.SyntaxKind.MinusMinusToken].includes(node.operator)&&!ts.isIdentifier(node.operand)&&derived(node.operand))writes.push(node.getText(file));
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&['push','pop','shift','unshift','splice','sort','reverse','set','add','delete','clear'].includes(node.expression.name.text)&&derived(node.expression.expression))writes.push(node.getText(file));
  node.forEachChild(visit);
 };visit(file);return writes;
}
test('DOM adapter cannot write published interaction or draft state through direct references or aliases',()=>{
 const source=readFileSync(new URL('../../lib/ui/adapters/dom.js',import.meta.url),'utf8');assert.deepEqual(stateWrites(source),[]);
 for(const mutation of ['state.interaction.selection.ids.push("x")','const pairs=due?state.interaction.view.duePairs:state.interaction.view.deferPairs;pairs[id]=next','const value=state.drafts[id];delete value.notes'])assert(stateWrites(mutation).length,mutation);
 assert.deepEqual(stateWrites('const row=document.createElement("div");row.textContent="text";function patch(current){current[name]=next[name];}'),[]);
});
