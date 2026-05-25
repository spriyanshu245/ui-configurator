import {
  isValidDraggedComponentIndexIndex,
  shouldRenderDropZoneAtIndex,
  shouldRenderInputGridDropZoneAtIndex,
} from "./dropZoneUtils";

describe("dropZoneUtils", () => {
  test("isValidDraggedComponentIndexIndex returns true for undefined and -1", () => {
    expect(isValidDraggedComponentIndexIndex(undefined)).toBe(true);
    expect(isValidDraggedComponentIndexIndex(-1)).toBe(true);
  });

  test("isValidDraggedComponentIndexIndex returns false for normal indexes", () => {
    expect(isValidDraggedComponentIndexIndex(0)).toBe(false);
    expect(isValidDraggedComponentIndexIndex(2)).toBe(false);
  });

  test("shouldRenderDropZoneAtIndex returns true for invalid dragged indexes", () => {
    expect(shouldRenderDropZoneAtIndex(1, undefined)).toBe(true);
    expect(shouldRenderDropZoneAtIndex(1, -1)).toBe(true);
  });

  test("shouldRenderDropZoneAtIndex hides the dragged index and the following index", () => {
    expect(shouldRenderDropZoneAtIndex(2, 2)).toBe(false);
    expect(shouldRenderDropZoneAtIndex(3, 2)).toBe(false);
    expect(shouldRenderDropZoneAtIndex(4, 2)).toBe(true);
  });

  test("shouldRenderInputGridDropZoneAtIndex returns true for invalid dragged indexes", () => {
    expect(shouldRenderInputGridDropZoneAtIndex(1, undefined)).toBe(true);
    expect(shouldRenderInputGridDropZoneAtIndex(1, -1)).toBe(true);
  });

  test("shouldRenderInputGridDropZoneAtIndex hides only the dragged index", () => {
    expect(shouldRenderInputGridDropZoneAtIndex(2, 2)).toBe(false);
    expect(shouldRenderInputGridDropZoneAtIndex(3, 2)).toBe(true);
  });
});
