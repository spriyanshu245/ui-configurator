"use client";
import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import styles from "./PreviewPane.module.scss";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import {
  TemplateBlock,
  TemplateGlobalStyles,
  PageSizeOption,
} from "@/app/template-designer/types";
import { markdownToHtml } from "@/app/template-designer/utils/markdownUtils";
import { getAlignmentStyle, generateEmailHtml } from "@/app/template-designer/utils";
import { PAGE_SIZE_OPTIONS } from "@/app/template-designer/constants";

type DataContext = Record<string, unknown>;

const MISSING_VALUE = Symbol("MISSING_VALUE");

const escapeHtml = (text: string): string => {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replaceAll(/[&<>"']/g, (char) => htmlEscapeMap[char]);
};

const getValueOrMissing = (
  obj: DataContext,
  path: string,
): string | typeof MISSING_VALUE => {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return MISSING_VALUE;
    if (
      typeof current === "object" &&
      part in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return MISSING_VALUE;
    }
  }
  if (current === null || current === undefined) return MISSING_VALUE;
  return String(current);
};

const getValue = (obj: DataContext, path: string): string => {
  const result = getValueOrMissing(obj, path);
  return result === MISSING_VALUE ? "" : result;
};

const getNumericValue = (obj: DataContext, path: string): number => {
  const value = getValue(obj, path);
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const getListValue = (obj: DataContext, path: string): unknown[] => {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return [];
    if (
      typeof current === "object" &&
      part in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return [];
    }
  }
  return Array.isArray(current) ? current : [];
};

type Token = {
  type: "number" | "variable" | "operator" | "lparen" | "rparen";
  value: string | number;
};

const tokenizeExpression = (expr: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  const len = expr.length;

  while (i < len) {
    const char = expr[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[+\-*/%]/.test(char)) {
      tokens.push({ type: "operator", value: char });
      i++;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "lparen", value: "(" });
      i++;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "rparen", value: ")" });
      i++;
      continue;
    }

    if (
      /\d/.test(char) ||
      (char === "." && i + 1 < len && /\d/.test(expr[i + 1]))
    ) {
      let numStr = "";
      while (i < len && (/\d/.test(expr[i]) || expr[i] === ".")) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: "number", value: Number.parseFloat(numStr) });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let varName = "";
      while (i < len && /[a-zA-Z0-9_.]/.test(expr[i])) {
        varName += expr[i];
        i++;
      }
      tokens.push({ type: "variable", value: varName });
      continue;
    }

    i++;
  }

  return tokens;
};

const evaluateMathExpression = (
  expr: string,
  context: DataContext,
): number | null => {
  const tokens = tokenizeExpression(expr);
  if (tokens.length === 0) return null;

  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];
  const consume = (): Token | undefined => tokens[pos++];

  const parsePrimary = (): number => {
    const token = peek();
    if (!token) return 0;

    if (token.type === "number") {
      consume();
      return token.value as number;
    }

    if (token.type === "variable") {
      consume();
      return getNumericValue(context, token.value as string);
    }

    if (token.type === "lparen") {
      consume();
      const result = parseAddSub();
      if (peek()?.type === "rparen") {
        consume();
      }
      return result;
    }

    if (token.type === "operator" && token.value === "-") {
      consume();
      return -parsePrimary();
    }

    if (token.type === "operator" && token.value === "+") {
      consume();
      return parsePrimary();
    }

    return 0;
  };

  const parseMulDiv = (): number => {
    let left = parsePrimary();

    while (peek()?.type === "operator") {
      const op = peek()?.value;
      if (op !== "*" && op !== "/" && op !== "%") break;
      consume();
      const right = parsePrimary();
      if (op === "*") left = left * right;
      else if (op === "/") left = right === 0 ? 0 : left / right;
      else if (op === "%") left = right === 0 ? 0 : left % right;
    }

    return left;
  };

  const parseAddSub = (): number => {
    let left = parseMulDiv();

    while (peek()?.type === "operator") {
      const op = peek()?.value;
      if (op !== "+" && op !== "-") break;
      consume();
      const right = parseMulDiv();
      if (op === "+") left = left + right;
      else if (op === "-") left = left - right;
    }

    return left;
  };

  return parseAddSub();
};

const formatDateValue = (dateValue: string, pattern: string): string => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  const pad = (n: number): string => n.toString().padStart(2, "0");

  const replacements: Record<string, string> = {
    yyyy: date.getFullYear().toString(),
    yy: date.getFullYear().toString().slice(-2),
    MM: pad(date.getMonth() + 1),
    M: (date.getMonth() + 1).toString(),
    dd: pad(date.getDate()),
    d: date.getDate().toString(),
    HH: pad(date.getHours()),
    H: date.getHours().toString(),
    hh: pad(date.getHours() % 12 || 12),
    h: (date.getHours() % 12 || 12).toString(),
    mm: pad(date.getMinutes()),
    m: date.getMinutes().toString(),
    ss: pad(date.getSeconds()),
    s: date.getSeconds().toString(),
    a: date.getHours() < 12 ? "AM" : "PM",
  };

  let result = pattern;
  for (const [token, value] of Object.entries(replacements)) {
    result = result.replaceAll(token, value);
  }
  return result;
};

const containsMathOperators = (expr: string): boolean => {
  const operatorPattern = /[+\-*/%]/;
  const cleanExpr = expr.replaceAll(/[a-zA-Z_][a-zA-Z0-9_.]*|\d+\.?\d*/g, "");
  return operatorPattern.test(cleanExpr);
};

const applyStringBuiltin = (value: string, builtin: string): string => {
  switch (builtin) {
    case "capitalize":
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    case "lower_case":
      return value.toLowerCase();
    case "upper_case":
      return value.toUpperCase();
    default:
      return value;
  }
};

const parseDefaultValue = (
  expr: string,
): { variablePath: string; defaultValue: string | null } => {
  const defaultMatch = /^\((.+)\)!(.*)$/.exec(expr);
  if (defaultMatch) {
    const variablePath = defaultMatch[1].trim();
    const defaultPart = defaultMatch[2];
    const defaultValue = extractDefaultValue(defaultPart);
    return { variablePath, defaultValue };
  }

  const simpleDefaultMatch = /^([^!]+)!(.*)$/.exec(expr);
  if (simpleDefaultMatch) {
    const variablePath = simpleDefaultMatch[1].trim();
    const defaultPart = simpleDefaultMatch[2];
    const defaultValue = extractDefaultValue(defaultPart);
    return { variablePath, defaultValue };
  }

  return { variablePath: expr, defaultValue: null };
};

const extractDefaultValue = (defaultPart: string): string => {
  const trimmed = defaultPart.trim();
  if (trimmed === "") return "";
  const quotedMatch = /^"(.*)"$/.exec(trimmed);
  if (quotedMatch) return quotedMatch[1];
  const singleQuotedMatch = /^'(.*)'$/.exec(trimmed);
  if (singleQuotedMatch) return singleQuotedMatch[1];
  return trimmed;
};

const getDefaultOrOriginal = (
  defaultValue: string | null,
  originalMatch: string,
): string => {
  if (defaultValue === null) return escapeHtml(originalMatch);
  return escapeHtml(defaultValue);
};

const substituteVariables = (text: string, context: DataContext): string => {
  if (!text) return text;
  return text.replaceAll(
    /\$\{([^}]*(?:\[[^\]]*\][^}]*)*)\}/g,
    (match, expr: string) => {
      const trimmedExpr = expr.trim();

      const { variablePath: baseExpr, defaultValue } =
        parseDefaultValue(trimmedExpr);

      const booleanStringMatch =
        /^([^?]+)\?string\("([^"]*)"\s*,\s*"([^"]*)"\)$/.exec(baseExpr);
      if (booleanStringMatch) {
        const variablePath = booleanStringMatch[1].trim();
        const trueValue = booleanStringMatch[2];
        const falseValue = booleanStringMatch[3];
        const value = getValueOrMissing(context, variablePath);
        if (value === MISSING_VALUE) {
          return getDefaultOrOriginal(defaultValue, match);
        }
        const boolValue =
          value === "true" || (Boolean(value) && value !== "false");
        return escapeHtml(boolValue ? trueValue : falseValue);
      }

      const dateFormatMatch = /^([^?]+)\?string\["([^"]+)"\]$/.exec(baseExpr);
      if (dateFormatMatch) {
        const variablePath = dateFormatMatch[1].trim();
        const pattern = dateFormatMatch[2];
        const value = getValueOrMissing(context, variablePath);
        if (value === MISSING_VALUE) {
          return getDefaultOrOriginal(defaultValue, match);
        }
        return escapeHtml(formatDateValue(value, pattern));
      }

      const stringBuiltinMatch =
        /^([^?]+)\?(capitalize|lower_case|upper_case)$/.exec(baseExpr);
      if (stringBuiltinMatch) {
        const variablePath = stringBuiltinMatch[1].trim();
        const builtin = stringBuiltinMatch[2];
        const value = getValueOrMissing(context, variablePath);
        if (value === MISSING_VALUE) {
          return getDefaultOrOriginal(defaultValue, match);
        }
        return escapeHtml(applyStringBuiltin(value, builtin));
      }

      if (containsMathOperators(baseExpr)) {
        const result = evaluateMathExpression(baseExpr, context);
        if (result !== null) {
          return Number.isInteger(result) ? String(result) : result.toFixed(2);
        }
        return getDefaultOrOriginal(defaultValue, match);
      }

      const value = getValueOrMissing(context, baseExpr);
      if (value === MISSING_VALUE) {
        return getDefaultOrOriginal(defaultValue, match);
      }
      return escapeHtml(value);
    },
  );
};

const evaluateCondition = (
  condition: string,
  context: DataContext,
): boolean => {
  if (!condition || !condition.trim()) return false;

  const trimmed = condition.trim();

  const eqMatch = /^(.+?)\s*==\s*"(.+)"$/.exec(trimmed);
  if (eqMatch) {
    const value = getValue(context, eqMatch[1].trim());
    return value === eqMatch[2];
  }

  const neqMatch = /^(.+?)\s*!=\s*"(.+)"$/.exec(trimmed);
  if (neqMatch) {
    const value = getValue(context, neqMatch[1].trim());
    return value !== neqMatch[2];
  }

  const numEqMatch = /^(.+?)\s*==\s*(-?\d+\.?\d*)$/.exec(trimmed);
  if (numEqMatch) {
    const value = Number(getValue(context, numEqMatch[1].trim()));
    return value === Number(numEqMatch[2]);
  }

  const numNeqMatch = /^(.+?)\s*!=\s*(-?\d+\.?\d*)$/.exec(trimmed);
  if (numNeqMatch) {
    const value = Number(getValue(context, numNeqMatch[1].trim()));
    return value !== Number(numNeqMatch[2]);
  }

  const gtMatch = /^(.+?)\s*>\s*(\d+)$/.exec(trimmed);
  if (gtMatch) {
    const value = Number(getValue(context, gtMatch[1].trim()));
    return value > Number(gtMatch[2]);
  }

  const ltMatch = /^(.+?)\s*<\s*(\d+)$/.exec(trimmed);
  if (ltMatch) {
    const value = Number(getValue(context, ltMatch[1].trim()));
    return value < Number(ltMatch[2]);
  }

  const gteMatch = /^(.+?)\s*>=\s*(\d+)$/.exec(trimmed);
  if (gteMatch) {
    const value = Number(getValue(context, gteMatch[1].trim()));
    return value >= Number(gteMatch[2]);
  }

  const lteMatch = /^(.+?)\s*<=\s*(\d+)$/.exec(trimmed);
  if (lteMatch) {
    const value = Number(getValue(context, lteMatch[1].trim()));
    return value <= Number(lteMatch[2]);
  }

  const value = getValue(context, trimmed);
  return value === "true" || (Boolean(value) && value !== "false");
};

const IFRAME_BLOCK_STYLES = `
  [data-block-id] {
    cursor: pointer;
    transition: background-color 0.15s ease, outline 0.15s ease;
  }
  [data-block-id]:hover {
    outline: 2px dashed #00867e;
    outline-offset: 1px;
    }
    [data-block-id][data-selected="true"] {
      outline: 2px dashed #00867e;
      outline-offset: 1px;
    background-color: rgba(204, 237, 235, 0.5);
    }
    tr[data-block-id][data-selected="true"] {
      outline: 2px dashed #00867e;
      outline-offset: -2px;
      background-color: rgba(204, 237, 235, 0.5);
  }
  ul, ol {
    margin: 0;
    padding-left: 16px;
  }
  li {
    margin: 2px 0;
  }
`;

const IFRAME_CLICK_HANDLER_SCRIPT = `
  <script>
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target !== document.body) {
        var blockId = target.getAttribute('data-block-id');
        if (blockId) {
          e.preventDefault();
          e.stopPropagation();
          window.parent.postMessage({ type: 'BLOCK_CLICK', blockId: blockId }, '*');
          return;
        }
        target = target.parentElement;
      }
    });

    window.addEventListener('scroll', function() {
      window.parent.postMessage({ type: 'SCROLL_POSITION', scrollTop: window.scrollY }, '*');
    });

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'SELECT_BLOCK') {
        var prevSelected = document.querySelectorAll('[data-selected="true"]');
        prevSelected.forEach(function(el) {
          el.removeAttribute('data-selected');
        });
        
        if (e.data.blockId) {
          var element = document.querySelector('[data-block-id="' + e.data.blockId + '"]');
          if (element) {
            element.setAttribute('data-selected', 'true');
            if (e.data.shouldScroll) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }
      
      if (e.data && e.data.type === 'RESTORE_SCROLL') {
        window.scrollTo(0, e.data.scrollTop);
      }
    });
  </script>
`;

const generateHtmlFromBlocks = (
  blocks: TemplateBlock[],
  dataContext: DataContext,
  globalStyles: TemplateGlobalStyles,
  languageCode: string,
): string => {
  if (blocks.length === 0) return "";

  const getDataAttributes = (blockId: string): string => {
    return `data-block-id="${blockId}"`;
  };

  const renderBlock = (
    block: TemplateBlock,
    context: DataContext,
    parentBlock?: TemplateBlock,
  ): string => {
    switch (block.type) {
      case "section": {
        const bordered = block.properties.bordered !== false;
        const paddingVertical = String(
          block.properties.paddingVertical ?? "16px",
        );
        const paddingHorizontal = String(
          block.properties.paddingHorizontal ?? "16px",
        );
        const borderStyle = bordered
          ? "border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-left: 1px solid #e0e0e0; border-radius: 4px;"
          : "";
        const title = block.properties.title
          ? `<h3 style="margin-top: 0; margin-right: 0; margin-bottom: 12px; margin-left: 0; font-size: 16px; font-weight: 600;">${substituteVariables(
              String(block.properties.title),
              context,
            )}</h3>`
          : "";
        const childrenHtml =
          block.children
            ?.map((child) => renderBlock(child, context, block))
            .join("") ?? "";
        const sectionBaseStyle = `padding-top: ${paddingVertical}; padding-right: ${paddingHorizontal}; padding-bottom: ${paddingVertical}; padding-left: ${paddingHorizontal}; ${borderStyle}`;
        return `<section ${getDataAttributes(
          block.id,
        )} style="${sectionBaseStyle}">${title}${substituteVariables(
          markdownToHtml(block.content ?? ""),
          context,
        )}${childrenHtml}</section>`;
      }
      case "richText": {
        const blockStyle = String(block.properties.style ?? "");
        const styleAttr = blockStyle ? ` style="${blockStyle}"` : "";
        return `<div ${getDataAttributes(
          block.id,
        )}${styleAttr}>${substituteVariables(
          markdownToHtml(block.content ?? "") ||
            "<p>RichText content here...</p>",
          context,
        )}</div>`;
      }
      case "grid": {
        if (block.children && block.children.length > 0) {
          const columnWidths =
            (block.properties.columnWidths as number[]) ?? [];
          const columns = Number(block.properties.columns) || 2;
          const showBorders = block.properties.showBorders !== false;
          const gridStyle = String(block.properties.style ?? "");
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
            .map((child) => renderBlock(child, context, block))
            .join("");
          const columnSpacing = Number(block.properties.columnSpacing ?? 0);
          const baseStyle = `width: 100%; border-collapse: separate; border-spacing: ${columnSpacing}px 0;`;
          const combinedStyle = gridStyle
            ? `${baseStyle} ${gridStyle}`
            : baseStyle;
          return `<table ${getDataAttributes(
            block.id,
          )} style="${combinedStyle}" data-show-borders="${showBorders}">${colgroup}<tbody>${rows}</tbody></table>`;
        }
        return `<div ${getDataAttributes(
          block.id,
        )} style="padding-top: 16px; padding-right: 16px; padding-bottom: 16px; padding-left: 16px; border-top: 1px dashed #ccc; border-right: 1px dashed #ccc; border-bottom: 1px dashed #ccc; border-left: 1px dashed #ccc; border-radius: 4px; min-height: 60px; color: #999; font-size: 12px;">Empty grid</div>`;
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
        const cells = Array.from({ length: parentColumns }, (_, i) => {
          const content = substituteVariables(
            markdownToHtml(columnContents[i] ?? ""),
            context,
          );
          const cellBorderStyle = parentShowBorders
            ? "border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-left: 1px solid #e0e0e0;"
            : "";
          const columnStyle = parentColumnStyles[i] ?? "";
          const combinedCellStyle = columnStyle
            ? `${cellBorderStyle} ${columnStyle}`
            : cellBorderStyle;
          return `<td style="${combinedCellStyle}">${content || "&nbsp;"}</td>`;
        }).join("");
        return `<tr ${getDataAttributes(block.id)}>${cells}</tr>`;
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
        const listData = getListValue(context, listPath);

        if (columns.length === 0) {
          return `<div ${getDataAttributes(
            block.id,
          )} style="padding-top: 16px; padding-right: 16px; padding-bottom: 16px; padding-left: 16px; border-top: 1px dashed #ccc; border-right: 1px dashed #ccc; border-bottom: 1px dashed #ccc; border-left: 1px dashed #ccc; border-radius: 4px; color: #999; font-size: 12px;">Table: No columns defined</div>`;
        }

        const borderStyle = showBorders
          ? "border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-left: 1px solid #e0e0e0;"
          : "";
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
            return `<th style="${combinedHeaderStyle}">${escapeHtml(
              col.label,
            )}</th>`;
          })
          .join("");
        const headerRow = `<tr>${headerCells}</tr>`;

        if (listData.length === 0) {
          return `<table ${getDataAttributes(
            block.id,
          )} style="width: 100%; border-collapse: collapse;"><thead>${headerRow}</thead><tbody><tr><td colspan="${
            columns.length
          }" style="padding-top: 16px; padding-right: 16px; padding-bottom: 16px; padding-left: 16px; text-align: center; color: #999; ${borderStyle}">No data</td></tr></tbody></table>`;
        }

        const baseRowCellStyle = borderStyle;
        const bodyRows = listData
          .map((item, rowIndex) => {
            const zebraStyle =
              zebraRows && rowIndex % 2 === 1 ? "background: #f9f9f9;" : "";
            const cells = columns
              .map((col) => {
                const value = col.dataKey.includes("${")
                  ? substituteVariables(col.dataKey, item as DataContext)
                  : escapeHtml(col.dataKey);
                const combinedCellStyle = `${baseRowCellStyle} text-align: ${getAlignmentStyle(
                  col.alignment,
                )}; ${zebraStyle} ${rowCellStyle}`;
                return `<td style="${combinedCellStyle}">${value}</td>`;
              })
              .join("");
            return `<tr>${cells}</tr>`;
          })
          .join("");

        return `<table ${getDataAttributes(
          block.id,
        )} style="width: 100%; border-collapse: collapse;"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
      }
      case "loop": {
        const variableName = String(block.properties.variable ?? "item");
        const listPath = String(block.properties.list ?? "");
        const listData = getListValue(context, listPath);

        if (listData.length === 0 || !block.children?.length) {
          return `<div ${getDataAttributes(
            block.id,
          )} style="padding-top: 8px; padding-right: 8px; padding-bottom: 8px; padding-left: 8px; border-top: 1px dashed #ccc; border-right: 1px dashed #ccc; border-bottom: 1px dashed #ccc; border-left: 1px dashed #ccc; border-radius: 4px;">
            <span style='color: #999; font-size: 12px;'>Loop: No items</span>
          </div>`;
        }

        const iteratedContent = listData
          .map((item) => {
            const itemContext: DataContext = {
              ...context,
              [variableName]: item as DataContext,
            };
            return block.children
              ?.map((child) => renderBlock(child, itemContext, block))
              .join("");
          })
          .join("");

        return `<div ${getDataAttributes(block.id)}>${iteratedContent}</div>`;
      }
      case "if": {
        const condition = String(block.properties.condition ?? "");
        const conditionMet = evaluateCondition(condition, context);

        if (!conditionMet) {
          return `<div ${getDataAttributes(
            block.id,
          )} style="padding-top: 8px; padding-right: 8px; padding-bottom: 8px; padding-left: 8px; border-top: 1px dashed #ffc107; border-right: 1px dashed #ffc107; border-bottom: 1px dashed #ffc107; border-left: 1px dashed #ffc107; border-radius: 4px; opacity: 0.5;">
            <span style='color: #999; font-size: 12px;'>Condition not met: ${
              condition || "none"
            }</span>
          </div>`;
        }

        const childrenHtml =
          block.children
            ?.map((child) => renderBlock(child, context, block))
            .join("") ?? "";
        return `<div ${getDataAttributes(block.id)}>${childrenHtml}</div>`;
      }
      case "image": {
        const imgSrc = substituteVariables(
          String(block.properties.src ?? ""),
          context,
        );
        const imgAlt = String(block.properties.alt ?? "");
        const imgWidth = String(block.properties.width ?? "100%");
        const imgStyle = String(block.properties.style ?? "");
        const alignment = String(block.properties.alignment ?? "L");

        const alignmentStyles: Record<string, string> = {
          L: "margin-right: auto;",
          C: "margin-left: auto; margin-right: auto;",
          R: "margin-left: auto;",
        };

        const baseStyle = `width: ${imgWidth}; max-width: 100%; height: auto; display: block; ${
          alignmentStyles[alignment] ?? ""
        }`;
        const combinedStyle = imgStyle ? `${baseStyle} ${imgStyle}` : baseStyle;

        if (!imgSrc.trim()) {
          return `<div ${getDataAttributes(
            block.id,
          )} style="padding-top: 24px; padding-right: 24px; padding-bottom: 24px; padding-left: 24px; background: #f5f5f5; text-align: center; border-radius: 4px; color: #999;">Image Placeholder</div>`;
        }

        const errorStyle =
          "padding-top: 24px; padding-right: 24px; padding-bottom: 24px; padding-left: 24px; background: #fff0f0; text-align: center; border-radius: 4px; color: #cc0000; border-top: 1px solid #ffcccc; border-right: 1px solid #ffcccc; border-bottom: 1px solid #ffcccc; border-left: 1px solid #ffcccc;";
        return `<img ${getDataAttributes(
          block.id,
        )} src="${imgSrc}" alt="${imgAlt}" style="${combinedStyle}" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<div style=&quot;${errorStyle}&quot;>Failed to load image</div>');" />`;
      }
      case "spacer": {
        const spacerHeight = String(block.properties.height ?? "15px");
        return `<div ${getDataAttributes(
          block.id,
        )} style="height: ${spacerHeight};"></div>`;
      }
      case "divider": {
        const dividerWidth = Number(block.properties.width) || 100;
        const thickness = String(block.properties.thickness ?? "1px");
        const color = String(block.properties.color ?? "#e0e0e0");
        return `<hr ${getDataAttributes(
          block.id,
        )} style="border-top: ${thickness} solid ${color}; border-right: none; border-bottom: none; border-left: none; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; width: ${dividerWidth}%;" />`;
      }
      case "pageBreak": {
        return `<div ${getDataAttributes(
          block.id,
        )} style="page-break-after: always; position: relative; height: 28px; display: flex; align-items: center; justify-content: center; margin: 4px 0;"><div style="position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed #9aa5c4;"></div><span style="position: relative; background: #fff; padding: 2px 10px; color: #00867e; font-size: 11px; font-weight: 600; letter-spacing: 0.5px;">Page Break</span></div>`;
      }
      default: {
        return `<div ${getDataAttributes(block.id)}>${substituteVariables(
          markdownToHtml(block.content ?? ""),
          context,
        )}</div>`;
      }
    }
  };

  const bodyContent = blocks
    .map((block) => renderBlock(block, dataContext))
    .join("");

  const preheaderHtml = globalStyles.preheaderText
    ? `<div style="display: none; max-height: 0; overflow: hidden;">${globalStyles.preheaderText}</div>`
    : "";

  const wrappedBodyContent = `${preheaderHtml}<div style="background-color: ${globalStyles.bodyBackgroundColor}; margin-top: 0; margin-right: auto; margin-bottom: 0; margin-left: auto; max-width: ${globalStyles.contentMaxWidth.value}px; padding-top: ${globalStyles.bodyPadding}; padding-right: ${globalStyles.bodyPadding}; padding-bottom: ${globalStyles.bodyPadding}; padding-left: ${globalStyles.bodyPadding}; border-radius: 4px;">${bodyContent}${IFRAME_CLICK_HANDLER_SCRIPT}</div>`;

  return generateEmailHtml({
    languageCode,
    globalStyles,
    bodyContent: wrappedBodyContent,
    preheaderHtml: "",
    bodyStyleConfig: {
      includeBackgroundAndLayout: false,
      marginTop: "3px",
    },
    additionalHeadStyles: IFRAME_BLOCK_STYLES,
  });
};

type BlockClickMessage = {
  type: "BLOCK_CLICK";
  blockId: string;
};

const isBlockClickMessage = (data: unknown): data is BlockClickMessage => {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as BlockClickMessage).type === "BLOCK_CLICK" &&
    "blockId" in data &&
    typeof (data as BlockClickMessage).blockId === "string"
  );
};

const PreviewPane = () => {
  const {
    templateContent,
    dataModelJson,
    blocks,
    globalStyles,
    selectedBlockId,
    selectBlock,
    isTranslating,
    currentLanguage,
    isCurrentLanguageDefault,
    setGlobalStyles,
  } = useTemplateDesigner();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rulerContainerRef = useRef<HTMLDivElement>(null);
  const [rulerWidth, setRulerWidth] = useState(0);
  const prevSelectedBlockIdRef = useRef<string | null>(null);
  const savedScrollTopRef = useRef<number>(0);
  const selectionSourceRef = useRef<"preview" | "structure" | null>(null);
  const isContentChangingRef = useRef(false);

  useEffect(() => {
    const container = rulerContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setRulerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handlePageSizeChange = useCallback(
    (pageSize: PageSizeOption) => {
      setGlobalStyles({ contentMaxWidth: pageSize });
    },
    [setGlobalStyles],
  );

  const maxPageWidth = useMemo(
    () =>
      Math.max(
        ...PAGE_SIZE_OPTIONS.map((opt) => Number.parseInt(opt.value, 10)),
      ),
    [],
  );

  const usePixelPositioning = rulerWidth >= maxPageWidth;

  const rulerMarkers = useMemo(() => {
    return PAGE_SIZE_OPTIONS.map((option) => {
      const pixelValue = Number.parseInt(option.value, 10);
      const leftPositionPercent =
        ((maxPageWidth - pixelValue) / 2 / maxPageWidth) * 100;
      const leftPositionPixels = (rulerWidth - pixelValue) / 2;
      return {
        ...option,
        leftPositionPercent,
        leftPositionPixels,
      };
    });
  }, [maxPageWidth, rulerWidth]);

  const handleBlockClick = useCallback(
    (blockId: string) => {
      selectionSourceRef.current = "preview";
      selectBlock(blockId);
    },
    [selectBlock],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (isBlockClickMessage(event.data)) {
        handleBlockClick(event.data.blockId);
      }
      if (event.data?.type === "SCROLL_POSITION") {
        savedScrollTopRef.current = event.data.scrollTop;
      }
      if (event.data?.type === "STRUCTURE_PANEL_SELECTION") {
        selectionSourceRef.current = "structure";
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleBlockClick]);

  const renderedContent = useMemo(() => {
    isContentChangingRef.current = true;

    let dataContext: DataContext = {};
    try {
      if (dataModelJson.trim()) {
        dataContext = JSON.parse(dataModelJson);
      }
    } catch {
      dataContext = {};
    }

    if (blocks.length > 0) {
      return generateHtmlFromBlocks(
        blocks,
        dataContext,
        globalStyles,
        currentLanguage.value,
      );
    }
    if (templateContent) {
      return substituteVariables(templateContent, dataContext);
    }
    return "";
  }, [
    templateContent,
    dataModelJson,
    blocks,
    globalStyles,
    currentLanguage.value,
  ]);

  useEffect(() => {
    const selectionChanged = prevSelectedBlockIdRef.current !== selectedBlockId;
    prevSelectedBlockIdRef.current = selectedBlockId;

    if (selectionChanged && iframeRef.current?.contentWindow) {
      const shouldScroll = selectionSourceRef.current === "structure";

      const timeoutId = setTimeout(() => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: "SELECT_BLOCK",
              blockId: selectedBlockId,
              shouldScroll,
            },
            "*",
          );
        }
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedBlockId]);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    setTimeout(() => {
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: "RESTORE_SCROLL", scrollTop: savedScrollTopRef.current },
          "*",
        );

        iframe.contentWindow.postMessage(
          {
            type: "SELECT_BLOCK",
            blockId: selectedBlockId,
            shouldScroll: false,
          },
          "*",
        );

        isContentChangingRef.current = false;
      }
    }, 0);
  }, [selectedBlockId]);

  return (
    <div className={styles.previewPane}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Preview</span>
        <div className={styles.languageInfo}>
          <span
            className={`${styles.languagePill} ${
              isCurrentLanguageDefault ? styles.defaultLanguage : ""
            }`}
          >
            {currentLanguage.nativeName}{" "}
            {currentLanguage.value !== "en" && `(${currentLanguage.label})`}
          </span>
          {isCurrentLanguageDefault && (
            <span className={styles.defaultBadge}>Default</span>
          )}
        </div>
      </div>
      <div className={styles.rulerContainer} ref={rulerContainerRef}>
        <div className={styles.ruler}>
          <div className={styles.rulerTrack}>
            {rulerMarkers.map((marker) => {
              const isActive =
                globalStyles.contentMaxWidth.value === marker.value;
              return (
                <button
                  key={marker.value}
                  type="button"
                  className={`${styles.rulerMarker} ${
                    isActive ? styles.active : ""
                  }`}
                  style={{
                    left: usePixelPositioning
                      ? `${marker.leftPositionPixels}px`
                      : `${marker.leftPositionPercent}%`,
                    zIndex: isActive ? 3 : 1,
                  }}
                  onClick={() => handlePageSizeChange(marker)}
                  aria-label={marker.label}
                >
                  <span className={styles.markerTriangle} />
                </button>
              );
            })}
          </div>
          <div className={styles.widthIndicator}>
            {globalStyles.contentMaxWidth.label}
          </div>
        </div>
      </div>
      <div className={styles.iframeWrapper}>
        {renderedContent ? (
          <iframe
            ref={iframeRef}
            className={styles.templateIframe}
            title="Template Preview"
            sandbox="allow-scripts"
            srcDoc={renderedContent}
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.text}>
              Add blocks to start building your template
            </span>
          </div>
        )}
        {isTranslating && <div className={styles.translatingOverlay} />}
      </div>
    </div>
  );
};

export default PreviewPane;
