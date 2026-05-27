# Base DSL Rules (Seeded from Analysis)

## Component Structure
- Every component has: \`id\`, \`type\`, \`category\`, \`properties\`.
- Some components have nested \`components\` (like \`sub-section\`, \`stack\`, \`input-grid\`).
- Component ID format is generally a random string/UUID generated via \`generateRandomId()\`.

## Valid Component Types
- Containers: \`sub-section\`, \`form\`, \`tabs\`, \`accordion-group\`, \`stack\`, \`repeatable-sub-section\`, \`input-grid\`, \`form-row\`
- Inputs: \`input\`, \`button-v2\`, \`multi-action-cta\`, \`input-table\`, \`date\`, \`file-upload\`, \`image-capture\`, \`text-area\`, \`transfer-list\`, \`time\`
- Choices: \`select\`, \`multi-select\`, \`checkbox-group\`, \`radio-group\`, \`toggle-button\`, \`numeric-slider\`
- Display: \`table\`, \`heading\`, \`typograph\`, \`data-grid\`, \`image\`, \`stepper\`, \`tree-structure\`
- Utilities: \`spacer\`, \`divider\`, \`hidden-field\`, \`condition-builder\`, \`maps\`, \`route-plan\`
- Domain: \`financial-details\`, \`questionnaire\`, \`contact\`, \`workflow-stage\`, \`external-integration\`, \`payment-checkout\`, \`collection-dashboard-table\`

## Routing / Page Connections
- Pages are connected via \`pageCode\` property, which is a unique slug (often prefixed with microsite name).
- For button/CTA actions, \`actionType\` might be set to \`routing\`, with target routing info within the component properties or global application logic referencing the \`pageCode\`.

## Write Rules
- Always propose via propose_dsl_patch tool
- Never modify DSL inline in conversation
- Validate all JSON Pointer paths before proposing
- A Page update happens by sending the ENTIRE DSL via PUT. No partial updates on the server.
