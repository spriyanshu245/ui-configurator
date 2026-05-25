export interface TemplateContent {
  content: string;
  language: string;
  isDefault: boolean;
}

export interface SupportedLanguage {
  value: string;
  label: string;
  nativeName: string;
}

export interface PageSizeOption {
  value: string;
  label: string;
}

export interface TemplateListing {
  id: string;
  name: string;
  category: string;
  mimeType?: string;
  content?: string;
  contents?: TemplateContent[];
}

export interface TemplateBlock {
  id: string;
  type: string;
  label: string;
  content: string;
  children?: TemplateBlock[];
  properties: Record<string, PropertyValue>;
}

export type ColumnAlignment = "L" | "C" | "R";

export interface TableColumn {
  id: string;
  dataKey: string;
  label: string;
  alignment: ColumnAlignment;
}

export type PropertyValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | TableColumn[];

export interface TemplateStructureNode {
  id: string;
  label: string;
  type: string;
  children?: TemplateStructureNode[];
  isExpanded?: boolean;
}

export interface AvailableBlock {
  id: string;
  type: string;
  label: string;
  description: string;
  icon?: string;
  isContainer?: boolean;
  defaultContent: string;
  defaultProperties: Record<
    string,
    string | number | boolean | number[] | TableColumn[]
  >;
}

export interface DataModelField {
  name: string;
  type: string;
  description?: string;
  children?: DataModelField[];
}

export interface TemplateDesignerState {
  blocks: TemplateBlock[];
  selectedBlockId: string | null;
  structure: TemplateStructureNode[];
  dataModel: DataModelField[];
}

export interface TemplateGlobalStyles {
  htmlTitle: string;
  preheaderText: string;
  bodyBackgroundColor: string;
  fontFamily: string;
  fontSize: string;
  textColor: string;
  lineHeight: string;
  contentMaxWidth: PageSizeOption;
  bodyPadding: string;
  linkColor: string;
  linkHoverColor: string;
}

export interface TemplateDesignerContextProps {
  blocks: TemplateBlock[];
  selectedBlockId: string | null;
  expandedNodes: Set<string>;
  structure: TemplateStructureNode[];
  htmlStructure: TemplateStructureNode[];
  dataModelJson: string;
  templateContent: string;
  templateName: string;
  templateMimeType: string;
  templateCategory: string;
  globalStyles: TemplateGlobalStyles;
  isLoading: boolean;
  error: string | null;
  currentLanguage: SupportedLanguage;
  defaultLanguage: SupportedLanguage;
  availableLanguages: SupportedLanguage[];
  isTranslating: boolean;
  isCurrentLanguageDefault: boolean;
  selectBlock: (blockId: string | null) => void;
  addBlock: (
    block: TemplateBlock,
    parentId?: string,
    afterBlockId?: string,
  ) => void;
  updateBlock: (blockId: string, updates: Partial<TemplateBlock>) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  moveBlock: (
    blockId: string,
    targetParentId: string | null,
    index: number,
  ) => void;
  toggleStructureNode: (nodeId: string) => void;
  setTemplateContent: (content: string) => void;
  setTemplateName: (name: string) => void;
  setTemplateMimeType: (mimeType: string) => void;
  setTemplateCategory: (category: string) => void;
  setGlobalStyles: (styles: Partial<TemplateGlobalStyles>) => void;
  setDataModelJson: (json: string) => void;
  setLoadingState: (loading: boolean, error?: string | null) => void;
  loadBlocksFromFtl: (ftlContent: string) => void;
  isMarkdownGuideOpen: boolean;
  setIsMarkdownGuideOpen: (open: boolean) => void;
  setCurrentLanguage: (lang: SupportedLanguage) => void;
  setDefaultLanguage: (lang: SupportedLanguage) => void;
  addLanguage: (targetLang: SupportedLanguage) => Promise<void>;
  removeLanguage: (lang: SupportedLanguage) => void;
  getLanguageBlocks: (lang: string) => TemplateBlock[];
  saveCurrentLanguageBlocks: () => void;
  loadBlocksFromContents: (contents: TemplateContent[]) => void;
}

export interface TemplateDesignerProviderProps {
  children: React.ReactNode;
  initialState?: Partial<TemplateDesignerState>;
  initialContent?: string;
  initialLoading?: boolean;
  initialError?: string | null;
}

export type IdGenerator = (type: string) => string;

export interface PropertyInputProps {
  propertyKey: string;
  value: PropertyValue;
  onChange: (key: string, value: PropertyValue) => void;
}

export interface GridRowColumnContentsProps {
  columns: number;
  columnContents: string[];
  onColumnContentChange: (columnIndex: number, value: string) => void;
  isMarkdownGuideOpen: boolean;
  onToggleGuide: () => void;
  onExpandColumn: (columnIndex: number) => void;
}

export interface TableColumnsEditorProps {
  list: string;
  zebraRows: boolean;
  showBorders: boolean;
  columns: TableColumn[];
  columnWidths: number[];
  headerStyle: string;
  rowCellStyle: string;
  onListBindingChange: (value: string) => void;
  onZebraRowsChange: (value: boolean) => void;
  onShowBordersChange: (value: boolean) => void;
  onColumnsChange: (columns: TableColumn[], newWidths?: number[]) => void;
  onColumnWidthChange: (
    index: number,
    value: number,
    columnWidths: number[],
  ) => void;
  onHeaderStyleChange: (value: string) => void;
  onRowCellStyleChange: (value: string) => void;
}

export interface BlockItemProps {
  block: AvailableBlock;
  onAdd: (block: AvailableBlock) => void;
}

export interface TemplateDesignerPageProps {
  params: Promise<{ templateId: string }>;
}

export type TemplateDesignerMode = "document" | "communication";
