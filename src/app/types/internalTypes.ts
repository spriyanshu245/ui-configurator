export interface Page {
  id: string;
  code: string;
  pageUrlSlug?: string;
  micrositeUrlSlug?: string;
  name: string;
  description: string;
  sourceSystem?: string;
  isArchive: boolean;
  createdOn: string;
  updatedOn: string;
  pageVersion?: Version[];
  micrositeVersion?: Version[];
}
export interface MicrositesV2 {
  id: string;
  code: string;
  name: string;
  description: string;
  sourceSystem?: string;
  accessControlled?: boolean;
  published?: boolean;
  isArchive: boolean;
  createdOn: string;
  updatedOn: string;
  version: number;
}

export interface Workspace {
  id: string;
  code: string;
  name: string;
  description: string;
  createdOn: string;
  updatedOn: string;
}

export interface Version {
  pageId?: string;
  micorsiteId?: string;
  dslJsonId: string;
  version: number;
  status: string;
  isArchive: boolean;
  createdOn: string;
  updatedOn: string;
}

export type DateInput = string | number | Date;

export type SortDirection = "asc" | "desc";

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  isCopyable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  render: (row: T, styles?: Record<string, any>) => React.ReactNode;
  getSortValue?: (row: T) => string | number;
}

export interface TableActionHandlers<T> {
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => Promise<void>;
  onCopy?: (code: string) => Promise<void>;
  onDuplicate?: (row: T) => Promise<void>;
  handleVersions?: (row: T) => void;
  onCancelDelete?: (row: T) => void;
  isDeleting?: (row: T) => boolean;
  isConfirmingDelete?: (row: T) => boolean;
}

export interface SourceSystemOption {
  code: string;
  name: string;
}
