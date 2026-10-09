import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({build:{outDir:'dist/local',emptyOutDir:true,lib:{entry:resolve('lib/mcp/local-server.mjs'),formats:['es'],fileName:()=> 'server.mjs'},rollupOptions:{external:['node:readline']}}});
