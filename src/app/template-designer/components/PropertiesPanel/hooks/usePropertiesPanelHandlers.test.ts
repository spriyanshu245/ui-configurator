import { renderHook, act } from "@testing-library/react";
import { usePropertiesPanelHandlers } from "./usePropertiesPanelHandlers";
import { TemplateBlock } from "./../../../../types";
import { ChangeEvent } from "react";

jest.mock("../utils/propertiesPanelUtils", () => ({
  getDefaultColumnWidths: jest.fn((count: number) => {
    if (count === 2) return [50, 50];
    if (count === 3) return [33, 34, 33];
    return Array.from({ length: count }, () => Math.round(100 / count));
  }),
  calculateAdjustedColumnWidths: jest.fn(
    (widths: number[], index: number, value: number) => {
      if (value === widths[index]) return null;
      const newWidths = [...widths];
      newWidths[index] = value;
      return newWidths;
    }
  ),
}));

describe("usePropertiesPanelHandlers", () => {
  const mockUpdateBlock = jest.fn();
  const mockRemoveBlock = jest.fn();

  const createSelectedBlock = (
    overrides: Partial<TemplateBlock> = {}
  ): TemplateBlock => ({
    id: "block-1",
    type: "text",
    label: "Test Block",
    content: "Test content",
    properties: {},
    ...overrides,
  });

  const defaultProps = {
    selectedBlockId: "block-1",
    selectedBlock: createSelectedBlock(),
    updateBlock: mockUpdateBlock,
    removeBlock: mockRemoveBlock,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handlePropertyChange", () => {
    it("updates block property when selectedBlockId exists", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handlePropertyChange("fontSize", 16);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { fontSize: 16 },
      });
    });

    it("does not update block when selectedBlockId is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlockId: null,
        })
      );

      act(() => {
        result.current.handlePropertyChange("fontSize", 16);
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });

    it("preserves existing properties when updating", () => {
      const block = createSelectedBlock({
        properties: { existingProp: "value" },
      });
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlock: block,
        })
      );

      act(() => {
        result.current.handlePropertyChange("newProp", "newValue");
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { existingProp: "value", newProp: "newValue" },
      });
    });
  });

  describe("handleGridColumnsChange", () => {
    it("updates columns and columnWidths when selectedBlockId exists", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleGridColumnsChange(2);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { columns: 2, columnWidths: [50, 50] },
      });
    });

    it("does not update when selectedBlockId is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlockId: null,
        })
      );

      act(() => {
        result.current.handleGridColumnsChange(3);
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });
  });

  describe("handleLabelChange", () => {
    it("updates block label when selectedBlockId exists", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      const event = {
        target: { value: "New Label" },
      } as ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleLabelChange(event);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        label: "New Label",
      });
    });

    it("does not update when selectedBlockId is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlockId: null,
        })
      );

      const event = {
        target: { value: "New Label" },
      } as ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleLabelChange(event);
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });
  });

  describe("handleStyleChange", () => {
    it("updates style property when selectedBlockId and selectedBlock exist", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleStyleChange("bold");
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { style: "bold" },
      });
    });

    it("does not update when selectedBlockId is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlockId: null,
        })
      );

      act(() => {
        result.current.handleStyleChange("bold");
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });

    it("does not update when selectedBlock is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlock: null,
        })
      );

      act(() => {
        result.current.handleStyleChange("bold");
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });
  });

  describe("handleColumnContentChange", () => {
    it("updates column content at specified index", () => {
      const block = createSelectedBlock({
        properties: { columnContents: ["col1", "col2"] },
      });
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlock: block,
        })
      );

      act(() => {
        result.current.handleColumnContentChange(0, "updated col1");
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { columnContents: ["updated col1", "col2"] },
      });
    });

    it("creates columnContents array if not exists", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleColumnContentChange(0, "new content");
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { columnContents: ["new content"] },
      });
    });

    it("does not update when selectedBlockId is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlockId: null,
        })
      );

      act(() => {
        result.current.handleColumnContentChange(0, "content");
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });
  });

  describe("handleBorderedChange", () => {
    it("updates bordered property", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleBorderedChange(true);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { bordered: true },
      });
    });

    it("does not update when selectedBlock is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlock: null,
        })
      );

      act(() => {
        result.current.handleBorderedChange(true);
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });
  });

  describe("handleShowBordersChange", () => {
    it("updates showBorders property", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleShowBordersChange(false);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { showBorders: false },
      });
    });
  });

  describe("handleColumnStyleChange", () => {
    it("updates column style at specified index", () => {
      const block = createSelectedBlock({
        properties: { columnStyles: ["style1", "style2"] },
      });
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlock: block,
        })
      );

      act(() => {
        result.current.handleColumnStyleChange(1, "newStyle");
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { columnStyles: ["style1", "newStyle"] },
      });
    });

    it("creates columnStyles array if not exists", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleColumnStyleChange(0, "style");
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { columnStyles: ["style"] },
      });
    });
  });

  describe("handleColumnWidthChange", () => {
    it("updates column widths when change is valid", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleColumnWidthChange(0, 60, [50, 50]);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { columnWidths: [60, 50] },
      });
    });

    it("does not update when selectedBlockId is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlockId: null,
        })
      );

      act(() => {
        result.current.handleColumnWidthChange(0, 60, [50, 50]);
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });

    it("does not update when selectedBlock is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlock: null,
        })
      );

      act(() => {
        result.current.handleColumnWidthChange(0, 60, [50, 50]);
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });

    it("does not update when calculateAdjustedColumnWidths returns null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleColumnWidthChange(0, 50, [50, 50]);
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });
  });

  describe("handleTableListBindingChange", () => {
    it("updates list property", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleTableListBindingChange("items");
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { list: "items" },
      });
    });
  });

  describe("handleTableZebraRowsChange", () => {
    it("updates zebraRows property", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleTableZebraRowsChange(true);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { zebraRows: true },
      });
    });
  });

  describe("handleTableShowBordersChange", () => {
    it("updates showBorders property for table", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleTableShowBordersChange(true);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { showBorders: true },
      });
    });
  });

  describe("handleTableColumnsChange", () => {
    it("updates columns without widths", () => {
      const columns = [
        { id: "1", dataKey: "name", label: "Name", alignment: "L" as const },
      ];
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleTableColumnsChange(columns);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { columns },
      });
    });

    it("updates columns with widths", () => {
      const columns = [
        { id: "1", dataKey: "name", label: "Name", alignment: "L" as const },
      ];
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleTableColumnsChange(columns, [100]);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { columns, columnWidths: [100] },
      });
    });

    it("does not update when selectedBlock is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlock: null,
        })
      );

      act(() => {
        result.current.handleTableColumnsChange([]);
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });
  });

  describe("handleTableColumnWidthChange", () => {
    it("updates table column widths", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleTableColumnWidthChange(0, 70, [50, 50]);
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { columnWidths: [70, 50] },
      });
    });

    it("does not update when selectedBlockId is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlockId: null,
        })
      );

      act(() => {
        result.current.handleTableColumnWidthChange(0, 70, [50, 50]);
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });

    it("does not update when calculation returns null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleTableColumnWidthChange(0, 50, [50, 50]);
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });
  });

  describe("handleTableHeaderStyleChange", () => {
    it("updates headerStyle property", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleTableHeaderStyleChange("bold-header");
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { headerStyle: "bold-header" },
      });
    });
  });

  describe("handleTableRowCellStyleChange", () => {
    it("updates rowCellStyle property", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleTableRowCellStyleChange("cell-style");
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        properties: { rowCellStyle: "cell-style" },
      });
    });
  });

  describe("handleContentChange", () => {
    it("updates block content", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleContentChange("New content");
      });

      expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
        content: "New content",
      });
    });

    it("does not update when selectedBlockId is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlockId: null,
        })
      );

      act(() => {
        result.current.handleContentChange("New content");
      });

      expect(mockUpdateBlock).not.toHaveBeenCalled();
    });
  });

  describe("handleDelete", () => {
    it("removes block when selectedBlockId exists", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers(defaultProps)
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(mockRemoveBlock).toHaveBeenCalledWith("block-1");
    });

    it("does not remove block when selectedBlockId is null", () => {
      const { result } = renderHook(() =>
        usePropertiesPanelHandlers({
          ...defaultProps,
          selectedBlockId: null,
        })
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(mockRemoveBlock).not.toHaveBeenCalled();
    });
  });
});
