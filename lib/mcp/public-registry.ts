/**
 * Static Non-Authorized Local MCP registry.
 *
 * This module is the public/local composition surface. It must not import the D1 binding,
 * the private ActionStore, the authenticated action service or the private dispatcher. It
 * exposes only static guidance and non-private diagnostics; creating/publishing a Site or
 * installing an authorized connection stays with separately authorized platform tools.
 */
export const PUBLIC_SERVER_INFO = { name: 'action-tools-local', version: '0.2.0' } as const;

const schema = (properties: object, required: string[] = []) => ({ type: 'object', properties, required, additionalProperties: false });
const annotations = (readOnlyHint: boolean) => ({ readOnlyHint, destructiveHint: false, idempotentHint: true, openWorldHint: false });

const setupGuidance = [
  'This is the Non-Authorized Local MCP. It exposes no action data and holds no database credentials.',
  'To read or change saved actions, connect the Authorized Remote MCP for your Sites installation.',
  'Site creation, connection installation and credential changes belong to the platform tools and require their own authorization.',
].join('\n');

export const publicDefinitions = [
  {
    name: 'get_setup_guidance',
    title: 'Get setup guidance',
    description: 'Return static guidance for connecting an authorized action-store installation. This local server reads no saved actions.',
    inputSchema: schema({}),
    annotations: annotations(true),
  },
  {
    name: 'get_public_diagnostics',
    title: 'Get public diagnostics',
    description: 'Return non-private server identity and capability information for the local server. No action data or credentials are included.',
    inputSchema: schema({}),
    annotations: annotations(true),
  },
];

/** Resources are intentionally empty: private UI resources belong to the authorized server. */
export const publicResources: { uri: string; name: string; mimeType: string }[] = [];

/** Answer a public tool call without any database or authenticated-service access. */
export function publicCall(name: string, args: unknown): unknown {
  if (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args as Record<string, unknown>).length > 0) {
    throw Object.assign(new Error('unexpected input'), { code: 'invalid_input', status: 400 });
  }
  if (name === 'get_setup_guidance') return { guidance: setupGuidance };
  if (name === 'get_public_diagnostics') return { server: PUBLIC_SERVER_INFO, authorized: false, actionData: false, database: false };
  throw Object.assign(new Error('unknown tool'), { code: 'unknown_tool', status: 404 });
}
