import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useFormRow } from "./useFormRow";
import { useUserTask } from "@/app/context/UserTaskContext";
import { useDragContext } from "@/app/context/DragContext";
import { useComponentDragOver } from "@/app/hooks/useComponentDragOver";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { useControlPanel } from "@/app/context/ControlPanelContext";
import { generateRandomId } from "@/app/utils/utils";
import { FormRowComponent } from "../types/types";

// Mock all required dependencies
jest.mock("@/app/context/UserTaskContext");
jest.mock("@/app/context/DragContext");
jest.mock("@/app/hooks/useComponentDragOver");
jest.mock("@/app/context/PropertiesContext");
jest.mock("@/app/context/ControlPanelContext");
jest.mock("@/app/utils/utils");

describe("useFormRow Hook", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (useUserTask as jest.Mock).mockReturnValue({
      moveComponent: jest.fn(),
      addComponentToComponent: jest.fn(),
    });

    (useDragContext as jest.Mock).mockReturnValue({
      draggingComponentId: null,
      setDraggingComponentId: jest.fn(),
      setIsDragging: jest.fn(),
      setIsDraggingComponent: jest.fn(),
      setIsDraggingFormElement: jest.fn(),
      isDraggingFormElement: false,
      isFormRowValidation: false,
      isSingleFormRowValidation: false,
    });

    (useComponentDragOver as jest.Mock).mockReturnValue({
      handleDragOver: jest.fn(),
      handleDragLeave: jest.fn(),
    });

    (usePropertyPane as jest.Mock).mockReturnValue({
      setActiveComponent: jest.fn(),
    });

    (useControlPanel as jest.Mock).mockReturnValue({
      showDropZones: false,
    });

    (generateRandomId as jest.Mock).mockReturnValue("random-id-123");
  });

  // Test 1: Basic initialization
  test("should initialize with correct default values", () => {
    const component: FormRowComponent = {
      id: "comp1",
      type: "form-row",
      category: "component",
      properties: {},
    };

    const { result } = renderHook(() => useFormRow({ component }));

    expect(result.current.columns).toBe(2); // Default columns value
    expect(result.current.columnGap).toBe(10); // Default column gap value
    expect(result.current.childCount).toBe(0);
    expect(result.current.emptySlotCount).toBe(2);
    expect(result.current.shouldShowDropZones).toBe(false);
    expect(result.current.effectiveIsDraggingFormElement).toBe(false);
  });

  // Test 2: Custom columns and column gap
  test("should use provided columns and columnGap values", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      components: [],
      properties: {
        columns: 3,
        columnGap: 20,
      },
    };

    const { result } = renderHook(() => useFormRow({ component }));

    expect(result.current.columns).toBe(3);
    expect(result.current.columnGap).toBe(20);
    expect(result.current.emptySlotCount).toBe(3);
  });

  // Test 3: Override component properties with props
  test("should override component properties with provided props", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      components: [],
      properties: {
        columns: 3,
        columnGap: 20,
      },
    };

    const { result } = renderHook(() =>
      useFormRow({
        component,
        columns: 4,
        columnGap: 30,
      })
    );

    expect(result.current.columns).toBe(4);
    expect(result.current.columnGap).toBe(30);
    expect(result.current.emptySlotCount).toBe(4);
  });

  // Test 4: Child count calculation
  test("should calculate childCount and emptySlotCount correctly", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [
        { id: "child-1", type: "text-field", category: "form" },
        { id: "child-2", type: "text-field", category: "form" },
      ],
    };

    const { result } = renderHook(() => useFormRow({ component, columns: 4 }));

    expect(result.current.childCount).toBe(2);
    expect(result.current.emptySlotCount).toBe(2); // 4 columns - 2 children
  });

  // Test 5: Drop zones visibility based on isPreview and draggingComponentId
  test("should show drop zones when dragging or showDropZones is true", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "component",
      properties: {},
      components: [],
    };

    // Case 1: Not in preview, not dragging, not showing drop zones
    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      draggingComponentId: null,
    });
    (useControlPanel as jest.Mock).mockReturnValue({ showDropZones: false });

    const { result, rerender } = renderHook(() => useFormRow({ component }));
    expect(result.current.shouldShowDropZones).toBe(false);

    // Case 2: Not in preview, dragging component
    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      draggingComponentId: "some-id",
    });

    rerender();
    expect(result.current.shouldShowDropZones).toBe(true);

    // Case 3: Not in preview, showDropZones enabled
    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      draggingComponentId: null,
    });
    (useControlPanel as jest.Mock).mockReturnValue({ showDropZones: true });

    rerender();
    expect(result.current.shouldShowDropZones).toBe(true);
  });

  // Test 6: Handling dropping an existing component
  test("should move existing component on drop", () => {
    const mockMoveComponent = jest.fn();
    const mockSetActiveComponent = jest.fn();
    const mockCleanupDragFns = {
      setIsDraggingComponent: jest.fn(),
      setIsDraggingFormElement: jest.fn(),
      setIsDragging: jest.fn(),
      setDraggingComponentId: jest.fn(),
    };

    (useUserTask as jest.Mock).mockReturnValue({
      moveComponent: mockMoveComponent,
      addComponentToComponent: jest.fn(),
    });

    (usePropertyPane as jest.Mock).mockReturnValue({
      setActiveComponent: mockSetActiveComponent,
    });

    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      ...mockCleanupDragFns,
    });

    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [],
    };

    const { result } = renderHook(() => useFormRow({ component }));

    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(
          JSON.stringify({
            id: "existing-component-id",
            type: "text-field",
          })
        ),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    act(() => {
      result.current.handleDrop(mockEvent, 0);
    });

    expect(mockMoveComponent).toHaveBeenCalledWith(
      "existing-component-id",
      "form-row-1",
      0
    );
    expect(mockSetActiveComponent).toHaveBeenCalledWith(
      "existing-component-id"
    );
    expect(mockCleanupDragFns.setIsDraggingComponent).toHaveBeenCalledWith(
      false
    );
    expect(mockCleanupDragFns.setIsDraggingFormElement).toHaveBeenCalledWith(
      false
    );
    expect(mockCleanupDragFns.setIsDragging).toHaveBeenCalledWith(false);
    expect(mockCleanupDragFns.setDraggingComponentId).toHaveBeenCalledWith(
      null
    );
  });

  // Test 7: Handling dropping a new component
  test("should add new component on drop", () => {
    const mockAddComponentToComponent = jest.fn();
    const mockSetActiveComponent = jest.fn();

    (useUserTask as jest.Mock).mockReturnValue({
      moveComponent: jest.fn(),
      addComponentToComponent: mockAddComponentToComponent,
    });

    (usePropertyPane as jest.Mock).mockReturnValue({
      setActiveComponent: mockSetActiveComponent,
    });

    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [],
    };

    const { result } = renderHook(() => useFormRow({ component }));

    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(
          JSON.stringify({
            type: "text-field",
            // No ID means it's a new component
          })
        ),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    act(() => {
      result.current.handleDrop(mockEvent, 0);
    });

    expect(mockAddComponentToComponent).toHaveBeenCalledWith(
      "form-row-1",
      expect.objectContaining({
        id: "random-id-123",
        type: "text-field",
      }),
      0
    );
    expect(mockSetActiveComponent).toHaveBeenCalledWith("random-id-123");
  });

  // Test 8: Prevent dropping disallowed component types
  test("should prevent dropping disallowed component types", () => {
    const mockAddComponentToComponent = jest.fn();
    const mockSetIsDraggingFormElement = jest.fn();
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

    (useUserTask as jest.Mock).mockReturnValue({
      moveComponent: jest.fn(),
      addComponentToComponent: mockAddComponentToComponent,
    });

    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      setIsDraggingFormElement: mockSetIsDraggingFormElement,
    });

    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [],
    };

    const { result } = renderHook(() =>
      useFormRow({
        component,
        disallowedTypes: ["form-row", "field-group"],
      })
    );

    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(
          JSON.stringify({
            type: "form-row",
          })
        ),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    act(() => {
      result.current.handleDrop(mockEvent, 0);
    });

    expect(mockAddComponentToComponent).not.toHaveBeenCalled();
    expect(mockSetIsDraggingFormElement).toHaveBeenCalledWith(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Dropping form-row into this component is not allowed"
      )
    );

    consoleWarnSpy.mockRestore();
  });

  // Test 9: Handling component shuffling
  test("should handle drag over component shuffle correctly", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [
        { id: "component-1", type: "text-field", category: "form" },
        { id: "component-2", type: "text-field", category: "form" },
        { id: "component-3", type: "text-field", category: "form" },
      ],
    };

    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      draggingComponentId: "component-1",
    });

    const { result } = renderHook(() => useFormRow({ component }));

    const mockEvent = {
      preventDefault: jest.fn(),
    } as unknown as React.DragEvent<HTMLDivElement>;

    act(() => {
      result.current.handleDragOverComponentShuffle(mockEvent, "component-3");
    });

    // Verify the component order has changed in renderComponent
    expect(result.current.renderComponent.components).toEqual([
      { id: "component-2", type: "text-field", category: "form" },
      { id: "component-3", type: "text-field", category: "form" },
      { id: "component-1", type: "text-field", category: "form" },
    ]);
  });

  // Test 10: Handling drop index adjustment when dragging within the same container
  test("should adjust drop index when dragging within the same container", () => {
    const mockMoveComponent = jest.fn();

    (useUserTask as jest.Mock).mockReturnValue({
      moveComponent: mockMoveComponent,
      addComponentToComponent: jest.fn(),
    });

    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [
        { id: "component-1", type: "text-field", category: "form" },
        { id: "component-2", type: "text-field", category: "form" },
        { id: "component-3", type: "text-field", category: "form" },
      ],
    };

    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      draggingComponentId: "component-1",
    });

    const { result } = renderHook(() => useFormRow({ component }));

    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(
          JSON.stringify({
            id: "component-1",
            type: "text-field",
          })
        ),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    // Try to drop component-1 at index 2
    act(() => {
      result.current.handleDrop(mockEvent, 2);
    });

    // Index should be adjusted from 2 to 1 since we're moving from index 0
    expect(mockMoveComponent).toHaveBeenCalledWith(
      "component-1",
      "form-row-1",
      1
    );
  });

  test("should set effectiveIsDraggingFormElement correctly", () => {
    const formRowComponent: FormRowComponent = {
      id: "form-row-1",
      name: "form-row",
      type: "form-row",
      category: "form",
      properties: {},
      components: [],
    };


    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      isDraggingFormElement: true,
      isFormRowValidation: false,
      isSingleFormRowValidation: false,
    });

    const { result: formRowResult, rerender: rerenderFormRow } = renderHook(
      () => useFormRow({ component: formRowComponent })
    );
    expect(formRowResult.current.effectiveIsDraggingFormElement).toBe(true);

    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      isDraggingFormElement: true,
      isFormRowValidation: true,
      isSingleFormRowValidation: false,
    });

    rerenderFormRow();
    expect(formRowResult.current.effectiveIsDraggingFormElement).toBe(false);


    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      isDraggingFormElement: true,
      isFormRowValidation: false,
      isSingleFormRowValidation: true,
    });

    rerenderFormRow();
    expect(formRowResult.current.effectiveIsDraggingFormElement).toBe(true);

    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      isDraggingFormElement: true,
      isFormRowValidation: false,
      isSingleFormRowValidation: false,
    });

   

    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      isDraggingFormElement: true,
      isFormRowValidation: false,
      isSingleFormRowValidation: true,
    });

   

    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      isDraggingFormElement: true,
      isFormRowValidation: true,
      isSingleFormRowValidation: false,
    });

   

    (useDragContext as jest.Mock).mockReturnValue({
      ...useDragContext(),
      isDraggingFormElement: false,
      isFormRowValidation: false,
      isSingleFormRowValidation: false,
    });

    rerenderFormRow();
    expect(formRowResult.current.effectiveIsDraggingFormElement).toBe(false);

  });
});
