import {
  CONTAINER_TYPES,
  GRID_TYPES,
  RICH_TEXT_TAGS,
  BLOCK_TYPE_LABELS,
  ELEMENT_TYPE_MAP,
  IMAGE_ALIGNMENT_STYLES,
  BLOCK_STYLES,
  isContainerType,
  isGridType,
  findBlockById,
  isDescendantOf,
  getAlignmentStyle,
  getBlockTypeLabel,
  getElementType,
  preserveHtmlEntities,
  getParentGridColumns,
  removeBlockFromList,
  findAncestorIds,
  getDefaultColumnWidths,
  calculateAdjustedColumnWidths,
  generateColgroup,
  generateEmailHtml,
} from "./utils";
import { TemplateBlock, TemplateGlobalStyles } from "./types";

describe("utils", () => {
  describe("Constants", () => {
    it("should have correct CONTAINER_TYPES", () => {
      expect(CONTAINER_TYPES.has("section")).toBe(true);
      expect(CONTAINER_TYPES.has("loop")).toBe(true);
      expect(CONTAINER_TYPES.has("if")).toBe(true);
      expect(CONTAINER_TYPES.has("div")).toBe(false);
    });

    it("should have correct GRID_TYPES", () => {
      expect(GRID_TYPES.has("grid")).toBe(true);
      expect(GRID_TYPES.has("gridRow")).toBe(true);
      expect(GRID_TYPES.has("section")).toBe(false);
    });

    it("should have correct RICH_TEXT_TAGS", () => {
      expect(RICH_TEXT_TAGS.has("p")).toBe(true);
      expect(RICH_TEXT_TAGS.has("h1")).toBe(true);
      expect(RICH_TEXT_TAGS.has("div")).toBe(true);
    });

    it("should have correct BLOCK_TYPE_LABELS", () => {
      expect(BLOCK_TYPE_LABELS.section).toBe("Section");
      expect(BLOCK_TYPE_LABELS.richText).toBe("Rich Text");
      expect(BLOCK_TYPE_LABELS.grid).toBe("Grid");
    });

    it("should have correct ELEMENT_TYPE_MAP", () => {
      expect(ELEMENT_TYPE_MAP.div).toBe("container");
      expect(ELEMENT_TYPE_MAP.img).toBe("image");
      expect(ELEMENT_TYPE_MAP.p).toBe("text");
    });

    it("should have correct IMAGE_ALIGNMENT_STYLES", () => {
      expect(IMAGE_ALIGNMENT_STYLES.L).toBe("margin-right: auto;");
      expect(IMAGE_ALIGNMENT_STYLES.C).toBe(
        "margin-left: auto; margin-right: auto;",
      );
      expect(IMAGE_ALIGNMENT_STYLES.R).toBe("margin-left: auto;");
    });

    it("should have correct BLOCK_STYLES", () => {
      expect(BLOCK_STYLES.BORDER).toBe("border: 1px solid #e0e0e0");
      expect(BLOCK_STYLES.BORDER_RADIUS).toBe("border-radius: 4px");
    });
  });

  describe("isContainerType", () => {
    it("should return true for container types", () => {
      expect(isContainerType("section")).toBe(true);
      expect(isContainerType("loop")).toBe(true);
      expect(isContainerType("if")).toBe(true);
    });

    it("should return false for non-container types", () => {
      expect(isContainerType("div")).toBe(false);
      expect(isContainerType("richText")).toBe(false);
    });
  });

  describe("isGridType", () => {
    it("should return true for grid types", () => {
      expect(isGridType("grid")).toBe(true);
      expect(isGridType("gridRow")).toBe(true);
    });

    it("should return false for non-grid types", () => {
      expect(isGridType("section")).toBe(false);
      expect(isGridType("div")).toBe(false);
    });
  });

  describe("findBlockById", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block1",
        type: "section",
        label: "Block 1",
        content: "",
        properties: {},
        children: [
          {
            id: "block2",
            type: "richText",
            label: "Block 2",
            content: "",
            properties: {},
          },
          {
            id: "block3",
            type: "grid",
            label: "Block 3",
            content: "",
            properties: {},
            children: [
              {
                id: "block4",
                type: "gridRow",
                label: "Block 4",
                content: "",
                properties: {},
              },
            ],
          },
        ],
      },
    ];

    it("should find a block by id at root level", () => {
      const result = findBlockById(blocks, "block1");
      expect(result).toEqual(blocks[0]);
    });

    it("should find a nested block by id", () => {
      const result = findBlockById(blocks, "block2");
      expect(result?.id).toBe("block2");
    });

    it("should find a deeply nested block by id", () => {
      const result = findBlockById(blocks, "block4");
      expect(result?.id).toBe("block4");
    });

    it("should return null if block is not found", () => {
      const result = findBlockById(blocks, "nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("isDescendantOf", () => {
    const parentBlock: TemplateBlock = {
      id: "parent",
      type: "section",
      label: "Parent",
      content: "",
      properties: {},
      children: [
        {
          id: "child1",
          type: "richText",
          label: "Child 1",
          content: "",
          properties: {},
        },
        {
          id: "child2",
          type: "grid",
          label: "Child 2",
          content: "",
          properties: {},
          children: [
            {
              id: "grandchild",
              type: "gridRow",
              label: "Grandchild",
              content: "",
              properties: {},
            },
          ],
        },
      ],
    };

    it("should return true if block is itself", () => {
      expect(isDescendantOf(parentBlock, "parent")).toBe(true);
    });

    it("should return true for direct children", () => {
      expect(isDescendantOf(parentBlock, "child1")).toBe(true);
    });

    it("should return true for nested descendants", () => {
      expect(isDescendantOf(parentBlock, "grandchild")).toBe(true);
    });

    it("should return false if not a descendant", () => {
      expect(isDescendantOf(parentBlock, "nonexistent")).toBe(false);
    });

    it("should return false if block has no children", () => {
      const blockWithoutChildren: TemplateBlock = {
        id: "single",
        type: "richText",
        label: "Single",
        content: "",
        properties: {},
      };
      expect(isDescendantOf(blockWithoutChildren, "other")).toBe(false);
    });
  });

  describe("getAlignmentStyle", () => {
    it("should return center for C", () => {
      expect(getAlignmentStyle("C")).toBe("center");
    });

    it("should return right for R", () => {
      expect(getAlignmentStyle("R")).toBe("right");
    });

    it("should return left for L or default", () => {
      expect(getAlignmentStyle("L")).toBe("left");
      expect(getAlignmentStyle("")).toBe("left");
      expect(getAlignmentStyle("anything")).toBe("left");
    });
  });

  describe("getBlockTypeLabel", () => {
    it("should return label for known types", () => {
      expect(getBlockTypeLabel("section")).toBe("Section");
      expect(getBlockTypeLabel("richText")).toBe("Rich Text");
      expect(getBlockTypeLabel("grid")).toBe("Grid");
    });

    it("should return the type itself for unknown types", () => {
      expect(getBlockTypeLabel("unknown")).toBe("unknown");
      expect(getBlockTypeLabel("customType")).toBe("customType");
    });
  });

  describe("getElementType", () => {
    it("should return correct type for known elements", () => {
      expect(getElementType("div")).toBe("container");
      expect(getElementType("img")).toBe("image");
      expect(getElementType("p")).toBe("text");
      expect(getElementType("h1")).toBe("heading");
    });

    it("should return element for unknown tags", () => {
      expect(getElementType("unknown")).toBe("element");
      expect(getElementType("custom")).toBe("element");
    });
  });

  describe("preserveHtmlEntities", () => {
    it("should preserve non-breaking space", () => {
      expect(preserveHtmlEntities("\u00A0")).toBe("&nbsp;");
    });

    it("should preserve copyright symbol", () => {
      expect(preserveHtmlEntities("\u00A9")).toBe("&copy;");
    });

    it("should preserve registered symbol", () => {
      expect(preserveHtmlEntities("\u00AE")).toBe("&reg;");
    });

    it("should preserve trademark symbol", () => {
      expect(preserveHtmlEntities("\u2122")).toBe("&trade;");
    });

    it("should preserve em dash", () => {
      expect(preserveHtmlEntities("\u2014")).toBe("&mdash;");
    });

    it("should preserve en dash", () => {
      expect(preserveHtmlEntities("\u2013")).toBe("&ndash;");
    });

    it("should preserve left single quote", () => {
      expect(preserveHtmlEntities("\u2018")).toBe("&lsquo;");
    });

    it("should preserve right single quote", () => {
      expect(preserveHtmlEntities("\u2019")).toBe("&rsquo;");
    });

    it("should preserve left double quote", () => {
      expect(preserveHtmlEntities("\u201C")).toBe("&ldquo;");
    });

    it("should preserve right double quote", () => {
      expect(preserveHtmlEntities("\u201D")).toBe("&rdquo;");
    });

    it("should preserve ellipsis", () => {
      expect(preserveHtmlEntities("\u2026")).toBe("&hellip;");
    });

    it("should preserve multiple entities in a string", () => {
      expect(preserveHtmlEntities("\u00A9 2024\u2014All rights reserved")).toBe(
        "&copy; 2024&mdash;All rights reserved",
      );
    });

    it("should leave regular text unchanged", () => {
      expect(preserveHtmlEntities("Hello World")).toBe("Hello World");
    });
  });

  describe("getParentGridColumns", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid1",
        type: "grid",
        label: "Grid 1",
        content: "",
        properties: { columns: 3 },
        children: [
          {
            id: "row1",
            type: "gridRow",
            label: "Row 1",
            content: "",
            properties: {},
          },
        ],
      },
      {
        id: "section1",
        type: "section",
        label: "Section 1",
        content: "",
        properties: {},
        children: [
          {
            id: "grid2",
            type: "grid",
            label: "Grid 2",
            content: "",
            properties: { columns: 5 },
            children: [
              {
                id: "row2",
                type: "gridRow",
                label: "Row 2",
                content: "",
                properties: {},
              },
            ],
          },
        ],
      },
    ];

    it("should return parent grid columns", () => {
      expect(getParentGridColumns(blocks, "row1")).toBe(3);
    });

    it("should return nested parent grid columns", () => {
      expect(getParentGridColumns(blocks, "row2")).toBe(5);
    });

    it("should return 2 if gridRowId is null", () => {
      expect(getParentGridColumns(blocks, null)).toBe(2);
    });

    it("should return 2 if parent grid not found", () => {
      expect(getParentGridColumns(blocks, "nonexistent")).toBe(2);
    });

    it("should return 2 if columns property is missing", () => {
      const blocksWithoutColumns: TemplateBlock[] = [
        {
          id: "grid3",
          type: "grid",
          label: "Grid 3",
          content: "",
          properties: {},
          children: [
            {
              id: "row3",
              type: "gridRow",
              label: "Row 3",
              content: "",
              properties: {},
            },
          ],
        },
      ];
      expect(getParentGridColumns(blocksWithoutColumns, "row3")).toBe(2);
    });
  });

  describe("removeBlockFromList", () => {
    it("should remove block at root level", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "block1",
          type: "section",
          label: "Block 1",
          content: "",
          properties: {},
        },
        {
          id: "block2",
          type: "richText",
          label: "Block 2",
          content: "",
          properties: {},
        },
      ];
      const blockRef: { current: TemplateBlock | null } = { current: null };
      const result = removeBlockFromList(blocks, "block1", blockRef);
      expect(result.length).toBe(1);
      expect(result[0]?.id).toBe("block2");
      expect(blockRef.current?.id).toBe("block1");
    });

    it("should remove nested block", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "block1",
          type: "section",
          label: "Block 1",
          content: "",
          properties: {},
          children: [
            {
              id: "block2",
              type: "richText",
              label: "Block 2",
              content: "",
              properties: {},
            },
            {
              id: "block3",
              type: "richText",
              label: "Block 3",
              content: "",
              properties: {},
            },
          ],
        },
      ];
      const blockRef: { current: TemplateBlock | null } = { current: null };
      const result = removeBlockFromList(blocks, "block2", blockRef);
      expect(result[0]?.children?.length).toBe(1);
      expect(result[0]?.children?.[0]?.id).toBe("block3");
      expect(blockRef.current?.id).toBe("block2");
    });

    it("should handle deeply nested removal", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "block1",
          type: "section",
          label: "Block 1",
          content: "",
          properties: {},
          children: [
            {
              id: "block2",
              type: "grid",
              label: "Block 2",
              content: "",
              properties: {},
              children: [
                {
                  id: "block3",
                  type: "gridRow",
                  label: "Block 3",
                  content: "",
                  properties: {},
                },
              ],
            },
          ],
        },
      ];
      const blockRef: { current: TemplateBlock | null } = { current: null };
      const result = removeBlockFromList(blocks, "block3", blockRef);
      expect(result[0]?.children?.[0]?.children?.length).toBe(0);
      expect(blockRef.current?.id).toBe("block3");
    });

    it("should not modify list if block not found", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "block1",
          type: "section",
          label: "Block 1",
          content: "",
          properties: {},
        },
      ];
      const blockRef = { current: null };
      const result = removeBlockFromList(blocks, "nonexistent", blockRef);
      expect(result.length).toBe(1);
      expect(blockRef.current).toBeNull();
    });
  });

  describe("findAncestorIds", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block1",
        type: "section",
        label: "Block 1",
        content: "",
        properties: {},
        children: [
          {
            id: "block2",
            type: "grid",
            label: "Block 2",
            content: "",
            properties: {},
            children: [
              {
                id: "block3",
                type: "gridRow",
                label: "Block 3",
                content: "",
                properties: {},
              },
            ],
          },
        ],
      },
    ];

    it("should return empty array for root level block", () => {
      const result = findAncestorIds(blocks, "block1");
      expect(result).toEqual([]);
    });

    it("should return single ancestor for direct child", () => {
      const result = findAncestorIds(blocks, "block2");
      expect(result).toEqual(["block1"]);
    });

    it("should return all ancestors for deeply nested block", () => {
      const result = findAncestorIds(blocks, "block3");
      expect(result).toEqual(["block1", "block2"]);
    });

    it("should return null if block not found", () => {
      const result = findAncestorIds(blocks, "nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getDefaultColumnWidths", () => {
    it("should return correct widths for 1 column", () => {
      expect(getDefaultColumnWidths(1)).toEqual([100]);
    });

    it("should return correct widths for 2 columns", () => {
      expect(getDefaultColumnWidths(2)).toEqual([50, 50]);
    });

    it("should return correct widths for 3 columns", () => {
      expect(getDefaultColumnWidths(3)).toEqual([40, 30, 30]);
    });

    it("should return correct widths for 4 columns", () => {
      expect(getDefaultColumnWidths(4)).toEqual([25, 25, 25, 25]);
    });

    it("should return correct widths for 5 columns", () => {
      expect(getDefaultColumnWidths(5)).toEqual([20, 20, 20, 20, 20]);
    });

    it("should return correct widths for 6 columns", () => {
      expect(getDefaultColumnWidths(6)).toEqual([20, 20, 15, 15, 15, 15]);
    });

    it("should return correct widths for 7 columns", () => {
      expect(getDefaultColumnWidths(7)).toEqual([15, 15, 15, 15, 15, 15, 10]);
    });

    it("should return correct widths for 8 columns", () => {
      expect(getDefaultColumnWidths(8)).toEqual([
        10, 15, 15, 10, 15, 15, 10, 10,
      ]);
    });

    it("should return correct widths for 9 columns", () => {
      expect(getDefaultColumnWidths(9)).toEqual([
        10, 10, 15, 10, 10, 15, 10, 10, 10,
      ]);
    });

    it("should return correct widths for 10 columns", () => {
      expect(getDefaultColumnWidths(10)).toEqual([
        10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
      ]);
    });

    it("should calculate equal widths for more than 10 columns", () => {
      const result = getDefaultColumnWidths(12);
      expect(result.length).toBe(12);
      expect(result.every((w) => w === 8)).toBe(true);
    });
  });

  describe("calculateAdjustedColumnWidths", () => {
    it("should return null if delta is zero", () => {
      const result = calculateAdjustedColumnWidths([50, 50], 0, 50);
      expect(result).toBeNull();
    });

    it("should adjust when increasing and total is 100", () => {
      const result = calculateAdjustedColumnWidths([50, 50], 0, 60);
      expect(result).toEqual([60, 40]);
    });

    it("should wrap around when adjusting last column", () => {
      const result = calculateAdjustedColumnWidths([50, 50], 1, 60);
      expect(result).toEqual([40, 60]);
    });

    it("should not reduce below available width", () => {
      const result = calculateAdjustedColumnWidths([30, 30], 0, 50);
      expect(result).toEqual([50, 30]);
    });

    it("should adjust when current total is not 100", () => {
      const result = calculateAdjustedColumnWidths([40, 40], 0, 50);
      expect(result).toEqual([50, 40]);
    });

    it("should not exceed max allowed width", () => {
      const result = calculateAdjustedColumnWidths([30, 20, 10], 0, 80);
      expect(result).toEqual([70, 20, 10]);
    });

    it("should return null if no change can be made due to reduction limit", () => {
      const result = calculateAdjustedColumnWidths([50, 50], 0, 40);
      expect(result).toEqual([40, 50]);
    });

    it("should handle reduction case", () => {
      const result = calculateAdjustedColumnWidths([60, 40], 0, 50);
      expect(result).toEqual([50, 40]);
    });

    it("should handle case where reduction is zero", () => {
      const result = calculateAdjustedColumnWidths([100], 0, 110);
      expect(result).toBeNull();
    });
  });

  describe("generateColgroup", () => {
    it("should generate colgroup with correct widths", () => {
      const result = generateColgroup([50, 50], 2);
      expect(result).toBe(
        '<colgroup><col style="width: 50%;" /><col style="width: 50%;" /></colgroup>',
      );
    });

    it("should handle multiple columns", () => {
      const result = generateColgroup([40, 30, 30], 3);
      expect(result).toBe(
        '<colgroup><col style="width: 40%;" /><col style="width: 30%;" /><col style="width: 30%;" /></colgroup>',
      );
    });

    it("should return empty string if widths length does not match expected", () => {
      const result = generateColgroup([50, 50], 3);
      expect(result).toBe("");
    });

    it("should return empty string if widths array is empty", () => {
      const result = generateColgroup([], 0);
      expect(result).toBe("<colgroup></colgroup>");
    });
  });

  describe("generateEmailHtml", () => {
    const globalStyles: TemplateGlobalStyles = {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      lineHeight: "1.5",
      textColor: "#333333",
      bodyBackgroundColor: "#f0f0f0",
      contentMaxWidth: { value: "600", label: "600px" },
      bodyPadding: "20px",
      linkColor: "#0066cc",
      linkHoverColor: "#004499",
      htmlTitle: "Test Email",
      preheaderText: "",
    };

    it("should generate complete email HTML with all features", () => {
      const result = generateEmailHtml({
        languageCode: "en",
        globalStyles,
        bodyContent: "<div>Test Content</div>",
        preheaderHtml: "<span>Preheader</span>",
        bodyStyleConfig: {
          includeBackgroundAndLayout: true,
          marginTop: "0",
        },
        additionalHeadStyles: ".custom { color: red; }",
      });

      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain('<html lang="en"');
      expect(result).toContain("<title>Test Email</title>");
      expect(result).toContain("Arial, sans-serif");
      expect(result).toContain("background-color: #f0f0f0");
      expect(result).toContain("max-width: 600px");
      expect(result).toContain(".custom { color: red; }");
      expect(result).toContain("<span>Preheader</span>");
      expect(result).toContain("<div>Test Content</div>");
    });

    it("should generate HTML without title tag if not provided", () => {
      const stylesWithoutTitle = { ...globalStyles, htmlTitle: "" };
      const result = generateEmailHtml({
        languageCode: "es",
        globalStyles: stylesWithoutTitle,
        bodyContent: "<div>Content</div>",
        preheaderHtml: "",
        bodyStyleConfig: {
          includeBackgroundAndLayout: false,
          marginTop: "10px",
        },
      });

      expect(result).not.toContain("<title>");
      expect(result).toContain('<html lang="es"');
      expect(result).toContain("margin-top: 10px");
      expect(result).not.toContain("background-color:");
      expect(result).not.toContain("max-width:");
    });

    it("should include layout styles when includeBackgroundAndLayout is true", () => {
      const result = generateEmailHtml({
        languageCode: "fr",
        globalStyles,
        bodyContent: "<p>Test</p>",
        preheaderHtml: "",
        bodyStyleConfig: {
          includeBackgroundAndLayout: true,
          marginTop: "0",
        },
      });

      expect(result).toContain("background-color: #f0f0f0");
      expect(result).toContain("max-width: 600px");
      expect(result).toContain("padding-top: 20px");
    });

    it("should exclude layout styles when includeBackgroundAndLayout is false", () => {
      const result = generateEmailHtml({
        languageCode: "de",
        globalStyles,
        bodyContent: "<p>Test</p>",
        preheaderHtml: "",
        bodyStyleConfig: {
          includeBackgroundAndLayout: false,
          marginTop: "5px",
        },
      });

      expect(result).not.toContain("background-color: #f0f0f0");
      expect(result).not.toContain("max-width: 600px");
      expect(result).not.toContain("padding-top: 20px");
      expect(result).toContain("margin-top: 5px");
    });

    it("should handle empty additionalHeadStyles", () => {
      const result = generateEmailHtml({
        languageCode: "en",
        globalStyles,
        bodyContent: "<div>Test</div>",
        preheaderHtml: "",
        bodyStyleConfig: {
          includeBackgroundAndLayout: true,
          marginTop: "0",
        },
      });

      expect(result).toContain("</style>");
      expect(result).not.toContain("undefined");
    });

    it("should include Microsoft Office tags", () => {
      const result = generateEmailHtml({
        languageCode: "en",
        globalStyles,
        bodyContent: "<div>Test</div>",
        preheaderHtml: "",
        bodyStyleConfig: {
          includeBackgroundAndLayout: true,
          marginTop: "0",
        },
      });

      expect(result).toContain("<!--[if gte mso 9]>");
      expect(result).toContain("<o:OfficeDocumentSettings>");
      expect(result).toContain("<!--[if !mso]><!-->");
    });

    it("should include viewport and meta tags", () => {
      const result = generateEmailHtml({
        languageCode: "en",
        globalStyles,
        bodyContent: "<div>Test</div>",
        preheaderHtml: "",
        bodyStyleConfig: {
          includeBackgroundAndLayout: true,
          marginTop: "0",
        },
      });

      expect(result).toContain('name="viewport"');
      expect(result).toContain('name="x-apple-disable-message-reformatting"');
      expect(result).toContain('name="format-detection"');
      expect(result).toContain('name="color-scheme"');
    });
  });
});
