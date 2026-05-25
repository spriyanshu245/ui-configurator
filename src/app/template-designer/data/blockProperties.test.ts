import { BlockProperty } from "./blockProperties";

describe("BlockProperty", () => {
  it("exports BlockProperty enum", () => {
    expect(BlockProperty).toBeDefined();
  });

  it("has Title property", () => {
    expect(BlockProperty.Title).toBe("title");
  });

  it("has Content property", () => {
    expect(BlockProperty.Content).toBe("content");
  });

  it("has padding properties", () => {
    expect(BlockProperty.PaddingVertical).toBe("paddingVertical");
    expect(BlockProperty.PaddingHorizontal).toBe("paddingHorizontal");
  });

  it("has Bordered property", () => {
    expect(BlockProperty.Bordered).toBe("bordered");
  });

  it("has column-related properties", () => {
    expect(BlockProperty.Columns).toBe("columns");
    expect(BlockProperty.ColumnContents).toBe("columnContents");
    expect(BlockProperty.ColumnWidths).toBe("columnWidths");
    expect(BlockProperty.Gap).toBe("gap");
  });

  it("has list-related properties", () => {
    expect(BlockProperty.List).toBe("list");
    expect(BlockProperty.Variable).toBe("variable");
    expect(BlockProperty.ZebraRows).toBe("zebraRows");
    expect(BlockProperty.TableColumns).toBe("tableColumns");
  });

  it("has Condition property", () => {
    expect(BlockProperty.Condition).toBe("condition");
  });

  it("has image-related properties", () => {
    expect(BlockProperty.Src).toBe("src");
    expect(BlockProperty.Alt).toBe("alt");
    expect(BlockProperty.Width).toBe("width");
    expect(BlockProperty.Alignment).toBe("alignment");
  });

  it("has Height property", () => {
    expect(BlockProperty.Height).toBe("height");
  });

  it("has divider-related properties", () => {
    expect(BlockProperty.Thickness).toBe("thickness");
    expect(BlockProperty.Color).toBe("color");
  });

  it("all enum values are valid strings", () => {
    Object.values(BlockProperty).forEach((value) => {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    });
  });

  it("all enum keys match their values in camelCase", () => {
    const entries = Object.entries(BlockProperty);
    entries.forEach(([key, value]) => {
      const camelCaseKey = key.charAt(0).toLowerCase() + key.slice(1);
      expect(value).toBe(camelCaseKey);
    });
  });
});
