import {spawnSync} from 'node:child_process';
const generated=spawnSync(process.execPath,['scripts/generate-widget-client.mjs'],{stdio:'inherit'});
if(generated.error)throw generated.error;
if(generated.status!==0)process.exit(generated.status??1);
for(const args of [['scripts/run-framework.mjs','build'],['node_modules/vite/bin/vite.js','build','--config','build/local-mcp-vite.config.mjs']]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0){process.exitCode=result.status??1;break;}
}
