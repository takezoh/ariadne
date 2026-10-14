import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync,readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const endpoint=new URL('/mcp',process.argv[2]||'http://127.0.0.1:8787');
const browserModule=process.env.ACTION_TOOLS_PLAYWRIGHT_CORE;
const executablePath=process.env.ACTION_TOOLS_CHROME_PATH;
const outputPath=process.env.ACTION_TOOLS_EVIDENCE_PATH;
const timeoutMs=120000;
if(!browserModule||!executablePath||!outputPath)throw new Error('Set ACTION_TOOLS_PLAYWRIGHT_CORE, ACTION_TOOLS_CHROME_PATH, and an authorized ACTION_TOOLS_EVIDENCE_PATH.');
const {chromium}=await import(pathToFileURL(resolve(browserModule)).href);
const root=process.cwd();
const sourceFiles=['lib/ui/effects/dom.js','lib/ui/model/display.ts','lib/widget.ts','tests/ui/display.test.mjs','tests/ui/dom.test.mjs','scripts/testing/verify-safe-area-browser.mjs','docs/technical/ui-architecture.md','docs/technical/testing.md','ARCHITECTURE.md'];
const digest=value=>createHash('sha256').update(value).digest('hex');
function directoryFiles(path){if(!existsSync(path))return [];const result=[];for(const entry of readdirSync(path,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const full=join(path,entry.name);if(entry.isDirectory())result.push(...directoryFiles(full));else if(entry.isFile())result.push(full);}return result;}
function identity(){
 const sources=sourceFiles.map(path=>({path,sha256:digest(readFileSync(join(root,path)))}));
 const artifacts=['dist/server','dist/local'].flatMap(directory=>directoryFiles(join(root,directory))).map(path=>({path:relative(root,path),sha256:digest(readFileSync(path))}));
 return {sourceSha256:digest(JSON.stringify(sources)),sourceFiles:sources,artifactSha256:digest(JSON.stringify(artifacts)),artifactFiles:artifacts};
}
const evidence={environment:'Local built Sites Worker resource in headless Chromium with a synthetic in-memory host bridge; no hosted D1 or ChatGPT Work calls.',endpoint:endpoint.origin,resourceUri:'ui://action-tools/actions-v4.html',viewport:{width:1280,height:640},scenario:'safe area on four edges, zero reset, short and long content, sticky header after scroll, malformed and dynamic context',result:'running',checks:{},hostedMobileAcceptance:'not_run'};
mkdirSync(dirname(resolve(outputPath)),{recursive:true});
const flush=()=>writeFileSync(resolve(outputPath),JSON.stringify(evidence,null,2)+'\n');
let server=null,serverOutput='',serverExit=null,browser=null,currentStage='setup';
const startedAt=Date.now(),watchdog=setTimeout(()=>{evidence.result='partial';evidence.failure={stage:currentStage,message:`Bounded run exceeded ${timeoutMs}ms.`};flush();if(server?.pid)try{process.kill(-server.pid,'SIGINT');}catch{}if(browser)void browser.close();},timeoutMs);watchdog.unref?.();
const sourceBefore=identity();evidence.identityBefore=sourceBefore;flush();

async function fetchResource(){
 const response=await fetch(endpoint,{signal:AbortSignal.timeout(5000),method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'safe-area-fixture','oai-authenticated-user-email':'safe-area@local.invalid'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'resources/read',params:{uri:evidence.resourceUri}})});
 assert.equal(response.status,200,'built Worker resource read must return HTTP 200');
 const envelope=await response.json();assert(!envelope.error,'built Worker must not return a resource read error');
 const html=envelope.result?.contents?.[0]?.text;assert.equal(typeof html,'string','built Worker must return the requested HTML resource');
 return {html,sha256:digest(html)};
}
async function waitForReady(){
 const deadline=Date.now()+45000;let lastError='Worker did not become ready.';
 while(Date.now()<deadline){if(serverExit){throw new Error(`Worker exited before resource readiness (${serverExit.code??serverExit.signal}).`);}try{return await fetchResource();}catch(error){lastError=error.message;await new Promise(resolve=>setTimeout(resolve,250));}}
 throw new Error(`Timed out waiting for built Worker resource: ${lastError}`);
}
async function assertInsetLayout(frame,expected){
 const measured=await frame.locator('header').evaluate((header,topInset)=>{const root=document.documentElement,mainNode=document.querySelector('main'),style=getComputedStyle(mainNode),rect=header.getBoundingClientRect(),main=mainNode.getBoundingClientRect(),workspace=document.querySelector('.workspace').getBoundingClientRect(),backdrop=getComputedStyle(header,'::before'),hit=topInset?document.elementFromPoint(Math.min(innerWidth-1,8+100),Math.max(0,Math.floor(topInset/2))):null;return {insets:Object.fromEntries(['top','right','bottom','left'].map(side=>[side,root.style.getPropertyValue('--host-safe-area-'+side)])),padding:Object.fromEntries(['top','right','bottom','left'].map(side=>[side,style['padding'+side[0].toUpperCase()+side.slice(1)]])),measuredHeaderHeight:root.style.getPropertyValue('--widget-header-height'),backdrop:{content:backdrop.content,position:backdrop.position,top:backdrop.top,height:backdrop.height,pointerEvents:backdrop.pointerEvents,hitTag:hit?.tagName||null,hitControl:Boolean(hit?.closest('button,input,textarea,select,a,[role="button"]'))},top:rect.top,left:rect.left,right:rect.right,width:innerWidth,headerHeight:rect.height,mainBottom:main.bottom,workspaceBottom:workspace.bottom,scrollY,scrollHeight:document.scrollingElement.scrollHeight,clientHeight:document.scrollingElement.clientHeight,position:getComputedStyle(header).position};},expected.top);
 for(const side of ['top','right','bottom','left'])assert.equal(measured.insets[side],`${expected[side]}px`,`${side} inset must be applied`);
 for(const side of ['top','right','bottom','left'])assert.equal(measured.padding[side],`${expected[side]}px`,`${side} inset must be included in viewport layout padding`);
 assert.equal(measured.position,'sticky','header must remain sticky');
 assert.equal(measured.backdrop.position,'fixed','host safe-area band must stay covered while document content scrolls');
 assert.equal(measured.backdrop.height,`${expected.top}px`,'top backdrop must cover the full safe-area inset');
 assert.equal(measured.backdrop.pointerEvents,'auto','top safe area must intercept pointer input rather than expose scrolling controls');
 assert.equal(measured.backdrop.hitControl,false,'top safe area must not hit an Action or header control');
 assert(Math.abs(Number.parseFloat(measured.measuredHeaderHeight)-measured.headerHeight)<1.1,'DOM adapter must track the actual rendered header height');
 assert(Math.abs(measured.left-expected.left)<1.1,'content must respect the left inset');
 assert(Math.abs(measured.right-(measured.width-expected.right))<1.1,'content must respect the right inset');
 assert(Math.abs(measured.top-expected.top)<1.1,'header must sit below the current top inset');
 assert(measured.mainBottom-measured.workspaceBottom>=expected.bottom-1.1,'workspace must leave the bottom inset inside the viewport layout');
 return measured;
}

try{
 currentStage='preflight';
 let alreadyServing=false;
 try{await fetch(endpoint,{signal:AbortSignal.timeout(1000)});alreadyServing=true;}catch{}
 assert.equal(alreadyServing,false,'refusing to test an unrelated or stale server already listening on the requested endpoint');
 currentStage='worker-start';
 server=spawn('pnpm',['start'],{cwd:root,env:process.env,detached:true,stdio:['ignore','pipe','pipe']});
 server.stdout.setEncoding('utf8').on('data',chunk=>{serverOutput=(serverOutput+chunk).slice(-12000);});
 server.stderr.setEncoding('utf8').on('data',chunk=>{serverOutput=(serverOutput+chunk).slice(-12000);});
 server.once('exit',(code,signal)=>{serverExit={code,signal};});
 const resource=await waitForReady();evidence.resource={sha256:resource.sha256,httpStatus:200};evidence.checks.workerResource='passed';flush();

 currentStage='browser-layout';
 browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
 evidence.browser={name:'Google Chrome for Testing',version:browser.version(),headless:true};
 const page=await browser.newPage({viewport:evidence.viewport});
 const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));page.on('console',message=>{if(message.type()==='error')pageErrors.push(message.text());});
 const actionId=index=>'00000000-0000-4000-8000-'+String(index+1).padStart(12,'0');
 let revision=1,actions=[makeAction(0)];
 function makeAction(index){return {id:actionId(index),title:`Synthetic action ${index+1}`,notes:'',revision:1,created_at:'2026-10-01T12:00:00.000Z',updated_at:'2026-10-01T12:00:00.000Z',status:'active',view:'normal',parent_id:null,due_at:null,defer_until:null,defer_reasons:[],order:index,flagged:false,project_id:null,tags:[],project_path:null};}
 const snapshot=result=>({schemaVersion:2,revision,actions:structuredClone(actions),projects:[],tags:[],perspectives:[],list_scopes:{inbox:actions.map(action=>action.id),waiting:[],flagged:[]},retrieved_at:'2026-10-01T12:00:00.000Z',...(result?{result}:{})});
 async function host(message){
  if(message.id===undefined)return null;
  let result={};
  if(message.method==='ui/initialize')result={hostContext:{platform:'web',displayMode:'inline',availableDisplayModes:['inline','fullscreen'],safeAreaInsets:{top:20,right:16,bottom:30,left:12}}};
  else if(message.method==='tools/call'){
   const {name}=message.params;
   if(name==='list_actions')result={structuredContent:snapshot()};
   else throw new Error(`Unexpected synthetic host tool ${name}.`);
  }
  return {jsonrpc:'2.0',id:message.id,result};
 }
 await page.exposeFunction('__hostBridge',host);
 await page.route(endpoint.href,route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Local widget harness</title>'}));
 const shell=await page.goto(endpoint.href,{waitUntil:'domcontentloaded'});assert.equal(shell?.status(),200,'browser must establish the local Worker origin');
 await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><iframe id="widgetFrame" title="Widget fixture" style="display:block;width:100%;height:100vh;border:0"></iframe><script>window.addEventListener("message",event=>{const frame=document.getElementById("widgetFrame");if(event.source!==frame.contentWindow||event.data?.jsonrpc!=="2.0"||event.data.id===undefined)return;Promise.resolve(window.__hostBridge(event.data)).then(reply=>{if(reply)event.source.postMessage(reply,"*");});});</script></body></html>');
 await page.evaluate(html=>{document.getElementById('widgetFrame').srcdoc=html;},resource.html);
 const frame=page.frameLocator('#widgetFrame');
 await frame.locator('#actions .action-row').first().waitFor({state:'visible',timeout:30000});
 await frame.locator('#actions .action-row').count().then(count=>assert.equal(count,1,'initial single-action fixture must remain short'));
 const initial=await assertInsetLayout(frame,{top:20,right:16,bottom:30,left:12});
 assert(initial.scrollHeight<=initial.clientHeight+1,'short content with four insets must not create viewport overflow');
 evidence.checks.initialFourInsetsAndShortViewport='passed';

 actions=Array.from({length:80},(_,index)=>makeAction(index));revision++;
 await page.evaluate(value=>{document.getElementById('widgetFrame').contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:value}},'*');},snapshot());
 await frame.locator('#actions .action-row').nth(79).waitFor({state:'visible',timeout:30000});
 await frame.locator('#actions').evaluate(()=>window.scrollTo(0,480));
 await frame.locator('#actions').evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const scrolled=await frame.locator('header').evaluate(header=>({scrollY,top:header.getBoundingClientRect().top,scrollHeight:document.scrollingElement.scrollHeight,clientHeight:document.scrollingElement.clientHeight}));
 assert(scrolled.scrollY>0,'long content must scroll the document');assert(scrolled.scrollHeight>scrolled.clientHeight,'long content must exceed the viewport');
 const sticky=await assertInsetLayout(frame,{top:20,right:16,bottom:30,left:12});evidence.measurements={short:{scrollHeight:initial.scrollHeight,clientHeight:initial.clientHeight},long:{scrollY:sticky.scrollY,scrollHeight:sticky.scrollHeight,clientHeight:sticky.clientHeight,stickyHeaderTop:sticky.top,safeTopBackdrop:sticky.backdrop}};
 evidence.checks.longContentStickyHeader='passed';

 const changed={top:32,right:24,bottom:28,left:8};
 await page.evaluate(value=>{document.getElementById('widgetFrame').contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{safeAreaInsets:value}},'*');},changed);
 await frame.locator('header').evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));
 const dynamic=await assertInsetLayout(frame,changed);assert(dynamic.scrollY>0,'dynamic inset update must retain the current scroll position');
 evidence.checks.dynamicFourEdgeUpdate='passed';
 await page.evaluate(()=>{document.getElementById('widgetFrame').contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{safeAreaInsets:{top:7,right:-1,bottom:Infinity,left:'bad'}}},'*');});
 await frame.locator('header').evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));
 const malformed=await assertInsetLayout(frame,changed);assert(malformed.scrollY>0,'malformed update must preserve the existing scrolled layout');
 evidence.checks.malformedInsetsPreserveLastValid='passed';
 await page.evaluate(()=>{document.getElementById('widgetFrame').contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{safeAreaInsets:{top:0,right:0,bottom:0,left:0}}},'*');});
 await frame.locator('header').evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));
 const zero=await assertInsetLayout(frame,{top:0,right:0,bottom:0,left:0});assert(zero.scrollY>0,'zero reset must retain current scroll position');
 evidence.checks.explicitZeroReset='passed';

 await frame.locator('#actions').evaluate(()=>window.scrollTo(0,0));
 await frame.locator('#actions .action-row').first().locator('.action-select').click();
 const editorGeometry=await frame.locator('#editor').evaluate(editor=>{const root=document.documentElement,rect=editor.getBoundingClientRect(),header=document.querySelector('header').getBoundingClientRect(),style=getComputedStyle(editor);return {position:style.position,top:style.top,maxHeight:style.maxHeight,rectTop:rect.top,headerBottom:header.bottom,headerHeight:root.style.getPropertyValue('--widget-header-height')};});
 assert.equal(editorGeometry.position,'sticky','desktop inspector must remain sticky');
 assert.equal(editorGeometry.top,editorGeometry.headerHeight,'inspector sticky offset must use the measured header height');
 assert(Math.abs(editorGeometry.rectTop-editorGeometry.headerBottom)<1.1,'inspector must begin below the rendered header');
 assert(Number.parseFloat(editorGeometry.maxHeight)<=640-Number.parseFloat(editorGeometry.headerHeight)+1.1,'inspector maximum height must fit within the viewport after header allocation');
 evidence.checks.measuredHeaderInspectorClearance='passed';evidence.measurements.inspector=editorGeometry;

 await page.setViewportSize({width:390,height:844});
 await frame.locator('header').evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const mobileInsets={top:44,right:8,bottom:34,left:8};
 await page.evaluate(value=>{document.getElementById('widgetFrame').contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{safeAreaInsets:value}},'*');},mobileInsets);
 await frame.locator('header').evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const mobile=await assertInsetLayout(frame,mobileInsets);assert.equal(mobile.width,390,'resized harness iframe must use the mobile viewport width');assert(mobile.scrollHeight>mobile.clientHeight,'long mobile fixture must remain scrollable after resize');
 await frame.locator('#actions').evaluate(()=>window.scrollTo(0,document.scrollingElement.scrollHeight));
 await frame.locator('header').evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));
 const mobileEnd=await frame.locator('.workspace').evaluate(workspace=>({scrollY,scrollHeight:document.scrollingElement.scrollHeight,clientHeight:document.scrollingElement.clientHeight,viewportBottom:innerHeight,workspaceBottom:workspace.getBoundingClientRect().bottom,headerTop:document.querySelector('header').getBoundingClientRect().top}));
 assert(mobileEnd.scrollY>0&&mobileEnd.scrollHeight>mobileEnd.clientHeight,'mobile long fixture must reach a scrolled document state');
 assert(mobileEnd.workspaceBottom<=mobileEnd.viewportBottom-mobileInsets.bottom+1.1,'mobile content must retain bottom safe-area clearance at scroll end');
 assert(Math.abs(mobileEnd.headerTop-mobileInsets.top)<1.1,'mobile sticky header must remain below the top inset after resize and scroll');
 const screenshotPath=resolve(outputPath+'.mobile.png');await page.screenshot({path:screenshotPath,fullPage:false});
 const screenshotBytes=readFileSync(screenshotPath);evidence.mobileScreenshot={path:screenshotPath,sha256:digest(screenshotBytes),bytes:screenshotBytes.length,kind:'synthetic fixture supplemental browser evidence'};
 evidence.checks.mobileResizeAndBottomClearance='passed';evidence.measurements.mobile={scrollY:mobileEnd.scrollY,scrollHeight:mobileEnd.scrollHeight,clientHeight:mobileEnd.clientHeight,workspaceBottom:mobileEnd.workspaceBottom,viewportBottom:mobileEnd.viewportBottom,headerTop:mobileEnd.headerTop,safeTopBackdrop:mobile.backdrop};

 assert.equal(pageErrors.length,0,pageErrors.join('\n'));
 evidence.result='passed';evidence.elapsedMs=Date.now()-startedAt;flush();
}catch(error){evidence.result='failed';evidence.failure={stage:currentStage,message:error instanceof Error?error.message:String(error)};evidence.elapsedMs=Date.now()-startedAt;throw error;}finally{
 clearTimeout(watchdog);
 if(browser)await browser.close().catch(()=>{});
 if(server?.pid){try{process.kill(-server.pid,'SIGINT');}catch{};await Promise.race([new Promise(resolve=>server.once('exit',resolve)),new Promise(resolve=>setTimeout(resolve,12000))]);if(!serverExit){try{process.kill(-server.pid,'SIGTERM');}catch{};await Promise.race([new Promise(resolve=>server.once('exit',resolve)),new Promise(resolve=>setTimeout(resolve,3000))]);}if(!serverExit){try{process.kill(-server.pid,'SIGKILL');}catch{};await new Promise(resolve=>setTimeout(resolve,200));}evidence.workerCleanup={exit:serverExit||'forced_after_timeout',terminationSignal:'SIGINT',serverOutputSha256:digest(serverOutput)};}
 try{evidence.identityAfter=identity();evidence.sourceAndArtifactsUnchanged=JSON.stringify(sourceBefore)===JSON.stringify(evidence.identityAfter);}catch(error){evidence.sourceIdentityError=error instanceof Error?error.message:String(error);evidence.sourceAndArtifactsUnchanged=false;}
 if(evidence.sourceAndArtifactsUnchanged===false&&evidence.result==='passed'){evidence.result='failed';evidence.failure={stage:'identity-check',message:'Source or built artifacts changed during browser verification.'};}
 if(evidence.workerCleanup?.exit==='forced_after_timeout'&&evidence.result==='passed'){evidence.result='failed';evidence.failure={stage:'worker-cleanup',message:'Worker process group did not stop within the bounded cleanup window.'};}
 flush();
}
if(evidence.result!=='passed')process.exitCode=1;

