import {
  ColumnAlignment,
  IdGenerator,
  TableColumn,
  TemplateBlock,
  TemplateGlobalStyles,
} from "@/app/template-designer/types";
import { PAGE_SIZE_OPTIONS } from "@/app/template-designer/constants";
import { generateRandomId } from "@/app/utils/utils";
import { htmlToMarkdown } from "@/app/template-designer/utils/markdownUtils";
import { preserveHtmlEntities, RICH_TEXT_TAGS } from "@/app/template-designer/utils";

export const parseGridFromTableElement = (
  element: Element,
  generateId: IdGenerator,
): TemplateBlock => {
  const htmlElement = element as HTMLElement;
  const gridName = htmlElement.getAttribute("name") ?? "Grid";
  const rows = element.querySelectorAll(":scope > tbody > tr, :scope > tr");
  const gridChildren: TemplateBlock[] = [];
  const columns =
    rows.length > 0 ? rows[0].querySelectorAll("td, th").length : 2;

  const showBordersAttr = htmlElement.dataset.showBorders;
  const showBorders = showBordersAttr !== "false";

  const inlineStyle = htmlElement.getAttribute("style") ?? "";

  const borderSpacingMatch = /border-spacing:\s*(\d+)px\s*(?:0|0px)?/.exec(
    inlineStyle,
  );
  const columnSpacing = borderSpacingMatch ? Number(borderSpacingMatch[1]) : 0;

  const baseStylePatterns = [
    /width:\s*100%;?\s*/gi,
    /border-collapse:\s*(?:collapse|separate);?\s*/gi,
    /border-spacing:\s*[^;]+;?\s*/gi,
  ];
  let customStyle = inlineStyle;
  baseStylePatterns.forEach((pattern) => {
    customStyle = customStyle.replace(pattern, "");
  });
  customStyle = customStyle
    .trim()
    .replaceAll(/(^;+)|(;+$)/g, "")
    .trim();

  const colElements = element.querySelectorAll(":scope > colgroup > col");
  const columnWidths: number[] = [];
  colElements.forEach((col) => {
    const style = col.getAttribute("style") ?? "";
    const widthMatch = /width:\s*(\d+)%/.exec(style);
    if (widthMatch) {
      columnWidths.push(Number(widthMatch[1]));
    }
  });

  const columnStyles: string[] = [];
  if (rows.length > 0) {
    const firstRowCells = rows[0].querySelectorAll("td, th");
    firstRowCells.forEach((cell) => {
      let cellStyle = (cell as HTMLElement).getAttribute("style") ?? "";
      cellStyle = cellStyle
        .trim()
        .replaceAll(/(^;+)|(;+$)/g, "")
        .trim();
      columnStyles.push(cellStyle);
    });
  }

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td, th");
    const columnContents: string[] = [];
    cells.forEach((cell) => {
      columnContents.push(
        htmlToMarkdown(preserveHtmlEntities(cell.innerHTML.trim())),
      );
    });
    const rowName = (row as HTMLElement).getAttribute("name") ?? "Row";

    gridChildren.push({
      id: generateId("gridRow"),
      type: "gridRow",
      label: rowName,
      content: "",
      properties: { columnContents },
      children: [],
    });
  });

  const defaultWidths = Array.from({ length: columns }, () =>
    Math.round(100 / columns),
  );

  const hasColumnStyles = columnStyles.some((s) => s.length > 0);

  return {
    id: generateId("grid"),
    type: "grid",
    label: gridName,
    content: "",
    properties: {
      columns,
      gap: "0",
      columnWidths:
        columnWidths.length === columns ? columnWidths : defaultWidths,
      showBorders,
      ...(columnSpacing > 0 && { columnSpacing }),
      ...(customStyle && { style: customStyle }),
      ...(hasColumnStyles && { columnStyles }),
    },
    children: gridChildren,
  };
};

export const parseDataTableElement = (
  element: Element,
  generateId: IdGenerator,
): TemplateBlock => {
  const htmlElement = element as HTMLElement;
  const tableName = htmlElement.getAttribute("name") ?? "Table";
  const listPath = htmlElement.dataset.list ?? "";
  const zebraRows = htmlElement.dataset.zebra === "true";
  const showBorders = htmlElement.dataset.showBorders !== "false";
  const headerStyle = htmlElement.dataset.headerStyle ?? "";
  const rowCellStyle = htmlElement.dataset.rowCellStyle ?? "";

  const headerCells = element.querySelectorAll(":scope > thead > tr > th");
  const bodyCells = element.querySelectorAll(":scope > tbody > tr > td");
  const columns: TableColumn[] = [];
  const columnWidths: number[] = [];

  headerCells.forEach((cell, index) => {
    const cellElement = cell as HTMLElement;
    const align = cellElement.dataset.align;
    const alignment: ColumnAlignment =
      align === "L" || align === "C" || align === "R" ? align : "L";

    let dataKey = "";
    const bodyCell = bodyCells[index];
    if (bodyCell) {
      const tdContent = bodyCell.textContent ?? "";
      const itemMatch = /^\$\{item\.(.+)\}$/.exec(tdContent.trim());
      dataKey = itemMatch ? `\${${itemMatch[1]}}` : tdContent.trim();
    }
    if (!dataKey) {
      const rawKey = cellElement.dataset.key ?? "";
      dataKey = rawKey && !rawKey.startsWith("${") ? `\${${rawKey}}` : rawKey;
    }

    columns.push({
      id: generateRandomId(),
      dataKey,
      label: cellElement.dataset.label ?? cell.textContent ?? "",
      alignment,
    });

    const style = cellElement.getAttribute("style") ?? "";
    const widthMatch = /width:\s*(\d+)%/.exec(style);
    if (widthMatch) {
      columnWidths.push(Number(widthMatch[1]));
    }
  });

  return {
    id: generateId("table"),
    type: "table",
    label: tableName,
    content: "",
    properties: {
      list: listPath,
      zebraRows,
      showBorders,
      columns,
      columnWidths: columnWidths.length === columns.length ? columnWidths : [],
      headerStyle,
      rowCellStyle,
    },
    children: [],
  };
};

export const parseHrElement = (
  element: Element,
  generateId: IdGenerator,
): TemplateBlock => {
  const dividerName = element.getAttribute("name") ?? "Divider";
  const style = element.getAttribute("style") ?? "";
  const thicknessMatch = /border-top:\s*(\d+px)/.exec(style);
  const colorMatch = /solid\s+(#[a-fA-F0-9]+|[a-z]+)/.exec(style);
  const widthMatch = /width:\s*(\d+)%/.exec(style);
  return {
    id: generateId("divider"),
    type: "divider",
    label: dividerName,
    content: "",
    properties: {
      thickness: thicknessMatch ? thicknessMatch[1] : "1px",
      color: colorMatch ? colorMatch[1] : "#e0e0e0",
      width: widthMatch ? Number(widthMatch[1]) : 100,
    },
  };
};

export const parseImgElement = (
  element: Element,
  generateId: IdGenerator,
): TemplateBlock => {
  const imageName = element.getAttribute("name") ?? "Image";
  const styleAttr = element.getAttribute("style") ?? "";

  const widthMatch = /(?:^|;)\s*width:\s*([^;]+)/.exec(styleAttr);
  const width = widthMatch ? widthMatch[1].trim() : "100%";

  const hasMarginLeft = /(?:^|;)\s*margin-left:\s*auto/.test(styleAttr);
  const hasMarginRight = /(?:^|;)\s*margin-right:\s*auto/.test(styleAttr);
  let alignment = "L";
  if (hasMarginLeft && hasMarginRight) {
    alignment = "C";
  } else if (hasMarginLeft) {
    alignment = "R";
  }

  const baseStylePatterns = [
    /(?:^|;)\s*width:[^;]*/g,
    /(?:^|;)\s*max-width:\s*100%[^;]*/g,
    /(?:^|;)\s*display:\s*block[^;]*/g,
    /(?:^|;)\s*margin-left:\s*auto[^;]*/g,
    /(?:^|;)\s*margin-right:\s*auto[^;]*/g,
  ];
  let remainingStyle = styleAttr;
  for (const pattern of baseStylePatterns) {
    remainingStyle = remainingStyle.replaceAll(pattern, "");
  }
  remainingStyle = remainingStyle
    .replaceAll(/;+/g, ";")
    .replace(/(?:^;|;$)/g, "")
    .trim();

  return {
    id: generateId("image"),
    type: "image",
    label: imageName,
    content: "",
    properties: {
      src: element.getAttribute("src") ?? "",
      alt: element.getAttribute("alt") ?? "",
      width,
      alignment,
      ...(remainingStyle ? { style: remainingStyle } : {}),
    },
  };
};

export const parseSpacerElement = (
  element: Element,
  generateId: IdGenerator,
): TemplateBlock | null => {
  const style = element.getAttribute("style") ?? "";
  const elementName = element.getAttribute("name");
  if (style.includes("page-break-after")) {
    return {
      id: generateId("pageBreak"),
      type: "pageBreak",
      label: elementName ?? "Page Break",
      content: "",
      properties: {},
    };
  }
  if (style.includes("height:") && element.innerHTML.trim() === "") {
    const heightMatch = /height:\s*([^;]+)/.exec(style);
    return {
      id: generateId("spacer"),
      type: "spacer",
      label: elementName ?? "Spacer",
      content: "",
      properties: { height: heightMatch ? heightMatch[1].trim() : "15px" },
    };
  }
  return null;
};

export const parseRichTextElement = (
  element: Element,
  generateId: IdGenerator,
): TemplateBlock => {
  const style = element.getAttribute("style") ?? "";
  const richTextName = element.getAttribute("name") ?? "Rich Text";
  const htmlElement = element as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  const isHeading = /^h[1-6]$/.test(tagName);
  const contentToConvert = isHeading
    ? htmlElement.outerHTML
    : htmlElement.innerHTML.trim();

  return {
    id: generateId("richText"),
    type: "richText",
    label: richTextName,
    content: htmlToMarkdown(
      preserveHtmlEntities(contentToConvert ?? element.textContent ?? ""),
    ),
    properties: style ? { style } : {},
  };
};

export const parseGlobalStylesFromHtml = (
  htmlContent: string,
): Partial<TemplateGlobalStyles> => {
  if (!htmlContent || globalThis.window === undefined) return {};

  const styles: Partial<TemplateGlobalStyles> = {};

  const styleMatch = /<style[^>]*?>([\s\S]*?)<\/style>/i.exec(htmlContent);
  if (!styleMatch) return styles;

  const styleContent = styleMatch[1];

  const bodyMatch = /body\s*\{([^}]*)\}/i.exec(styleContent);
  if (bodyMatch) {
    const bodyStyles = bodyMatch[1];

    const fontFamilyMatch = /font-family:\s*([^;]+);/i.exec(bodyStyles);
    if (fontFamilyMatch) {
      styles.fontFamily = fontFamilyMatch[1].trim();
    }

    const fontSizeMatch = /font-size:\s*([^;]+);/i.exec(bodyStyles);
    if (fontSizeMatch) {
      styles.fontSize = fontSizeMatch[1].trim();
    }

    const lineHeightMatch = /line-height:\s*([^;]+);/i.exec(bodyStyles);
    if (lineHeightMatch) {
      styles.lineHeight = lineHeightMatch[1].trim();
    }

    const colorMatch = /(?<!background-)color:\s*([^;]+);/i.exec(bodyStyles);
    if (colorMatch) {
      styles.textColor = colorMatch[1].trim();
    }

    const bgColorMatch = /background-color:\s*([^;]+);/i.exec(bodyStyles);
    if (bgColorMatch) {
      styles.bodyBackgroundColor = bgColorMatch[1].trim();
    }

    const paddingMatch = /padding:\s*([^;]+);/i.exec(bodyStyles);
    if (paddingMatch) {
      styles.bodyPadding = paddingMatch[1].trim();
    }

    const maxWidthMatch = /max-width:\s*([^;]+);/i.exec(bodyStyles);
    if (maxWidthMatch) {
      const parsedValue = maxWidthMatch[1].trim();
      const numericValue = parsedValue.replace("px", "");
      const matchingOption = PAGE_SIZE_OPTIONS.find(
        (opt) => opt.value === numericValue,
      );
      styles.contentMaxWidth = matchingOption ?? {
        value: numericValue,
        label: `${numericValue}px`,
      };
    }
  }

  const linkMatch = /a\s*\{([^}]*)\}/i.exec(styleContent);
  if (linkMatch) {
    const linkStyles = linkMatch[1];
    const linkColorMatch = /color:\s*([^;]+);/i.exec(linkStyles);
    if (linkColorMatch) {
      styles.linkColor = linkColorMatch[1].trim();
    }
  }

  const linkHoverMatch = /a:hover\s*\{([^}]*)\}/i.exec(styleContent);
  if (linkHoverMatch) {
    const linkHoverStyles = linkHoverMatch[1];
    const linkHoverColorMatch = /color:\s*([^;]+);/i.exec(linkHoverStyles);
    if (linkHoverColorMatch) {
      styles.linkHoverColor = linkHoverColorMatch[1].trim();
    }
  }

  return styles;
};

export const parseFtlToBlocks = (ftlContent: string): TemplateBlock[] => {
  if (!ftlContent || globalThis.window === undefined) return [];

  let blockIdCounter = 0;
  const generateId: IdGenerator = (type: string): string =>
    `${type}-${Date.now()}-${blockIdCounter++}`;

  const parseFtlContent = (html: string): TemplateBlock[] => {
    const blocks: TemplateBlock[] = [];

    const parseHtmlElement = (element: Element): TemplateBlock | null => {
      const tagName = element.tagName.toLowerCase();
      const htmlElement = element as HTMLElement;
      const blockType = htmlElement.dataset.blockType;

      if (tagName === "table") {
        if (blockType === "table") {
          return parseDataTableElement(element, generateId);
        }
        if (blockType === "grid" || !blockType) {
          return parseGridFromTableElement(element, generateId);
        }
      }
      if (tagName === "hr") {
        return parseHrElement(element, generateId);
      }
      if (tagName === "img") {
        return parseImgElement(element, generateId);
      }
      if (tagName === "div") {
        const spacer = parseSpacerElement(element, generateId);
        if (spacer) return spacer;
      }
      if (RICH_TEXT_TAGS.has(tagName)) {
        return parseRichTextElement(element, generateId);
      }
      return null;
    };

    const processSegment = (segment: string): TemplateBlock[] => {
      const segmentBlocks: TemplateBlock[] = [];
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = segment;

      for (const child of Array.from(tempDiv.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = htmlToMarkdown(
            preserveHtmlEntities(child.textContent?.trim() ?? ""),
          );
          if (text) {
            segmentBlocks.push({
              id: generateId("richText"),
              type: "richText",
              label: "Rich Text",
              content: text,
              properties: {},
            });
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const block = parseHtmlElement(child as Element);
          if (block) segmentBlocks.push(block);
        }
      }

      return segmentBlocks;
    };

    const findMatchingCloseTag = (
      content: string,
      startPos: number,
      directiveName: string,
    ): number => {
      const openTag = `<#${directiveName}`;
      const closeTag = `</#${directiveName}>`;
      let depth = 1;
      let scanPos = startPos;

      while (scanPos < content.length && depth > 0) {
        const nextOpen = content.indexOf(openTag, scanPos);
        const nextClose = content.indexOf(closeTag, scanPos);

        if (nextClose === -1) return -1;

        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          scanPos = nextOpen + openTag.length;
        } else {
          depth--;
          if (depth === 0) return nextClose;
          scanPos = nextClose + closeTag.length;
        }
      }

      return -1;
    };

    let pos = 0;
    while (pos < html.length) {
      const sectionIdx = html.indexOf("<section", pos);
      const listIdx = html.indexOf("<#list", pos);
      const ifIdx = html.indexOf("<#if", pos);

      const candidates = [
        {
          type: "section" as const,
          index: sectionIdx === -1 ? Infinity : sectionIdx,
        },
        { type: "list" as const, index: listIdx === -1 ? Infinity : listIdx },
        { type: "if" as const, index: ifIdx === -1 ? Infinity : ifIdx },
      ];

      const next = candidates.reduce(
        (a, b) => (a.index < b.index ? a : b),
        candidates[0],
      );

      if (next.index === Infinity) {
        const remaining = html.slice(pos);
        if (remaining.trim()) blocks.push(...processSegment(remaining));
        break;
      }

      const before = html.slice(pos, next.index);
      if (before.trim()) blocks.push(...processSegment(before));

      if (next.type === "section") {
        const closeSection = html.indexOf("</section>", next.index);
        if (closeSection === -1) {
          break;
        }
        const sectionFull = html.slice(
          next.index,
          closeSection + "</section>".length,
        );
        const sectionMatch = /^<section([^>]*)>([\s\S]*)<\/section>$/.exec(
          sectionFull,
        );
        if (sectionMatch) {
          blocks.push(parseSectionFromString(sectionMatch[1], sectionMatch[2]));
        }
        pos = closeSection + "</section>".length;
      } else {
        const directiveName = next.type;
        const openTagEnd = html.indexOf(">", next.index) + 1;
        if (openTagEnd === 0) {
          break;
        }
        const openTagFull = html.slice(next.index, openTagEnd);
        const paramsMatch = /^<#(?:list|if)\s*([\s\S]*?)>$/.exec(openTagFull);
        const params = paramsMatch ? paramsMatch[1] : "";

        const closeIndex = findMatchingCloseTag(
          html,
          openTagEnd,
          directiveName,
        );
        if (closeIndex === -1) {
          break;
        }

        const innerContent = html.slice(openTagEnd, closeIndex);
        const closeTag = `</#${directiveName}>`;

        if (directiveName === "list") {
          const listMatch = /(\S*)\s*as\s+(\S+)/.exec(params);
          if (listMatch) {
            const [, listPath, variable] = listMatch;
            const children = parseFtlContent(innerContent);
            blocks.push({
              id: generateId("loop"),
              type: "loop",
              label: "Loop",
              content: "",
              properties: { variable, list: listPath.trim() },
              children,
            });
          }
        } else if (directiveName === "if") {
          const condition = params.trim();
          const children = parseFtlContent(innerContent);
          blocks.push({
            id: generateId("if"),
            type: "if",
            label: "If",
            content: "",
            properties: { condition },
            children,
          });
        }

        pos = closeIndex + closeTag.length;
      }
    }

    return blocks;
  };

  const parseSectionFromString = (
    attrs: string,
    content: string,
  ): TemplateBlock => {
    const titleMatch = /<h3[^>]*>([\s\S]*?)<\/h3>/.exec(content);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const contentWithoutTitle = titleMatch
      ? content.replace(titleMatch[0], "")
      : content;

    const children = parseFtlContent(contentWithoutTitle.trim());

    const styleMatch = /style="([^"]*)"/.exec(attrs);
    const style = styleMatch ? styleMatch[1] : "";

    const nameMatch = /name="([^"]*)"/.exec(attrs);
    const sectionName = nameMatch ? nameMatch[1] : "Section";

    let paddingVertical = "16px";
    let paddingHorizontal = "16px";

    const paddingTopMatch = /padding-top:\s*([^;]+)/.exec(style);
    if (paddingTopMatch) {
      paddingVertical = paddingTopMatch[1].trim();
    }

    const paddingRightMatch = /padding-right:\s*([^;]+)/.exec(style);
    if (paddingRightMatch) {
      paddingHorizontal = paddingRightMatch[1].trim();
    }

    const bordered = style.includes("border-top:");

    return {
      id: generateId("section"),
      type: "section",
      label: sectionName,
      content: "",
      properties: { title, paddingVertical, paddingHorizontal, bordered },
      children,
    };
  };

  const stripFtlFromTableBlocks = (html: string): string => {
    return html.replaceAll(
      /(<table[^>]*data-block-type="table"[^>]*>)([\s\S]*?)(<\/table>)/g,
      (match, openTag: string, content: string, closeTag: string) => {
        const cleanedContent = content
          .replaceAll(/<#list\s[^>]+>/g, "")
          .replaceAll("</#list>", "");
        return openTag + cleanedContent + closeTag;
      },
    );
  };

  const preprocessedContent = stripFtlFromTableBlocks(ftlContent);
  return parseFtlContent(preprocessedContent);
};
