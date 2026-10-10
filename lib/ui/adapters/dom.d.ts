import type {WidgetModel} from '../client';
import type {HostPort,IdPort} from '../ports';
import type {UiDiagnosticsPort} from './diagnostics';

export function mountDom(
 document:Document,
 window:Window,
 transport:HostPort,
 ids:IdPort,
 model:WidgetModel,
 createToolClient:typeof import('../controller').createToolClient,
 createUiController:typeof import('../application').createUiController,
 createDisplayBridge:typeof import('./host').createDisplayBridge,
 diagnostics?:UiDiagnosticsPort,
):{
 controller:ReturnType<typeof import('../application').createUiController>;
 bridge:ReturnType<typeof import('./host').createDisplayBridge>;
 dispose:()=>void;
};
