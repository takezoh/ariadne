# UI responsibility and dependency boundaries

The dedicated UI separates data-only decisions, application state transitions, component rendering, and host/DOM effects. `lib/ui/client.ts` is the composition root: it creates the model instances and connects the controller, view, tool client, host transport, and DOM adapter. Typed occurrences and the readonly `get_selection_context` projection live in the model/controller boundary; the DOM adapter registers the local App tool while the host adapter owns trusted bidirectional JSON-RPC dispatch.

## Development principles

These rules apply to new UI features and refactors as well as the current implementation.

1. **Separate decisions from execution.** Put filtering, ordering, validation, labels, control availability, view projections and state-transition decisions in deterministic, nonmutating model functions. Pass time, IDs and other environmental values explicitly; do not hide concrete capabilities inside model inputs or callbacks.
2. **Give state one owner.** Application code owns published state and normalizes dates, picker selection, movement choices and acknowledgments before publication. Rendering must not initialize drafts, dispatch state changes or repair state through helpers in its call graph. Express focus and other required view effects explicitly and execute them at the effect boundary.
3. **Share components through explicit contracts.** Reuse outline and inspector rendering for Action, Project and Tag where their interaction contracts match. Components consume readonly view data and callbacks, render through injected DOM references, and retain only local rendering caches. They must not read controller state or initiate host/API calls directly. Keep entity-specific decisions in model projections instead of accumulating hidden policy in a generic component.
4. **Keep data types authoritative.** Define shared state and projection types in the model. Derive narrower component inputs with readonly types, `Pick` or `Omit`; do not duplicate DTO schemas. Keep callback-bearing requests and effect capabilities out of public data-only state.
5. **Compose effects at entry points.** Ports describe required capabilities; adapters implement them; the composition root connects them. DOM geometry, focus, capture, timers and host communication remain effects even when a component or application operation triggers them.
6. **Preserve interaction contracts.** A structural refactor must retain occurrence identity separately from entity IDs, compatible DOM nodes, focus/caret/IME behavior, unsaved proposals and exact request identity for unknown-outcome recovery. A passing projection test alone cannot establish these browser-facing guarantees.
7. **Enforce boundaries as the tree grows.** Place every new module in a declared layer and keep imports in the permitted direction. Extend the real-config lint fixtures whenever a new extension, import form or capability is introduced. A boundary change must update the responsibility contract and its tests; moving code or suppressing lint does not resolve a responsibility violation.

Use the [test allocation principles](testing.md#test-allocation-principles) to choose the evidence for each responsibility. The source tree below is the current implementation of these principles, not a requirement to keep unrelated responsibilities in a single file.

## Host safe-area layout

`model/display.ts` validates `safeAreaInsets` as one complete set of finite, nonnegative top/right/bottom/left numbers. `effects/dom.js` applies that accepted context to root CSS variables and invalidates cached gesture geometry when any effective inset changes. Missing insets use zero, and a valid all-zero update clears a previous host value. Malformed updates leave the last valid context in place.

The widget uses the browser-assigned viewport and applies the four insets as padding inside a border-box `100dvh` main region. The workspace flexes into the remaining area; it does not subtract those insets a second time. The header sticks below the current top inset, and a viewport-fixed backdrop covers and intercepts input in the reserved top band while document content scrolls behind the sticky region. Its rendered height is measured by the DOM adapter for the inspector's sticky offset and available scroll height, and a changed header height invalidates gesture geometry. Insets never infer host chrome dimensions or add fixed ChatGPT/mobile offsets. A synthetic browser host verifies local geometry and context updates; actual ChatGPT iOS overlap and device safe-area behavior remain unverified until measured in the deployed host.

## Source tree

```text
lib/ui/
├── client.ts                         composition root
├── ports.ts                          host, ID, and message effect contracts
├── application/
│   └── controller.ts                 state transitions, normalization, orchestration
├── components/
│   ├── inspector-panel.ts            inspector rendering from typed view data
│   └── outline-list.ts               outline rendering from typed row data
├── effects/
│   ├── diagnostics.ts                optional diagnostics port
│   ├── dom.d.ts                      DOM adapter type boundary
│   ├── dom.js                        generated-resource DOM events and rendering
│   ├── host.ts                       trusted bidirectional transport and display-mode adapter
│   ├── tool-client.ts                tool request/response adapter
│   └── verification.ts               response-discard verification adapter
└── model/
    ├── autosave.ts                   pure save planning and acknowledgment
    ├── catalog-drafts.ts             pure Project/Tag draft state
    ├── catalog-tree.ts               pure catalog occurrence projection
    ├── controls.ts                   pure control availability decisions
    ├── date-input.ts                 pure calendar/date input decisions
    ├── display.ts                    pure display and host-context data
    ├── drafts.ts                     pure action draft state
    ├── gesture.ts                    pure gesture and interaction transitions
    ├── icons.ts                      static icon markup
    ├── interaction.ts                pure typed occurrence selection and interaction state
    ├── movement.ts                   pure movement decisions and indexes
    ├── navigation.ts                 pure view and picker navigation
    ├── operations.ts                 pure operation and recovery state
    ├── picker.ts                     pure picker filtering and ranking
    ├── presentation.ts               pure text and presentation helpers
    ├── selection-context.ts          confirmed selection projection and Action eligibility
    ├── save-status.ts                pure save-status projection
    ├── transient-create.ts           pure temporary creation state
    ├── tree-drop.ts                  pure tree-drop decisions
    ├── types.ts                      data-only UI state and snapshot DTOs
    ├── ui-projections.ts             deterministic row, inspector, and chooser DTOs
    └── view-state.ts                 pure view and acknowledgment decisions
```

## Dependency direction

| Source | May depend on | Must not depend on |
| --- | --- | --- |
| `model/` | `model/`, pure `lib/domain/`, data-only standard values | `ports.ts`, `application/`, `components/`, `effects/`, DOM or host capabilities |
| `ports.ts` | `model/` data types and other port declarations | `application/`, `components/`, `effects/` implementations |
| `application/` | `model/`, `ports.ts`, other `application/` modules | `components/`, `effects/`, browser globals, direct host communication |
| `components/` | `model/`, other `components/`; injected `Document` and element references for local rendering | `application/`, `ports.ts`, `effects/`, ambient browser globals, host communication |
| `effects/tool-client.ts` | `model/`, `ports.ts`, pure `lib/domain/`, its own module | `application/`, `components/`, other effects and ambient browser globals |
| other `effects/` | `model/`, `ports.ts`, `application/`, `components/`, other `effects/` | — |
| `client.ts` | all UI layers to construct the runtime | — |

`model/types.ts` carries serializable UI state and result DTOs only. Private callback-bearing unknown requests are retained inside the controller and projected to callback-free public state. Ports describe capabilities outside the pure model; the model never imports a port or adapter.

## Enforcement and limits

`eslint.config.mjs` applies the `architecture/dependency-direction` rule across `lib/ui/`. It covers `.ts`, `.tsx`, `.mts`, `.js`, `.jsx`, and `.mjs` modules, resolves local extensionless paths and `@/` aliases, and checks ordinary imports, type imports (including inline `import()` types), import-equals declarations, re-exports, `require`, and dynamic imports. The restricted tool-client edge applies to these extensions as well. Application and component files are checked for concrete ambient effects such as global `window`, `document`, `fetch`, `Date.now`, `Math.random`, timers, browser storage and host APIs. Components are DOM renderers: they may mutate only the `Document` and elements passed to them, while ambient DOM access and host communication remain in `effects/dom.js`. The model also rejects named DOM and host capability types. `effects/tool-client.ts` has a narrower dependency rule than the other effect adapters and can depend only on the model, ports, pure domain, and its own module. Any source file added directly under `lib/ui/` must first be assigned to a layer; unclassified paths fail lint instead of becoming unrestricted.

`tests/harness/architecture-fixtures.test.mjs` runs positive and negative fixtures through the actual repository ESLint configuration. The fixtures exercise model-to-component and model-to-port type dependencies, component-to-controller re-exports, controller-to-DOM re-exports and non-static dynamic imports, ambient browser effects, new sibling application paths, and unclassified UI paths.

These checks enforce the repository's concrete closed module architecture and enumerate common ambient capabilities. They are not a proof that arbitrary JavaScript is effect-free; review and tests remain necessary when adding a new runtime capability or changing a boundary.
