# Plugin publication and update workflow

Use this workflow to publish application source to the selected Site. For an existing installation, continue through registered-tool refresh and update verification. Initial Site preparation and plugin installation are described in [INSTALL.md](../../INSTALL.md).

Read the [deployment guide](deployment.md) and [testing guide](testing.md). Use the Sites skill for source synchronization, packaging and publication. Keep the selected branch, Site identity, database binding, audience and connection throughout the workflow.

For a new installation, use the Site project ID and hosting manifest prepared by the installation guide. Proceed to source selection and publication below, then return to the installation guide for plugin registration and authentication.

## Select the installation and source

1. Read `.openai/hosting.json` in the installation checkout to identify its project ID and bindings. If the checkout belongs to the shared upstream application, locate the user's personal deployment through Sites and open its source checkout.
2. For an existing installation, call `get_site` with `include_mcp_connection: true` for the selected project. Retain the exact project ID, plugin ID, MCP URL, OAuth resource, current audience and published version. Match the existing host plugin to this Site using its connection URL and ID.
3. Fetch the branch requested by the user and record its source commit. For an unspecified branch, use the branch associated with the existing installation and state the selection. Retain the installation's hosting manifest when bringing in application source.

## Validate and publish

1. Use Node >=22.13 and the `packageManager` version declared in `package.json`. Install dependencies with `pnpm install --frozen-lockfile`.
2. Run `pnpm check` and `pnpm build`. Resolve failures before publication.
3. Inspect the target database's applied migrations and determine the pending migrations. Preserve the recorded migration history and user data; obtain explicit authorization for any proposed data reset. Include the recorded SQL migrations in the deployment artifact; Sites applies pending migrations during publication. An empty database receives the recorded schema.
4. Use the Sites source workflow to synchronize the exact validated source and package its build. Keep source credentials in session memory and pass them through the workflow's supported stdin interface.
5. Publish to the same Site using its current audience. For an owner-private Site, use `save_version_and_deploy_private`; continue an already saved version using `deploy_private_site_version`.
6. Retain the returned version and deployment IDs. Poll a nonterminal deployment until it succeeds or fails. On a failed or uncertain result, inspect that same deployment and report the concrete failure or unresolved state before proceeding.

## Refresh the registered tools

After successful publication, refresh the existing connection's tool definitions as a separate operation:

1. Use the available browser controls to open **Plugins > Personal > Created by you**.
2. Open the plugin matched to the selected Site, choose **More actions > Manage**, and select **Refresh tools**.
3. Automate these browser actions when the host is accessible. Observe the resulting state and handle any refresh error before continuing.
4. When browser access requires the user's participation, provide the exact navigation path above and identify the required action. Resume verification after the user completes the refresh.
5. Obtain current tool definitions in a fresh chat or a supported host session reload. Preserve the current conversation and explain any user step needed to open the fresh chat.

## Verify the update

Read [action-tools](../../skills/action-tools/SKILL.md) for the connected operation contract. Use existing data for the following checks:

- Match the host's advertised tool names, titles, descriptions, schemas and UI metadata to the published source. Distinguish freshly retrieved definitions from the current chat's retained tool snapshot.
- Confirm that `open_actions`, titled `Ariadne`, is the single global sidebar launcher. Inspect actual host entries after the refresh and investigate discrepancies against the server definition and registered connection.
- Call `list_actions` through the connected plugin to verify authenticated access to hosted D1.
- Call `open_actions` and inspect the rendered UI and navigation. Separate a successful tool response from observed UI behavior.

If a host surface remains inaccessible, report the attempted operation, its failure boundary and the unverified behavior. Continue independent checks that remain available.

## Report

Report the source branch and commit, Sites source commit, artifact, saved version, terminal deployment result and Site URL. State registered-tool refresh, current tool metadata, authenticated reads, actual sidebar entries and UI behavior separately. Record whether each result was observed in the current chat, a fresh host session, the Web UI or the desktop UI.
