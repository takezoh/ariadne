import {createTransientModel} from './model/transient-create';
import {createSaveStatusModel} from './model/save-status';
import {createTreeDropModel} from './model/tree-drop';
import {createPickerModel} from './model/picker';
import {createCatalogTreeModel} from './model/catalog-tree';
import {createCatalogDraftModel} from './model/catalog-drafts';
import {createDateInputModel} from './model/date-input';
import {createMovementModel} from './model/movement';
import {createAutosaveModel} from './model/autosave';
import {createUiController} from './application';
import {createDiscardingEffects} from './adapters/verification';
import {mutationBlocked,hasUnsavedChanges,editorSelection} from './model/controls';
import {retainRequest,operationSucceeded,createdActionId} from './model/operations';
import {visibleActions,scopeTitle,reviewChangeSummary,errorMessage,warningMessage,actionDepth,displayTitle} from './model/presentation';
import {mergeHostContext} from './model/display';
import {createNavigationModel} from './model/navigation';
import {iconSvg} from './icons';
import {createToolClient} from './controller';
import {mountDom} from './adapters/dom.js';
import {createHostTransport,createDisplayBridge} from './adapters/host';
import {editDraft,discardDraft,mergeDrafts,draftPayload,acknowledgeDraft} from './model/drafts';
import type {HostEffects,MessageEvent as HostMessageEvent,HostMessage} from './ports';
import type {UiDiagnosticCounter,UiDiagnosticPhase,UiDiagnosticsPort} from './adapters/diagnostics';

const verification=document.documentElement.dataset.verification==='true';
let effects:HostEffects={
 send:(message:unknown)=>window.parent.postMessage(message,'*'),
 listen:(handler:(event:HostMessageEvent)=>void)=>{
  const fn=(event:globalThis.MessageEvent)=>handler({trusted:event.source===window.parent,message:event.data as HostMessage});
  window.addEventListener('message',fn);
  return ()=>window.removeEventListener('message',fn);
 },
 schedule:(fn:()=>void,ms:number)=>window.setTimeout(fn,ms),
 cancel:(handle:unknown)=>window.clearTimeout(handle as number),
};
if(verification){
 effects=createDiscardingEffects(effects,{
  consume:()=>{const el=document.getElementById('discardNext') as HTMLInputElement|null;if(!el?.checked)return false;el.checked=false;return true;},
  discarded:()=>{const status=document.getElementById('status');if(status)status.textContent='Save response discarded for verification. Waiting for the normal timeout.';},
 });
}
const transport=createHostTransport(effects);
const model={
 transient:createTransientModel(),saveStatus:createSaveStatusModel(),treeDrop:createTreeDropModel(),picker:createPickerModel(),
 catalogTree:createCatalogTreeModel(),catalogDrafts:createCatalogDraftModel(),dateInput:createDateInputModel(),
 movement:createMovementModel(),autosave:createAutosaveModel(),createdActionId,displayTitle,navigation:createNavigationModel(),
 errorMessage,warningMessage,actionDepth,reviewChangeSummary,iconSvg,visibleActions,scopeTitle,mergeHostContext,
 editorSelection,acknowledgeDraft,draftPayload,mutationBlocked,hasUnsavedChanges,operationSucceeded,retainRequest,
 editDraft,discardDraft,mergeDrafts,
};
export type WidgetModel=typeof model;
const diagnosticCounters:UiDiagnosticCounter[]=['list.render','movement.fingerprint','movement.intent','movement.relevant','movement.target-groups'];
const diagnostics:UiDiagnosticsPort|undefined=document.documentElement.dataset.uiDiagnostics==='true'?{
 increment(counter){const metrics=(window as Window&{__actionToolsMetrics?:Record<UiDiagnosticCounter,number>}).__actionToolsMetrics||Object.fromEntries(diagnosticCounters.map(name=>[name,0])) as Record<UiDiagnosticCounter,number>;(window as Window&{__actionToolsMetrics?:Record<UiDiagnosticCounter,number>}).__actionToolsMetrics=metrics;metrics[counter]++;},
 record(phase:UiDiagnosticPhase,durationMs:number){const target=window as Window&{__actionToolsPhases?:{phase:UiDiagnosticPhase;durationMs:number;at:number}[]};const phases=target.__actionToolsPhases||[];target.__actionToolsPhases=phases;phases.push({phase,durationMs,at:window.performance.now()});},
}:undefined;
mountDom(document,window,transport,{next:()=>crypto.randomUUID()},model,createToolClient,createUiController,createDisplayBridge,diagnostics);
