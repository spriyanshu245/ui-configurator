import {
  blockPropertiesMap,
  hiddenBlockProperties,
  contentHiddenBlockTypes,
  unitSuffixProperties,
} from "./blockPropertiesMap";
import { BlockProperty } from "./blockProperties";

describe("blockPropertiesMap", () => {
  it("exports blockPropertiesMap object", () => {
    expect(blockPropertiesMap).toBeDefined();
    expect(typeof blockPropertiesMap).toBe("object");
  });

  it("has section properties", () => {
    expect(blockPropertiesMap.section).toEqual([
      BlockProperty.Title,
      BlockProperty.PaddingVertical,
      BlockProperty.PaddingHorizontal,
      BlockProperty.Bordered,
    ]);
  });

  it("has richText properties", () => {
    expect(blockPropertiesMap.richText).toEqual([BlockProperty.Content]);
  });

  it("has grid properties", () => {
    expect(blockPropertiesMap.grid).toEqual([
      BlockProperty.Columns,
      BlockProperty.Gap,
      BlockProperty.ColumnWidths,
    ]);
  });

  it("has gridRow properties", () => {
    expect(blockPropertiesMap.gridRow).toEqual([BlockProperty.ColumnContents]);
  });

  it("has table properties", () => {
    expect(blockPropertiesMap.table).toEqual([
      BlockProperty.List,
      BlockProperty.ZebraRows,
      BlockProperty.ShowBorders,
      BlockProperty.TableColumns,
      BlockProperty.ColumnWidths,
      BlockProperty.HeaderStyle,
      BlockProperty.RowCellStyle,
    ]);
  });

  it("has loop properties", () => {
    expect(blockPropertiesMap.loop).toEqual([
      BlockProperty.Variable,
      BlockProperty.List,
    ]);
  });

  it("has if properties", () => {
    expect(blockPropertiesMap.if).toEqual([BlockProperty.Condition]);
  });

  it("has image properties", () => {
    expect(blockPropertiesMap.image).toEqual([
      BlockProperty.Src,
      BlockProperty.Alt,
      BlockProperty.Width,
      BlockProperty.Alignment,
    ]);
  });

  it("has spacer properties", () => {
    expect(blockPropertiesMap.spacer).toEqual([BlockProperty.Height]);
  });

  it("has divider properties", () => {
    expect(blockPropertiesMap.divider).toEqual([
      BlockProperty.Thickness,
      BlockProperty.Color,
      BlockProperty.Width,
    ]);
  });

  it("has pageBreak with empty array", () => {
    expect(blockPropertiesMap.pageBreak).toEqual([]);
  });

  it("all block types have property arrays", () => {
    Object.values(blockPropertiesMap).forEach((properties) => {
      expect(Array.isArray(properties)).toBe(true);
    });
  });
});

describe("hiddenBlockProperties", () => {
  it("exports hiddenBlockProperties object", () => {
    expect(hiddenBlockProperties).toBeDefined();
    expect(typeof hiddenBlockProperties).toBe("object");
  });

  it("has grid hidden properties", () => {
    expect(hiddenBlockProperties.grid).toEqual([
      BlockProperty.Columns,
      BlockProperty.Gap,
      BlockProperty.ColumnWidths,
      BlockProperty.ColumnSpacing,
      BlockProperty.ShowBorders,
      BlockProperty.Style,
      BlockProperty.ColumnStyles,
    ]);
  });

  it("has gridRow with empty hidden properties", () => {
    expect(hiddenBlockProperties.gridRow).toEqual([]);
  });

  it("has table hidden properties", () => {
    expect(hiddenBlockProperties.table).toEqual([
      BlockProperty.TableColumns,
      BlockProperty.List,
      BlockProperty.ZebraRows,
      BlockProperty.ShowBorders,
      BlockProperty.ColumnWidths,
      BlockProperty.HeaderStyle,
      BlockProperty.RowCellStyle,
    ]);
  });

  it("has if hidden properties", () => {
    expect(hiddenBlockProperties.if).toEqual([BlockProperty.Content]);
  });

  it("has loop hidden properties", () => {
    expect(hiddenBlockProperties.loop).toEqual([BlockProperty.Content]);
  });

  it("has pageBreak hidden properties", () => {
    expect(hiddenBlockProperties.pageBreak).toEqual([BlockProperty.Content]);
  });

  it("has image hidden properties", () => {
    expect(hiddenBlockProperties.image).toEqual([BlockProperty.Alignment]);
  });

  it("all block types have hidden property arrays", () => {
    Object.values(hiddenBlockProperties).forEach((properties) => {
      expect(Array.isArray(properties)).toBe(true);
    });
  });
});

describe("contentHiddenBlockTypes", () => {
  it("exports contentHiddenBlockTypes as a Set", () => {
    expect(contentHiddenBlockTypes).toBeDefined();
    expect(contentHiddenBlockTypes instanceof Set).toBe(true);
  });

  it("contains grid block type", () => {
    expect(contentHiddenBlockTypes.has("grid")).toBe(true);
  });

  it("contains gridRow block type", () => {
    expect(contentHiddenBlockTypes.has("gridRow")).toBe(true);
  });

  it("contains section block type", () => {
    expect(contentHiddenBlockTypes.has("section")).toBe(true);
  });

  it("contains spacer block type", () => {
    expect(contentHiddenBlockTypes.has("spacer")).toBe(true);
  });

  it("contains image block type", () => {
    expect(contentHiddenBlockTypes.has("image")).toBe(true);
  });

  it("contains divider block type", () => {
    expect(contentHiddenBlockTypes.has("divider")).toBe(true);
  });

  it("contains table block type", () => {
    expect(contentHiddenBlockTypes.has("table")).toBe(true);
  });

  it("contains if block type", () => {
    expect(contentHiddenBlockTypes.has("if")).toBe(true);
  });

  it("contains loop block type", () => {
    expect(contentHiddenBlockTypes.has("loop")).toBe(true);
  });

  it("contains pageBreak block type", () => {
    expect(contentHiddenBlockTypes.has("pageBreak")).toBe(true);
  });

  it("does not contain richText block type", () => {
    expect(contentHiddenBlockTypes.has("richText")).toBe(false);
  });

  it("has expected number of block types", () => {
    expect(contentHiddenBlockTypes.size).toBe(10);
  });
});

describe("unitSuffixProperties", () => {
  it("exports unitSuffixProperties as a Set", () => {
    expect(unitSuffixProperties).toBeDefined();
    expect(unitSuffixProperties instanceof Set).toBe(true);
  });

  it("contains PaddingVertical property", () => {
    expect(unitSuffixProperties.has(BlockProperty.PaddingVertical)).toBe(true);
  });

  it("contains PaddingHorizontal property", () => {
    expect(unitSuffixProperties.has(BlockProperty.PaddingHorizontal)).toBe(
      true,
    );
  });

  it("contains Height property", () => {
    expect(unitSuffixProperties.has(BlockProperty.Height)).toBe(true);
  });

  it("contains Width property", () => {
    expect(unitSuffixProperties.has(BlockProperty.Width)).toBe(true);
  });

  it("contains Gap property", () => {
    expect(unitSuffixProperties.has(BlockProperty.Gap)).toBe(true);
  });

  it("contains Thickness property", () => {
    expect(unitSuffixProperties.has(BlockProperty.Thickness)).toBe(true);
  });

  it("does not contain non-unit properties", () => {
    expect(unitSuffixProperties.has(BlockProperty.Title)).toBe(false);
    expect(unitSuffixProperties.has(BlockProperty.Content)).toBe(false);
    expect(unitSuffixProperties.has(BlockProperty.Bordered)).toBe(false);
  });

  it("has expected number of properties", () => {
    expect(unitSuffixProperties.size).toBe(6);
  });

  it("all properties are valid BlockProperty values", () => {
    unitSuffixProperties.forEach((prop) => {
      expect(Object.values(BlockProperty)).toContain(prop);
    });
  });
});
