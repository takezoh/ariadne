import {createWidgetHtml} from './widget';

export const VERIFICATION_UI_URI='ui://action-tools/actions-verification-v4.html';
// Explicit opt-in fixture: the real write executes; its first reply is discarded.
export const verificationWidgetHtml=createWidgetHtml(true);
