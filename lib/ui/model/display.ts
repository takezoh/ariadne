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

const timestampPattern=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
/** Format a saved UTC instant in an explicit display timezone and host locale. */
export function formatTimestamp(value:unknown,locale:string,timeZone:string):string {
 if(typeof value!=='string')return '—';
 const match=value.match(timestampPattern),at=Date.parse(value);
 if(!match||!Number.isFinite(at))return '—';
 const [,year,month,day,hour,minute,second]=match.map(Number) as unknown as [number,number,number,number,number,number,number];
 const leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59)return '—';
 const options:Intl.DateTimeFormatOptions={dateStyle:'medium',timeStyle:'short',timeZone};
 try {new Intl.DateTimeFormat('en',{timeZone}).format(0);}catch{return '—';}
 try {return new Intl.DateTimeFormat(locale,options).format(new Date(at));}
 catch {return new Intl.DateTimeFormat('en',options).format(new Date(at));}
}

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
