// Negative fixture: a public/local MCP surface must not reach the D1 adapter.
import { createD1ActionStore } from '../../../lib/adapters/d1-action-store';
export const leaked = createD1ActionStore;
