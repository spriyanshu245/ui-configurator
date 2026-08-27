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

## Session Data: store an API/table response and reuse it on another page

This is the end-to-end recipe for "click a row on a list page → carry that row → use one of its fields as an API path variable (or body param) on the routed-to page." There are TWO distinct ways data gets into the session; use the right one.

### A. Whole-table WRITE — store the entire fetched list (`storeDataInSession`)
On a **Table** / **DataGrid** that fetches a list, persist the whole response into session so any page can read it:
```json
"storeDataInSession": true,
"apiName": "loanAccountsList",         // the session key the response is stored under
"pathToTableData": "data.accounts",     // dot-path inside the API response to the row array
"nameKeyIds": [                          // which row fields become addressable session fields
  { "id": "lan", "label": "lan" },
  { "id": "loanTenure", "label": "loanTenure" }
]
```
- `apiName` names the stored bucket; you later read a field as `${<microsite>.<page>.<apiName>.<field>}`.
- `pathToTableData` points at the array of rows within the raw response.
- `nameKeyIds[i].label` = the session field name; `nameKeyIds[i].id` = the row/foreign key it maps to. A table column binds to one of these by setting its own `tableColumns[i].properties.name` equal to that `id` (same `name`↔`id` rule as Form `nameKeyIds`).

### B. Clickable column TRANSFER — carry just the CLICKED row (`dataTransfer`)
When a specific column is clickable and routes to a detail page, attach the clicked row as a payload on that column's `properties`:
```json
"isClickable": true,
"routingType": "Internal",
"routePage": "loan-accounts_loan-overview",
"dataTransfer": {
  "name": "selected",                    // session key the payload lands under (→ micrositeNav.<microsite>.selected)
  "body": "{ \"lan\": \"$lan\", \"tenure\": \"$loanTenure\" }"
},
"sessionKeys": "selected"                // optional: which session keys to CLEAR first
```
- `dataTransfer.name` is the session key; `dataTransfer.body` is a JSON template describing what to store.
- Body placeholder grammar: **`$field`** pulls a field from the CLICKED ROW (or a sibling form field); **`${...}`** pulls an already-stored session/API value. (Same grammar as a form's `requestBodySpecs`/`body`.)

**A vs B:** `storeDataInSession` (A) writes the WHOLE fetched list under `apiName`; a clickable column's `dataTransfer` (B) writes only the ONE row the user clicked, under `dataTransfer.name`. For "click a row then use its id on the next page", you want B (it's what populates `micrositeNav.<microsite>.selected`).

### C. CONSUME the stored data on the destination page
Two interpolation shapes — pick by what you stored:
- **Current selection** (from a clickable column's `dataTransfer.name: "selected"`): `${micrositeNav.<microsite>.selected.<field>}`. This is the usual "use the clicked row's id as a path variable":
  ```json
  "apiUrl": "/api/v1/loan-accounts/${micrositeNav.loan-accounts.selected.lan}"
  ```
- **Named stored response** (from `storeDataInSession`+`apiName`, or a Form's `prefillApiName`): `${<microsite>.<page>.<apiName>.<field>}`, e.g. `${loan-accounts.loan-overview.loanAccountOverview.loanTenure}`.
- In a request BODY (form submit / action), reuse the same placeholder grammar: `$siblingFormField` for a value typed on the current page, `${...}` for a stored session value.

### D. Other session read/write knobs
- `storePrefillInSession: true` + `prefillApiName` (on a **Form**) — persist the form's prefill response; read children as `${...apiName.field}` (see Form Rules).
- `fetchFromSession: true` + `sessionPath: "<micrositeNav...path>"` — read a previously stored value straight into a component.
- `storeInputApiInSession` — persist an input's own API result into session.
- `storeSelectedInSession` — persist the user's current selection into session.

### E. Worked example — list → detail via a path variable
1. **List page** `loan-accounts_list`: a Table fetches `/api/v1/loan-accounts`. Its `lan` column is clickable:
   `isClickable: true`, `routingType: "Internal"`, `routePage: "loan-accounts_loan-overview"`, `dataTransfer: { "name": "selected", "body": "{ \"lan\": \"$lan\" }" }`.
2. User clicks a row → the clicked row's `lan` is stored at `micrositeNav.loan-accounts.selected.lan`, and the editor routes to the overview page.
3. **Detail page** `loan-accounts_loan-overview`: a Form/Table/DataGrid sets `apiUrl: "/api/v1/loan-accounts/${micrositeNav.loan-accounts.selected.lan}"` — the clicked `lan` flows in as the path variable.
Because this spans two pages, apply it with `propose_dsl_batch` (one operation per page).

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

## Improving the Knowledge Base (learn as you work)

You have two tools for making future sessions smarter — use them judiciously, not on every turn:
- **`record_skill`** — after you work out a NOVEL, reusable DSL recipe that WORKED and isn't already covered here (e.g. a multi-step session-data binding, a routing+popup wiring, a fix for a non-obvious error), save a concise how-to that names the exact property keys. One high-quality entry beats several thin ones. Do NOT record trivial edits (label/text/color), one-off page-specific facts, or things already in this document.
- **`log_user_preference`** — when the user states a DURABLE choice about how they like things done (naming convention, default styling/spacing, a preferred component, a workflow habit like "always confirm before deleting"), persist it with a stable snake_case `key`. Do NOT log one-off, page-specific facts.
- Learned entries are compiled into a separate "LEARNED FROM PAST SESSIONS" layer and are treated as helpful priors — this curated base and the user's explicit instructions always win.

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
