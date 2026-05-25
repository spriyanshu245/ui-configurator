import { ReactNode, MouseEvent as ReactMouseEvent, KeyboardEvent } from "react";
import { SearchFieldConfig } from "@/app/utils/searchUtils";
import { SortDirection } from "@/app/types/types";

export interface ColumnConfig<T> {
  key: string;
  label: string;
  sortable?: boolean;
  centered?: boolean;
  render?: (item: T) => ReactNode;
}

export interface ActionConfig<T> {
  key: string;
  icon: ReactNode;
  label: (item: T) => string;
  title: (item: T) => string;
  onClick: (
    e: ReactMouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
    item: T,
  ) => void | Promise<void>;
  isDanger?: boolean;
  disabled?: (item: T) => boolean;
  testId?: (item: T) => string;
}

export interface DataListConfig<T, S extends string> {
  searchFields: SearchFieldConfig[];
  tiebreakers: ((item: T) => string | number)[];
  defaultSort: { column: S; direction: "asc" | "desc" };
  getComparableValue: (item: T, column: S) => string | number;
  getItemKey: (item: T) => string;
}

export interface UseDataListReturn<T, S extends string> {
  data: T[];
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  loading: boolean;
  error: string | null;
  displayedData: T[];
  deletingKey: string | null;
  confirmDeleteKey: string | null;
  copiedKey: string | null;
  searchValue: string;
  isSearchOpen: boolean;
  isPending: boolean;
  hasSearchTerm: boolean;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
  handleSearchToggle: () => void;
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  clearSearch: () => void;
  focusSearchInput: () => void;
  handleSort: (column: S) => void;
  getSortDirection: (column: S) => SortDirection;
  requestDelete: (key: string) => void;
  executeDelete: (deleteFn: (key: string) => Promise<void>) => Promise<void>;
  cancelDelete: () => void;
  setDeleteHandler: (fn: (key: string) => Promise<void>) => void;
  handleConfirmDelete: (e: React.MouseEvent | React.KeyboardEvent) => void;
  handleCancelDelete: (e: React.MouseEvent | React.KeyboardEvent) => void;
  handleCopy: (
    e: ReactMouseEvent<HTMLButtonElement>,
    value: string,
  ) => Promise<void>;
  handleRowKeyDown: (
    e: KeyboardEvent<HTMLTableRowElement>,
    item: T,
    onActivate: (item: T) => void,
  ) => void;
  loadData: (fetcher: () => Promise<T[]>) => () => void;
}
