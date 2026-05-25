import {
  memo,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent,
} from "react";
import sharedStyles from "@/app/styles/shared.module.scss";
import InlineLoaderIcon from "@/app/components/InternalComponents/InlineLoader/InlineLoader";
import SortableColumn from "@/app/components/DataList/SortableColumn";
import DeleteConfirmCell from "@/app/components/DataList/DeleteConfirmCell";
import { ColumnConfig, ActionConfig } from "@/app/components/DataList/types";
import { SortDirection } from "@/app/types/types";

interface DataListTableProps<T, S extends string> {
  columns: ColumnConfig<T>[];
  actions?: ActionConfig<T>[];
  displayedData: T[];
  getItemKey: (item: T) => string;
  onRowClick: (item: T) => void;
  handleRowKeyDown: (
    e: KeyboardEvent<HTMLTableRowElement>,
    item: T,
    onActivate: (item: T) => void,
  ) => void;
  handleSort: (column: S) => void;
  getSortDirection: (column: S) => SortDirection;
  confirmDeleteKey: string | null;
  deletingKey: string | null;
  onConfirmDelete: (
    e: ReactMouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
  ) => void;
  onCancelDelete: (
    e: ReactMouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
  ) => void;
  hasSearchTerm: boolean;
  error?: string | null;
  emptySearchText?: string;
  emptyText?: string;
  loading: boolean;
}

const DataListTableInner = <T, S extends string>({
  columns,
  actions,
  displayedData,
  getItemKey,
  onRowClick,
  handleRowKeyDown,
  handleSort,
  getSortDirection,
  confirmDeleteKey,
  deletingKey,
  onConfirmDelete,
  onCancelDelete,
  hasSearchTerm,
  error,
  emptySearchText = "No data found.",
  emptyText = "No matches found.",
  loading,
}: DataListTableProps<T, S>) => {
  const totalColumns = columns.length + (actions ? 1 : 0);

  const renderDefaultCell = (item: T, col: ColumnConfig<T>): ReactNode => {
    const value = (item as Record<string, unknown>)[col.key];
    if (value === undefined || value === null) return "—";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    return JSON.stringify(value);
  };

  if (loading) {
    return (
      <div className={sharedStyles.loadingContainer}>
        <InlineLoaderIcon />
        <div className={sharedStyles.loadingText}>loading...</div>
      </div>
    );
  }

  return (
    <div className={sharedStyles.tableResponsive}>
      <table>
        <thead>
          <tr>
            {columns.map((col) =>
              col.sortable ? (
                <SortableColumn
                  key={col.key}
                  label={col.label}
                  direction={getSortDirection(col.key as S)}
                  centered={col.centered}
                  onSort={() => handleSort(col.key as S)}
                />
              ) : (
                <th
                  key={col.key}
                  className={col.centered ? sharedStyles.centered : undefined}
                >
                  {col.label}
                </th>
              ),
            )}
            {actions && (
              <th key="actions" className={sharedStyles.centered}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {displayedData.length === 0 && (
            <tr>
              <td colSpan={totalColumns} className={sharedStyles.emptyState}>
                {error ?? (hasSearchTerm ? emptySearchText : emptyText)}
              </td>
            </tr>
          )}
          {displayedData.length > 0 &&
            displayedData.map((item) => {
              const itemKey = getItemKey(item);
              const isConfirming = confirmDeleteKey === itemKey;

              return (
                <tr
                  key={itemKey}
                  onClick={() => onRowClick(item)}
                  tabIndex={0}
                  onKeyDown={(e) => handleRowKeyDown(e, item, onRowClick)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={
                        col.centered ? sharedStyles.centered : undefined
                      }
                    >
                      {col.render
                        ? col.render(item)
                        : renderDefaultCell(item, col)}
                    </td>
                  ))}
                  {actions && (
                    <td key="actions" className={sharedStyles.actionsCell}>
                      {isConfirming ? (
                        <DeleteConfirmCell
                          isDeleting={deletingKey === itemKey}
                          onConfirm={onConfirmDelete}
                          onCancel={onCancelDelete}
                        />
                      ) : (
                        <div className={sharedStyles.actionsContainer}>
                          {actions.map((action) => (
                            <button
                              key={action.key}
                              type="button"
                              className={`${sharedStyles.actionButton} ${
                                action.isDanger ? sharedStyles.deleteButton : ""
                              }`}
                              aria-label={action.label(item)}
                              title={action.title(item)}
                              data-testid={action.testId?.(item)}
                              disabled={action.disabled?.(item)}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                action.onClick(e, item);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  action.onClick(e, item);
                                }
                              }}
                            >
                              {action.icon}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

DataListTableInner.displayName = "DataListTable";

const DataListTable = memo(DataListTableInner) as typeof DataListTableInner;

export default DataListTable;
