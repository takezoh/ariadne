import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
export function sourceIdentity(){
 const git=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'});if(git.status!==0)throw Error('Source inventory failed');
 const paths=[...new Set(git.stdout.split('\0').filter(path=>/^(app\/|lib\/|build\/|db\/|drizzle\/|scripts\/|tests\/|package\.json$|pnpm-lock\.yaml$|eslint\.config\.mjs$|vite\.config\.ts$|tsconfig\.json$|\.openai\/hosting\.json$)/.test(path)))].sort();
 const files=paths.map(path=>({path,sha256:existsSync(path)?createHash('sha256').update(readFileSync(path)).digest('hex'):null}));
 return {baseCommit:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),worktreeSha256:createHash('sha256').update(JSON.stringify(files)).digest('hex'),files};
}
