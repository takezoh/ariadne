# Install Ariadne

Installation names: marketplace `ariadne-personal-marketplace`, plugin `ariadne-personal`, display name `Ariadne`.

Publish Ariadne as a private Site, then install the personal plugin provisioned for that Site. Sites supplies the plugin identity and OAuth connection. Use `Ariadne` as the Site title and plugin display name.

## Prepare and publish the application

1. Follow the Sites skill and the [deployment guide](docs/technical/deployment.md). Open the existing personal Site's source checkout and retain its project ID, `DB` binding and private audience. For a new installation, prepare application source in a separate directory and create a private Site titled `Ariadne`; save the returned project ID immediately.
2. Set `.openai/hosting.json` to the selected project ID with `d1: "DB"`, `r2: null` and `capabilities: ["mcp"]`.
3. Follow [Select the installation and source](docs/technical/plugin-workflow.md#select-the-installation-and-source) and [Validate and publish](docs/technical/plugin-workflow.md#validate-and-publish) in the shared workflow. Use the branch requested for this installation and retain the successful deployment's Site URL.

## Install and authenticate

1. Call `get_site` for the selected project with `include_mcp_connection: true`.
2. Retain the returned `mcp_connection.plugin_id`, `mcp_url` and `oauth_resource`.
3. For an existing plugin, follow [Refresh the registered tools](docs/technical/plugin-workflow.md#refresh-the-registered-tools) after publishing.
4. For a new installation, pass the exact Site-returned plugin ID to `plugin_management.suggest_plugins`, open the resulting Ariadne plugin detail page and select **Install**.
5. Complete **Connect** and the platform-managed authentication flow for the selected plugin.
6. Start a new chat to load the current tool definitions and continue once the host exposes the connected Ariadne tools.

## Update an existing installation

Use the [update-plugin skill](skills/update-plugin/SKILL.md), which follows the [shared publication and update workflow](docs/technical/plugin-workflow.md).

## Use Ariadne

Read [action-tools](skills/action-tools/SKILL.md) and discover the connected tool schemas. Call `list_actions` to read existing actions and `open_actions` to open the shared UI. The sidebar launcher is the `open_actions` tool titled `Ariadne`.

Record the publication details listed in the shared workflow's [Report](docs/technical/plugin-workflow.md#report), together with the Site-returned plugin ID, with the installation result.
