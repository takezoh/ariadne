# Personal plugin installation

Follow [INSTALL.md](../../INSTALL.md) to publish or reuse the user’s private Site, generate an Ariadne Personal package and private marketplace registration, install it, and authenticate its registered Sites connection.

The shared repository contains application source and operation skills. Generate `plugin.json`, `.app.json`, `mcp.json` and `.agents/plugins/marketplace.json` in a separate user-specific installation directory. Keep the selected Site’s connection ID out of shared source. The package references the registered connection using `extensions.com.openai.apps`; direct CLI OAuth is not the verified Sites connection path.

Installation, authenticated D1 reads and actual UI operation require separate verification. Reuse the Site and package identities on updates.
