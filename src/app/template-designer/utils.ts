import { TemplateBlock, TemplateGlobalStyles } from "@/app/template-designer/types";
import { LANGUAGE_FONT_FAMILY_MAP } from "@/app/template-designer/constants";

export const CONTAINER_TYPES = new Set(["section", "loop", "if"]);

export const GRID_TYPES = new Set(["grid", "gridRow"]);

export const RICH_TEXT_TAGS = new Set([
  "p",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
]);

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  section: "Section",
  richText: "Rich Text",
  grid: "Grid",
  gridRow: "Grid Row",
  table: "Table",
  loop: "Loop",
  if: "Condition",
  image: "Image",
  spacer: "Spacer",
  divider: "Divider",
  pageBreak: "Page Break",
};

export const ELEMENT_TYPE_MAP: Record<string, string> = {
  div: "container",
  section: "section",
  table: "table",
  img: "image",
  p: "text",
  span: "text",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  ul: "list",
  ol: "list",
  form: "form",
  button: "button",
  a: "link",
  hr: "divider",
};

const HTML_ENTITY_MAP: Record<string, string> = {
  "\u00A0": "&nbsp;",
  "\u00A9": "&copy;",
  "\u00AE": "&reg;",
  "\u2122": "&trade;",
  "\u2014": "&mdash;",
  "\u2013": "&ndash;",
  "\u2018": "&lsquo;",
  "\u2019": "&rsquo;",
  "\u201C": "&ldquo;",
  "\u201D": "&rdquo;",
  "\u2026": "&hellip;",
};

const HTML_ENTITY_REGEX = new RegExp(
  Object.keys(HTML_ENTITY_MAP).join("|"),
  "g",
);

export const isContainerType = (type: string): boolean => {
  return CONTAINER_TYPES.has(type);
};

export const isGridType = (type: string): boolean => {
  return GRID_TYPES.has(type);
};

export const findBlockById = (
  blocks: TemplateBlock[],
  id: string,
): TemplateBlock | null => {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.children) {
      const found = findBlockById(block.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const isDescendantOf = (
  parentBlock: TemplateBlock,
  childId: string,
): boolean => {
  if (parentBlock.id === childId) return true;
  if (!parentBlock.children) return false;
  return parentBlock.children.some((child) => isDescendantOf(child, childId));
};

export const getAlignmentStyle = (align: string): string => {
  if (align === "C") return "center";
  if (align === "R") return "right";
  return "left";
};

export const getBlockTypeLabel = (type: string): string => {
  return BLOCK_TYPE_LABELS[type] ?? type;
};

export const getElementType = (tagName: string): string => {
  return ELEMENT_TYPE_MAP[tagName] ?? "element";
};

export const preserveHtmlEntities = (html: string): string => {
  return html.replaceAll(HTML_ENTITY_REGEX, (char) => HTML_ENTITY_MAP[char]);
};

export const getParentGridColumns = (
  blocks: TemplateBlock[],
  gridRowId: string | null,
): number => {
  if (!gridRowId) return 2;

  const findParentGrid = (
    blockList: TemplateBlock[],
    targetId: string,
  ): TemplateBlock | null => {
    for (const block of blockList) {
      if (block.children) {
        for (const child of block.children) {
          if (child.id === targetId && block.type === "grid") {
            return block;
          }
        }
        const found = findParentGrid(block.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const parentGrid = findParentGrid(blocks, gridRowId);
  return parentGrid ? Number(parentGrid.properties.columns) || 2 : 2;
};

export const removeBlockFromList = (
  blockList: TemplateBlock[],
  blockId: string,
  blockRef: { current: TemplateBlock | null },
): TemplateBlock[] => {
  return blockList.reduce<TemplateBlock[]>((acc, block) => {
    if (block.id === blockId) {
      blockRef.current = block;
    } else {
      acc.push({
        ...block,
        children: block.children
          ? removeBlockFromList(block.children, blockId, blockRef)
          : undefined,
      });
    }
    return acc;
  }, []);
};

export const findAncestorIds = (
  blocks: TemplateBlock[],
  targetId: string,
  ancestors: string[] = [],
): string[] | null => {
  for (const block of blocks) {
    if (block.id === targetId) {
      return ancestors;
    }
    if (block.children) {
      const found = findAncestorIds(block.children, targetId, [
        ...ancestors,
        block.id,
      ]);
      if (found) return found;
    }
  }
  return null;
};

export const IMAGE_ALIGNMENT_STYLES: Record<string, string> = {
  L: "margin-right: auto;",
  C: "margin-left: auto; margin-right: auto;",
  R: "margin-left: auto;",
};

export const BLOCK_STYLES = {
  BORDER: "border: 1px solid #e0e0e0",
  BORDER_RADIUS: "border-radius: 4px",
  TABLE_HEADER_BG: "background: #f5f5f5",
  TABLE_HEADER: "font-weight: 600",
  TABLE_BASE: "width: 100%; border-collapse: collapse",
  ZEBRA_ROW_BG: "background: #f9f9f9",
} as const;

export const getDefaultColumnWidths = (count: number): number[] => {
  const DEFAULT_COLUMN_WIDTHS: Record<number, number[]> = {
    1: [100],
    2: [50, 50],
    3: [40, 30, 30],
    4: [25, 25, 25, 25],
    5: [20, 20, 20, 20, 20],
    6: [20, 20, 15, 15, 15, 15],
    7: [15, 15, 15, 15, 15, 15, 10],
    8: [10, 15, 15, 10, 15, 15, 10, 10],
    9: [10, 10, 15, 10, 10, 15, 10, 10, 10],
    10: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  };
  return (
    DEFAULT_COLUMN_WIDTHS[count] ??
    Array.from({ length: count }, () => Math.round(100 / count))
  );
};

export const calculateAdjustedColumnWidths = (
  columnWidths: number[],
  index: number,
  newValue: number,
): number[] | null => {
  const newWidths = [...columnWidths];
  const oldValue = newWidths[index];
  const delta = newValue - oldValue;

  if (delta === 0) return null;

  const currentTotal = columnWidths.reduce((sum, w) => sum + w, 0);

  if (currentTotal === 100 && delta > 0) {
    const nextIndex = (index + 1) % newWidths.length;
    const reduction = Math.min(newWidths[nextIndex], delta);
    if (reduction > 0) {
      newWidths[index] = oldValue + reduction;
      newWidths[nextIndex] -= reduction;
    }
  } else {
    const othersTotal = columnWidths.reduce(
      (sum, w, i) => (i === index ? sum : sum + w),
      0,
    );
    const maxAllowed = 100 - othersTotal;
    newWidths[index] = Math.min(newValue, maxAllowed);
  }

  if (newWidths[index] === oldValue) return null;

  return newWidths;
};

export const generateColgroup = (
  columnWidths: number[],
  expectedColumns: number,
): string => {
  if (columnWidths.length !== expectedColumns) return "";
  const colTags = columnWidths
    .map((w) => `<col style="width: ${w}%;" />`)
    .join("");
  return `<colgroup>${colTags}</colgroup>`;
};

interface EmailHtmlConfig {
  languageCode: string;
  globalStyles: TemplateGlobalStyles;
  bodyContent: string;
  preheaderHtml: string;
  bodyStyleConfig: {
    includeBackgroundAndLayout: boolean;
    marginTop: string;
  };
  additionalHeadStyles?: string;
}

export const generateEmailHtml = (config: EmailHtmlConfig): string => {
  const {
    languageCode,
    globalStyles,
    bodyContent,
    preheaderHtml,
    bodyStyleConfig,
    additionalHeadStyles,
  } = config;

  const titleTag = globalStyles.htmlTitle
    ? `<title>${globalStyles.htmlTitle}</title>`
    : "";

  const layoutStyles = bodyStyleConfig.includeBackgroundAndLayout
    ? `background-color: ${globalStyles.bodyBackgroundColor}; 
                max-width: ${globalStyles.contentMaxWidth.value}px; margin-left: auto; margin-right: auto; padding-top: ${globalStyles.bodyPadding};
                padding-right: ${globalStyles.bodyPadding};
                padding-bottom: ${globalStyles.bodyPadding};
                padding-left: ${globalStyles.bodyPadding};`
    : "";

  // Get language-specific font family or fallback to globalStyles fontFamily
  const fontFamily =
    LANGUAGE_FONT_FAMILY_MAP[languageCode] || globalStyles.fontFamily;

  return `<!DOCTYPE html>
          <html lang="${languageCode}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
          <head>
            <!--[if gte mso 9]>
            <xml>
              <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
            <![endif]-->
            <!--[if !mso]><!-->
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <!--<![endif]-->
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="x-apple-disable-message-reformatting" />
            <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
            <meta name="color-scheme" content="light dark" />
            <meta name="supported-color-schemes" content="light dark" />
            ${titleTag}
            <style>
              .ExternalClass { width: 100%; }
              .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
              body { 
                font-family: ${fontFamily}; 
                font-size: ${globalStyles.fontSize}; 
                line-height: ${globalStyles.lineHeight}; 
                color: ${globalStyles.textColor}; 
                ${layoutStyles}margin-top: ${bodyStyleConfig.marginTop};
                margin-right: 0;
                margin-bottom: 0;
                margin-left: 0;
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
              }
              * { box-sizing: border-box; }
              p { margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly; font-size: inherit; }
              h1 { margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly; font-size: 32px; }
              h2 { margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly; font-size: 24px; }
              h3 { margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly; font-size: 18px; }
              h4 { margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly; font-size: 16px; }
              h5 { margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly; font-size: 14px; }
              h6 { margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; mso-line-height-rule: exactly; font-size: 12px; }
              table { font-size: inherit; }
              td { font-size: inherit; }
              a { color: ${globalStyles.linkColor}; }
              a:hover { color: ${globalStyles.linkHoverColor}; }
              ${additionalHeadStyles ?? ""}
            </style>
            <!--[if mso]>
            <style type="text/css">
              body, table, td { font-family: Arial, sans-serif !important; }
            </style>
            <![endif]-->
          </head>
          <body>${preheaderHtml}${bodyContent}</body>
          </html>`;
};
