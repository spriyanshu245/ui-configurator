[Back: Panels & Components](available-components.md) | [Next: Property-to-Panel Mapping](component-properties-map.md)

# Component Properties

Properties control how each component looks, behaves, and interacts with other parts of your UI. You set these using the panels—no coding required.

---

## Properties (A-Z)

### <a id="actionType"></a>actionType

**Description**
Type of action (e.g., routing, submit).

**Values** - `submit`: Submits a form - `route`: Navigates to another page - `custom`: Triggers a custom action

**Example Usage**
Set the action type for a button in the ActionPanel. For example, select "submit" to make the button submit a form, or "route" to navigate to another page.

### <a id="apiHeaders"></a>apiHeaders

**Description**
Custom headers for API requests.

**Values**

- Object with key-value pairs, e.g.:
  - `Authorization`: string (e.g., "Bearer <token>")
  - `Content-Type`: string (e.g., "application/json")

**Example Usage**
Add custom headers to API requests made by a Form component. Enter key-value pairs such as Authorization and Content-Type in the API Headers section of the DataPanel.

### <a id="apiKey"></a>apiKey

**Description**
Key used for API requests.

**Values**

- String (e.g., "searchKey")
- Used for authentication or data lookup in API requests

**Example Usage**
Enter the API key in the property pane for Form components to enable secure data fetching.

### <a id="apiUrl"></a>apiUrl

**Description**
API endpoint for data or actions.

**Values**

- String (e.g., "/api/user/details")
- Must be a valid URL or endpoint path

**Example Usage**
Set the API endpoint in the property pane to connect your Form or data component to backend data or actions.

### <a id="backgroundColor"></a>backgroundColor

**Description**
Background color of a component.
**Values** - String (hex, rgb, or named color, e.g., "#f5f5f5", "red") - Use the color picker in the StylePanel

**Example Usage**
Select a background color for a Section, Table, or other component using the StylePanel color picker.

```json
{
  "type": "Section",
  "backgroundColor": "#f5f5f5"
}
```

### <a id="borderColor"></a>borderColor

**Description**
Border color of a component.

**Values**

- String (hex, rgb, or named color, e.g., "#cccccc", "blue")
- Use the color picker in the StylePanel

**Example Usage**
Set the border color for a Table, Section, or other component using the StylePanel color picker.

### <a id="borderRadius"></a>borderRadius

**Description**
Border radius for rounded corners.

**Values**

- Number (pixels, e.g., 8)
- Controls the roundness of corners

**Example Usage**
Adjust the border radius in the StylePanel to create rounded corners for Sections, Tables, or other components.

### <a id="buttonPosition"></a>buttonPosition

**Description**
Position of button in a form.

**Values**

- "left": Button appears on the left
- "right": Button appears on the right
- "center": Button appears in the center

**Example Usage**
Choose the button position in the FormPanel for Single Row Form components to control layout.

### <a id="checked"></a>checked

**Description**
Whether a toggle or checkbox is checked.

**Values**

- Boolean: true (checked), false (unchecked)
- Default state for Toggle Button or Checkbox

**Example Usage**
Set the default checked state using the toggle switch in the OptionsPanel for Toggle Button or Checkbox components.

### <a id="closeOnBackdropClick"></a>closeOnBackdropClick

**Description**
Close popup when clicking outside.

**Values**

- Boolean: true (enabled), false (disabled)

**Example Usage**
Enable this property in the PageSettingsPanel to allow users to close popups by clicking outside the popup area.

### <a id="columnGap"></a>columnGap

**Description**
Gap between columns.

**Values**

- Number (pixels, e.g., 16)
- Controls spacing between columns in Stack, Form Row, etc.

**Example Usage**
Set the gap between columns in the LayoutPanel for Stack or Form Row components to adjust spacing.

### <a id="columnHeaders"></a>columnHeaders

**Description**
Column headers for grids/tables.

**Values**

- Array of strings (e.g., ["Name", "Amount", "Status"])

**Example Usage**
Specify column headers in the DataPanel for Input Grid or Table components to label each column.

### <a id="columns"></a>columns

**Description**
Number of columns in a layout or grid.

**Values**

- Number (e.g., 2, 3, 4)
- Controls the number of columns in Stack, Form Row, etc.

**Example Usage**
Set the number of columns in the LayoutPanel for Stack or Form Row components to organize layout.

### <a id="conditionalRoutes"></a>conditionalRoutes

**Description**
Routes based on conditions.

**Values**

- Array of route objects, each with:
  - `route`: string (destination)
  - `condition`: expression or reference

**Example Usage**
Configure conditional navigation for Button or CTA components in the ActionPanel to route users based on logic or data.

### <a id="contactType"></a>contactType

**Description**
Type of contact input (e.g., mobile, email).

**Values**

- "mobile": Mobile number input
- "email": Email input
- "phone": Landline input

**Example Usage**
Select the type of contact input in the Contact component’s property pane (e.g., mobile, email, phone).

**Description**
Type of contact input (e.g., mobile, email).

**Example Usage**

```json
{
  "type": "Contact",
  "contactType": "email"
}
```

### <a id="dataTransfer"></a>dataTransfer

**Description**
Data passed between screens/components.

**Values**

- Object with:
  - `from`: string (source screen/component)
  - `to`: string (destination screen/component)
  - `fields`: array of strings (data fields to transfer)

**Example Usage**
Configure data transfer in the DataTransferPanel to pass specific fields between screens or components.

**Description**
Data passed between screens/components.

**Example Usage**

```json
{
  "type": "DataTransferPanel",
  "dataTransfer": {
    "from": "PageA",
    "to": "PageB",
    "fields": ["userId", "accountId"]
  }
}
```

### <a id="description"></a>description

**Description**
Description for a page or popup.

**Values**

- String (e.g., "This popup allows you to edit account details.")

**Example Usage**
Enter a description for your page or popup in the PageSettingsPanel. This text will appear as a subtitle or helper text in the UI.

**Description**
Description for a page or popup.

**Example Usage**

```json
{
  "type": "PageSettingsPanel",
  "description": "This popup allows you to edit account details."
}
```

### <a id="disabled"></a>disabled

**Description**
Whether a field/component is disabled.

**Values**

- Boolean: true (disabled), false (enabled)

**Example Usage**
Toggle whether a field or component is enabled or disabled using the switch in the property pane. Disabled fields cannot be edited by the user.

**Description**
Whether a field/component is disabled.

**Example Usage**

```json
{
  "type": "Text Input",
  "disabled": true
}
```

### <a id="financialDetails"></a>financialDetails

**Description**
Financial details configuration.

**Values**

- Object with financial configuration fields (varies by use case)

**Example Usage**
Configure financial details for a component using the Financial Details panel.

### <a id="format"></a>format

**Description**
Format for date or number fields.

**Values**

- String (e.g., "MM/DD/YYYY", "0.00")
- Controls display format for dates or numbers

**Example Usage**
Set the format for date or number fields in the property pane (e.g., Date Picker, Number Input).

### <a id="fromListTitle"></a>fromListTitle

**Description**
Title for source list in transfer.

**Values**

- String (e.g., "Available Items")

**Example Usage**
Set the title for the source list in Transfer List components to label the available items.

### <a id="helperText"></a>helperText

**Description**
Helper text for inputs.

**Values**

- String (e.g., "Enter your name")
- Shown below or beside the input field

**Example Usage**
Add helper text to inputs in the property pane to guide users (e.g., Text Input, Table Column).

### <a id="height"></a>height

**Description**
Height of a component or spacer.

**Values**

- Number (pixels, e.g., 32)
- Controls vertical space

**Example Usage**
Set the height for a Spacer or other component in the LayoutPanel to adjust vertical spacing.

### <a id="iconPosition"></a>iconPosition

**Description**
Position of the icon (left, right, etc.).

**Values**

- "left": Icon appears on the left
- "right": Icon appears on the right
- "center": Icon appears in the center (if supported)

**Example Usage**
Choose the icon position in the IconPanel for Button, Table Column, or other components.

### <a id="iconSize"></a>iconSize

**Description**
Size of the icon.

**Values**

- Number (pixels, e.g., 24)
- Controls icon size

**Example Usage**
Set the icon size in the IconPanel for Button, Table Column, or other components.

### <a id="iconSpacing"></a>iconSpacing

**Description**
Spacing around the icon.

**Values**

- Number (pixels, e.g., 8)
- Controls space between icon and text

**Example Usage**
Adjust icon spacing in the IconPanel for Button, Table Column, or other components.

### <a id="iconUrl"></a>iconUrl

**Description**
URL for an icon image.

**Values**

- String (URL, e.g., "https://example.com/icon.png")

**Example Usage**
Set the icon image URL in the IconPanel for Button, Table Column, or other components.

### <a id="inputColumns"></a>inputColumns

**Description**
Columns for input tables.

**Values**

- Array of column objects (e.g., label, type, validation)

**Example Usage**
Configure columns for Input Table components in the DataPanel to define each input field.

### <a id="inputType"></a>inputType

**Description**
Type of input field (text, number, etc.).

**Values**

- "text": Single-line text input
- "number": Numeric input
- "date": Date input
- "email": Email input
- "password": Password input
- (other types as supported)

**Example Usage**
Select the input type in the property pane for Text Input or other input components.

### <a id="interceptors"></a>interceptors

**Description**
Advanced logic for data manipulation.

**Values**

- Array of interceptor objects (custom logic, event handlers)

**Example Usage**
Configure interceptors in the InterceptorsPanel to add advanced logic for data manipulation or event handling.

### <a id="isCollapsible"></a>isCollapsible

**Description**
Whether a section is collapsible.

**Values**

- Boolean: true (collapsible), false (not collapsible)

**Example Usage**
Enable collapsibility for a section in the LayoutPanel or property pane to allow users to expand/collapse content.

### <a id="isFetchingFromApi"></a>isFetchingFromApi

**Description**
Fetch options/data from API.

**Values**

- Boolean: true (fetch from API), false (static options)

**Example Usage**
Enable this property in the DataPanel for Select or Multi Select components to fetch options dynamically from an API.

### <a id="isMultiSelect"></a>isMultiSelect

**Description**
Enable multi-select for options.

**Values**

- Boolean: true (multi-select enabled), false (single-select)

**Example Usage**
Enable multi-select in the property pane for Select, Multi Select, or File Upload components to allow multiple selections.

### <a id="label"></a>label

**Description**
Display label for input, button, or section.

**Values**

- String (e.g., "First Name", "Submit")

**Example Usage**
Set the display label for a component in the property pane (e.g., Text Input, Select, Table).

### <a id="level"></a>level

**Description**
Heading level (e.g., H1, H2, H3).

**Values**

- "H1", "H2", "H3", "H4", "H5", "H6"

**Example Usage**
Choose the heading level in the property pane for Heading components to set the importance and style.

### <a id="linkedForm"></a>linkedForm

**Description**
Form linked to a table for actions.

**Values**

- String (form name or identifier)

**Example Usage**
Link a form to a Table component in the DataPanel to enable row actions or editing.

### <a id="maxDate"></a>maxDate

**Description**
Maximum selectable date.

**Values**

- String (date, e.g., "2025-12-31")
- Controls the latest date a user can select

**Example Usage**
Set the maximum selectable date in the property pane for Date Picker components.

### <a id="maxLength"></a>maxLength

**Description**
Maximum length for input.

**Values**

- Number (e.g., 50)
- Limits the number of characters allowed

**Example Usage**
Set the maximum input length in the property pane for Text Input components.

### <a id="maxValue"></a>maxValue

**Description**
Maximum value for input.

**Values**

- Number (e.g., 100)
- Limits the maximum value allowed

**Example Usage**
Set the maximum value in the property pane for Number Input components.

### <a id="minDate"></a>minDate

**Description**
Minimum selectable date.

**Values**

- String (date, e.g., "2025-01-01")
- Controls the earliest date a user can select

**Example Usage**
Set the minimum selectable date in the property pane for Date Picker components.

### <a id="minLength"></a>minLength

**Description**
Minimum length for input.

**Values**

- Number (e.g., 3)
- Requires a minimum number of characters

**Example Usage**
Set the minimum input length in the property pane for Text Input components.

### <a id="minValue"></a>minValue

**Description**
Minimum value for input.

**Values**

- Number (e.g., 1)
- Limits the minimum value allowed

**Example Usage**
Set the minimum value in the property pane for Number Input components.

### <a id="name"></a>name

**Description**
Name/identifier for a component.

**Values**

- String (unique name or identifier)

**Example Usage**
Set the name or identifier for a component in the property pane (e.g., Input, Form, File Upload).

### <a id="optionHelperText"></a>optionHelperText

**Description**
Helper text for options.

**Values**

- String (e.g., "Select one or more options")

**Example Usage**
Add helper text for options in Checkbox Group or Select components to guide users.

### <a id="options"></a>options

**Description**
List of selectable options.

**Values**

- Array of option objects (label, value, etc.)

**Example Usage**
Configure selectable options in the property pane for Select, Checkbox Group, or other components.

### <a id="pattern"></a>pattern

**Description**
Regex pattern for validation.

**Values**

- String (regex, e.g., "^[A-Za-z0-9]+$")

**Example Usage**
Set a regex pattern for input validation in the property pane for Text Input components.

### <a id="placeholder"></a>placeholder

**Description**
Placeholder text shown in input fields.

**Values**

- String (e.g., "Enter your name")

**Example Usage**
Set placeholder text in the property pane for Text Input or Select components.

### <a id="popupWidth"></a>popupWidth

**Description**
Width of a popup/modal.

**Values**

- Number (pixels, e.g., 400)
- Controls popup width

**Example Usage**
Set the width for popups in the PageSettingsPanel.

### <a id="prefillApiUrl"></a>prefillApiUrl

**Description**
API to prefill form data.

**Values**

- String (URL or endpoint)

**Example Usage**
Set the API endpoint to prefill form data in the property pane for Form or Single Row Form components.

### <a id="prefillResponseBodySpecs"></a>prefillResponseBodySpecs

**Description**
Specs for parsing API response.

**Values**

- Object with response parsing configuration

**Example Usage**
Configure response parsing specs in the property pane for Form components to extract data from API responses.

### <a id="questionnaire"></a>questionnaire

**Description**
Questionnaire configuration.

**Values**

- Object with questionnaire setup (questions, options, etc.)

**Example Usage**
Configure questionnaire details in the Questionnaire panel.

### <a id="required"></a>required

**Description**
Whether a field is required.

**Values**

- Boolean: true (required), false (optional)

**Example Usage**
Set whether a field is required in the property pane for Text Input, Select, or other components.

### <a id="rowHeaders"></a>rowHeaders

**Description**
Row headers for grids/tables.

**Values**

- Array of strings (e.g., ["Row 1", "Row 2"])

**Example Usage**
Specify row headers in the DataPanel for Input Grid or Table components to label each row.

### <a id="rowTabCount"></a>rowTabCount

**Description**
Number of tabs in a row.

**Values**

- Number (e.g., 3)
- Controls the number of tabs in a row

**Example Usage**
Set the number of tabs in a row in the property pane for Tabs components.

### <a id="showHelperText"></a>showHelperText

**Description**
Show helper text in UI.

**Values**

- Boolean: true (show), false (hide)

**Example Usage**
Enable or disable helper text display in the property pane for Table Column or other components.

### <a id="showLabel"></a>showLabel

**Description**
Whether to show the label in the UI.

**Values**

- Boolean: true (show), false (hide)

**Example Usage**
Choose whether to show the label in the property pane for Checkbox, Table, or other components.

### <a id="showOptionHelperText"></a>showOptionHelperText

**Description**
Show helper text for options.

**Values**

- Boolean: true (show), false (hide)

**Example Usage**
Enable or disable option helper text in the property pane for Checkbox Group components.

### <a id="showSingleOption"></a>showSingleOption

**Description**
Show only one option in group.

**Values**

- Boolean: true (show one), false (show all)

**Example Usage**
Enable this property in the property pane for Checkbox Group components to show only one option at a time.

### <a id="stack"></a>stack

**Description**
Stack layout configuration.

**Values**

- Object with stack configuration (direction, columns, spacing, etc.)

**Example Usage**
Configure stack layout in the LayoutPanel for Stack or Form components.

### <a id="subsectionHeaders"></a>subsectionHeaders

**Description**
Pills/headers for sub sections.

**Values**

- Array of strings (e.g., ["General", "Advanced"])

**Example Usage**
Set subsection headers in the LayoutPanel for Sub Section or Repeatable Sub Section components.

### <a id="submitOnChange"></a>submitOnChange

**Description**
Submit form automatically on change.

**Values**

- Boolean: true (auto-submit), false (manual submit)

**Example Usage**
Enable auto-submit in the FormPanel for Single Row Form components to submit on every change.

### <a id="tabLayout"></a>tabLayout

**Description**
Layout style for tabs.

**Values**

- String (e.g., "horizontal", "vertical")

**Example Usage**
Set the tab layout style in the property pane for Tabs components.

### <a id="tabLevel"></a>tabLevel

**Description**
Level of tabs (L1, L2, etc.).

**Values**

- String (e.g., "L1", "L2")

**Example Usage**
Set the tab level in the property pane for Tabs components.

### <a id="tableColumns"></a>tableColumns

**Description**
Columns configuration for tables.

**Values**

- Array of column objects (label, type, validation, etc.)

**Example Usage**
Configure table columns in the DataPanel for Table or Table (Form) components.

### <a id="text"></a>text

**Description**
The main text content or label for a component.

**Values**

- String (e.g., "Welcome", "Submit")

**Example Usage**
Set the main text or label for a component in the property pane (e.g., Heading, Button, Typograph).

### <a id="textAlign"></a>textAlign

**Description**
Alignment of text (left, center, right).

**Values**

- "left": Align text left
- "center": Align text center
- "right": Align text right

**Example Usage**
Set text alignment in the property pane for Heading or Typograph components.

### <a id="toListTitle"></a>toListTitle

**Description**
Title for destination list in transfer.

**Values**

- String (e.g., "Selected Items")

**Example Usage**
Set the title for the destination list in Transfer List components to label the selected items.

### <a id="toggleButton"></a>toggleButton

**Description**
Toggle button configuration.

**Values**

- Object with toggle configuration (label, checked state, etc.)

**Example Usage**
Configure toggle button details in the OptionsPanel for Toggle Button components.

### <a id="validationMessage"></a>validationMessage

**Description**
Message shown on validation error.

**Values**

- String (e.g., "Please enter a valid value.")

**Example Usage**
Set the validation message in the property pane for Text Input or other components.

### <a id="visibilityConditions"></a>visibilityConditions

**Description**
Conditions for showing/hiding components.

**Values**

- Array of condition objects (expression, target, etc.)

**Example Usage**
Configure visibility conditions in the ConditionalPanel for Section or other components.

### <a id="width"></a>width

**Description**
Width of a component or section.

**Values**

- Number (pixels, e.g., 300)
- Controls component or section width

**Example Usage**
Set the width for a component or section in the LayoutPanel or property pane.

## How to Set Properties

1. Select a component.
2. The relevant panel opens (e.g., TextPanel for text, LayoutPanel for layout).
3. Use the panel controls to set or change properties.
4. Preview your changes instantly.

## Example: Setting Up a Table

- Use DataPanel to connect the table to an API and configure columns.
- Use LayoutPanel to adjust width and alignment.
- Use StylePanel to set background and borders.
- Use ConditionalPanel to show/hide the table based on user actions.

---

Continue to [Property-to-Panel Mapping](component-properties-map.md) to see which panel edits which property.
