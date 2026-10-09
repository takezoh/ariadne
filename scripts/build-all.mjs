import {spawnSync} from 'node:child_process';
for(const args of [['scripts/run-framework.mjs','build'],['node_modules/vite/bin/vite.js','build','--config','build/local-mcp-vite.config.mjs']]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0){process.exitCode=result.status??1;break;}
}
