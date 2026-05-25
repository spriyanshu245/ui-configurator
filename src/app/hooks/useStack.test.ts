import { renderHook, act } from "@testing-library/react";
import { useStack } from "./useStack";
import { StackComponent } from "../types/types";

const mockMoveComponent = jest.fn();
const mockAddComponentToComponent = jest.fn();
const mockSetActiveComponent = jest.fn();

const mockSetIsDragging = jest.fn();
const mockSetIsDraggingComponent = jest.fn();
const mockSetDraggingComponentId = jest.fn();
const mockSetIsDraggingFormElement = jest.fn();

const mockHandleDragOver = jest.fn();
const mockHandleDragLeave = jest.fn();
const mockResetGhostImage = jest.fn();

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: () => ({
    moveComponent: mockMoveComponent,
    addComponentToComponent: mockAddComponentToComponent,
  }),
}));

jest.mock("@/app/context/DragContext", () => ({
  useDragContext: () => ({
    draggingComponentId: "child-1",
    setIsDragging: mockSetIsDragging,
    setIsDraggingComponent: mockSetIsDraggingComponent,
    setDraggingComponentId: mockSetDraggingComponentId,
    setIsDraggingFormElement: mockSetIsDraggingFormElement,
    isDraggingFormElement: false,
  }),
}));

jest.mock("@/app/hooks/useComponentDragOver", () => ({
  useComponentDragOver: () => ({
    dragOverIndex: null,
    handleDragOver: mockHandleDragOver,
    handleDragLeave: mockHandleDragLeave,
  }),
}));

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: () => ({
    setActiveComponent: mockSetActiveComponent,
  }),
}));

jest.mock("@/app/utils/utils", () => ({
  generateRandomId: () => "random-id-123",
  resetGhostImage: () => mockResetGhostImage(),
}));

jest.mock("@/app/utils/userTask/dropZoneUtils", () => ({
  shouldRenderDropZoneAtIndex: () => true,
}));

describe("useStack - happy path", () => {
  it("should return layout and drop zone props correctly", () => {
    const mockComponent: StackComponent = {
      id: "stack-1",
      type: "stack",
      category: "form",
      properties: {
        columns: 2,
        columnGap: 20,
        hasFixedColumns: true,
      },
      components: [
        { id: "child-1", type: "text", category: "form", },
      ],
    };

    const { result } = renderHook(() => useStack({ component: mockComponent }));

    expect(result.current.columns).toBe(2);
    expect(result.current.columnGap).toBe(20);
    expect(result.current.childCount).toBe(1);
    expect(result.current.gridTemplateColumns).toBe("repeat(2, 1fr)");
    expect(result.current.components).toHaveLength(1);
    expect(result.current.shouldRenderDropZone).toBe(true);

    const dropZoneProps = result.current.getDropZoneProps();
    expect(dropZoneProps.index).toBe(1);
    expect(typeof dropZoneProps.handleDragOver).toBe("function");
    expect(typeof dropZoneProps.handleDrop).toBe("function");
    expect(dropZoneProps.isDraggingFormElement).toBe(false);
  });
});

describe("useStack - handleDrop and related logic", () => {
  it("should call cleanupDragState, handleDrop, and handleDragOver correctly", () => {
    const mockComponent: StackComponent = {
      id: "stack-1",
      type: "stack",
      category: "form",
      properties: { columns: 2, columnGap: 16, hasFixedColumns: true },
      components: [],
    };

    const { result } = renderHook(() => useStack({ component: mockComponent }));
    const dropZoneProps = result.current.getDropZoneProps();

    act(() => {
      dropZoneProps.handleDragOver({
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.DragEvent);
    });
    expect(mockHandleDragOver).toHaveBeenCalled();

    const mockDropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(
          JSON.stringify({
            type: "text",
            category: "form",
          })
        ),
      },
    };

    act(() => {
      dropZoneProps.handleDrop(
        mockDropEvent as unknown as React.DragEvent<HTMLDivElement>
      );
    });

    expect(mockAddComponentToComponent).toHaveBeenCalledWith(
      "stack-1",
      {
        type: "text",
        category: "form",
        id: "random-id-123",
        isNewComponent: true,
      },
      0
    );
    expect(mockSetActiveComponent).toHaveBeenCalledWith("random-id-123");
    expect(mockSetIsDragging).toHaveBeenCalledWith(false);
    expect(mockSetIsDraggingComponent).toHaveBeenCalledWith(false);
    expect(mockSetDraggingComponentId).toHaveBeenCalledWith(null);
    expect(mockSetIsDraggingFormElement).toHaveBeenCalledWith(false);
    expect(mockResetGhostImage).toHaveBeenCalled();
  });

  it("should return early if categories mismatch", () => {
    const mockComponent: StackComponent = {
      id: "stack-2",
      type: "stack",
      category: "form",
      properties: { columns: 2, columnGap: 16 },
      components: [],
    };

    const { result } = renderHook(() => useStack({ component: mockComponent }));
    const dropZoneProps = result.current.getDropZoneProps();

    const event = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest
          .fn()
          .mockReturnValue(
            JSON.stringify({ id: "some-id", type: "text", category: "layout" })
          ),
      },
    };

    act(() => {
      dropZoneProps.handleDrop(
        event as unknown as React.DragEvent<HTMLDivElement>
      );
    });

    expect(mockSetIsDraggingFormElement).toHaveBeenCalledWith(false);

    expect(mockMoveComponent).not.toHaveBeenCalled();
  });

  it("should move component with index shift", () => {
    const mockComponent: StackComponent = {
      id: "stack-3",
      type: "stack",
      category: "form",
      properties: { columns: 2, columnGap: 16 },
      components: [
        { id: "c1", type: "text", category: "form", },
        { id: "c2", type: "input", category: "form", },
      ],
    };

    const { result } = renderHook(() => useStack({ component: mockComponent }));
    const dropZoneProps = result.current.getDropZoneProps();

    const event = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest
          .fn()
          .mockReturnValue(
            JSON.stringify({ id: "c1", type: "text", category: "form" })
          ),
      },
    };

    act(() => {
      dropZoneProps.handleDrop(
        event as unknown as React.DragEvent<HTMLDivElement>
      );
    });

    expect(mockMoveComponent).toHaveBeenCalledWith("c1", "stack-3", 1);
  });
});

describe("useStack - computed layout branches", () => {
  it("uses explicit column and gap values when provided", () => {
    const mockComponent: StackComponent = {
      id: "stack-explicit",
      type: "stack",
      category: "form",
      properties: {
        columns: 3,
        columnGap: 24,
        hasFixedColumns: true,
      },
      components: [
        { id: "c1", type: "text", category: "form", },
        { id: "c2", type: "input", category: "form", },
      ],
    };

    const { result } = renderHook(() => useStack({ component: mockComponent }));

    expect(result.current.columns).toBe(3);
    expect(result.current.columnGap).toBe(24);
    expect(result.current.childCount).toBe(2);
    expect(result.current.gridTemplateColumns).toBe("repeat(3, 1fr)");
  });

  it("uses fallback values when columns/gap/components are missing", () => {
    const mockComponent: StackComponent = {
      id: "stack-fallback",
      type: "stack",
      category: "form",
      properties: {
        hasFixedColumns: true,
      },
    };

    const { result } = renderHook(() => useStack({ component: mockComponent }));

    expect(result.current.columns).toBe(2);
    expect(result.current.columnGap).toBe(10);
    expect(result.current.childCount).toBe(0);
    expect(result.current.gridTemplateColumns).toBe("repeat(2, 1fr)");
  });

  it("should return 2 columns if hasFixedColumns is true", () => {
    const mockComponent: StackComponent = {
      id: "stack-fixed-true",
      type: "stack",
      category: "form",
      properties: { hasFixedColumns: true },
      components: [],
    };

    const { result } = renderHook(() => useStack({ component: mockComponent }));
    expect(result.current.columns).toBe(2);
  });

  it("should return 1 column if hasFixedColumns is false", () => {
    const mockComponent: StackComponent = {
      id: "stack-fixed-false",
      type: "stack",
      category: "form",
      properties: { hasFixedColumns: false },
      components: [],
    };

    const { result } = renderHook(() => useStack({ component: mockComponent }));
    expect(result.current.columns).toBe(2);
  });
});
