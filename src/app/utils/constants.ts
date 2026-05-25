import { DataType, DataTypeConfig } from "../types/types";

export const maxHeadingLevels = 4;
export const inputTypes = ["text", "number", "email", "password", "location"];
export const contactTypes = ["Mobile Number", "Telephone Number"];
export const textAreaTypes = ["text", "json"];
export const textAlignTypes = ["left", "center", "right", "stretch"];
export const borderStyleType = ["solid", "dashed", "dotted", "none"];
export const pinTo = ["Top", "Bottom"];
export const DATE_ERROR_MESSAGE = "Enter Valid Date";
export const DEFAULT_DATE_FORMAT = "DD/MM/YYYY";
export const DEFAULT_DATE_SEPARATOR = "/";
export const TEXT_CASE = ["Default", "Capitalized", "All Caps", "All Small"];

export const actionTypes = [
  {
    value: "submit",
    label: "Submit",
  },
  {
    value: "reset",
    label: "Reset",
  },
  {
    value: "routing",
    label: "Routing",
  },
  {
    value: "download",
    label: "Download",
  },
  {
    value: "close-popup",
    label: "Close Popup",
  },
  {
    value: "file-preview-action",
    label: "File Preview Action",
  },
];

export const externalServices = [
  { value: "kyc-verification", label: "KYC Verification" },
  { value: "account-aggregator", label: "Account Aggregator" },
  { value: "offline-kyc-verification", label: "Offline KYC Verification" },
  { value: "mandate-registration", label: "Mandate Registration" },
];

export const DIRECTION = [
  { label: "Horizontal", value: "row" },
  { label: "Vertical", value: "column" },
];
export const ALIGNMENT = [
  { value: "flex-start", label: "Top" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "Bottom" },
  { value: "stretch", label: "Stretch" },
];
export const JUSTIFICATION = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Space Between" },
  { value: "space-around", label: "Space Around" },
  { value: "space-evenly", label: "Space Evenly" },
];

export const micrositeActionTypes = [
  {
    value: "internal",
    label: "Internal",
  },
  {
    value: "external",
    label: "External",
  },
];

export const requestBodyTypes = [
  {
    value: "flat",
    label: "Flat",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

export const POSITIONS = [
  {
    value: "left",
    label: "Left",
  },
  {
    value: "right",
    label: "Right",
  },
];

export const ROUTING_TYPE = [
  {
    value: "Internal",
    label: "Internal",
  },
  {
    value: "External",
    label: "External",
  },
  {
    value: "SamePage",
    label: "Same page",
  },
  {
    value: "Microsite",
    label: "Microsite",
  },
];

export const BEHAVIOR_TYPE = [
  {
    value: "navigation",
    label: "Navigation",
  },
  {
    value: "multiSelect",
    label: "Multi Select",
  },
];

export const MicrositeHeaders = [];

export enum PropertyPanels {
  ButtonPanel = "ButtonPanel",
  ConditionalPanel = "ConditionalPanel",
  DataPanel = "DataPanel",
  ActionPanel = "ActionPanel",
  PrefillDataPanel = "PrefillDataPanel",
  HeadingPanel = "HeadingPanel",
  IconPanel = "IconPanel",
  ImagePanel = "ImagePanel",
  InputValidationPanel = "InputValidationPanel",
  InputCalculationsPanel = "InputCalculationsPanel",
  LayoutPanel = "LayoutPanel",
  SectionPanel = "SectionPanel",
  TextPanel = "TextPanel",
  TabsPanel = "TabsPanel",
  TabsPanelV2 = "TabsPanelV2",
  InputGridPanel = "InputGridPanel",
  AccordionGroupPanel = "AccordionGroupPanel",
  InputTablePanel = "InputTablePanel",
  InterceptorsPanel = "InterceptorsPanel",
  PageSettingsPanel = "PageSettingsPanel",
  DataTransferPanel = "DataTransferPanel",
  DataColumnPanel = "DataColumnPanel",
  FooterPanel = "FooterPanel",
  ConstantsPanel = "ConstantsPanel",
  MetadataPanel = "MetadataPanel",
  DisplayValuePanel = "DisplayValuePanel",
  FieldRestrictionsPanel = "FieldRestrictionsPanel",
  PositioningPanel = "PositioningPanel",
  FieldPathPanel = "fieldPathPanel",
  TreeStructurePanel = "treeStructurePanel",
  PaymentPanel = "paymentPanel",
  IntegrationPanel = "integrationPanel",
  MapsPanel = "mapsPanel",
  RoutePlanPanel = "routePlanPanel",
  StepperPanel = "StepperPanel",
  StepperMappingPanel = "StepperMappingPanel",
}

export const DefaultButtonIconSize = 20;
export const DefaultInputIconSize = 30;
export const DefaultButtonIconPosition = "left";
export const DefaultButtonTextSize = 14;
export const DefaultButtonTextColor = "#ffffff";
export const DefaultButtonIconSpacing = 5;
export const DefaultInputIconSpacing = 0;
export const DefaultButtonIconUploadType = "file-upload";
export const InputKeyFormat = /[^a-zA-Z0-9._[\]\-=*]/g;

export const HELPER_TEXT_POSITION = [
  { label: "Info Icon with Tooltip", value: "infoIcon" },
  { label: "Below the Input", value: "belowInput" },
];

export const MAX_FORMS_LIMIT = 999;

export const displayColumnTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "fetchDisplayValueFromApi", label: "Fetch Display Value from API" },
];

export const inputColumnTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "checkbox-group", label: "Checkbox Group" },
  { value: "date", label: "Date" },
  { value: "toggle-button", label: "Toggle Button" },
  { value: "routing-action", label: "Routing Action" },
  { value: "file-preview-action", label: "File Preview Action" },
  { value: "fetchDisplayValueFromApi", label: "Fetch Display Value from API" },
  { value: "condition-builder", label: "Condition Builder" },
  { value: "image-capture", label: "Image Capture" },
  { value: "file-upload", label: "File Upload" },
];

export const columnDataTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "api-action", label: "API Action" },
  { value: "routing-action", label: "Routing Action" },
  { value: "fetchDisplayValueFromApi", label: "Fetch Display Value from API" },
  { value: "file-preview-action", label: "File Preview Action" },
  { value: "multiple-actions", label: "Multiple Actions" },
  { value: "condition-builder", label: "Condition Builder" },
];
export const tableColumnActionTypes = [
  { value: "api-action", label: "API Action" },
  { value: "routing-action", label: "Routing Action" },
  { value: "file-preview-action", label: "File Preview Action" },
];

export const multiActionCtaActionTypes = [
  { value: "submit", label: "Submit" },
  { value: "routing", label: "Routing" },
  { value: "reset", label: "Reset" },
  { value: "download", label: "Download" },
  { value: "close-popup", label: "Close Popup" },
];
export const columnInputFieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "label", label: "Label" },
  { value: "select", label: "Select" },
  { value: "checkbox-group", label: "Checkbox Group" },
  { value: "date", label: "Date" },
  { value: "toggle-button", label: "Toggle Button" },
  { value: "routing-action", label: "Routing Action" },
  { value: "file-preview-action", label: "File Preview Action" },
];

export const separatorOptions = [
  { value: "/", label: "/" },
  { value: "-", label: "-" },
  { value: ".", label: "." },
  { value: " ", label: "Space" },
];
export const filterTypes = [
  { label: "Text search", value: "partialMatch" },
  {
    label: "Date range",
    value: "dateRange",
  },
  {
    label: "Numeric range",
    value: "numericRange",
  },

  { label: "Exact match", value: "exactMatch" },
];

export const buttonTypes = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "tertiary", label: "Tertiary" },
  { value: "link", label: "Link" },
];

export const buttonSizes = [
  { value: "S", label: "Small" },
  { value: "M", label: "Medium" },
  { value: "L", label: "Large" },
];

export const timerUnits = [
  { value: "min", label: "Min" },
  { value: "sec", label: "Sec" },
];

export const VALIDATION_INTERCEPTOR_JS_SNIPPET = `const validate = () => {
  let isValid = true;
  // enter your logic here...
  return isValid;
}`;

export const VALIDATION_TABLE_INTERCEPTOR_JS_SNIPPET = `const validate = () => {
  let isValid = true;
   // Use the following predefined variables that provide access to the input table data
   // $allRows: to access all the rows of the input table
   // $newValue: for the currently entered value
   // $rowIndex: current row index

   // enter your logic here...
  return isValid;
}`;

export const CURRENCY = [
  { label: "US Dollar (USD)", value: "en-US" },
  { label: "Indian Rupee (INR)", value: "en-IN" },
];

export const DATE_FORMAT = [
  { label: "DD/MM/YYYY", value: "en-GB" },
  {
    label: "DD/mmm/YYYY",
    value: '"en-GB", {day: "2-digit", month: "short", year: "numeric"}',
  },
];

export const RESTRICTED_ELEMENTS = [
  "form-row",
  "sub-section",
  "repeatable-sub-section",
  "input-grid",
  "input-grid-row",
  "stack",
];

export const dynamicContionsTitles: Record<string, string> = {
  visibilityConditions: "Visibility",
  enableDisableConditions: "Enable disable",
  requiredFieldConditions: "Required field",
  dynamicOptions: "Dynamic options",
};

export const dynamicConditionsType: Record<string, string> = {
  visibilityConditions: "Visible",
  enableDisableConditions: "Enable",
  requiredFieldConditions: "Required",
};

export const toggleDynamicTooltips: Record<string, any> = {
  visibilityConditions: {
    true: "Visible",
    false: "Hidden",
  },
  enableDisableConditions: {
    true: "Enable",
    false: "Disable",
  },
  requiredFieldConditions: {
    true: "Mandatory",
    false: "Optional",
  },
};

export const OPERATORS = [
  { value: "==", label: "Equal (==)" },
  { value: "===", label: "Strict Equal (===)" },
  { value: "!=", label: "Not Equal (!=)" },
  { value: ">", label: "Greater Than (>)" },
  { value: "<", label: "Less Than (<)" },
  { value: ">=", label: "Greater or Equal (>=)" },
  { value: "<=", label: "Less or Equal (<=)" },
  { value: "&&", label: "AND (&&)" },
  { value: "||", label: "OR (||)" },
];

export const LOGICAL_OPERATORS = [
  { value: "&&", label: "AND (&&)" },
  { value: "||", label: "OR (||)" },
];

export const BREAKPOINTS = [
  { label: "Mobile", id: "mobile" },
  { label: "Tablet", id: "tablet" },
  { label: "Laptop", id: "laptop" },
  { label: "Desktop", id: "desktop" },
];

export const keysToRemove = [
  "icon",
  "isNewComponent",
  "suffixIconUploadType",
  "prefixIconUploadType",
];

export const DATA_TYPE_CONFIG: Record<DataType, DataTypeConfig> = {
  pages: {
    label: "Pages",
    pluralLabel: "Pages",
    endpoint: "/api/v1/config/pages",
    routeBase: "/pages",
    requiresWorkspace: true,
    supportsVersioning: false,
  },
  microsites: {
    label: "Microsites",
    pluralLabel: "Microsites",
    endpoint: "/api/v1/config/microsites",
    routeBase: "/microsites",
    requiresWorkspace: true,
    supportsVersioning: true,
  },
  workspace: {
    label: "Workspace",
    pluralLabel: "Workspaces",
    endpoint: "/api/v1/config/workspaces",
    routeBase: "/workspaces",
    requiresWorkspace: false,
    supportsVersioning: false,
  },
};

export const MASTER_NAME = "PLATFORMSUBSYSTEM";

export const COLUMN_ACTIONS = [
  "api-action",
  "routing-action",
  "file-preview-action",
];
