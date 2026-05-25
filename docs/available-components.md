[Back: Overview](overview.md) | [Next: Component Properties](component-properties.md)

# Panels & Components

UI Configurator provides a set of panels and components you can use to build your UI. Here’s how to use them in practice:

## Panels (Property Editors)

Panels appear when you select a component. They let you change how the component looks and behaves. Below is a table of all available panels and their main functions:

| Panel Name           | Main Functions & Usage                                                             |
| -------------------- | ---------------------------------------------------------------------------------- |
| TextPanel            | Change labels, placeholder text, helper text, and formatting                       |
| LayoutPanel          | Adjust width, height, columns, alignment, and spacing                              |
| IconPanel            | Add or edit icons, set their size and position                                     |
| ActionPanel          | Set up API calls, button actions, and triggers                                     |
| DataPanel            | Connect tables/lists to data sources, enable search, multi-select, session storage |
| StylePanel           | Change background, borders, padding, and clickable areas                           |
| ConditionalPanel     | Show/hide components or sections based on user actions or data                     |
| InputValidationPanel | Add validation rules, error messages, and input restrictions                       |
| PrefillDataPanel     | Pre-populate fields from APIs or other sources                                     |
| InterceptorsPanel    | Add advanced logic for data manipulation or event handling                         |
| PageSettingsPanel    | Configure popups, page titles, and descriptions                                    |
| DataTransferPanel    | Pass data between screens or components                                            |
| DataColumnPanel      | Manage table columns, sorting, and pagination                                      |
| TabsPanelV2          | Set up tabbed layouts                                                              |
| InputGridPanel       | Edit grid headers and footers                                                      |
| FooterPanel          | Add calculated columns and footers                                                 |
| ConstantsPanel       | Manage constants and specs                                                         |
| MetadataPanel        | Add metadata for search or integration                                             |

## Components (Visual Elements)

| Component       | Type                | Panels                 | Properties                                                                                                                                                                                     | Usage                                                                                                                       |
| --------------- | ------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| CTA (Button)    | Action Component    | ActionPanel, TextPanel | [label](component-properties.md#label), [showLabel](component-properties.md#showlabel), [actionType](component-properties.md#actiontype)                                                       | Primary actions like submit, next, or custom triggers. Supports API calls and routing.                                      |
| Data Grid       | Data Component      | DataPanel              | [showLabel](component-properties.md#showlabel), [label](component-properties.md#label), [columns](component-properties.md#columns)                                                             | Display tabular data with sorting, filtering, and pagination. Connect to APIs for dynamic data.                             |
| Date Picker     | Form Component      | TextPanel              | [label](component-properties.md#label), [format](component-properties.md#format), [minDate](component-properties.md#mindate), [maxDate](component-properties.md#maxdate)                       | Date selection in forms. Supports validation, formatting, and min/max date restrictions.                                    |
| Form            | Container Component | FormPanel              | [name](component-properties.md#name), [prefillApiUrl](component-properties.md#prefillapiurl), [prefillResponseBodySpecs](component-properties.md#prefillresponsebodyspecs)                     | Group input fields and manage data entry. Supports API prefill and response parsing. Ideal for onboarding, data collection. |
| Heading         | Visual Component    | TextPanel              | [level](component-properties.md#level), [text](component-properties.md#text), [textAlign](component-properties.md#textalign)                                                                   | Page titles, section headers, and important labels. Supports multiple heading levels and alignment.                         |
| Input Grid      | Form Component      | DataPanel              | [name](component-properties.md#name), [label](component-properties.md#label), [rowHeaders](component-properties.md#rowheaders), [columnHeaders](component-properties.md#columnheaders)         | Grid-based data entry, such as matrices or tabular forms. Supports custom headers and validation.                           |
| Input Table     | Form Component      | DataPanel              | [label](component-properties.md#label), [showLabel](component-properties.md#showlabel), [inputColumns](component-properties.md#inputcolumns)                                                   | Table-based input, such as itemized lists or multi-row forms. Supports dynamic columns and validation.                      |
| Multi Select    | Form Component      | OptionsPanel           | [label](component-properties.md#label), [showLabel](component-properties.md#showlabel), [placeholder](component-properties.md#placeholder)                                                     | Select multiple options from a list. Useful for tags, categories, or multi-choice fields.                                   |
| Questionnaire   | Form Component      | DataPanel              | [name](component-properties.md#name)                                                                                                                                                           | Survey-style forms or multi-question data collection. Supports dynamic question sets and validation.                        |
| Select          | Form Component      | OptionsPanel           | [label](component-properties.md#label), [showLabel](component-properties.md#showlabel), [options](component-properties.md#options), [isMultiSelect](component-properties.md#ismultiselect)     | Dropdown selection. Supports single or multi-select, dynamic options, and API integration.                                  |
| Single Row Form | Form Component      | FormPanel              | [name](component-properties.md#name), [submitOnChange](component-properties.md#submitonchange), [buttonPosition](component-properties.md#buttonposition)                                       | Single-row data entry, such as quick edits or inline forms. Supports auto-submit and custom button placement.               |
| Spacer          | Layout Component    | LayoutPanel            | [height](component-properties.md#height)                                                                                                                                                       | Add vertical space between components for better layout and readability.                                                    |
| Stack           | Layout Component    | LayoutPanel            | [columns](component-properties.md#columns), [columnGap](component-properties.md#columngap)                                                                                                     | Arrange components in a horizontal or vertical stack. Supports custom column count and spacing.                             |
| Sub Section     | Layout Component    | LayoutPanel            | [width](component-properties.md#width), [label](component-properties.md#label), [showLabel](component-properties.md#showlabel), [subsectionHeaders](component-properties.md#subsectionheaders) | Organize components into logical groups or sections. Supports custom width, headers, and visibility.                        |
| Table           | Data Component      | DataPanel              | [showLabel](component-properties.md#showlabel), [label](component-properties.md#label), [tableColumns](component-properties.md#tablecolumns), [linkedForm](component-properties.md#linkedform) | Display tabular data, connect to APIs, and enable row actions. Supports column configuration and linking to forms.          |
| Text Input      | Form Component      | TextPanel              | [placeholder](component-properties.md#placeholder), [label](component-properties.md#label), [showLabel](component-properties.md#showlabel), [inputType](component-properties.md#inputtype)     | Single-line text entry. Supports validation, custom input types, and placeholder text.                                      |
| Toggle Button   | Form Component      | OptionsPanel           | [label](component-properties.md#label), [checked](component-properties.md#checked)                                                                                                             | On/off switches, feature toggles, or binary choices. Supports custom labels and default state.                              |
| Typograph       | Visual Component    | TextPanel              | [text](component-properties.md#text), [textAlign](component-properties.md#textalign)                                                                                                           | Styled text, descriptions, and instructions. Supports custom formatting and alignment.                                      |

1. Add a Table to your page. Use the DataPanel to connect it to your data source and configure columns.
2. Add a Heading above the table for context.
3. Use the LayoutPanel to adjust spacing and alignment.
4. Add a Spacer for visual separation.
5. Use the ConditionalPanel to show/hide sections based on user actions.
6. Preview your dashboard and make adjustments as needed.

---

Continue to [Component Properties](component-properties.md) to learn what each property does and how to set it.

[Back: Overview](overview.md) | [Next: Component Properties](component-properties.md)
