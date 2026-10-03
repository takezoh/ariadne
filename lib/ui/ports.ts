import type {HostContext} from './model/display';
export type {DisplayMode,HostContext,HostInitializeResult,DisplayState} from './model/display';
export interface HostMessage {jsonrpc?: string; id?: number; method?: string; params?: {structuredContent?: unknown;[key:string]:unknown}; result?: unknown; error?: {message?: string}}
export interface MessageEvent {trusted: boolean; message: HostMessage}
export interface HostEffects {
 send(message: unknown): void;
 listen(handler: (event: MessageEvent) => void): () => void;
 schedule(callback: () => void, milliseconds: number): unknown;
 cancel(handle: unknown): void;
}
export interface HostPort {
 request(method: string, params: unknown): Promise<unknown>;
 notify(method: string, params: unknown): void;
 subscribe(handler: (snapshot: unknown) => void): () => void;
 subscribeContext(handler: (context: Partial<HostContext>) => void): () => void;
 dispose(): void;
}
export interface IdPort {next(): string}
