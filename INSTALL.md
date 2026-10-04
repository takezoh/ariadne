# Install a personal Ariadne plugin

Each user installs a private Ariadne Personal package that references the registered MCP connection of their own private Site. The shared Ariadne package supplies application source and operation skills.

## Prepare and publish the Site

Reuse an identified personal deployment and preserve its project ID, DB binding and private audience. For a new deployment, copy application source into a separate directory, excluding the author's `.openai/hosting.json`, Git metadata, runtime state, dependencies, generated outputs, environment files, credentials and user data. Preserve `build/`, `db/`, recorded SQL migrations, package files and bundled licenses.

Follow the Sites skill, [deployment guide](docs/technical/deployment.md) and [testing guide](docs/technical/testing.md). Create one private Site and immediately save its returned project ID. Configure `d1: "DB"`, `r2: null` and `capabilities: ["mcp"]`. Never reuse the author's identity or create duplicates after an uncertain result.

Use Node >=22.13 and the declared packageManager version. Install with the frozen lockfile, run `pnpm check` and `pnpm build`, then package and publish the exact pushed source through Sites. Initialize an empty D1 using recorded migrations; inspect applied migrations on an existing DB and never repeat a data reset without authorization. Record source commit, artifact, version and terminal deployment result.

## Create the personal package

After successful MCP-ready publication, read the selected Site with `include_mcp_connection: true`. Retain its exact `mcp_connection.plugin_id`, `mcp_url` and `oauth_resource`. If the registered plugin ID is missing, resolve Site provisioning before generating the package; do not invent an ID.

Generate the package and marketplace definitions in the user's private installation directory; do not copy fixed definitions from this repository. The host uses `marketplace.json` for marketplace registration, not `manifest.json`.

Use this directory layout:

```text
personal-install/
  .agents/plugins/marketplace.json
  ariadne-personal/
    plugin.json
    mcp.json
    .app.json
    skills/action-guide/
    skills/action-tools/
    LICENSE
```

Generate `ariadne-personal/plugin.json`:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "ariadne-personal",
  "version": "0.2.0",
  "description": "Manage your personal actions through conversation and a shared UI.",
  "license": "MIT",
  "extensions": {
    "com.openai": {
      "apps": "./.app.json",
      "interface": {
        "displayName": "Ariadne Personal",
        "shortDescription": "Manage actions in your private Ariadne Site.",
        "category": "Productivity",
        "defaultPrompt": ["Read my saved actions and open my list."]
      }
    }
  }
}
```

Generate `.agents/plugins/marketplace.json` at the installation directory root:

```json
{
  "name": "ariadne-personal-marketplace",
  "interface": {"displayName": "Ariadne Personal"},
  "plugins": [{
    "name": "ariadne-personal",
    "source": {"source": "local", "path": "./ariadne-personal"},
    "policy": {"installation": "AVAILABLE", "authentication": "ON_INSTALL"},
    "category": "Productivity"
  }]
}
```

Keep the marketplace entry name identical to the generated plugin name. Resolve the source path from the marketplace root. Reuse these identities when updating the same installation. If several personal deployments must coexist on one host, append a stable unique suffix to both plugin and marketplace names and update their references together. Keep the display name `Ariadne Personal` (with a deployment label when needed). Never copy another package's registered ID.

Copy the full operation skill directories and the source LICENSE into the generated package. Use the source release version in its manifest. Validate generated JSON and paths before installation.

## Configure Sites-managed authentication

Sites uses a registered platform-managed MCP connection. Do not configure its URL as a direct CLI OAuth server: The direct CLI OAuth path failed with unsupported DCR and CIMD during verification; use the registered platform connection instead.

Read the selected Site with `include_mcp_connection: true`. Generate `.app.json` in the personal package, mapping `apps.actions.id` to the exact returned `mcp_connection.plugin_id`, with `required: true`. Set `extensions.com.openai.apps` to `./.app.json` in the generated `plugin.json`. The registered connection is a dependency of Ariadne Personal, not a replacement for the package.

Generate `ariadne-personal/.app.json`:

```json
{
  "apps": {
    "actions": {
      "id": "<exact mcp_connection.plugin_id>",
      "required": true
    }
  }
}
```

Replace the placeholder with the selected Site's server-returned ID. Never copy an ID from an example or another user's installation.

Generate `ariadne-personal/mcp.json`:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {}
}
```

Generate root `mcp.json` with the portable schema and an empty `mcpServers` object; do not add a second raw HTTP connection to the same Site. Keep the returned URL and OAuth resource for verification only. Never embed authentication credentials.

Install or refresh Ariadne Personal through the private marketplace. Use the host's platform connection flow for its required registered connection. Do not call `codex mcp login` or create a standalone server for it. Complete any account authentication required by the host, then reload the package or test in a new chat when needed.

## Install the package and connect its dependency

On a host supporting the verified CLI commands, register the generated marketplace root and install the package:

```text
codex plugin marketplace add <absolute personal-install directory> --json
codex plugin add ariadne-personal@ariadne-personal-marketplace --json
```

Retain the returned installed path and check that its `plugin.json` references `.app.json` and that the installed mapping contains the selected Site's exact ID. Reinstall the same package after changing generated definitions; modifying the source directory alone does not update the installed cache.

Offer the registered dependency's installation/connection flow using `plugin_management.suggest_plugins` with the exact returned Site plugin ID. This connects the required service used by Ariadne Personal. A suggestion is not evidence of installation or authentication. Continue automatically when the host confirms that the connection's tools are available; do not repeat an earlier connection blocker. User-only authentication remains a concrete external step when required.

## Verify

Discover the personal package's tool schemas, confirm the selected Site connection, perform a read-only `list_actions` call, and open `open_actions`. Do not create test actions. Follow the bundled action-tools skill for operation semantics.

A successful `list_actions` call verifies authenticated D1 read access. A successful `open_actions` call verifies the UI operation request; it does not alone prove rendering or interaction. Verify the actual UI when host inspection is available, otherwise state that limit. Report Site URL, package location, installation, authentication, read access and actual UI operation separately. If a host capability is unavailable, preserve the package and Site and identify the concrete remaining step. Package creation alone does not establish authenticated access.
