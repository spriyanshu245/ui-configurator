import {
  ComponentTypes,
  EventTypes,
  InterceptorTypes,
  MessageTypes,
} from "../utils/enums";

export interface WorkspaceItem {
  code: string;
  name: string;
}

export interface MicrositePageReference {
  pageCode: string;
  pageVersion?: number;
}

export interface Microsite {
  code: string;
  name: string;
  slug?: string;
  description?: string;
  sourceSystem?: string;
  accessControlled?: boolean;
  published?: boolean;
  version: number;
  pages: MicrositePageReference[];
  firstPageCode: string | undefined;
  lastUpdatedOn?: string;
}

export interface PageComponentLocationState {
  activeTabIndex?: number;
}

export interface PageLocationSnapshot {
  componentLocations: Record<string, PageComponentLocationState>;
}

export interface PageHistoryEntry {
  pageCode: string;
  location: PageLocationSnapshot;
}

export interface UserTask {
  code?: string;
  slug?: string;
  name?: string;
  description?: string;
  components: BaseComponent[];
  properties?: {
    showAsPopup?: boolean;
    dataTransfer?: DataTransfer;
  };
}

export interface FormsNameKeys {
  [key: string]: NameKeyId[];
}
export interface DataTransfer {
  name: string;
  body: string;
}

export interface Option {
  value?: string;
  label: string;
  name?: string;
  sign?: string;
  lists?: {
    label: string;
    sign?: string;
    value: string;
  }[];
}

export interface NameKeyId {
  label: string;
  id: string;
}

export type Options = Option[];

export interface Conditions {
  parentNames?: string[];
  defaultValue?: boolean;
  conditions?: { [key: string]: any };
}

export interface DynamicConditions extends Conditions {
  conditions?: { [key: string]: boolean | undefined };
}

export interface DynamicOptions extends Conditions {
  conditions?: { [key: string]: Options };
}

export interface BaseComponent {
  id: string;
  name?: string;
  type: string;
  category: "component" | "form" | "";
  isNewComponent?: boolean;
  readOnly?: boolean;
  style?: { key: string; value: string }[];
  properties?: { [key: string]: any };
  components?: BaseComponent[];
}

export interface BuilderComponent extends BaseComponent {
  displayName: string;
  icon?: string;
  items?: string[];
  options?: Options;
  validations?: Validation[];
  actions?: CustomAction[];
  events?: InputEvent[];
  components?: BaseComponent[];
  properties: {
    label?: string;
    showLabel?: boolean;
    name?: string;
    placeholder?: string;
    visibilityConditions?: DynamicConditions;
    enableDisableConditions?: DynamicConditions;
    requiredFieldConditions?: DynamicConditions;
    dynamicOptions?: DynamicOptions;
    isConditionalComponent?: boolean;
    nameKeyIds?: NameKeyId[];
    [key: string]: any;
  };
}

export type BehaviorCategory =
  | "containers"
  | "inputs"
  | "choices"
  | "display"
  | "utilities"
  | "domain";

export interface ComponentCatalogEntry extends BuilderComponent {
  title?: string;
  description?: string;
  viewCategory?: BehaviorCategory;
  keywords?: string[];
}

export interface ComponentGroup extends BaseComponent {
  components?: BaseComponent[];
  properties?: { [key: string]: any };
}

export interface FormInputComponent extends BaseComponent {
  options?: Options;
  validations?: Validation[];
  actions?: CustomAction[];
  events?: InputEvent[];
  properties: {
    label?: string;
    showLabel?: boolean;
    placeholder?: string;
    name?: string;
    conditions?: Conditions;
    isMultiSelect?: boolean;
    enableApiValidation?: boolean;
    validationApiUrl?: string;
    [key: string]: any;
  };
}

interface InputEvent {
  type: "onFocus" | "onBlur" | "onChange" | "onInput";
  handler: (event: Event) => void;
}
export interface CustomFormInputComponent extends FormInputComponent {}

interface CustomAction {
  trigger: string;
  operation: string;
  url: string;
  headers: CustomActionHeader[];
  responseMapping: {
    onSuccess: {
      display: {
        type: string;
        fields: { key: string; label: string }[];
      };
    };
    onError: {
      display: {
        type: string;
        message: string;
      };
    };
  };
}

export interface CustomActionHeader {
  name: string;
  value: string;
}

// page components
export interface HeadingComponent extends BaseComponent {
  type: "heading";
  properties: {
    level: number;
    text: string;
    [key: string]: any;
  };
}

export interface TypographComponent extends BaseComponent {
  type: "typograph";
  properties: {
    text: string;
    [key: string]: any;
  };
}

export interface ImageComponent extends BaseComponent {
  type: "image";
  properties: {
    src: string;
    alt: string;
    [key: string]: any;
  };
}

export interface SpacerComponent extends BaseComponent {
  type: "spacer";
  properties: {
    height?: number;
  };
}

export interface AccordionGroupItem {
  id: string;
  title: string;
  description: string;
}

export interface AccordionGroupComponent extends BaseComponent {
  type: "accordion-group";
  properties: {
    items: AccordionGroupItem[];
    autoOpenFirst: boolean;
    showNumbering: boolean;
  };
}

export interface StepperComponent extends BaseComponent {
  type: "stepper";
  properties: {
    apiUrl?: string;
    apiHeaders?: string;
    apiName?: string;
    storeDataInSession?: boolean;
    stepperPathToData?: string;
    statusKey?: string;
    waitValue?: string;
    currentValue?: string;
    completedValue?: string;
    titleKey?: string;
    descriptionKey?: string;
    [key: string]: unknown;
  };
}

export interface DividerComponent extends BaseComponent {
  type: "divider";
  properties: {
    height?: number;
    width?: string;
    backgroundColor?: string;
    align?: string;
  };
}

export interface FormComponent extends BaseComponent {
  type: "form";
  components?: BaseComponent[];
  properties: {
    action: string;
    method: "GET" | "POST";
    name: string;
    nameKeyIds: NameKeyId[];
    prefillApiUrl?: string;
    interceptors?: Interceptor;
  };
}

export interface FormRowComponent extends ComponentGroup {
  type: "form-row";
  properties: {
    [key: string]: any;
  };
}

export interface SubsectionHeader {
  id: string;
  type: string;
  properties: {
    label: string;
    value: string;
    colSpan: string;
    columnInputType?: string;
    isCurrency?: boolean;
    currencyName?: string;
    fetchDisplayValueFromApi?: string;
    decimalPrecision?: number;
    format?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface SubSectionComponent extends ComponentGroup {
  type: "sub-section";
  properties: {
    label: string;
    subsectionHeaders: SubsectionHeader[];
    responsiveVisibilityOff: string[];
    [key: string]: any;
  };
}

// form input components
export interface InputComponent extends FormInputComponent {
  type: "input";
  properties: {
    inputType: "text" | "email" | "password" | "number" | "location";
    defaultValue?: string;
    [key: string]: any;
  };
}
export interface TextAreaComponent extends FormInputComponent {
  type: "text-area";
  properties: {
    [key: string]: any;
  };
}

export interface ContactComponent extends FormInputComponent {
  type: "contact";
  properties: {
    contactType: "Mobile Number" | "Telephone Number";
    [key: string]: any;
  };
}

export interface HiddenFieldComponent extends FormInputComponent {
  type: "hidden-field";
  properties: {
    defaultValue?: string;
    name: string;
    locationOnLoad: boolean;
    [key: string]: any;
  };
}

export interface FileUploadComponent extends FormInputComponent {
  type: "file-upload";
  properties: {
    [key: string]: any;
    label: string;
    showLabel: boolean;
  };
}
export interface FilterDetails {
  filterType: string;
  placeholder: string;
  minValue?: number;
  maxValue?: number;
  apiUrl?: string;
  apiKey: string;
}

export interface IconColorCondition {
  id: string;
  leftOperand: string;
  operator: string;
  rightOperand: string;
  color: string;
}

export interface DataTableColumn {
  id: string;
  type: string;
  properties: {
    label: string;
    name: string;
    enableFilter?: boolean;
    filterType?: string;
    enableSorting?: boolean;
    filterDetails?: FilterDetails;
    isClickable?: boolean;
    action?: TableColumnAction[];
    multipleAction?: TableColumnAction[];
    routingType?: "Internal" | "External";
    isConditional?: boolean;
    externalURL?: string;
    conditionalRoutes?: ConditionalRoute[];
    routePage?: string;
    columnWidth?: number;
    prefixType?: string;
    suffixType?: string;
    prefixIconUploadType?: string;
    suffixIconUploadType?: string;
    prefixIconUrl?: string;
    suffixIconUrl?: string;
    prefixSuffix?: string;
    prefixDynamicIconName?: string;
    prefixDynamicIconSize?: number;
    prefixDynamicIconDefaultColor?: string;
    prefixDynamicIconColorConditions?: IconColorCondition[];
    prefixHideIconOnNoMatch?: boolean;
    columnInputType?: string;
    isCurrency?: boolean;
    currencyName?: string;
    fetchDisplayValueFromApi?: string;
    decimalPrecision?: number;
    format?: string;
    [key: string]: any;
  };
}

export interface TableColumnAction {
  id: string;
  tableColumnActionTypes:
    | "api-action"
    | "routing-action"
    | "file-preeview-action";
  label: string;
  buttonText?: string;
  iconUploadType?: "none" | "static" | "dynamic";
  routeConfig?: {
    routingType: "Internal" | "External";
    routePage?: string;
    externalURL?: string;
  };
  visibilityConditions?: DynamicConditions;
  [key: string]: any;
}

export interface TableComponent extends BaseComponent {
  type: "table";
  properties: {
    tableColumns: DataTableColumn[];
    nameKeyIds: NameKeyId[];
    defaultSort: boolean;
    sortByField?: string;
    sortByOrder?: "asc" | "desc";
    enablePagination?: boolean;
    defaultPageSize?: number;
    pageSizeOptions?: string;
    [key: string]: any;
  };
}

export interface CheckboxGroupComponent extends FormInputComponent {
  type: "checkbox-group";
}

export interface ToggleButtonComponent extends FormInputComponent {
  type: "toggle-button";
}

export interface SelectComponent extends FormInputComponent {
  type: "select";
  properties: {
    defaultValue?: string | string[];
    [key: string]: any;
  };
}

export interface MultiSelectComponent extends FormInputComponent {
  type: "multi-select";
}

export interface RadioGroupComponent extends FormInputComponent {
  type: "radio-group";
}

export type InputType = "input" | "select" | "checkbox" | "date" | "number";

export interface InputTableColumn {
  id: string;
  type: "input-table-column";
  properties: {
    label?: string;
    showLabel: boolean;
    name?: string;
    placeholder?: string;
    [key: string]: any;
  };
}

export interface InputTableComponent extends BaseComponent {
  type: "input-table";
  properties: {
    label?: string;
    showLabel: boolean;
    name?: string;
    placeholder?: string;
    inputColumns: InputTableColumn[];
    nameKeyIds: NameKeyId[];
    fixedRows?: boolean;
    transpose: boolean;
    [key: string]: any;
  };
}

export interface InputGridHeader {
  id: string;
  text: string;
  showHelperText?: boolean;
  helperText?: string;
}

export interface InputGridRow extends BaseComponent {
  type: "input-grid-row";
}

export interface InputGridColumn extends BaseComponent {
  type: "input-grid-column";
}

export interface InputGridComponent extends BaseComponent {
  type: "input-grid";
  properties: {
    name: string;
    label: string;
    rowHeaders: InputGridHeader[];
    columnHeaders: InputGridHeader[];
    width?: string;
    [key: string]: any;
  };
  components: InputGridRow[];
}

export interface Validation {
  type: "required" | "min" | "max" | "pattern";
  value: string;
  message: string;
}

export interface TabComponent extends BaseComponent {
  id: string;
  pageCode: string;
  properties: {
    title: string;
    isConditional?: boolean;
    condition?: string;
    sessionKeys?: string;
    [key: string]: any;
  };
}

export interface TabsComponent extends ComponentGroup {
  type: "tabs";
  components: TabComponent[];
  properties: {
    [key: string]: any;
  };
}

export type ButtonSize = "S" | "M" | "L";

export interface ButtonV2Component extends BaseComponent {
  type: "button-v2";
  properties: {
    label: string;
    showLabel: boolean;
    routeKey?: string;
    isDynamicRouting?: boolean;
    buttonSize?: ButtonSize;
    saveFormResponseOnSuccess?: boolean;
    [key: string]: any;
  };
}

export type MultiActionCtaActionType =
  | "submit"
  | "routing"
  | "reset"
  | "download"
  | "close-popup";

export interface MultiActionCtaAction {
  id: string;
  actionType?: MultiActionCtaActionType;
  [key: string]: unknown;
}

export interface MultiActionCtaComponent extends BaseComponent {
  type: "multi-action-cta";
  properties: {
    label: string;
    showLabel: boolean;
    buttonSize?: ButtonSize;
    actions: MultiActionCtaAction[];
    [key: string]: unknown;
  };
}

export interface QuestionnaireComponent extends BaseComponent {
  type: "questionnaire";
  properties: {
    name: string;
    [key: string]: any;
  };
}
export interface TransferListItem {
  id?: string;
  disabled?: boolean;
  [key: string]: any;
}
export interface TransferListComponent extends FormInputComponent {
  type: "transfer-list";
  properties: {
    label?: string;
    showLabel?: boolean;
    fromListTitle?: string;
    toListTitle?: string;
    searchable?: boolean;
    showSearch?: boolean;
    fromListItems?: { value: string; label: string }[];
    toListItems?: { value: string; label: string }[];
    height?: number;
    searchPlaceholder?: string;
    showHelperText?: boolean;
    helperText?: string;
    helperTextPosition?: string;
    [key: string]: any;
  };
}
export interface ImageCaptureComponent extends BuilderComponent {
  type: "image-capture";
  properties: {
    id: string;
    label?: string;
    showLabel?: boolean;
    name?: string;
    src?: string | null;
    alt?: string;
    preview?: boolean;
    camera?: "environment" | "user";
    maxSizeKB?: number | null;
    onValueChange?: (value: any) => void;
  };
}

export interface TreeComponentProperties {
  name?: string;
  showLabel?: boolean;
  label?: string;
  apiUrl: string;
  apiHeaders: string;
  apiName: string;
  pathKeyToArray?: string;
  childrenPathKey: string;
  behaviorType: string;
  sessionKey?: string;
  valueKey?: string;
  labelKey?: string;
  paramValueKey?: string;
  onSelectApiUrl?: string;
}

export interface PaymentCheckoutComponent extends BaseComponent {
  type: "payment-checkout";
  properties: {
    orderIdPathKey?: string;
    paymentModePathKey?: string;
    qrTimer?: number;
    pollingTime?: number;
    routingType?: string;
    routePage?: string;
    [key: string]: any;
  };
}

export interface TreeStructureComponent extends BaseComponent {
  type: "tree-structure";
  properties: TreeComponentProperties;
}

export interface ConditionBuilderComponent extends FormInputComponent {
  type: "condition-builder";
  properties: {
    dialectCode: string;
    [key: string]: any;
  };
}

export interface MapsComponent extends FormInputComponent {
  type: "maps";
  properties: {
    encodedPolylinePathKey?: string;
    locationsPathKey?: string;
    showRoute?: boolean;
    showOrder?: boolean;
  };
}

export interface RoutePlanComponent extends FormInputComponent {
  type: "route-plan";
  properties: {
    namePathKey: string;
    pathToArray: string;
    addressPathKey: string;
    latitudePathKey?: string;
    longitudePathKey?: string;
  };
}

export interface TimeInputComponent extends FormInputComponent {
  type: "time";
  properties: {
    name?: string;
    label?: string;
    showLabel?: boolean;
  };
}

export interface CollectionDashboardTableComponent extends BaseComponent {
  type: "collection-dashboard-table";
  properties: {
    apiUrl: string;
    apiHeaders?: string;
    label?: string;
    showLabel?: boolean;
    [key: string]: any;
  };
}

// Union type for all UI components, covering standard and custom components
export type UIComponent =
  | BaseComponent
  | ComponentGroup
  | HeadingComponent
  | TypographComponent
  | ImageComponent
  | FormComponent
  | FormRowComponent
  | InputComponent
  | ImageCaptureComponent
  | CheckboxGroupComponent
  | CustomFormInputComponent
  | SubSectionComponent
  | TableComponent
  | InputTableComponent
  | TabsComponent
  | InputGridComponent
  | InputGridRow
  | InputGridColumn
  | ButtonV2Component
  | MultiActionCtaComponent
  | QuestionnaireComponent
  | StackComponent
  | TransferListComponent
  | TreeStructureComponent
  | PaymentCheckoutComponent
  | ConditionBuilderComponent
  | MapsComponent
  | RoutePlanComponent
  | TimeInputComponent
  | CollectionDashboardTableComponent;

export interface DropZoneProps {
  index: number;
  emptySection?: boolean;
  dragOverIndex: number | null;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  isVertical?: boolean;
  height?: string;
  isDraggingFormElement?: boolean;
}

export type AnyObject = { [key: string]: any };

export interface IRequestData {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  rawBody?: boolean;
  headers?: Record<string, string>;
  credentials?: string;
}
export interface UserNotification {
  text: string;
  time: number;
  type: "error" | "warning" | "default" | "success";
}

export interface PageDetails {
  latitudename: string;
  longitudetion: string;
  code: string;
}

export interface GridData {
  id: string;
  properties: {
    label: string;
    value: string;
    prefixType?: string;
    suffixType?: string;
    prefixIconUploadType?: string;
    suffixIconUploadType?: string;
    prefixIconUrl?: string;
    suffixIconUrl?: string;
    prefixSuffix?: string;
    columnInputType?: string;
    isCurrency?: boolean;
    currencyName?: string;
    fetchDisplayValueFromApi?: string;
    decimalPrecision?: number;
    format?: string;
    [key: string]: any;
  };
}

export interface DataGridComponent extends BaseComponent {
  type: "data-grid";
  properties: {
    fieldLayout: string;
    columnGap: number;
    columns: number;
    gridData: GridData[];
    [key: string]: any;
  };
}

export interface Interceptor {
  id: string;
  label: string;
  interceptorType: InterceptorTypes;
  jsObject: string;
  eventType: EventTypes;
  eventObject: string[];
  messageObject: string[];
  message: string;
  messageType: MessageTypes;
  messageTimeout: number;
  componentType: ComponentTypes;
  tableName?: string;
}

export interface ConditionalRoute {
  condition: {
    leftOperand: string;
    operator: string;
    rightOperand: string;
  };
  route: string;
  onCloseAction?: string;
}

export interface MicrositeApiResponse {
  status: "success" | "error" | "pending";
  data?: MicrositeAPIDataResponse;
  error: Error | null;
  message?: string;
}

export interface MicrositeAPIDataResponse {
  dslJson: Microsite;
  sourceSystem?: string;
}

export interface TabsConditions {
  logicalOp: string;
  expressions: Record<string, string>[];
}

export interface InputProps {
  id: string;
  value: any;
  label?: string;
  placeholder?: string;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  options?: { value: string; label: string; [key: string]: any }[];
  [key: string]: any;
}

export interface StackComponent extends ComponentGroup {
  type: "stack";
  properties: {
    responsiveVisibilityOff: string[];
    [key: string]: any;
  };
}

export interface FinancialDetailsComponent extends BaseComponent {
  type: "financial-details";
  properties: {
    name: string;
    [key: string]: any;
  };
}

export type SortableColumn = "name" | "code" | "version" | "status";
export type SortDirection = "asc" | "desc" | null;
export type DataType = "microsites" | "workspace" | "pages";
export interface DataTypeConfig {
  label: string;
  pluralLabel: string;
  endpoint: string;
  routeBase: string;
  requiresWorkspace: boolean;
  supportsVersioning: boolean;
}
