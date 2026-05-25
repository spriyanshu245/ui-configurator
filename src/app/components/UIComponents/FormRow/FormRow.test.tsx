import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FormRow from "./FormRow";
import { useFormRow } from "@/app/hooks/useFormRow";
import ComponentRenderer from "../../ComponentRenderer/ComponentRenderer";
import FormElementDropZone from "../../FormElementDropZone/FormElementDropZone";
import { FormRowComponent } from "@/app/types/types";

// Mock dependencies
jest.mock("@/app/hooks/useFormRow");
jest.mock("../../ComponentRenderer/ComponentRenderer", () =>
  jest.fn(() => <div data-testid="mocked-component-renderer" />)
);
jest.mock("../../FormElementDropZone/FormElementDropZone", () =>
  jest.fn(() => <div data-testid="mocked-drop-zone" />)
);

describe("FormRow Component", () => {
  // Setup default mock implementation for useFormRow
  beforeEach(() => {
    (useFormRow as jest.Mock).mockReturnValue({
      columns: 2,
      columnGap: 10,
      childCount: 0,
      emptySlotCount: 2,
      shouldShowDropZones: false,
      effectiveIsDraggingFormElement: false,
      handleDrop: jest.fn(),
      handleDragOver: jest.fn(),
      handleDragLeave: jest.fn(),
      handleDragOverComponentShuffle: jest.fn(),
      renderComponent: { id: "form-row-1", components: [] },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Basic rendering
  test("renders FormRow with correct grid properties", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: { columns: 3, columnGap: 20 },
      components: [
        { id: "child1", type: "input", category: "form" },
        { id: "child2", type: "input", category: "form" },
      ],
    };

    render(<FormRow component={component} />);

    const formRowElement = screen.getByTestId("form-row-1");
    expect(formRowElement).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      columnGap: "10px",
    });
  });

  // Test 2: Rendering with custom columns and gap
  test("renders FormRow with custom grid properties", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: { columns: 3, columnGap: 20 },
      components: [
        { id: "child1", type: "input", category: "form" },
        { id: "child2", type: "input", category: "form" },
      ],
    };

    (useFormRow as jest.Mock).mockReturnValue({
      columns: 4,
      columnGap: 20,
      childCount: 0,
      emptySlotCount: 4,
      shouldShowDropZones: false,
      effectiveIsDraggingFormElement: false,
      handleDrop: jest.fn(),
      handleDragOver: jest.fn(),
      handleDragLeave: jest.fn(),
      handleDragOverComponentShuffle: jest.fn(),
      renderComponent: component,
    });

    render(<FormRow component={component} />);

    const formRowElement = screen.getByTestId("form-row-1");
    expect(formRowElement).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      columnGap: "20px",
    });
  });

  // Test 3: Rendering child components
  test("renders child components with ComponentRenderer", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: { columns: 3, columnGap: 20 },
      components: [
        { id: "child-1", type: "text-field", category: "form" },
        { id: "child-2", type: "text-field", category: "form" },
      ],
    };

    (useFormRow as jest.Mock).mockReturnValue({
      columns: 2,
      columnGap: 10,
      childCount: 2,
      emptySlotCount: 0,
      shouldShowDropZones: false,
      effectiveIsDraggingFormElement: false,
      handleDrop: jest.fn(),
      handleDragOver: jest.fn(),
      handleDragLeave: jest.fn(),
      handleDragOverComponentShuffle: jest.fn(),
      renderComponent: component,
    });

    render(<FormRow component={component} />);

    const renderers = screen.getAllByTestId("mocked-component-renderer");
    expect(renderers).toHaveLength(2);
  });

  // Test 4: Empty slots without drop zones
  test("renders empty slots when shouldShowDropZones is false", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [{ id: "child-1", type: "text-field", category: "form" }],
    };

    (useFormRow as jest.Mock).mockReturnValue({
      columns: 3,
      columnGap: 10,
      childCount: 1,
      emptySlotCount: 2,
      shouldShowDropZones: false,
      effectiveIsDraggingFormElement: false,
      handleDrop: jest.fn(),
      handleDragOver: jest.fn(),
      handleDragLeave: jest.fn(),
      handleDragOverComponentShuffle: jest.fn(),
      renderComponent: component,
    });

    render(<FormRow component={component} />);

    // Should have 1 component renderer and 2 empty divs (no drop zones)
    const renderers = screen.getAllByTestId("mocked-component-renderer");
    expect(renderers).toHaveLength(1);

    const dropZones = screen.queryAllByTestId("mocked-drop-zone");
    expect(dropZones).toHaveLength(0);
  });

  // Test 5: Empty slots with drop zones
  test("renders drop zones when shouldShowDropZones is true", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [{ id: "child-1", type: "text-field", category: "form" }],
    };

    (useFormRow as jest.Mock).mockReturnValue({
      columns: 3,
      columnGap: 10,
      childCount: 1,
      emptySlotCount: 2,
      shouldShowDropZones: true,
      effectiveIsDraggingFormElement: true,
      handleDrop: jest.fn(),
      handleDragOver: jest.fn(),
      handleDragLeave: jest.fn(),
      handleDragOverComponentShuffle: jest.fn(),
      renderComponent: component,
    });

    render(<FormRow component={component} />);

    // Should have 1 component renderer and 2 drop zones
    const renderers = screen.getAllByTestId("mocked-component-renderer");
    expect(renderers).toHaveLength(1);

    const dropZones = screen.getAllByTestId("mocked-drop-zone");
    expect(dropZones).toHaveLength(2);
  });

  // Test 6: Props passed to FormElementDropZone
  test("passes correct props to FormElementDropZone", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [],
    };

    const mockHandleDrop = jest.fn();
    const mockHandleDragOver = jest.fn();
    const mockHandleDragLeave = jest.fn();

    (useFormRow as jest.Mock).mockReturnValue({
      columns: 2,
      columnGap: 10,
      childCount: 0,
      emptySlotCount: 2,
      shouldShowDropZones: true,
      effectiveIsDraggingFormElement: true,
      handleDrop: mockHandleDrop,
      handleDragOver: mockHandleDragOver,
      handleDragLeave: mockHandleDragLeave,
      handleDragOverComponentShuffle: jest.fn(),
      renderComponent: component,
    });

    render(<FormRow component={component} />);

    expect(FormElementDropZone).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 0,
        dragOverIndex: 0,
        height: "fit-content",
        isDraggingFormElement: true,
      }),
      undefined
    );

    expect(FormElementDropZone).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 1,
        dragOverIndex: 1,
        height: "fit-content",
        isDraggingFormElement: true,
      }),
      undefined
    );
  });

  // Test 7: Drag over handling for component shuffling
  test("calls handleDragOverComponentShuffle when dragging over a component", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [{ id: "child-1", type: "text-field", category: "form" }],
    };

    const mockHandleDragOverComponentShuffle = jest.fn();

    (useFormRow as jest.Mock).mockReturnValue({
      columns: 2,
      columnGap: 10,
      childCount: 1,
      emptySlotCount: 1,
      shouldShowDropZones: false,
      effectiveIsDraggingFormElement: false,
      handleDrop: jest.fn(),
      handleDragOver: jest.fn(),
      handleDragLeave: jest.fn(),
      handleDragOverComponentShuffle: mockHandleDragOverComponentShuffle,
      renderComponent: component,
    });

    render(<FormRow component={component} />);

    // Find the div that wraps the component and fire a dragOver event
    const componentWrapper = screen.getByTestId(
      "mocked-component-renderer"
    ).parentElement;
    fireEvent.dragOver(componentWrapper!);

    expect(mockHandleDragOverComponentShuffle).toHaveBeenCalledWith(
      expect.any(Object),
      "child-1"
    );
  });

  // Test 8: Integration with useFormRow hook
  test("calls useFormRow with correct parameters", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [],
    };

    render(<FormRow component={component} />);

    expect(useFormRow).toHaveBeenCalledWith({
      component,
      disallowedTypes: ["form-row"],
      defaultColumns: 2,
    });
  });

  // Test 9: Check if drop event handlers are correctly wired
  test("wires up drop event handlers correctly", () => {
    const component: FormRowComponent = {
      id: "form-row-1",
      type: "form-row",
      category: "form",
      properties: {},
      components: [],
    };

    const mockHandleDrop = jest.fn();
    const mockHandleDragOver = jest.fn();
    const mockHandleDragLeave = jest.fn();

    (useFormRow as jest.Mock).mockReturnValue({
      columns: 2,
      columnGap: 10,
      childCount: 0,
      emptySlotCount: 2,
      shouldShowDropZones: true,
      effectiveIsDraggingFormElement: true,
      handleDrop: mockHandleDrop,
      handleDragOver: mockHandleDragOver,
      handleDragLeave: mockHandleDragLeave,
      handleDragOverComponentShuffle: jest.fn(),
      renderComponent: component,
    });

    render(<FormRow component={component} />);

    // Verify that the handlers are called with the correct arguments
    const firstDropZoneProps = (FormElementDropZone as jest.Mock).mock
      .calls[0][0];
    const mockEvent = {} as React.DragEvent<HTMLDivElement>;

    firstDropZoneProps.handleDrop(mockEvent);
    expect(mockHandleDrop).toHaveBeenCalledWith(mockEvent, 0);

    firstDropZoneProps.handleDragOver(mockEvent);
    expect(mockHandleDragOver).toHaveBeenCalledWith(mockEvent, 0);

    firstDropZoneProps.handleDragLeave();
    expect(mockHandleDragLeave).toHaveBeenCalled();
  });

  // Test 10: Full grid with no empty slots
  test("renders full grid with no empty slots or drop zones", () => {
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

    (useFormRow as jest.Mock).mockReturnValue({
      columns: 2,
      columnGap: 10,
      childCount: 2,
      emptySlotCount: 0,
      shouldShowDropZones: true, // Even with this true, no dropzones should render
      effectiveIsDraggingFormElement: true,
      handleDrop: jest.fn(),
      handleDragOver: jest.fn(),
      handleDragLeave: jest.fn(),
      handleDragOverComponentShuffle: jest.fn(),
      renderComponent: component,
    });

    render(<FormRow component={component} />);

    // Should have 2 component renderers and 0 drop zones
    const renderers = screen.getAllByTestId("mocked-component-renderer");
    expect(renderers).toHaveLength(2);

    const dropZones = screen.queryAllByTestId("mocked-drop-zone");
    expect(dropZones).toHaveLength(0);
  });
});
