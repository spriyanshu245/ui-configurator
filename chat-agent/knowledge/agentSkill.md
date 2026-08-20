# DSL Page Builder Knowledge

## DSL Rules

- Only use component types listed in the Component Registry.
- Ensure all required properties are populated.
- Use valid UUIDv4 strings for component `id` fields.

## Component Catalog

- **Heading**: Displays heading text (`text`).
- **Typograph**: General text display with variants (`text`).
- **ButtonV2**: Interactive element for actions/routing (`label`).
- **Input**: Text input for users (`name`, `label`).
- **FormRow**: Groups components horizontally.
- **Stack**: Container for stacking components vertically or horizontally.
- **DataGrid**: Displays data in a structured column format.
- **Table**: Displays tabular data, requires columns definition.
- **Form**: Wrapper component to group inputs, handles prefill/submission APIs.
- **SubSection**: Visually groupings inside forms/stacks.

## Component Patterns

- **Layout**: Stacks define layout rules (`columns`, `columnWidths`, `columnGap`, `justification`).
- **Forms**: Often wrap `sub-section` components which then wrap `data-grid` or `spacer` elements.
- **Properties Panel**: Each component has specific panels mapped to its properties (e.g. `DataTransferPanel` maps to `dataTransfer`).

## Form Rules

- `nameKeyIds` on the Form maps a user-friendly `label` to a UUID (`id`).
- Child input components (like data-grid, table, etc.) register themselves within the form by setting their `name` property to match the `id` of a `nameKeyId`.
- Form API data can be saved to the session state by setting `storePrefillInSession: true` and defining a `prefillApiName` (e.g., `"loanAccountOverview"`).
- Once saved, child components can reference that session data. Example: `value: "${pageId.prefillApiName.dataField}"`.

## Session & sessionDataConfiguration

- In DSL, components can pass data into the session to be retrieved by other components or pages.
- Example pattern from code: Data flow between pages is often setup via `dataTransfer: { body: "{...}" }` on actions (buttons/table actions).
- Using `sessionKeys` string (comma-separated), the `Clear session on click` logic can optionally clear data from the session state upon an action.
- When injecting session data into values, use the syntax `${pageSlug.sessionObject.field}`.
  - For example, if a Form has `storePrefillInSession: true` and `prefillApiName: "loanAccountOverview"`, you can access `loanTenure` like so: `${micrositeNav.loan-accounts.selected.loanTenure}` or `${loan-accounts.loan-overview.loanAccountOverview.loanTenure}`.
- Components fetching data (like Table/DataGrid) can setup their `apiUrl` with session interpolation: `"/api/v1/loan-accounts/${micrositeNav.loan-accounts.selected.lan}"`.

## Navigation Patterns

- Components like buttons or table columns can act as navigators by configuring specific routing properties.
- `routingType` determines the type of navigation:
  - **Internal**: Navigates to another page within the same microsite. Set `routePage: "page-code-value"` (e.g., `"untitled-7"`).
  - **External**: Navigates to an external link. Set `externalURL: "https://..."`.
  - **Microsite**: Navigates to another microsite entirely. Use `routeMicrosite` (slug of target microsite) and `routeMicrositeVersion`.
  - **SamePage**: Triggers action without changing the URL.
- Advanced Navigation configurations:
  - `navigateWithoutDataTransfer`: Set to `true` to navigate without passing session context payload.
  - `routeOnActionSuccess`: A boolean that triggers routing only after an API action succeeds.
  - `isConditional`: Set to `true` and configure `conditionalRoutes` to navigate dynamically based on state.
  - `isDynamicRouting`: Enable and configure `routeKey` to fetch route from session dynamically.
- Example snippet for internal routing:
  ```json
  "actionType": "routing",
  "routingType": "Internal",
  "routePage": "untitled-7",
  "navigateWithoutDataTransfer": true
  ```

## Routing & pageCode

- Pages are identified primarily by `pageCode`. Internal routing relies heavily on this property to point actions directly to another page's ID.

## Creating a New Page

- To add a page, call the `propose_create_page` tool with a `suggested_name` inferred from the user's request (they can edit it). This opens an input card where the user confirms the NAME and ticks an "Open as popup" checkbox, then submits.
- You do NOT choose the page `code` or `slug` — they are derived server-side from the name: `slug = lowercase, non-alphanumerics → dashes`; `code = "<micrositeId>_<slug>"`. The code is the page's unique identifier.
- After the user submits, the page is created (POST /config/pages + the microsite's page list is updated) and the editor AUTO-NAVIGATES to the new page. You then receive a tool result with the real `pageCode` — use THAT exact code for any subsequent routing/config.
- Do NOT call `get_page_dsl` or try to patch a page you have only *proposed* — wait until it is actually created (you'll get the pageCode back).
- If the user ticked "Open as popup", the new page is already configured as a popup (right-aligned, 40% width, close-on-backdrop) — you don't need to patch those unless the user wants different values.

## Navigating the Editor

- Use the `navigate_to_page` tool to switch the configurator to an existing page by its `pageCode` (e.g. "show me the overview page", or to let the user see a change you just made). This is non-destructive and needs no approval. The page must already exist.

## Routing a Control to a Page (assign a page as a route target)

Routing config lives in the SOURCE component's `properties` (except tabs). To point a control at a page, set:
- **Button (`button-v2`), `form`, `stack`, `repeatable-sub-section`**:
  ```json
  "actionType": "routing",
  "routingType": "Internal",
  "routePage": "<target pageCode>",
  "navigateWithoutDataTransfer": true   // optional: skip passing session data
  ```
  (For a submit button that routes only after its API succeeds, use `actionType: "submit"` + `routeOnActionSuccess: true` instead of `actionType: "routing"`.)
- **Table column** — two shapes:
  - Single clickable column: `properties.isClickable: true`, `properties.routingType: "Internal"`, `properties.routePage: "<pageCode>"`.
  - Multi-action column (`columnInputType: "multiple-actions"`): the route is nested per action — `properties.multipleActions[i].routeConfig = { "routingType": "Internal", "routePage": "<pageCode>" }`.
- **Tabs** — each tab in a `tabs` component references its page via a BARE `pageCode` field on the tab object (a sibling of `properties`, NOT inside it, and with NO `routingType`):
  ```json
  { "id": "<uuid>", "pageCode": "<target pageCode>", "properties": { "title": "Tab label" } }
  ```
- **Dynamic / conditional routing** (advanced): `isDynamicRouting: true` + `routeKey: "<session key>"` resolves the target page from session at runtime; or `isConditional: true` + `conditionalRoutes: [{ condition, route, onCloseAction? }]` to route based on a runtime condition.

## Configuring a Page as a Popup

Popup config is a PAGE-LEVEL property on the TARGET page's DSL (`properties`), NOT part of the routing action. There is NO `routingType: "Popup"` — you route to a `pageCode` and that page's own `showAsPopup` decides whether it renders as a popup.
- Set on the popup page's top-level `properties`:
  ```json
  "showAsPopup": true,
  "panePosition": "right",        // alignment: "left" | "right" | "center" | "bottom"
  "popupWidth": 40,                // size: 0-100 (%)
  "closeOnBackdropClick": true,    // close when clicking outside
  "showTitle": true
  ```
- Defaults when created via the popup checkbox: right / 40% / close-on-backdrop on / show title. If the user asks to change alignment ("center it"), size ("make it 60%"), or backdrop behavior, patch just those `properties` on the page.
- The routing control gains an `onCloseAction` option only when its target page is a popup.

## Multi-Page Changes (routing + popup together)

- "Add a page, route a button to it, and make it a popup" spans two pages: the SOURCE page (where the button gets its routing config) and the NEW page (popup config). After the page is created, use `propose_dsl_batch` to change BOTH pages atomically in one approved batch — do NOT try to do them as two separate single-page patches. Each batch operation targets a different `page_path`.

## Common Operations

- To update form values automatically: configure the form's `prefillApiUrl` with session interpolated paths.
- To clear form session: set `Clear session on click` via `sessionKeys`.

## Error Fixes

- Issue: Child inputs not appearing in form submission. Fix: Ensure child component `name` matches a UUID from the Form's `nameKeyIds` array.
- Issue: Variables not interpolating in URLs. Fix: Ensure proper syntax `${variable}` and confirm the variable exists in the mapped session store.

## Low Confidence Entries

- Complex conditional routing rules might need manual verification through the UI depending on nested session keys logic.

## Conditional Rendering Rules

- **Enabling Conditions**: To apply conditional logic, set `"isConditionalComponent": true` on a component.
- **Available Conditional Props**: `visibilityConditions`, `enableDisableConditions`, `requiredFieldConditions`, and `dynamicOptions`.
- **Condition Object Structure**:
  - `parentNames`: An array of session keys or component IDs to watch. E.g., `["${micrositeNav.loan-accounts.selected.loanStatus}"]` or `["component-uuid"]`.
  - `conditions`: An object where keys are expected values and values are boolean outcomes (`true`/`false`).
- **Condition Operators**:
  - Exact match: `"EXPECTED_VALUE": true`
  - Null check: `"!null": true` (Triggers if the parent value is not null/empty).
- **Example Usage**:
  ```json
  "isConditionalComponent": true,
  "visibilityConditions": {
    "parentNames": ["${loan-accounts.loan-overview.amort-controls.loanAccountMorats}"],
    "conditions": {
      "!null": true,
      "ACTIVE": true,
      "CLOSED": false
    }
  }
  ```
- **Form Linking**: Inside a form, conditionals often watch the ID (`nameKeyId`) of another input component. If watching another input component, use its UUID in the `parentNames` array. If watching a session variable, use the `${...}` syntax.
