'use client';
import {useEffect,useRef} from 'react';
import {widgetHtml} from '@/lib/widget';
/** The web preview uses the same UI resource as Work, relaying to the same application. */
export default function Board(){
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{const listener=async(e:MessageEvent)=>{
  if(e.source!==frame.current?.contentWindow||e.data?.jsonrpc!=='2.0'||e.data.id==null)return;
  const m=e.data;let result:unknown;
  if(m.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'web-preview',version:'0.2.0'},hostCapabilities:{},hostContext:{displayMode:'fullscreen',availableDisplayModes:['fullscreen'],platform:'web'}};
  else if(m.method==='ui/request-display-mode'){if(m.params?.mode!=='fullscreen'){frame.current?.contentWindow?.postMessage({jsonrpc:'2.0',id:m.id,error:{code:-32602,message:'The Web preview only supports its full-window display.'}},window.location.origin);return;}result={mode:'fullscreen'};}
  else if(m.method==='tools/call'){try{const r=await fetch('/api/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(m.params)});const d=await r.json() as {error?:string;message?:string};result=r.ok?{structuredContent:d}:{isError:true,structuredContent:{error:{code:d.error||'outcome_unknown',message:d.message}}};}catch{result={isError:true,structuredContent:{error:{code:'outcome_unknown',message:'The save result is unknown.'}}};}}
  else return;
  frame.current?.contentWindow?.postMessage({jsonrpc:'2.0',id:m.id,result},window.location.origin);
 };window.addEventListener('message',listener);if(frame.current)frame.current.srcdoc=widgetHtml;return()=>window.removeEventListener('message',listener);},[]);
 return <iframe ref={frame} title="Actions" style={{width:'100%',height:'100vh',border:0}}/>;
}
