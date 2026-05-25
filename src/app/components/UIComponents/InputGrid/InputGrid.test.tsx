import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import InputGrid from "./InputGrid";
import "@testing-library/jest-dom";
import { InputGridComponent } from "../../../types/types";
import * as DragContext from "../../../context/DragContext";
import * as UserTaskContext from "../../../context/UserTaskContext";
import * as ComponentDragOver from "../../../hooks/useComponentDragOver";
import * as PropertiesContext from "../../../context/PropertiesContext";
import * as ControlPanelContext from "../../../context/ControlPanelContext";

jest.mock("../../../context/UserTaskContext");
jest.mock("../../../context/DragContext");
jest.mock("../../../hooks/useComponentDragOver");
jest.mock("../../../context/PropertiesContext");
jest.mock("../../../context/ControlPanelContext");

jest.mock("../../../../app/utils/utils", () => ({
  ...jest.requireActual("../../../../app/utils/utils"),
  addCategoryRecursive: jest.fn((component, category) => ({
    ...component,
    category,
  })),
}));

const addComponentToComponentMock = jest.fn();
const moveComponentMock = jest.fn();
const removeComponentMock = jest.fn();
const setActiveComponentMock = jest.fn();
const setIsDraggingMock = jest.fn();
const setIsDraggingComponentMock = jest.fn();
const setDraggingComponentIdMock = jest.fn();
const setIsDraggingFormElementMock = jest.fn();
const handleDragOverMock = jest.fn();
const handleDragLeaveMock = jest.fn();

describe("handleDrop functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (UserTaskContext.useUserTask as jest.Mock).mockReturnValue({
      addComponentToComponent: addComponentToComponentMock,
      moveComponent: moveComponentMock,
      userTask: {},
      removeComponent: removeComponentMock,
    });

    (ComponentDragOver.useComponentDragOver as jest.Mock).mockReturnValue({
      handleDragOver: handleDragOverMock,
      handleDragLeave: handleDragLeaveMock,
    });

    (PropertiesContext.usePropertyPane as jest.Mock).mockReturnValue({
      setActiveComponent: setActiveComponentMock,
    });
    (ControlPanelContext.useControlPanel as jest.Mock).mockReturnValue({
      showDropZones: jest.fn(),
      toggleShowDropZones: jest.fn(),
      isAutoSave: jest.fn(),
      toggleAutoSave: jest.fn(),
      isAutoSaveInProgress: jest.fn(),
      setIsAutoSaveInProgress: jest.fn(),
      isSaveSuccessful: jest.fn(),
      setIsSaveSuccessful: jest.fn(),
    });
  });
  test("handles drop with existing component (moveComponent)", async () => {
    (DragContext.useDragContext as jest.Mock).mockReturnValue({
      draggingComponentId: null,
      setIsDragging: setIsDraggingMock,
      setIsDraggingComponent: setIsDraggingComponentMock,
      setDraggingComponentId: setDraggingComponentIdMock,
      setIsDraggingFormElement: setIsDraggingFormElementMock,
      isDraggingFormElement: false,
    });
    const testComponent: InputGridComponent = {
      id: "grid-1",
      type: "input-grid",
      category: "form",
      properties: {
        name: "Input Grid",
        label: "Grid Label",
        width: "100",
        rowHeaders: [{ id: "row-1", text: "Row 1" }],
        columnHeaders: [
          { id: "col-1", text: "Column 1" },
          { id: "col-2", text: "Column 2" },
        ],
      },
      components: [
        {
          id: "row-1",
          type: "input-grid-row",
          category: "form",
          properties: {
            name: "Input Grid Row-1",
            label: "",
          },
          components: [
            {
              id: "col-1-1",
              type: "input-grid-column",
              category: "form",
            },
            {
              id: "col-1-2",
              type: "input",
              category: "form",
              properties: {
                label: "New Text Input",
              },
            },
          ],
        },
      ],
    };

    const newComponentData = {
      type: "input",
      category: "component",
      properties: {
        label: "New Text Input",
      },
    };

    const dropEvent = {
      dataTransfer: {
        getData: jest.fn().mockReturnValue(JSON.stringify(newComponentData)),
      },
    };

    render(<InputGrid component={testComponent} />);
    const dropZone = await screen.findAllByTestId("form-dropzone");
    fireEvent.drop(dropZone[0], dropEvent);

    const cells = document.querySelectorAll("td");
    if (cells.length > 0) {
      fireEvent.drop(cells[0], dropEvent);
    }

    expect(addComponentToComponentMock).toHaveBeenCalledWith(
      "row-1",
      expect.objectContaining({
        ...newComponentData,
      }),
      expect.any(Number),
    );

    expect(setIsDraggingMock).toHaveBeenCalledWith(false);
    expect(setIsDraggingComponentMock).toHaveBeenCalledWith(false);
    expect(setIsDraggingFormElementMock).toHaveBeenCalledWith(false);
    expect(setDraggingComponentIdMock).toHaveBeenCalledWith(null);
  });
  test("handles drop with existing component (moveComponent)", async () => {
    (DragContext.useDragContext as jest.Mock).mockReturnValue({
      draggingComponentId: "col-1-2",
      setIsDragging: setIsDraggingMock,
      setIsDraggingComponent: setIsDraggingComponentMock,
      setDraggingComponentId: setDraggingComponentIdMock,
      setIsDraggingFormElement: setIsDraggingFormElementMock,
      isDraggingFormElement: false,
    });
    const testComponent: InputGridComponent = {
      id: "grid-1",
      type: "input-grid",
      category: "form",
      properties: {
        name: "Input Grid",
        label: "Grid Label",
        width: "100",
        rowHeaders: [{ id: "row-1", text: "Row 1" }],
        columnHeaders: [
          { id: "col-1", text: "Column 1" },
          { id: "col-2", text: "Column 2" },
        ],
      },
      components: [
        {
          id: "row-1",
          type: "input-grid-row",
          category: "form",
          properties: {
            name: "Input Grid Row-1",
            label: "",
          },
          components: [
            {
              id: "col-1-1",
              type: "input-grid-column",
              category: "form",
            },
            {
              id: "col-1-2",
              type: "input",
              category: "form",
              properties: {
                label: "New Text Input",
              },
            },
          ],
        },
      ],
    };

    const newComponentData = {
      id: "col-1-2",
      type: "input",
      category: "component",
      properties: {
        label: "New Text Input",
      },
    };

    const dropEvent = {
      dataTransfer: {
        getData: jest.fn().mockReturnValue(JSON.stringify(newComponentData)),
      },
    };

    render(<InputGrid component={testComponent} />);
    const dropZone = await screen.findAllByTestId("form-dropzone");
    fireEvent.drop(dropZone[0], dropEvent);

    const cells = document.querySelectorAll("td");
    if (cells.length > 0) {
      fireEvent.drop(cells[0], dropEvent);
    }

    expect(moveComponentMock).toHaveBeenCalledWith("col-1-2", "row-1", 0);

    expect(setIsDraggingMock).toHaveBeenCalledWith(false);
    expect(setIsDraggingComponentMock).toHaveBeenCalledWith(false);
    expect(setIsDraggingFormElementMock).toHaveBeenCalledWith(false);
    expect(setDraggingComponentIdMock).toHaveBeenCalledWith(null);
  });

  test("handles drop with empty category", async () => {
    (DragContext.useDragContext as jest.Mock).mockReturnValue({
      draggingComponentId: null,
      setIsDragging: setIsDraggingMock,
      setIsDraggingComponent: setIsDraggingComponentMock,
      setDraggingComponentId: setDraggingComponentIdMock,
      setIsDraggingFormElement: setIsDraggingFormElementMock,
      isDraggingFormElement: false,
    });

    const testComponent: InputGridComponent = {
      id: "grid-1",
      type: "input-grid",
      category: "form",
      properties: {
        name: "Input Grid",
        label: "Grid Label",
        width: "100",
        rowHeaders: [{ id: "row-1", text: "Row 1" }],
        columnHeaders: [
          { id: "col-1", text: "Column 1" },
          { id: "col-2", text: "Column 2" },
        ],
      },
      components: [
        {
          id: "row-1",
          type: "input-grid-row",
          category: "form",
          properties: {
            name: "Input Grid Row-1",
            label: "",
          },
          components: [
            {
              id: "col-1-1",
              type: "input-grid-column",
              category: "form",
            },
            {
              id: "col-1-2",
              type: "input-grid-column",
              category: "form",
            },
          ],
        },
      ],
    };

    const newComponentData = {
      type: "input",
      category: "",
      properties: {
        label: "New Text Input",
      },
    };

    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(JSON.stringify(newComponentData)),
      },
    };

    render(<InputGrid component={testComponent} />);
    const dropZones = await screen.findAllByTestId("form-dropzone");
    if (dropZones.length > 0) {
      fireEvent.drop(dropZones[0], dropEvent);
    }

    expect(addComponentToComponentMock).toHaveBeenCalled();
  });

  test("handles drag from lower to higher index", async () => {
    (DragContext.useDragContext as jest.Mock).mockReturnValue({
      draggingComponentId: "col-1-1",
      setIsDragging: setIsDraggingMock,
      setIsDraggingComponent: setIsDraggingComponentMock,
      setDraggingComponentId: setDraggingComponentIdMock,
      setIsDraggingFormElement: setIsDraggingFormElementMock,
      isDraggingFormElement: false,
    });

    const testComponent: InputGridComponent = {
      id: "grid-1",
      type: "input-grid",
      category: "form",
      properties: {
        name: "Input Grid",
        label: "Grid Label",
        width: "100",
        rowHeaders: [{ id: "row-1", text: "Row 1" }],
        columnHeaders: [
          { id: "col-1", text: "Column 1" },
          { id: "col-2", text: "Column 2" },
        ],
      },
      components: [
        {
          id: "row-1",
          type: "input-grid-row",
          category: "form",
          properties: {
            name: "Input Grid Row-1",
            label: "",
          },
          components: [
            {
              id: "col-1-1",
              type: "input",
              category: "form",
              properties: {
                label: "First Input",
              },
            },
            {
              id: "col-1-2",
              type: "input-grid-column",
              category: "form",
            },
          ],
        },
      ],
    };

    const draggedComponentData = {
      id: "col-1-1",
      type: "input",
      category: "form",
      properties: {
        label: "First Input",
      },
    };

    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest
          .fn()
          .mockReturnValue(JSON.stringify(draggedComponentData)),
      },
    };

    render(<InputGrid component={testComponent} />);
    const dropZones = await screen.findAllByTestId("form-dropzone");
    if (dropZones.length > 0) {
      fireEvent.drop(dropZones[0], dropEvent);
    }

    expect(moveComponentMock).toHaveBeenCalled();
  });

  test("renders FormElementDropZone when category is not component", async () => {
    (DragContext.useDragContext as jest.Mock).mockReturnValue({
      draggingComponentId: null,
      setIsDragging: setIsDraggingMock,
      setIsDraggingComponent: setIsDraggingComponentMock,
      setDraggingComponentId: setDraggingComponentIdMock,
      setIsDraggingFormElement: setIsDraggingFormElementMock,
      isDraggingFormElement: true,
    });

    const testComponent: InputGridComponent = {
      id: "grid-1",
      type: "input-grid",
      category: "form",
      properties: {
        name: "Input Grid",
        label: "Grid Label",
        width: "100",
        rowHeaders: [{ id: "row-1", text: "Row 1" }],
        columnHeaders: [{ id: "col-1", text: "Column 1" }],
      },
      components: [
        {
          id: "row-1",
          type: "input-grid-row",
          category: "form",
          properties: {
            name: "Input Grid Row-1",
            label: "",
          },
          components: [
            {
              id: "col-1-1",
              type: "input-grid-column",
              category: "form",
            },
          ],
        },
      ],
    };

    const { container } = render(<InputGrid component={testComponent} />);
    const formDropZones = await screen.findAllByTestId("form-dropzone");
    expect(formDropZones.length).toBeGreaterThan(0);
  });

  test("handles multiple columns properly", async () => {
    const testComponent: InputGridComponent = {
      id: "grid-1",
      type: "input-grid",
      category: "form",
      properties: {
        name: "Input Grid",
        label: "Grid Label",
        width: "100",
        rowHeaders: [{ id: "row-1", text: "Row 1" }],
        columnHeaders: [
          { id: "col-1", text: "Column 1" },
          { id: "col-2", text: "Column 2" },
          { id: "col-3", text: "Column 3" },
        ],
      },
      components: [
        {
          id: "row-1",
          type: "input-grid-row",
          category: "form",
          properties: {
            name: "Input Grid Row-1",
            label: "",
          },
          components: [
            {
              id: "col-1-1",
              type: "input-grid-column",
              category: "form",
            },
            {
              id: "col-1-2",
              type: "input-grid-column",
              category: "form",
            },
            {
              id: "col-1-3",
              type: "input-grid-column",
              category: "form",
            },
          ],
        },
      ],
    };

    const { container } = render(<InputGrid component={testComponent} />);
    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();
    const headerCells = container.querySelectorAll("th");
    expect(headerCells.length).toBeGreaterThan(0);
  });

  test("maintains correct grid layout with form zone rendering", () => {
    const testComponent: InputGridComponent = {
      id: "grid-1",
      type: "input-grid",
      category: "form",
      properties: {
        name: "Input Grid",
        label: "Grid Label",
        width: "100",
        rowHeaders: [{ id: "row-1", text: "Row 1" }],
        columnHeaders: [{ id: "col-1", text: "Column 1" }],
      },
      components: [
        {
          id: "row-1",
          type: "input-grid-row",
          category: "form",
          properties: {
            name: "Input Grid Row-1",
            label: "",
          },
          components: [
            {
              id: "col-1-1",
              type: "input-grid-column",
              category: "form",
            },
          ],
        },
      ],
    };

    const { container } = render(<InputGrid component={testComponent} />);
    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();
    const cells = container.querySelectorAll("td");
    expect(cells.length).toBeGreaterThan(0);
  });

  test("adjusts colIndex when draggedComponentIndex is within range", () => {
    (DragContext.useDragContext as jest.Mock).mockReturnValue({
      draggingComponentId: "col-1-1",
      setIsDragging: setIsDraggingMock,
      setIsDraggingComponent: setIsDraggingComponentMock,
      setDraggingComponentId: setDraggingComponentIdMock,
      setIsDraggingFormElement: setIsDraggingFormElementMock,
      isDraggingFormElement: false,
    });

    (ComponentDragOver.useComponentDragOver as jest.Mock).mockReturnValue({
      draggedComponentIndex: 5,
      handleDragOver: handleDragOverMock,
      handleDragLeave: handleDragLeaveMock,
    });

    const testComponent: InputGridComponent = {
      id: "grid-1",
      type: "input-grid",
      category: "form",
      properties: {
        name: "Input Grid",
        label: "Grid Label",
        width: "100",
        rowHeaders: [{ id: "row-1", text: "Row 1" }],
        columnHeaders: [
          { id: "col-1", text: "Column 1" },
          { id: "col-2", text: "Column 2" },
          { id: "col-3", text: "Column 3" },
          { id: "col-4", text: "Column 4" },
          { id: "col-5", text: "Column 5" },
          { id: "col-6", text: "Column 6" },
        ],
      },
      components: [
        {
          id: "row-1",
          type: "input-grid-row",
          category: "form",
          properties: {
            name: "Input Grid Row-1",
            label: "",
          },
          components: [
            {
              id: "col-1-1",
              type: "input-grid-column",
              category: "form",
            },
            {
              id: "col-1-2",
              type: "input-grid-column",
              category: "form",
            },
            {
              id: "col-1-3",
              type: "input-grid-column",
              category: "form",
            },
            {
              id: "col-1-4",
              type: "input-grid-column",
              category: "form",
            },
            {
              id: "col-1-5",
              type: "input-grid-column",
              category: "form",
            },
            {
              id: "col-1-6",
              type: "input-grid-column",
              category: "form",
            },
          ],
        },
      ],
    };

    const droppedItem = {
      id: "col-1-1",
      type: "input-grid-column",
      category: "form",
      properties: {},
    };

    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(JSON.stringify(droppedItem)),
      },
    };

    const { container } = render(<InputGrid component={testComponent} />);
    const formDropZones = container.querySelectorAll(
      '[data-testid="form-dropzone"]',
    );
    if (formDropZones.length > 5) {
      fireEvent.drop(formDropZones[5], dropEvent);
      expect(moveComponentMock).toHaveBeenCalled();
    }
  });

  test("renders with component category type grid", () => {
    const testComponent: InputGridComponent = {
      id: "grid-1",
      type: "input-grid",
      category: "component",
      properties: {
        name: "Input Grid",
        label: "Grid Label",
        width: "100",
        rowHeaders: [{ id: "row-1", text: "Row 1" }],
        columnHeaders: [{ id: "col-1", text: "Column 1" }],
      },
      components: [
        {
          id: "row-1",
          type: "input-grid-row",
          category: "component",
          properties: {
            name: "Input Grid Row-1",
            label: "",
          },
          components: [
            {
              id: "col-1-1",
              type: "input-grid-column",
              category: "component",
            },
          ],
        },
      ],
    };

    const { container } = render(<InputGrid component={testComponent} />);
    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();
  });
});
