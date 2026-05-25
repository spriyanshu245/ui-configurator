import {
  formatPropertyKey,
  getHiddenProperties,
  shouldShowContent,
  getDefaultColumnWidths,
  calculateAdjustedColumnWidths,
} from "./propertiesPanelUtils";

jest.mock("@/app/template-designer/data/blockPropertiesMap", () => ({
  hiddenBlockProperties: {
    section: ["bordered", "paddingVertical", "paddingHorizontal"],
    grid: ["columns", "gap", "columnWidths"],
  },
  contentHiddenBlockTypes: new Set([
    "grid",
    "gridRow",
    "section",
    "spacer",
    "image",
  ]),
}));

jest.mock("@/app/template-designer/constants", () => ({
  DEFAULT_COLUMN_WIDTHS: {
    1: [100],
    2: [50, 50],
    3: [40, 30, 30],
    4: [25, 25, 25, 25],
  },
}));

describe("propertiesPanelUtils", () => {
  describe("formatPropertyKey", () => {
    it("should format camelCase to Title Case", () => {
      expect(formatPropertyKey("columnWidths")).toBe("Column Widths");
    });

    it("should format PascalCase to Title Case", () => {
      expect(formatPropertyKey("ColumnWidths")).toBe("Column Widths");
    });

    it("should handle single word", () => {
      expect(formatPropertyKey("title")).toBe("Title");
    });

    it("should handle already formatted string", () => {
      expect(formatPropertyKey("Title")).toBe("Title");
    });

    it("should handle multiple consecutive capitals", () => {
      expect(formatPropertyKey("HTMLContent")).toBe("H T M L Content");
    });

    it("should handle empty string", () => {
      expect(formatPropertyKey("")).toBe("");
    });

    it("should handle string with no capitals", () => {
      expect(formatPropertyKey("content")).toBe("Content");
    });
  });

  describe("getHiddenProperties", () => {
    it("should return hidden properties for known type", () => {
      const result = getHiddenProperties("section");
      expect(result).toEqual([
        "bordered",
        "paddingVertical",
        "paddingHorizontal",
      ]);
    });

    it("should return hidden properties for grid type", () => {
      const result = getHiddenProperties("grid");
      expect(result).toEqual(["columns", "gap", "columnWidths"]);
    });

    it("should return empty array for unknown type", () => {
      const result = getHiddenProperties("unknownType");
      expect(result).toEqual([]);
    });

    it("should return empty array for empty string", () => {
      const result = getHiddenProperties("");
      expect(result).toEqual([]);
    });
  });

  describe("shouldShowContent", () => {
    it("should return false for types in contentHiddenBlockTypes", () => {
      expect(shouldShowContent("grid")).toBe(false);
      expect(shouldShowContent("gridRow")).toBe(false);
      expect(shouldShowContent("section")).toBe(false);
      expect(shouldShowContent("spacer")).toBe(false);
      expect(shouldShowContent("image")).toBe(false);
    });

    it("should return true for types not in contentHiddenBlockTypes", () => {
      expect(shouldShowContent("richText")).toBe(true);
      expect(shouldShowContent("table")).toBe(true);
      expect(shouldShowContent("unknownType")).toBe(true);
    });

    it("should return true for empty string", () => {
      expect(shouldShowContent("")).toBe(true);
    });
  });

  describe("getDefaultColumnWidths", () => {
    it("should return predefined widths for known count", () => {
      expect(getDefaultColumnWidths(1)).toEqual([100]);
      expect(getDefaultColumnWidths(2)).toEqual([50, 50]);
      expect(getDefaultColumnWidths(3)).toEqual([40, 30, 30]);
      expect(getDefaultColumnWidths(4)).toEqual([25, 25, 25, 25]);
    });

    it("should calculate equal widths for unknown count", () => {
      const result = getDefaultColumnWidths(5);
      expect(result).toHaveLength(5);
      expect(result).toEqual([20, 20, 20, 20, 20]);
    });

    it("should handle count of 6 with calculated widths", () => {
      const result = getDefaultColumnWidths(6);
      expect(result).toHaveLength(6);
      expect(result.every((w) => w === 16 || w === 17)).toBe(true);
    });

    it("should handle count of 7", () => {
      const result = getDefaultColumnWidths(7);
      expect(result).toHaveLength(7);
      expect(result.every((w) => w === 14 || w === 15)).toBe(true);
    });

    it("should handle count of 0", () => {
      const result = getDefaultColumnWidths(0);
      expect(result).toEqual([]);
    });

    it("should handle large count", () => {
      const result = getDefaultColumnWidths(10);
      expect(result).toHaveLength(10);
      expect(result.every((w) => w === 10)).toBe(true);
    });
  });

  describe("calculateAdjustedColumnWidths", () => {
    it("should return null when delta is 0", () => {
      const columnWidths = [50, 50];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 50);
      expect(result).toBeNull();
    });

    it("should adjust next column when increasing and total is 100", () => {
      const columnWidths = [50, 50];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 60);
      expect(result).toEqual([60, 40]);
    });

    it("should adjust next column when decreasing and total is 100", () => {
      const columnWidths = [50, 50];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 40);
      expect(result).toEqual([40, 50]);
    });

    it("should wrap to first column when adjusting last column", () => {
      const columnWidths = [50, 50];
      const result = calculateAdjustedColumnWidths(columnWidths, 1, 60);
      expect(result).toEqual([40, 60]);
    });

    it("should not exceed available space from next column", () => {
      const columnWidths = [50, 30, 20];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 90);
      expect(result).toEqual([80, 0, 20]);
    });

    it("should handle adjustment when total is not 100", () => {
      const columnWidths = [40, 40];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 50);
      expect(result).toEqual([50, 40]);
    });

    it("should not exceed maximum allowed when total is not 100", () => {
      const columnWidths = [40, 40];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 70);
      expect(result).toEqual([60, 40]);
    });

    it("should return adjusted widths when total is not 100", () => {
      const columnWidths = [60, 40];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 70);
      expect(result).toEqual([70, 30]);
    });

    it("should handle reduction when next column is at minimum", () => {
      const columnWidths = [90, 10];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 95);
      expect(result).toEqual([95, 5]);
    });

    it("should handle multiple columns", () => {
      const columnWidths = [25, 25, 25, 25];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 35);
      expect(result).toEqual([35, 15, 25, 25]);
    });

    it("should handle small reduction", () => {
      const columnWidths = [50, 50];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 49);
      expect(result).toEqual([49, 50]);
    });

    it("should handle large increase with limited next column", () => {
      const columnWidths = [20, 10, 70];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 40);
      expect(result).toEqual([30, 0, 70]);
    });

    it("should handle edge case when next column has exactly the delta", () => {
      const columnWidths = [40, 20, 40];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 60);
      expect(result).toEqual([60, 0, 40]);
    });

    it("should handle negative delta (decrease)", () => {
      const columnWidths = [60, 40];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 45);
      expect(result).toEqual([45, 40]);
    });

    it("should maintain array immutability", () => {
      const columnWidths = [50, 50];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 60);
      expect(columnWidths).toEqual([50, 50]);
      expect(result).not.toBe(columnWidths);
    });

    it("should clamp to maxAllowed when trying to exceed", () => {
      const columnWidths = [80, 15, 5];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 90);
      expect(result).toEqual([90, 5, 5]);
    });

    it("should handle case where total is less than 100 and adjustment is clamped", () => {
      const columnWidths = [30, 30, 30];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 50);
      expect(result).toEqual([40, 30, 30]);
    });

    it("should handle when new value exceeds maximum in non-100 total", () => {
      const columnWidths = [20, 20, 20];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 100);
      expect(result).toEqual([60, 20, 20]);
    });

    it("should handle adjustment in middle column", () => {
      const columnWidths = [30, 40, 30];
      const result = calculateAdjustedColumnWidths(columnWidths, 1, 50);
      expect(result).toEqual([30, 50, 20]);
    });

    it("should handle last column adjustment with wraparound", () => {
      const columnWidths = [40, 30, 30];
      const result = calculateAdjustedColumnWidths(columnWidths, 2, 50);
      expect(result).toEqual([20, 30, 50]);
    });

    it("should handle case where next column cannot provide full delta", () => {
      const columnWidths = [50, 5, 45];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 60);
      expect(result).toEqual([55, 0, 45]);
    });

    it("should handle total of exactly 100 with small increase", () => {
      const columnWidths = [33, 33, 34];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 35);
      expect(result).toEqual([35, 31, 34]);
    });

    it("should handle single column width change", () => {
      const columnWidths = [100];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 90);
      expect(result).toEqual([90]);
    });

    it("should handle when newValue equals maxAllowed in else branch", () => {
      const columnWidths = [70, 20, 10];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 100);
      expect(result).toEqual([90, 0, 10]);
    });

    it("should return null when reduction is 0 in if branch", () => {
      const columnWidths = [50, 0, 50];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 55);
      expect(result).toBeNull();
    });

    it("should handle total not equal 100 with exact maxAllowed", () => {
      const columnWidths = [50, 30];
      const result = calculateAdjustedColumnWidths(columnWidths, 0, 80);
      expect(result).toEqual([70, 30]);
    });
  });
});
