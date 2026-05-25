import { useState } from "react";
import styles from "../../PropertiesPanel.module.scss";
import {
  TableColumnsEditorProps,
  TableColumn,
  ColumnAlignment,
} from "@/app/template-designer/types";
import { generateRandomId } from "@/app/utils/utils";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import DragHandleIcon from "@/app/components/SVGIcons/DragHandle";
import ToggleSwitch from "@/app/components/ToggleSwitch/ToggleSwitch";
import StyleEditor from "../../StyleEditor";
import ColumnWidthSliders from "../ColumnWidthSliders/ColumnWidthSliders";
import { getDefaultColumnWidths } from "../../utils/propertiesPanelUtils";

const ALIGNMENT_OPTIONS: ColumnAlignment[] = ["L", "C", "R"];

const TableProperties = ({
  list,
  zebraRows,
  showBorders,
  columns,
  columnWidths,
  headerStyle,
  rowCellStyle,
  onListBindingChange,
  onZebraRowsChange,
  onShowBordersChange,
  onColumnsChange,
  onColumnWidthChange,
  onHeaderStyleChange,
  onRowCellStyleChange,
}: TableColumnsEditorProps) => {
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(
    new Set(),
  );
  const [expandedStyleSection, setExpandedStyleSection] = useState<
    string | null
  >(null);

  const toggleColumnExpanded = (columnId: string) => {
    setExpandedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const handleAddColumn = () => {
    const newColumn: TableColumn = {
      id: generateRandomId(),
      dataKey: "",
      label: "",
      alignment: "L",
    };
    const newColumns = [...columns, newColumn];
    onColumnsChange(newColumns, getDefaultColumnWidths(newColumns.length));
    setExpandedColumns((prev) => new Set(prev).add(newColumn.id));
  };

  const handleRemoveColumn = (index: number) => {
    const updated = columns.filter((_, i) => i !== index);
    onColumnsChange(updated, getDefaultColumnWidths(updated.length));
  };

  const handleColumnChange = (
    index: number,
    field: keyof TableColumn,
    value: string,
  ) => {
    const updated = columns.map((col, i) =>
      i === index ? { ...col, [field]: value } : col,
    );
    onColumnsChange(updated);
  };

  return (
    <>
      <div className={styles.propertyRow}>
        <label className={styles.propertyLabel} htmlFor="table-list-binding">
          List
        </label>
        <input
          id="table-list-binding"
          type="text"
          className={styles.propertyInput}
          value={list}
          onChange={(e) => onListBindingChange(e.target.value)}
          placeholder="e.g., statement.entries"
        />
      </div>

      <div className={`${styles.propertyRow} ${styles.rowLayout}`}>
        <span className={styles.propertyLabel}>Zebra Rows</span>
        <ToggleSwitch
          id="table-zebra-rows"
          size="small"
          isToggled={zebraRows}
          onToggle={(e) => onZebraRowsChange(e.target.checked)}
        />
      </div>

      <div className={`${styles.propertyRow} ${styles.rowLayout}`}>
        <span className={styles.propertyLabel}>Show Borders</span>
        <ToggleSwitch
          id="table-show-borders"
          size="small"
          isToggled={showBorders}
          onToggle={(e) => onShowBordersChange(e.target.checked)}
        />
      </div>

      {columns.length > 0 && (
        <ColumnWidthSliders
          columns={columns.length}
          columnWidths={columnWidths}
          columnLabels={columns.map((col) => col.label)}
          onWidthChange={onColumnWidthChange}
        />
      )}

      <div className={styles.tableCellStylesSection}>
        <span className={styles.propertyLabel}>Cell Styles</span>
        <div className={styles.cellStylesList}>
          <div className={styles.cellStyleItem}>
            <button
              type="button"
              className={`${styles.cellStyleHeader} ${
                expandedStyleSection === "header" ? styles.expanded : ""
              }`}
              onClick={() =>
                setExpandedStyleSection(
                  expandedStyleSection === "header" ? null : "header",
                )
              }
            >
              <span>Header Cells</span>
              <span
                className={`${styles.cellStyleChevron} ${
                  expandedStyleSection === "header" ? styles.rotated : ""
                }`}
              >
                <ChevronDownIcon />
              </span>
            </button>
            {expandedStyleSection === "header" && (
              <div className={styles.cellStyleEditor}>
                <StyleEditor
                  value={headerStyle}
                  onChange={onHeaderStyleChange}
                />
              </div>
            )}
          </div>
          <div className={styles.cellStyleItem}>
            <button
              type="button"
              className={`${styles.cellStyleHeader} ${
                expandedStyleSection === "row" ? styles.expanded : ""
              }`}
              onClick={() =>
                setExpandedStyleSection(
                  expandedStyleSection === "row" ? null : "row",
                )
              }
            >
              <span>Row Cells</span>
              <span
                className={`${styles.cellStyleChevron} ${
                  expandedStyleSection === "row" ? styles.rotated : ""
                }`}
              >
                <ChevronDownIcon />
              </span>
            </button>
            {expandedStyleSection === "row" && (
              <div className={styles.cellStyleEditor}>
                <StyleEditor
                  value={rowCellStyle}
                  onChange={onRowCellStyleChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tableColumnsSection}>
        <div className={styles.tableColumnsHeader}>
          <span className={styles.propertyLabel}>Columns</span>
          <button
            type="button"
            className={styles.addColumnBtn}
            onClick={handleAddColumn}
          >
            <span>+</span>
            <span>Add</span>
          </button>
        </div>

        <div className={styles.tableColumnsList}>
          {columns.map((col, index) => {
            const isExpanded = expandedColumns.has(col.id);
            return (
              <div key={`column-${col.id}`} className={styles.tableColumnRow}>
                <div
                  className={`${styles.tableColumnHeader} ${
                    isExpanded ? styles.expanded : ""
                  }`}
                >
                  <button
                    type="button"
                    className={styles.columnExpandBtn}
                    onClick={() => toggleColumnExpanded(col.id)}
                  >
                    <div className={styles.dragHandle}>
                      <DragHandleIcon />
                      <div className={styles.columnIndex}>
                        {col.label || `Column #${index + 1}`}
                      </div>
                    </div>
                    <span
                      className={`${styles.columnChevron} ${
                        isExpanded ? styles.rotated : ""
                      }`}
                    >
                      <ChevronDownIcon />
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.deleteColumnBtn}
                    onClick={() => handleRemoveColumn(index)}
                    title="Delete column"
                  >
                    <DeleteIcon />
                  </button>
                </div>
                {isExpanded && (
                  <div className={styles.tableColumnContent}>
                    <div className={styles.propertyRow}>
                      <label
                        htmlFor={`column-label-${index}`}
                        className={styles.propertyLabel}
                      >
                        Label
                      </label>
                      <input
                        type="text"
                        className={styles.propertyInput}
                        value={col.label}
                        onChange={(e) =>
                          handleColumnChange(index, "label", e.target.value)
                        }
                        placeholder="Label"
                      />
                    </div>
                    <div className={styles.propertyRow}>
                      <label
                        htmlFor={`column-datakey-${index}`}
                        className={styles.propertyLabel}
                      >
                        Value
                      </label>
                      <input
                        type="text"
                        className={styles.propertyInput}
                        value={col.dataKey}
                        onChange={(e) =>
                          handleColumnChange(index, "dataKey", e.target.value)
                        }
                        placeholder="e.g., ${item.value} or Static Text"
                      />
                    </div>
                    <div className={styles.alignmentSelector}>
                      {ALIGNMENT_OPTIONS.map((align) => (
                        <button
                          key={align}
                          type="button"
                          className={`${styles.alignmentOption} ${
                            col.alignment === align ? styles.selected : ""
                          }`}
                          onClick={() =>
                            handleColumnChange(index, "alignment", align)
                          }
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default TableProperties;
