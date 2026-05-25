# UI Configurator User Manual

Welcome to the UI Configurator! This guide will help you visually create, edit, and manage user interface configurations for business applications—no coding required. The UI Configurator lets you build screens, forms, workflows, and dashboards by assembling components, setting properties, and defining logic, all through an intuitive interface.

## How Your Configuration Powers the Live UI

When you build and export a configuration, it is saved as a JSON DSL. This JSON is then consumed by the `web-renderer-lib` (via the `MicrositeRenderer` component), which dynamically renders your UI exactly as you designed it. Every property, condition, and workflow you set up in the Configurator is faithfully executed in the live app.

**Key renderer features:**

- **MicrositeRenderer**: Entry point; renders the correct microsite and page, handling popups, notifications, and navigation.
- **PageRenderer**: Breaks pages into components, applies layout, visibility, and styling, and recursively renders nested components.
- **ComponentRenderer**: Renders each UI component using specialized “Web” components (e.g., `WebInput`, `WebForm`, `WebButton`).
- **Contexts & Hooks**: Advanced state management for forms, validation, session data, dynamic conditions, interceptors, and more.

## Workspaces: Your Central Hub

Workspaces are the central point for all configuration and design activities. From a workspace, you can:

### Microsites

Modular groups of pages tailored for specific user journeys or business needs. Each microsite can contain multiple pages and is ideal for delivering targeted experiences. Use the workspace to create, organize, and configure microsites for different business scenarios.

### Pages

Pages are flexible layouts with components, used as user tasks within workflows or as standalone screens in digital DIY customer journeys. Pages in the workspace are separate from microsite pages and can be reused across workflows. Design and manage pages to support a variety of user interactions and business processes.

#### Versions & Statuses (Microsites & Pages)

- **Versions**: Both microsites and pages can have multiple versions (drafts, published, archived, etc.), allowing you to iterate and improve without affecting live experiences.

| Status    | Description                                                               | Visible to End Users? |
| --------- | ------------------------------------------------------------------------- | --------------------- |
| Draft     | Initial version, editable, not yet reviewed or published                  | No                    |
| In Review | Under review, not yet published                                           | No                    |
| Published | Live version, available for use in portal UI and customer-facing journeys | Yes                   |
| Archived  | Old or deprecated version, not available for use                          | No                    |

- **Publishing**: When you are ready to make a microsite or page live, publish the desired version. Only published versions are visible to end users and can be integrated into live applications, workflows, and customer journeys.

### Workflows

Automate multi-step processes and user actions to deliver consistent, guided experiences. Workflows orchestrate portal tasks, journey tasks, system tasks, business rule tasks and many more, allowing you to define the flow of information and actions across your application. Build and manage workflows to streamline business operations.

### Business Rules

Configure dynamic business logic to personalize content and control behavior across workflows and pages. Rules allow for advanced personalization and automation, ensuring your application responds intelligently to user actions and data. Define and manage business rules to support your business needs.

Workspaces keep all your assets organized and make it easy to collaborate, version, and manage your business applications.

## Playground Workspace

The Playground workspace is available in the Portal UI application as a menu option. Use it to:

- Experiment with UI Configurator configurations
- Preview and test new layouts, logic, and features
- Safely play around without affecting production workspaces

This is the best place to try out new ideas, learn the tool, and validate your UI before moving to a live workspace.

## Getting Started

1. **Launch the UI Configurator**: Open the tool in your workspace by clicking on either Microsites or Pages.
2. **Create a New UI Flow**: Start a new configuration or open an existing one.
3. **Everything in Sections**: All components are added within sections, which organize your UI and manage layout.
4. **Drag & Drop Components**: Add visual elements like tables, headings, spacers, workflow stages, and more.
5. **Configure Properties**: Select any component to open its property pane. Adjust appearance, behavior, data, and logic using easy-to-understand controls organized under relevant categories.
6. **Set Up Logic**: Use panels to add conditional visibility, data transfer between screens, popups, validation, and API actions. Advanced logic is supported via interceptors, session storage, and dynamic conditions.
7. **Preview & Test**: Instantly preview your UI and test interactions. All logic, validation, and data flows are simulated as they will appear in the live app.
8. **Save & Export**: Save your configuration. The tool stores it as a JSON file (DSL) for future editing or integration. This JSON is directly consumed by the renderer library to power your live UI.

## What Can You Build?

## Components (Visual Elements)

| Component Type                | Description                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| Multi-step forms & onboarding | Build forms with validation, API integration, and dynamic logic for onboarding flows.                 |
| Loan account dashboards       | Create dashboards and worklists for loan accounts and similar business data.                          |
| Application queues            | Design login screens, application queues, and user entry points.                                      |
| Data entry & review           | Build interfaces for data entry, review, and approval workflows.                                      |
| Popups & modals               | Add custom popups, modals, and conditional screens for advanced user interactions.                    |
| Modular microsites            | Organize business needs into modular microsites, each with its own set of pages.                      |
| Reusable pages                | Create pages that can be reused across workflows and DIY customer journeys.                           |
| Interactive UIs               | Enable highly interactive UIs with conditional visibility, dynamic options, and session-driven flows. |

## How to Use Panels & Properties

**Panels**: When you select a component, a panel appears for editing its properties. For example, use the TextPanel to change labels, the LayoutPanel to adjust size and position, or the ActionPanel to set up API calls. Each panel directly maps to the renderer’s logic, so every change is reflected in the live UI.

**Properties**: Properties control everything from text and color to advanced logic like conditional rendering, validation, API integration, and data transfer. All properties are consumed by the renderer’s “Web” components, ensuring your configuration is faithfully executed.

## Example Workflow

1. Add a Table component to a page. Use the DataPanel to connect it to an API and configure columns.
2. Add a Heading and Spacer for layout.
3. Use the ConditionalPanel to show or hide sections based on user actions, API responses, or session data.
4. Set up a popup using the PageSettingsPanel and configure its width and close behavior.
5. Preview your UI and make adjustments as needed. All logic, validation, and data flows will be reflected in the live app via the renderer.

## Tips & Best Practices

**Tips & Best Practices**

- Use drag-and-drop to quickly build layouts.
- Use panels for all configuration—no need to edit JSON directly.
- Preview often to check your work. The renderer will show exactly how your configuration will behave.
- Save regularly. You can always re-open and edit your configuration.
- Use advanced panels for logic, validation, and data flows. All advanced logic (conditional, interceptors, session, etc.) is supported by the renderer.
- Use the Playground workspace to experiment and learn before deploying changes to production workspaces.

## Documentation Structure

## Documentation Structure

- [Overview](docs/overview.md): Quick start and main workflow
- [Panels & Components](docs/available-components.md): How to use each panel and component
- [Component Properties](docs/component-properties.md): What each property does and how to set it
- [Property-to-Panel Mapping](docs/component-properties-map.md): Which panel edits which property
- [Properties Panel Map](docs/properties-panel-map.md): Visual editing of advanced logic
- [Advanced Usage](docs/advanced-usage.md): Conditional logic, popups, data transfer, validation
- [API Reference](api-reference.md): For developers integrating configurations

---

For step-by-step guides and practical walkthroughs, see the sections above. Use navigation links to move through the manual. Every feature and property you configure is supported by the renderer, so your live UI will match your design and logic exactly.

[Next: Overview](overview.md)
