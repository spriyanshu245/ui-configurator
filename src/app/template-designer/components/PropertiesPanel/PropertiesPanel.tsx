"use client";
import { useMemo, useState } from "react";
import styles from "./PropertiesPanel.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import { TableColumn, ColumnAlignment } from "@/app/template-designer/types";
import {
  GRID_COLUMN_OPTIONS,
  DEFAULT_COLUMN_WIDTHS,
} from "@/app/template-designer/constants";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import InfoIcon from "@/app/components/SVGIcons/Info";
import ToggleSwitch from "@/app/components/ToggleSwitch/ToggleSwitch";
import {
  findBlockById,
  getBlockTypeLabel,
  getParentGridColumns,
} from "@/app/template-designer/utils";
import Tooltip from "@/app/components/Tooltip/Tooltip";
import StyleEditor from "./StyleEditor";
import TransliterationInput from "@/app/template-designer/components/TransliterationInput/TransliterationInput";
import MaximizeIcon from "@/app/components/SVGIcons/Maximize";
import ExpandedContentEditor from "./ExpandedContentEditor/ExpandedContentEditor";
import { usePropertiesPanelHandlers } from "./hooks/usePropertiesPanelHandlers";
import {
  getHiddenProperties,
  shouldShowContent,
} from "./utils/propertiesPanelUtils";
import PropertyInput from "./components/PropertyInput/PropertyInput";
import ColumnWidthSliders from "./components/ColumnWidthSliders/ColumnWidthSliders";
import GridRowColumnContents from "./components/GridRowColumnContents/GridRowColumnContents";
import TableProperties from "./components/TableProperties/TableProperties";
import ColumnStylesEditor from "./components/ColumnStylesEditor/ColumnStylesEditor";

const ALIGNMENT_OPTIONS: ColumnAlignment[] = ["L", "C", "R"];

const PropertiesPanel = () => {
  const {
    blocks,
    selectedBlockId,
    updateBlock,
    removeBlock,
    isMarkdownGuideOpen,
    setIsMarkdownGuideOpen,
  } = useTemplateDesigner();

  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [expandedColumnIndex, setExpandedColumnIndex] = useState<number | null>(
    null,
  );

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null;
    return findBlockById(blocks, selectedBlockId);
  }, [blocks, selectedBlockId]);

  const {
    handlePropertyChange,
    handleGridColumnsChange,
    handleLabelChange,
    handleStyleChange,
    handleColumnContentChange,
    handleBorderedChange,
    handleShowBordersChange,
    handleColumnStyleChange,
    handleColumnWidthChange,
    handleTableListBindingChange,
    handleTableZebraRowsChange,
    handleTableShowBordersChange,
    handleTableColumnsChange,
    handleTableColumnWidthChange,
    handleTableHeaderStyleChange,
    handleTableRowCellStyleChange,
    handleContentChange,
    handleDelete,
  } = usePropertiesPanelHandlers({
    selectedBlockId,
    selectedBlock,
    updateBlock,
    removeBlock,
  });

  if (!selectedBlock) {
    return (
      <div className={styles.propertiesPanel}>
        <div className={styles.header}>
          <h3>Properties</h3>
        </div>
        <div className={styles.emptyState}>
          <span>Select a block to edit its properties</span>
        </div>
      </div>
    );
  }

  const hiddenProps = getHiddenProperties(selectedBlock.type);
  const visibleProperties = Object.entries(selectedBlock.properties).filter(
    ([key]) =>
      !hiddenProps.includes(key) && key !== "columnContents" && key !== "style",
  );
  const currentColumns = Number(selectedBlock.properties.columns) || 2;

  const SPECIAL_HANDLER_TYPES = [
    "section",
    "grid",
    "gridRow",
    "table",
    "divider",
    "image",
  ];
  const hasNoEditableProperties =
    selectedBlock.type === "pageBreak" ||
    (!shouldShowContent(selectedBlock.type) &&
      !SPECIAL_HANDLER_TYPES.includes(selectedBlock.type) &&
      visibleProperties.length === 0);

  return (
    <div className={styles.propertiesPanel}>
      <div className={styles.header}>
        <h3>{getBlockTypeLabel(selectedBlock.type)} - Properties</h3>
        <button
          className={styles.iconButton}
          onClick={handleDelete}
          title="Delete Block"
        >
          <DeleteIcon />
        </button>
      </div>
      <div className={styles.content}>
        {hasNoEditableProperties && (
          <div className={styles.emptyState}>
            <span>No properties available</span>
          </div>
        )}
        {selectedBlock.type !== "pageBreak" && (
          <div className={styles.propertyRow}>
            <label className={styles.propertyLabel} htmlFor="block-label">
              Name
            </label>
            <input
              id="block-label"
              type="text"
              className={styles.propertyInput}
              value={selectedBlock.label}
              onChange={handleLabelChange}
            />
          </div>
        )}

        {shouldShowContent(selectedBlock.type) && (
          <div className={styles.propertyRow}>
            <div className={styles.labelWithIcon}>
              <label className={styles.propertyLabel} htmlFor="block-content">
                Content
              </label>
              <Tooltip text="Expand editor">
                <button
                  className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
                  onClick={() => setIsContentExpanded(true)}
                  aria-label="Expand content editor"
                  type="button"
                >
                  <MaximizeIcon />
                </button>
              </Tooltip>
              <Tooltip
                text={
                  isMarkdownGuideOpen
                    ? "Close Markdown & HTML guide"
                    : "Open Markdown & HTML guide"
                }
              >
                <button
                  className={`${sharedStyles.iconButton} ${
                    sharedStyles.small
                  } ${isMarkdownGuideOpen ? sharedStyles.active : ""}`}
                  onClick={() => setIsMarkdownGuideOpen(!isMarkdownGuideOpen)}
                  aria-label={
                    isMarkdownGuideOpen
                      ? "Close Markdown & HTML guide"
                      : "Open Markdown & HTML guide"
                  }
                  type="button"
                >
                  <InfoIcon />
                </button>
              </Tooltip>
            </div>
            <TransliterationInput
              id="block-content"
              className={styles.propertyTextarea}
              value={selectedBlock.content}
              onChange={handleContentChange}
              rows={4}
              placeholder="Enter block content here. Click on info icon for Markdown & HTML guide."
            />
          </div>
        )}

        {shouldShowContent(selectedBlock.type) && (
          <div className={styles.propertyRow}>
            <label className={styles.propertyLabel} htmlFor="block-style">
              Styles
            </label>
            <StyleEditor
              value={String(selectedBlock.properties.style ?? "")}
              onChange={handleStyleChange}
            />
          </div>
        )}

        {selectedBlock.type === "section" && (
          <SectionProperties
            selectedBlock={selectedBlock}
            onBorderedChange={handleBorderedChange}
            onPropertyChange={handlePropertyChange}
          />
        )}

        {selectedBlock.type === "grid" && (
          <GridProperties
            selectedBlock={selectedBlock}
            currentColumns={currentColumns}
            onShowBordersChange={handleShowBordersChange}
            onGridColumnsChange={handleGridColumnsChange}
            onColumnWidthChange={handleColumnWidthChange}
            onStyleChange={handleStyleChange}
            onColumnStyleChange={handleColumnStyleChange}
            onPropertyChange={handlePropertyChange}
          />
        )}

        {selectedBlock.type === "gridRow" && (
          <GridRowColumnContents
            columns={getParentGridColumns(blocks, selectedBlockId)}
            columnContents={
              (selectedBlock.properties.columnContents as string[]) ?? []
            }
            onColumnContentChange={handleColumnContentChange}
            isMarkdownGuideOpen={isMarkdownGuideOpen}
            onToggleGuide={() => setIsMarkdownGuideOpen(!isMarkdownGuideOpen)}
            onExpandColumn={(index) => setExpandedColumnIndex(index)}
          />
        )}

        {selectedBlock.type === "table" && (
          <TablePropertiesSection
            selectedBlock={selectedBlock}
            onListBindingChange={handleTableListBindingChange}
            onZebraRowsChange={handleTableZebraRowsChange}
            onShowBordersChange={handleTableShowBordersChange}
            onColumnsChange={handleTableColumnsChange}
            onColumnWidthChange={handleTableColumnWidthChange}
            onHeaderStyleChange={handleTableHeaderStyleChange}
            onRowCellStyleChange={handleTableRowCellStyleChange}
          />
        )}

        {selectedBlock.type === "divider" && (
          <div className={styles.propertyRow}>
            <span className={styles.propertyLabel}>Width</span>
            <div className={styles.columnWidthSliders}>
              <div className={styles.sliderRow}>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={Number(selectedBlock.properties.width) || 100}
                  onChange={(e) =>
                    handlePropertyChange("width", Number(e.target.value))
                  }
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>
                  {Number(selectedBlock.properties.width) || 100}%
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedBlock.type !== "image" &&
          visibleProperties.map(([key, value]) => (
            <PropertyInput
              key={key}
              propertyKey={key}
              value={value}
              onChange={handlePropertyChange}
            />
          ))}

        {selectedBlock.type === "image" && (
          <>
            {visibleProperties.map(([key, value]) => (
              <PropertyInput
                key={key}
                propertyKey={key}
                value={value}
                onChange={handlePropertyChange}
              />
            ))}
            <div className={styles.propertyRow}>
              <span className={styles.propertyLabel}>Alignment</span>
              <div className={styles.imageAlignmentSelector}>
                {ALIGNMENT_OPTIONS.map((align) => (
                  <button
                    key={align}
                    type="button"
                    className={`${styles.imageAlignmentOption} ${
                      selectedBlock.properties.alignment === align
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() => handlePropertyChange("alignment", align)}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.propertyRow}>
              <label className={styles.propertyLabel} htmlFor="block-style">
                Styles
              </label>
              <StyleEditor
                value={String(selectedBlock.properties.style ?? "")}
                onChange={handleStyleChange}
              />
            </div>
          </>
        )}
      </div>
      {selectedBlock && (
        <ExpandedContentEditor
          isOpen={isContentExpanded}
          onClose={() => setIsContentExpanded(false)}
          value={selectedBlock.content}
          onChange={handleContentChange}
        />
      )}
      {selectedBlock && expandedColumnIndex !== null && (
        <ExpandedContentEditor
          isOpen={expandedColumnIndex !== null}
          onClose={() => setExpandedColumnIndex(null)}
          value={
            ((selectedBlock.properties.columnContents as string[]) ?? [])[
              expandedColumnIndex
            ] ?? ""
          }
          onChange={(value) =>
            handleColumnContentChange(expandedColumnIndex, value)
          }
        />
      )}
    </div>
  );
};

interface SectionPropertiesProps {
  selectedBlock: { properties: Record<string, unknown> };
  onBorderedChange: (value: boolean) => void;
  onPropertyChange: (key: string, value: string) => void;
}

const SectionProperties = ({
  selectedBlock,
  onBorderedChange,
  onPropertyChange,
}: SectionPropertiesProps) => (
  <>
    <div className={`${styles.propertyRow} ${styles.rowLayout}`}>
      <span className={styles.propertyLabel}>Bordered</span>
      <ToggleSwitch
        id="section-bordered"
        size="small"
        isToggled={Boolean(selectedBlock.properties.bordered)}
        onToggle={(e) => onBorderedChange(e.target.checked)}
      />
    </div>
    <div className={styles.propertyRow}>
      <label
        className={styles.propertyLabel}
        htmlFor="section-padding-vertical"
      >
        Padding Vertical
      </label>
      <div className={styles.propertyInputWithSuffix}>
        <input
          id="section-padding-vertical"
          type="text"
          className={styles.suffixInput}
          value={String(
            selectedBlock.properties.paddingVertical ?? "16",
          ).replace("px", "")}
          onChange={(e) =>
            onPropertyChange(
              "paddingVertical",
              `${e.target.value.replaceAll(/\D/g, "")}px`,
            )
          }
        />
        <span className={styles.suffix}>px</span>
      </div>
    </div>
    <div className={styles.propertyRow}>
      <label
        className={styles.propertyLabel}
        htmlFor="section-padding-horizontal"
      >
        Padding Horizontal
      </label>
      <div className={styles.propertyInputWithSuffix}>
        <input
          id="section-padding-horizontal"
          type="text"
          className={styles.suffixInput}
          value={String(
            selectedBlock.properties.paddingHorizontal ?? "16",
          ).replace("px", "")}
          onChange={(e) =>
            onPropertyChange(
              "paddingHorizontal",
              `${e.target.value.replaceAll(/\D/g, "")}px`,
            )
          }
        />
        <span className={styles.suffix}>px</span>
      </div>
    </div>
  </>
);

interface GridPropertiesProps {
  selectedBlock: { properties: Record<string, unknown> };
  currentColumns: number;
  onShowBordersChange: (value: boolean) => void;
  onGridColumnsChange: (numColumns: number) => void;
  onColumnWidthChange: (index: number, value: number, widths: number[]) => void;
  onStyleChange: (value: string) => void;
  onColumnStyleChange: (index: number, value: string) => void;
  onPropertyChange: (key: string, value: number) => void;
}

const GridProperties = ({
  selectedBlock,
  currentColumns,
  onShowBordersChange,
  onGridColumnsChange,
  onColumnWidthChange,
  onStyleChange,
  onColumnStyleChange,
  onPropertyChange,
}: GridPropertiesProps) => (
  <>
    <div className={`${styles.propertyRow} ${styles.rowLayout}`}>
      <span className={styles.propertyLabel}>Show Borders</span>
      <ToggleSwitch
        id="grid-show-borders"
        size="small"
        isToggled={selectedBlock.properties.showBorders !== false}
        onToggle={(e) => onShowBordersChange(e.target.checked)}
      />
    </div>
    <div className={styles.propertyRow}>
      <span className={styles.propertyLabel}>Number of Columns</span>
      <div className={styles.columnSelector}>
        {GRID_COLUMN_OPTIONS.map((num) => (
          <button
            key={num}
            className={`${styles.columnOption} ${
              currentColumns === num ? styles.selected : ""
            }`}
            onClick={() => onGridColumnsChange(num)}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
    <ColumnWidthSliders
      columns={currentColumns}
      columnWidths={
        (selectedBlock.properties.columnWidths as number[]) ??
        Array.from({ length: currentColumns }, () =>
          Math.round(100 / currentColumns),
        )
      }
      onWidthChange={onColumnWidthChange}
    />
    <div className={styles.propertyRow}>
      <label className={styles.propertyLabel} htmlFor="grid-style">
        Styles
      </label>
      <StyleEditor
        value={String(selectedBlock.properties.style ?? "")}
        onChange={onStyleChange}
      />
    </div>
    <div className={styles.propertyRow}>
      <span className={styles.propertyLabel}>Column Spacing</span>
      <div className={styles.columnWidthSliders}>
        <div className={styles.sliderRow}>
          <input
            type="range"
            min={0}
            max={80}
            step={2}
            value={Number(selectedBlock.properties.columnSpacing ?? 0)}
            onChange={(e) =>
              onPropertyChange("columnSpacing", Number(e.target.value))
            }
            className={styles.slider}
          />
          <span className={styles.sliderValue}>
            {Number(selectedBlock.properties.columnSpacing ?? 0)}px
          </span>
        </div>
      </div>
    </div>
    <ColumnStylesEditor
      columns={currentColumns}
      columnStyles={(selectedBlock.properties.columnStyles as string[]) ?? []}
      onColumnStyleChange={onColumnStyleChange}
    />
  </>
);

interface TablePropertiesSectionProps {
  selectedBlock: { properties: Record<string, unknown> };
  onListBindingChange: (value: string) => void;
  onZebraRowsChange: (value: boolean) => void;
  onShowBordersChange: (value: boolean) => void;
  onColumnsChange: (columns: TableColumn[], newWidths?: number[]) => void;
  onColumnWidthChange: (index: number, value: number, widths: number[]) => void;
  onHeaderStyleChange: (value: string) => void;
  onRowCellStyleChange: (value: string) => void;
}

const TablePropertiesSection = ({
  selectedBlock,
  onListBindingChange,
  onZebraRowsChange,
  onShowBordersChange,
  onColumnsChange,
  onColumnWidthChange,
  onHeaderStyleChange,
  onRowCellStyleChange,
}: TablePropertiesSectionProps) => {
  const tableColumns =
    (selectedBlock.properties.columns as TableColumn[]) ?? [];
  const tableColumnWidths =
    (selectedBlock.properties.columnWidths as number[]) ?? [];
  const effectiveWidths =
    tableColumnWidths.length === tableColumns.length
      ? tableColumnWidths
      : (DEFAULT_COLUMN_WIDTHS[tableColumns.length] ??
        Array.from({ length: tableColumns.length || 1 }, () =>
          Math.round(100 / (tableColumns.length || 1)),
        ));

  return (
    <TableProperties
      list={String(selectedBlock.properties.list ?? "")}
      zebraRows={Boolean(selectedBlock.properties.zebraRows)}
      showBorders={selectedBlock.properties.showBorders !== false}
      columns={tableColumns}
      columnWidths={effectiveWidths}
      headerStyle={String(selectedBlock.properties.headerStyle ?? "")}
      rowCellStyle={String(selectedBlock.properties.rowCellStyle ?? "")}
      onListBindingChange={onListBindingChange}
      onZebraRowsChange={onZebraRowsChange}
      onShowBordersChange={onShowBordersChange}
      onColumnsChange={onColumnsChange}
      onColumnWidthChange={onColumnWidthChange}
      onHeaderStyleChange={onHeaderStyleChange}
      onRowCellStyleChange={onRowCellStyleChange}
    />
  );
};

export default PropertiesPanel;
