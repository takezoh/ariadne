import type {HostPort,IdPort} from '../ports';
import type {UiDiagnosticsPort} from './diagnostics';

export function mountDom(
 document:Document,
 window:Window,
 transport:HostPort,
 ids:IdPort,
 model:object,
 createToolClient:typeof import('../effects/tool-client').createToolClient,
 createUiController:typeof import('../application/controller').createUiController,
 createDisplayBridge:typeof import('./host').createDisplayBridge,
 diagnostics?:UiDiagnosticsPort,
):{
 controller:ReturnType<typeof import('../application/controller').createUiController>;
 bridge:ReturnType<typeof import('./host').createDisplayBridge>;
 dispose:()=>void;
};
