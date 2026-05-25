"use client";
import {
  Fragment,
  useState,
  useCallback,
  useRef,
  useEffect,
  DragEvent,
  RefObject,
} from "react";
import styles from "./StructurePanel.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import {
  TemplateStructureNode,
  TemplateBlock,
  TemplateGlobalStyles,
  TemplateContent,
  TemplateDesignerMode,
} from "@/app/template-designer/types";
import { updateTemplate } from "@/app/documents/templates/services";
import {
  saveNotificationTemplateData,
  updateNotificationTemplate,
} from "@/app/communications/templates/services";
import { NotificationTemplateMetadata } from "@/app/communications/templates/types";
import SaveIcon from "@/app/components/SVGIcons/Save";
import SettingsIcon from "@/app/components/SVGIcons/Settings";
import ChevronRightIcon from "@/app/components/SVGIcons/ChevronRight";
import PlusIcon from "@/app/components/SVGIcons/Plus";
import CopyIcon from "@/app/components/SVGIcons/Copy";
import ExpandAllIcon from "@/app/components/SVGIcons/ExpandAll";
import CollapseAllIcon from "@/app/components/SVGIcons/CollapseAll";
import Tooltip from "@/app/components/Tooltip/Tooltip";
import TemplateSettingsPane from "@/app/template-designer/components/TemplateSettingsPane/TemplateSettingsPane";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { markdownToHtml } from "@/app/template-designer/utils/markdownUtils";
import {
  isContainerType,
  getAlignmentStyle,
  generateEmailHtml,
} from "@/app/template-designer/utils";
import LanguageSelector from "@/app/template-designer/components/LanguageSelector/LanguageSelector";
import Modal from "@/app/components/InternalComponents/Modal/Modal";
import { deepCloneBlocks } from "@/app/template-designer/services/translationService";

interface StructureNodeProps {
  node: TemplateStructureNode;
  depth: number;
  isFromBlocks?: boolean;
  parentId?: string | null;
  index: number;
  onDragStart: (blockId: string) => void;
  onDragEnd: () => void;
  draggedBlockId: string | null;
  nodeRefs: RefObject<Map<string, HTMLDivElement>>;
}

type DropPosition = "before" | "after" | "inside" | null;

const StructureNode = ({
  node,
  depth,
  isFromBlocks,
  parentId,
  index,
  onDragStart,
  onDragEnd,
  draggedBlockId,
  nodeRefs,
}: StructureNodeProps) => {
  const {
    selectedBlockId,
    selectBlock,
    toggleStructureNode,
    addBlock,
    moveBlock,
    duplicateBlock,
  } = useTemplateDesigner();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);
  const isSelected = selectedBlockId === node.id;

  useEffect(() => {
    if (nodeRef.current && nodeRefs.current) {
      nodeRefs.current.set(node.id, nodeRef.current);
      return () => {
        nodeRefs.current?.delete(node.id);
      };
    }
  }, [node.id, nodeRefs]);
  const hasChildren = node.children && node.children.length > 0;
  const isGrid = node.type === "grid";
  const isContainer = isContainerType(node.type);
  const isDragging = draggedBlockId === node.id;
  const isDragTarget = draggedBlockId !== null && draggedBlockId !== node.id;
  const isExpandable = hasChildren || isGrid || isContainer;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.postMessage(
      { type: "STRUCTURE_PANEL_SELECTION", blockId: node.id },
      globalThis.location.origin,
    );
    setTimeout(() => {
      selectBlock(node.id);
      if (isExpandable) {
        toggleStructureNode(node.id);
      }
    }, 0);
  };

  const handleAddRow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newRow: TemplateBlock = {
      id: `gridRow-${Date.now()}`,
      type: "gridRow",
      label: "Row",
      content: "",
      properties: {},
      children: [],
    };
    addBlock(newRow, node.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateBlock(node.id);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", node.id);
    onDragStart(node.id);
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDropPosition(null);
    onDragEnd();
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!isDragTarget) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    if (isContainer) {
      if (y < height * 0.25) {
        setDropPosition("before");
      } else if (y > height * 0.75) {
        setDropPosition("after");
      } else {
        setDropPosition("inside");
      }
    } else if (y < height / 2) {
      setDropPosition("before");
    } else {
      setDropPosition("after");
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDropPosition(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedBlockId || !dropPosition) {
      setDropPosition(null);
      return;
    }

    if (dropPosition === "inside" && isContainer) {
      moveBlock(draggedBlockId, node.id, 0);
    } else if (dropPosition === "before") {
      moveBlock(draggedBlockId, parentId ?? null, index);
    } else if (dropPosition === "after") {
      moveBlock(draggedBlockId, parentId ?? null, index + 1);
    }

    setDropPosition(null);
    onDragEnd();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectBlock(node.id);
    }
  };

  return (
    <Fragment>
      {dropPosition === "before" && (
        <div
          className={styles.dropIndicator}
          style={{
            marginLeft: `${
              depth * 10 + (depth > 0 ? BASE_INDENT_PADDING : 0)
            }px`,
          }}
        />
      )}
      <div
        ref={nodeRef}
        className={`${styles.node} ${isSelected ? styles.selected : ""} ${
          isDragging ? styles.dragging : ""
        } ${dropPosition === "inside" ? styles.dropInside : ""}`}
        style={{
          paddingLeft: `${
            depth * 10 + (depth > 0 ? BASE_INDENT_PADDING : 0)
          }px`,
        }}
        role="treeitem"
        aria-selected={isSelected}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        draggable={isFromBlocks}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isExpandable ? (
          <span className={styles.expandBtn}>
            <span
              className={`${styles.chevron} ${
                node.isExpanded ? styles.expanded : ""
              }`}
            >
              <ChevronRightIcon />
            </span>
          </span>
        ) : (
          <span className={styles.bullet}>
            <div className={styles.bulletPoint} />
          </span>
        )}
        <span className={styles.label}>{node.label}</span>
        {isFromBlocks && (
          <button
            type="button"
            className={styles.duplicateBtn}
            onClick={handleDuplicate}
            title="Duplicate block"
          >
            <CopyIcon />
          </button>
        )}
        <span className={styles.typeTag}>{node.type}</span>
      </div>
      {isExpandable && node.isExpanded && (
        <div className={styles.children}>
          {node.children?.map((child, childIndex) => (
            <StructureNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isFromBlocks={isFromBlocks}
              parentId={node.id}
              index={childIndex}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              draggedBlockId={draggedBlockId}
              nodeRefs={nodeRefs}
            />
          ))}
          {isGrid && isFromBlocks && (
            <button
              className={styles.addRowBtn}
              style={{
                marginLeft: `${
                  (depth + 1) * 10 + (depth + 1 > 0 ? BASE_INDENT_PADDING : 0)
                }px`,
              }}
              onClick={handleAddRow}
            >
              <PlusIcon />
              <span>Add Row</span>
            </button>
          )}
        </div>
      )}
      {dropPosition === "after" && (
        <div
          className={styles.dropIndicator}
          style={{
            marginLeft: `${
              depth * 10 + (depth > 0 ? BASE_INDENT_PADDING : 0)
            }px`,
          }}
        />
      )}
    </Fragment>
  );
};

const generateFtlFromBlocks = (
  blocks: TemplateBlock[],
  globalStyles: TemplateGlobalStyles,
  languageCode: string,
): string => {
  const renderBlock = (
    block: TemplateBlock,
    parentBlock?: TemplateBlock,
  ): string => {
    switch (block.type) {
      case "section": {
        const bordered = block.properties.bordered !== false;
        const paddingVertical = block.properties.paddingVertical ?? "16px";
        const paddingHorizontal = block.properties.paddingHorizontal ?? "16px";
        const borderStyle = bordered
          ? "border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-left: 1px solid #e0e0e0; border-radius: 4px;"
          : "";
        const title = block.properties.title
          ? `<h3 style="margin-top: 0; margin-right: 0; margin-bottom: 12px; margin-left: 0; font-size: 16px; font-weight: 600;">${String(
              block.properties.title,
            )}</h3>`
          : "";
        const childrenHtml =
          block.children?.map((child) => renderBlock(child, block)).join("") ??
          "";
        const nameAttr = block.label ? ` name="${block.label}"` : "";
        return `<section${nameAttr} style="display: block; padding-top: ${paddingVertical}; padding-right: ${paddingHorizontal}; padding-bottom: ${paddingVertical}; padding-left: ${paddingHorizontal}; ${borderStyle}">${title}${markdownToHtml(
          block.content ?? "",
        )}${childrenHtml}</section>`;
      }
      case "richText": {
        const blockStyle = String(block.properties.style ?? "");
        const nameAttr = block.label ? ` name="${block.label}"` : "";
        if (blockStyle) {
          return `<div${nameAttr} style="${blockStyle}">${markdownToHtml(
            block.content ?? "",
          )}</div>`;
        }
        return nameAttr
          ? `<div${nameAttr}>${markdownToHtml(block.content ?? "")}</div>`
          : markdownToHtml(block.content ?? "");
      }
      case "grid": {
        if (block.children && block.children.length > 0) {
          const columnWidths =
            (block.properties.columnWidths as number[]) ?? [];
          const columns = Number(block.properties.columns) || 2;
          const showBorders = block.properties.showBorders !== false;
          const gridStyle = String(block.properties.style ?? "");
          const nameAttr = block.label ? ` name="${block.label}"` : "";
          const colTags =
            columnWidths.length === columns
              ? columnWidths.map(
                  (w) => '<col style="width: ' + String(w) + '%;" />',
                )
              : [];
          const colgroup =
            colTags.length > 0
              ? "<colgroup>" + colTags.join("") + "</colgroup>"
              : "";
          const rows = block.children
            .map((child) => renderBlock(child, block))
            .join("");
          const columnSpacing = Number(block.properties.columnSpacing ?? 0);
          const baseStyle = `width: 100%; border-collapse: separate; border-spacing: ${columnSpacing}px 0;`;
          const combinedStyle = gridStyle
            ? `${baseStyle} ${gridStyle}`
            : baseStyle;
          return `<table style="${combinedStyle}" data-block-type="grid" data-show-borders="${showBorders}"${nameAttr}>${colgroup}<tbody>${rows}</tbody></table>`;
        }
        return "";
      }
      case "gridRow": {
        const parentColumns = parentBlock
          ? Number(parentBlock.properties.columns) || 2
          : 2;
        const parentShowBorders = parentBlock?.properties.showBorders !== false;
        const parentColumnStyles =
          (parentBlock?.properties.columnStyles as string[]) ?? [];
        const columnContents =
          (block.properties.columnContents as string[]) ?? [];
        const nameAttr = block.label ? ` name="${block.label}"` : "";
        const cells = Array.from({ length: parentColumns }, (_, i) => {
          const content = markdownToHtml(columnContents[i] ?? "");
          const cellBorderStyle = parentShowBorders
            ? "border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-left: 1px solid #e0e0e0;"
            : "";
          const columnStyle = parentColumnStyles[i] ?? "";
          const combinedCellStyle = columnStyle
            ? `${cellBorderStyle} ${columnStyle}`
            : cellBorderStyle;
          return `<td style="${combinedCellStyle}">${content}</td>`;
        }).join("");
        return `<tr${nameAttr}>${cells}</tr>`;
      }
      case "table": {
        const listPath = String(block.properties.list ?? "");
        const columns =
          (block.properties.columns as Array<{
            dataKey: string;
            label: string;
            alignment: string;
          }>) ?? [];
        const columnWidths = (block.properties.columnWidths as number[]) ?? [];
        const zebraRows = block.properties.zebraRows === true;
        const showBorders = block.properties.showBorders !== false;
        const headerStyle = String(block.properties.headerStyle ?? "");
        const rowCellStyle = String(block.properties.rowCellStyle ?? "");

        if (columns.length === 0) {
          return `<table style="width: 100%; border-collapse: collapse;"><tbody></tbody></table>`;
        }

        const borderStyle = showBorders
          ? "border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-left: 1px solid #e0e0e0;"
          : "";

        const extractPropertyName = (dataKey: string): string => {
          const ftlMatch = /^\$\{(.+)\}$/.exec(dataKey.trim());
          if (!ftlMatch) return dataKey;

          let expression = ftlMatch[1];

          expression = expression.replace(/!.*$/, "");
          expression = expression.replace(/\?string\(.*\)$/, "");
          expression = expression.replace(/\?string\[.*\]$/, "");
          expression = expression.replace(
            /\?(capitalize|lower_case|upper_case)$/,
            "",
          );

          return expression.trim();
        };

        const baseHeaderStyle = `${borderStyle} background: #f5f5f5; font-weight: 600;`;
        const headerCells = columns
          .map((col, colIndex) => {
            const widthStyle =
              columnWidths[colIndex] === undefined
                ? ""
                : `width: ${columnWidths[colIndex]}%;`;
            const combinedHeaderStyle = `${baseHeaderStyle} text-align: ${getAlignmentStyle(
              col.alignment,
            )}; ${widthStyle} ${headerStyle}`;
            const propertyName = extractPropertyName(col.dataKey);
            return `<th style="${combinedHeaderStyle}" data-label="${col.label}" data-key="${propertyName}" data-align="${col.alignment}">${col.label}</th>`;
          })
          .join("");
        const headerRow = `<tr>${headerCells}</tr>`;

        const zebraAttr = zebraRows ? ' data-zebra="true"' : "";
        const showBordersAttr = showBorders ? "" : ' data-show-borders="false"';
        const zebraStyle = zebraRows
          ? `\${item?index % 2 == 1?then('background: #f9f9f9;', '')}`
          : "";

        const baseRowCellStyle = borderStyle;
        const bodyCells = columns
          .map((col) => {
            const combinedCellStyle = `${baseRowCellStyle} text-align: ${getAlignmentStyle(
              col.alignment,
            )}; ${zebraStyle} ${rowCellStyle}`;
            const ftlMatch = /^\$\{(.+)\}$/.exec(col.dataKey.trim());
            const cellContent = ftlMatch
              ? `\${item.${ftlMatch[1]}}`
              : col.dataKey;
            return `<td style="${combinedCellStyle}">${cellContent}</td>`;
          })
          .join("");
        const bodyRow = `<tr>${bodyCells}</tr>`;

        const headerStyleAttr = headerStyle
          ? ` data-header-style="${headerStyle}"`
          : "";
        const rowCellStyleAttr = rowCellStyle
          ? ` data-row-cell-style="${rowCellStyle}"`
          : "";
        const nameAttr = block.label ? ` name="${block.label}"` : "";

        const loopContent = listPath
          ? `<#list ${listPath} as item>${bodyRow}</#list>`
          : "";

        return `<table style="width: 100%; border-collapse: collapse;" data-block-type="table" data-list="${listPath}"${zebraAttr}${showBordersAttr}${headerStyleAttr}${rowCellStyleAttr}${nameAttr}><thead>${headerRow}</thead><tbody>${loopContent}</tbody></table>`;
      }
      case "loop": {
        const variableName = String(block.properties.variable ?? "item");
        const listPath = String(block.properties.list ?? "");
        const childrenHtml =
          block.children?.map((child) => renderBlock(child, block)).join("") ??
          "";
        return `<#list ${listPath} as ${variableName}>${childrenHtml}</#list>`;
      }
      case "if": {
        const condition = String(block.properties.condition ?? "true");
        const childrenHtml =
          block.children?.map((child) => renderBlock(child, block)).join("") ??
          "";
        return `<#if ${condition}>${childrenHtml}</#if>`;
      }
      case "image": {
        const src = String(block.properties.src ?? "");
        const alt = String(block.properties.alt ?? "");
        const width = String(block.properties.width ?? "100%");
        const imgStyle = String(block.properties.style ?? "");
        const alignment = String(block.properties.alignment ?? "L");
        const nameAttr = block.label ? ` name="${block.label}"` : "";

        const alignmentStyles: Record<string, string> = {
          L: "margin-right: auto;",
          C: "margin-left: auto; margin-right: auto;",
          R: "margin-left: auto;",
        };

        const baseStyle = `width: ${width}; max-width: 100%; display: block; ${
          alignmentStyles[alignment] ?? ""
        }`;
        const combinedStyle = imgStyle ? `${baseStyle} ${imgStyle}` : baseStyle;
        return `<img${nameAttr} src="${src}" alt="${alt}" style="${combinedStyle}" />`;
      }
      case "spacer": {
        const height = String(block.properties.height ?? "15px");
        const nameAttr = block.label ? ` name="${block.label}"` : "";
        return `<div${nameAttr} style="height: ${height};"></div>`;
      }
      case "divider": {
        const thickness = String(block.properties.thickness ?? "1px");
        const color = String(block.properties.color ?? "#e0e0e0");
        const dividerWidth = Number(block.properties.width) || 100;
        const nameAttr = block.label ? ` name="${block.label}"` : "";
        return `<hr${nameAttr} style="border-top: ${thickness} solid ${color}; border-right: none; border-bottom: none; border-left: none; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; width: ${dividerWidth}%;" />`;
      }
      case "pageBreak": {
        const nameAttr = block.label ? ` name="${block.label}"` : "";
        return `<div${nameAttr} style="page-break-after: always;">&nbsp;</div>`;
      }
      default:
        return markdownToHtml(block.content ?? "");
    }
  };

  const bodyContent = blocks.map((block) => renderBlock(block)).join("");
  const preheaderHtml = globalStyles.preheaderText
    ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${globalStyles.preheaderText}</div><div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : "";

  return generateEmailHtml({
    languageCode,
    globalStyles,
    bodyContent,
    preheaderHtml,
    bodyStyleConfig: {
      includeBackgroundAndLayout: true,
      marginTop: "0",
    },
  });
};

interface StructurePanelProps {
  templateId: string;
  isPlayground?: boolean;
  mode?: TemplateDesignerMode;
  communicationType?: string;
  communicationSubscriptionKey?: string;
  communicationTemplateMetadata?: NotificationTemplateMetadata | null;
}

const BASE_INDENT_PADDING = 8;

const StructurePanel = ({
  templateId,
  isPlayground = false,
  mode = "document",
  communicationType,
  communicationSubscriptionKey,
  communicationTemplateMetadata,
}: StructurePanelProps) => {
  const {
    structure,
    htmlStructure,
    templateContent,
    templateName,
    templateMimeType,
    templateCategory,
    globalStyles,
    blocks,
    selectBlock,
    selectedBlockId,
    currentLanguage,
    defaultLanguage,
    availableLanguages,
    getLanguageBlocks,
    saveCurrentLanguageBlocks,
    toggleStructureNode,
    expandedNodes,
  } = useTemplateDesigner();

  const { setUserNotification } = useHeaderV2();
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const nodeRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const contentRef = useRef<HTMLDivElement>(null);

  const getAllBlockIds = useCallback(
    (nodes: TemplateStructureNode[]): string[] => {
      const ids: string[] = [];
      const traverse = (node: TemplateStructureNode) => {
        if (
          (node.children && node.children.length > 0) ||
          node.type === "grid" ||
          isContainerType(node.type)
        ) {
          ids.push(node.id);
        }
        if (node.children) {
          node.children.forEach(traverse);
        }
      };
      nodes.forEach(traverse);
      return ids;
    },
    [],
  );

  const handleExpandAll = useCallback(() => {
    const displayStructure = templateContent ? htmlStructure : structure;
    const allIds = getAllBlockIds(displayStructure);
    allIds.forEach((id) => {
      if (!expandedNodes.has(id)) {
        toggleStructureNode(id);
      }
    });
  }, [
    templateContent,
    htmlStructure,
    structure,
    getAllBlockIds,
    toggleStructureNode,
    expandedNodes,
  ]);

  const handleCollapseAll = useCallback(() => {
    const displayStructure = templateContent ? htmlStructure : structure;
    const allIds = getAllBlockIds(displayStructure);
    allIds.forEach((id) => {
      if (expandedNodes.has(id)) {
        toggleStructureNode(id);
      }
    });
  }, [
    templateContent,
    htmlStructure,
    structure,
    getAllBlockIds,
    toggleStructureNode,
    expandedNodes,
  ]);

  useEffect(() => {
    if (selectedBlockId && contentRef.current) {
      requestAnimationFrame(() => {
        const nodeElement = nodeRefsMap.current.get(selectedBlockId);
        const container = contentRef.current;
        if (nodeElement && container) {
          const containerRect = container.getBoundingClientRect();
          const nodeRect = nodeElement.getBoundingClientRect();

          const isAbove = nodeRect.top < containerRect.top;
          const isBelow = nodeRect.bottom > containerRect.bottom;

          if (isAbove || isBelow) {
            const scrollTop = isAbove
              ? container.scrollTop + (nodeRect.top - containerRect.top) - 10
              : container.scrollTop +
                (nodeRect.bottom - containerRect.bottom) +
                10;

            container.scrollTo({
              top: scrollTop,
              behavior: "smooth",
            });
          }
        }
      });
    }
  }, [selectedBlockId]);

  const displayStructure = templateContent ? htmlStructure : structure;
  const isFromBlocks = !templateContent;

  const generateContentFromBlocks = useCallback((): string => {
    if (templateContent) return templateContent;
    return generateFtlFromBlocks(blocks, globalStyles, currentLanguage.value);
  }, [templateContent, blocks, globalStyles, currentLanguage.value]);

  const buildContentsArray = useCallback((): TemplateContent[] => {
    saveCurrentLanguageBlocks();

    const contents: TemplateContent[] = [];

    for (const lang of availableLanguages) {
      const langBlocks =
        lang.value === currentLanguage.value
          ? deepCloneBlocks(blocks)
          : getLanguageBlocks(lang.value);
      const langContent = generateFtlFromBlocks(
        langBlocks,
        globalStyles,
        lang.value,
      );

      contents.push({
        content: langContent,
        language: lang.value,
        isDefault: lang.value === defaultLanguage.value,
      });
    }

    if (contents.length === 0) {
      contents.push({
        content: generateContentFromBlocks(),
        language: currentLanguage.value,
        isDefault: true,
      });
    }

    return contents;
  }, [
    availableLanguages,
    currentLanguage,
    defaultLanguage,
    blocks,
    globalStyles,
    getLanguageBlocks,
    saveCurrentLanguageBlocks,
    generateContentFromBlocks,
  ]);

  const handleSave = async () => {
    if (isPlayground) {
      const contents = buildContentsArray();
      console.log("Playground Save - Contents Array:", contents);
      setUserNotification({
        type: "success",
        text: "Playground: Template logged to console (no backend save)",
        time: 3000,
      });
      return;
    }

    if (isSaving) return;

    if (mode === "document" && availableLanguages.length > 1) {
      setShowSaveConfirmModal(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    setShowSaveConfirmModal(false);
    setIsSaving(true);
    try {
      const contents = buildContentsArray();

      if (mode === "communication") {
        if (!communicationType || !communicationSubscriptionKey) {
          throw new Error("Missing communication template context");
        }

        const content =
          contents.find((item) => item.language === currentLanguage.value)
            ?.content ??
          contents[0]?.content ??
          generateContentFromBlocks();

        await saveNotificationTemplateData(
          communicationType,
          communicationSubscriptionKey,
          templateId,
          content,
        );

        if (
          communicationTemplateMetadata &&
          (communicationTemplateMetadata.templateName !== templateName ||
            communicationTemplateMetadata.templateMimeType !==
              templateMimeType ||
            communicationTemplateMetadata.language !== currentLanguage.value)
        ) {
          await updateNotificationTemplate(
            communicationType,
            communicationSubscriptionKey,
            templateId,
            {
              templateName,
              subject: communicationTemplateMetadata.subject,
              templateMimeType,
              language: currentLanguage.value,
              primary: communicationTemplateMetadata.primary,
              vendorTemplateId: communicationTemplateMetadata.vendorTemplateId,
            },
          );
        }
      } else {
        await updateTemplate(templateId, {
          id: templateId,
          name: templateName,
          category: templateCategory || "general",
          contents,
          mimeType: templateMimeType,
        });
      }
      setUserNotification({
        type: "success",
        text: "Template saved successfully",
        time: 3000,
      });
    } catch (error) {
      setUserNotification({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to save template",
        time: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmptyClick = () => {
    selectBlock(null);
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      selectBlock(null);
    }
  };

  const handleDragStart = (blockId: string) => {
    setDraggedBlockId(blockId);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
  };

  return (
    <div className={styles.structurePanel}>
      <div className={styles.templateHeader}>
        <span className={styles.templateName}>
          {templateName || "Untitled Template"}
        </span>
        {mode === "document" && <LanguageSelector />}
        <Tooltip text="Settings">
          <button
            className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </Tooltip>
        <Tooltip text={isSaving ? "Saving..." : "Save"}>
          <button
            className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
            onClick={handleSave}
            disabled={isSaving}
            title="Save"
          >
            <SaveIcon />
          </button>
        </Tooltip>
      </div>
      <div className={styles.controlBar}>
        <Tooltip text="Expand All">
          <button
            className={styles.controlButton}
            onClick={handleExpandAll}
            title="Expand All"
          >
            <ExpandAllIcon />
          </button>
        </Tooltip>
        <Tooltip text="Collapse All">
          <button
            className={styles.controlButton}
            onClick={handleCollapseAll}
            title="Collapse All"
          >
            <CollapseAllIcon />
          </button>
        </Tooltip>
      </div>
      <div
        ref={contentRef}
        className={styles.content}
        role="tree"
        tabIndex={-1}
        onClick={handleEmptyClick}
        onKeyDown={handleContentKeyDown}
      >
        {displayStructure.length === 0 ? (
          <div className={styles.empty}>No blocks added yet</div>
        ) : (
          displayStructure.map((node, index) => (
            <StructureNode
              key={node.id}
              node={node}
              depth={0}
              isFromBlocks={isFromBlocks}
              parentId={null}
              index={index}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              draggedBlockId={draggedBlockId}
              nodeRefs={nodeRefsMap}
            />
          ))
        )}
      </div>
      <TemplateSettingsPane
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mode={mode}
      />
      <Modal
        isOpen={showSaveConfirmModal}
        title="Confirm Save"
        description="This template has multiple languages. Please confirm that you have reviewed the auto-translated content for all languages before saving."
        submitText="Confirm & Save"
        cancelText="Cancel"
        onSubmit={performSave}
        onClose={() => setShowSaveConfirmModal(false)}
        backDrop={() => setShowSaveConfirmModal(false)}
        type="warning"
      />
    </div>
  );
};

export default StructurePanel;
