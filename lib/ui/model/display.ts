export type DisplayMode='inline'|'fullscreen'|'pip';
export interface HostContext {
 displayMode?:DisplayMode;
 availableDisplayModes?:DisplayMode[];
 theme?:'light'|'dark';
 locale?:string;
 timeZone?:string;
 platform?:'web'|'desktop'|'mobile';
 styles?:{variables?:Record<string,string>;css?:{fonts?:string}};
 safeAreaInsets?:{top:number;right:number;bottom:number;left:number};
 [key:string]:unknown;
}
export interface HostInitializeResult {hostContext?:HostContext;hostInfo?:{name:string;version:string};hostCapabilities?:Record<string,unknown>}
export interface DisplayState {context:HostContext;contextVersion:number;pending:DisplayMode|null;error:string|null}

/** Validate a partial context without deriving host mode from layout dimensions. */
export function mergeHostContext(current:HostContext,patch:unknown):HostContext {
 if(!patch||typeof patch!=='object'||Array.isArray(patch))return current;
 const input=patch as Record<string,unknown>;const next:HostContext={...current};
 for(const [key,value] of Object.entries(input)){
  if(key==='displayMode'){if(['inline','fullscreen','pip'].includes(String(value)))next.displayMode=value as HostContext['displayMode'];}
  else if(key==='availableDisplayModes'){if(Array.isArray(value)&&value.every(mode=>['inline','fullscreen','pip'].includes(mode)))next.availableDisplayModes=[...new Set(value)] as HostContext['availableDisplayModes'];}
  else if(key==='theme'){if(value==='light'||value==='dark')next.theme=value;}
  else if(key==='platform'){if(['web','desktop','mobile'].includes(String(value)))next.platform=value as HostContext['platform'];}
  else if(['locale','timeZone'].includes(key)){if(typeof value==='string')next[key]=value;}
  else if(key==='safeAreaInsets'){if(value&&typeof value==='object'&&['top','right','bottom','left'].every(side=>typeof (value as Record<string,unknown>)[side]==='number'&&Number.isFinite((value as Record<string,unknown>)[side])&&Number((value as Record<string,unknown>)[side])>=0))next.safeAreaInsets={...value} as HostContext['safeAreaInsets'];}
  else if(key==='styles'){if(value&&typeof value==='object'&&!Array.isArray(value))next.styles=JSON.parse(JSON.stringify(value));}
  else next[key]=value&&typeof value==='object'?JSON.parse(JSON.stringify(value)):value;
 }
 return next;
}
export function displayAvailability(context:HostContext) {return {mode:context.displayMode??null,canInline:Boolean(context.availableDisplayModes?.includes('inline')),canFullscreen:Boolean(context.availableDisplayModes?.includes('fullscreen'))};}
