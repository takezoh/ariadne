import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// The local server receives no inherited Sites, action-data or end-user credentials.
const child=spawn(process.execPath,[fileURLToPath(new URL('../dist/local/server.mjs',import.meta.url))],{env:{},stdio:'inherit'});
child.on('error',()=>{process.exitCode=1;});
child.on('exit',(code,signal)=>{process.exitCode=signal?1:code??1;});
