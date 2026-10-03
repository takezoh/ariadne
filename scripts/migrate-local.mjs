import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
// Local-only migration. It never accepts --remote or switches to hosted D1.
if(process.argv.length>2)throw new Error('This command accepts no arguments and only migrates local D1.');
const built=JSON.parse(readFileSync('dist/server/wrangler.json','utf8'));
const config={name:'local-migrations',compatibility_date:built.compatibility_date,d1_databases:built.d1_databases.map(d=>({...d,migrations_dir:resolve('drizzle')}))};
mkdirSync('.sites-runtime',{recursive:true});writeFileSync('.sites-runtime/migrations-local.json',JSON.stringify(config));
const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config','.sites-runtime/migrations-local.json','--persist-to',resolve('.wrangler/state')],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:resolve('.wrangler/logs')}});
process.exit(result.status??1);
