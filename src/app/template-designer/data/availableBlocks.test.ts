import { availableBlocks } from "./availableBlocks";
import { DEFAULT_COLUMN_WIDTHS } from "../constants";

describe("availableBlocks", () => {
  it("exports an array of available blocks", () => {
    expect(Array.isArray(availableBlocks)).toBe(true);
    expect(availableBlocks.length).toBeGreaterThan(0);
  });

  it("contains section block with correct properties", () => {
    const sectionBlock = availableBlocks.find((b) => b.type === "section");
    expect(sectionBlock).toBeDefined();
    expect(sectionBlock?.id).toBe("section");
    expect(sectionBlock?.label).toBe("Section");
    expect(sectionBlock?.isContainer).toBe(true);
    expect(sectionBlock?.defaultProperties).toEqual({
      title: "",
      paddingVertical: "16px",
      paddingHorizontal: "16px",
      bordered: true,
    });
  });

  it("contains richText block with correct properties", () => {
    const richTextBlock = availableBlocks.find((b) => b.type === "richText");
    expect(richTextBlock).toBeDefined();
    expect(richTextBlock?.id).toBe("rich-text");
    expect(richTextBlock?.label).toBe("Rich Text");
    expect(richTextBlock?.defaultContent).toBe("RichText content here...");
  });

  it("contains grid block with column widths from constants", () => {
    const gridBlock = availableBlocks.find((b) => b.type === "grid");
    expect(gridBlock).toBeDefined();
    expect(gridBlock?.defaultProperties?.columns).toBe(2);
    expect(gridBlock?.defaultProperties?.columnWidths).toBe(
      DEFAULT_COLUMN_WIDTHS[2]
    );
  });

  it("contains table block with empty columns array", () => {
    const tableBlock = availableBlocks.find((b) => b.type === "table");
    expect(tableBlock).toBeDefined();
    expect(tableBlock?.defaultProperties?.columns).toEqual([]);
    expect(tableBlock?.defaultProperties?.zebraRows).toBe(false);
  });

  it("contains loop block as a container", () => {
    const loopBlock = availableBlocks.find((b) => b.type === "loop");
    expect(loopBlock).toBeDefined();
    expect(loopBlock?.isContainer).toBe(true);
    expect(loopBlock?.defaultProperties?.variable).toBe("item");
  });

  it("contains if block with condition property", () => {
    const ifBlock = availableBlocks.find((b) => b.type === "if");
    expect(ifBlock).toBeDefined();
    expect(ifBlock?.isContainer).toBe(true);
    expect(ifBlock?.defaultProperties).toHaveProperty("condition");
  });

  it("contains image block with dimensions and alignment", () => {
    const imageBlock = availableBlocks.find((b) => b.type === "image");
    expect(imageBlock).toBeDefined();
    expect(imageBlock?.defaultProperties?.width).toBe("100px");
    expect(imageBlock?.defaultProperties?.alignment).toBe("L");
  });

  it("contains spacer block with height property", () => {
    const spacerBlock = availableBlocks.find((b) => b.type === "spacer");
    expect(spacerBlock).toBeDefined();
    expect(spacerBlock?.defaultProperties?.height).toBe("15px");
  });

  it("contains divider block with thickness and color", () => {
    const dividerBlock = availableBlocks.find((b) => b.type === "divider");
    expect(dividerBlock).toBeDefined();
    expect(dividerBlock?.defaultProperties?.thickness).toBe("1px");
    expect(dividerBlock?.defaultProperties?.color).toBe("#e0e0e0");
  });

  it("contains pageBreak block with empty default properties", () => {
    const pageBreakBlock = availableBlocks.find((b) => b.type === "pageBreak");
    expect(pageBreakBlock).toBeDefined();
    expect(pageBreakBlock?.defaultProperties).toEqual({});
  });

  it("all blocks have required properties", () => {
    availableBlocks.forEach((block) => {
      expect(block).toHaveProperty("id");
      expect(block).toHaveProperty("type");
      expect(block).toHaveProperty("label");
      expect(block).toHaveProperty("description");
      expect(block).toHaveProperty("defaultContent");
      expect(block).toHaveProperty("defaultProperties");
    });
  });

  it("all block IDs are unique", () => {
    const ids = availableBlocks.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all block types are unique", () => {
    const types = availableBlocks.map((b) => b.type);
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size).toBe(types.length);
  });
});
