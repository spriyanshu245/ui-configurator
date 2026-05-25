import React from "react";
import { render, screen, fireEvent, createEvent } from "@testing-library/react";
import BuilderPane from "./BuilderPane";
import { UIComponent } from "@/app/types/types";

const mockAddComponentAtIndex = jest.fn();
const mockMoveComponentToIndex = jest.fn();
const mockSetActiveComponent = jest.fn();
const mockSetIsDragging = jest.fn();
const mockSetIsDraggingComponent = jest.fn();
const mockSetIsDraggingFormElement = jest.fn();
const mockSetDraggingComponentId = jest.fn();
const mockHandleDropHook = jest.fn();
const mockResetGhostImage = jest.fn();

jest.mock("./BuilderPane.module.scss", () => ({
  builderPaneContainer: "builderPaneContainer",
  emptyPane: "emptyPane",
  dragOver: "dragOver",
}));
jest.mock("@/app/styles/shared.module.scss", () => ({
  emptyPlaceholder: "emptyPlaceholder",
  svgIcon: "svgIcon",
  label: "label",
}));

jest.mock("@/app/utils/utils", () => ({
  generateRandomId: jest.fn(() => "new-random-id"),
  addCategoryRecursive: jest.fn((item) => ({ ...item, category: "resolved" })),
  resetGhostImage: (...args: any[]) => mockResetGhostImage(...args),
}));

jest.mock("@/app/utils/userTask/dropZoneUtils", () => ({
  shouldRenderDropZoneAtIndex: jest.fn(() => true),
}));

jest.mock(
  "../../ComponentRenderer/ComponentRenderer",
  () => (props: { component: UIComponent }) => (
    <div data-testid={`component-${props.component.id}`}>
      Renderer: {props.component.label}
    </div>
  ),
);

jest.mock("@/app/components/ComponentDropZone/ComponentDropZone", () => {
  return ({ handleDrop, index }: { handleDrop: Function; index: number }) => (
    <div data-testid={`dropzone-${index}`} onDrop={(e) => handleDrop(e, index)}>
      DropZone {index}
    </div>
  );
});

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("@/app/context/ControlPanelContext", () => ({
  useControlPanel: jest.fn(),
}));

jest.mock("@/app/context/DragContext", () => ({
  useDragContext: () => ({
    isDragging: false,
    isDraggingComponent: false,
    draggingComponentId: null,
    setIsDragging: mockSetIsDragging,
    setIsDraggingComponent: mockSetIsDraggingComponent,
    setIsDraggingFormElement: mockSetIsDraggingFormElement,
    setDraggingComponentId: mockSetDraggingComponentId,
  }),
}));

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: () => ({
    setActiveComponent: mockSetActiveComponent,
  }),
}));

jest.mock("@/app/hooks/useAutoScroll", () => ({
  useAutoScroll: jest.fn(),
}));

jest.mock("@/app/hooks/useComponentDragOver", () => ({
  useComponentDragOver: () => ({
    dragOverIndex: null,
    handleDragOver: jest.fn(),
    handleDragLeave: jest.fn(),
    handleDrop: mockHandleDropHook,
  }),
}));

describe("BuilderPane Component", () => {
  const mockUseUserTask = require("@/app/context/UserTaskContext").useUserTask;
  const mockUseControlPanel =
    require("@/app/context/ControlPanelContext").useControlPanel;

  const setUserTaskMock = (components: any[], isPopup = false) => {
    mockUseUserTask.mockReturnValue({
      userTask: {
        components,
        properties: { showAsPopup: isPopup },
      },
      addComponentAtIndex: mockAddComponentAtIndex,
      moveComponentToIndex: mockMoveComponentToIndex,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseControlPanel.mockReturnValue({
      showDropZones: false,
    });

    setUserTaskMock([]);
  });

  describe("Rendering", () => {
    test("renders empty state placeholder when no components exist", () => {
      render(<BuilderPane />);
      expect(
        screen.getByText("Drop your first component here"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("dropzone-0")).toBeInTheDocument();
    });

    test("renders list of components and dropzones", () => {
      const mockComponents = [
        { id: "c1", label: "Button", type: "button" },
        { id: "c2", label: "Input", type: "input" },
      ];
      setUserTaskMock(mockComponents);

      render(<BuilderPane />);

      expect(screen.getByTestId("component-c1")).toBeInTheDocument();
      expect(screen.getByTestId("component-c2")).toBeInTheDocument();

      expect(
        screen.queryByText("Drop your first component here"),
      ).not.toBeInTheDocument();

      expect(screen.getByTestId("dropzone-0")).toBeInTheDocument();
      expect(screen.getByTestId("dropzone-1")).toBeInTheDocument();
      expect(screen.getByTestId("dropzone-2")).toBeInTheDocument();
    });
  });

  describe("Drop Logic", () => {
    test("handles dropping a NEW component successfully", () => {
      const droppedItem = {
        type: "button",
        category: "elements",
        isComponent: true,
        label: "Button",
      };
      mockHandleDropHook.mockReturnValue(droppedItem);

      render(<BuilderPane />);
      const dropZone = screen.getByTestId("dropzone-0");

      fireEvent.drop(dropZone);

      expect(mockAddComponentAtIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "button",
          id: "new-random-id",
        }),
        "",
        0,
      );
      expect(mockSetActiveComponent).toHaveBeenCalledWith("new-random-id");
      expect(mockResetGhostImage).toHaveBeenCalled();
      expect(mockSetIsDragging).toHaveBeenCalledWith(false);
    });

    test("handles dropping a component with EMPTY CATEGORY (triggers recursive add)", () => {
      const droppedItem = {
        type: "button",
        category: "",
        isComponent: true,
        label: "Button",
      };
      mockHandleDropHook.mockReturnValue(droppedItem);

      render(<BuilderPane />);
      const dropZone = screen.getByTestId("dropzone-0");

      fireEvent.drop(dropZone);

      const { addCategoryRecursive } = require("@/app/utils/utils");
      expect(addCategoryRecursive).toHaveBeenCalledWith(
        droppedItem,
        "component",
      );

      expect(mockAddComponentAtIndex).toHaveBeenCalled();
    });

    test("handles MOVING an existing component (no Ctrl key)", () => {
      const existingId = "existing-123";
      const droppedItem = {
        id: existingId,
        type: "button",
        category: "elements",
        isComponent: true,
      };
      mockHandleDropHook.mockReturnValue(droppedItem);

      render(<BuilderPane />);
      const dropZone = screen.getByTestId("dropzone-0");

      fireEvent.drop(dropZone);

      expect(mockMoveComponentToIndex).toHaveBeenCalledWith(existingId, "", 0);
      expect(mockAddComponentAtIndex).not.toHaveBeenCalled();
      expect(mockSetActiveComponent).toHaveBeenCalledWith(existingId);
    });

    test("handles CLONING an existing component (Ctrl key pressed)", () => {
      const existingId = "existing-123";
      const droppedItem = {
        id: existingId,
        type: "button",
        category: "elements",
        isComponent: true,
      };
      mockHandleDropHook.mockReturnValue(droppedItem);

      render(<BuilderPane />);
      const dropZone = screen.getByTestId("dropzone-0");

      const dropEvent = createEvent.drop(dropZone);
      Object.defineProperty(dropEvent, "ctrlKey", { value: true });

      fireEvent(dropZone, dropEvent);

      expect(mockMoveComponentToIndex).not.toHaveBeenCalled();

      expect(mockAddComponentAtIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "button",
          id: "new-random-id",
        }),
        "",
        0,
      );
    });

    test("prevents dropping Form Elements directly into Builder Pane", () => {
      const droppedItem = {
        type: "input",
        isFormElement: true,
        isComponent: false,
      };
      mockHandleDropHook.mockReturnValue(droppedItem);
      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      render(<BuilderPane />);
      const dropZone = screen.getByTestId("dropzone-0");

      fireEvent.drop(dropZone);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Dropping form elements into the builder pane is not allowed.",
      );
      expect(mockAddComponentAtIndex).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    describe("External Integration Logic", () => {
      const externalItem = {
        type: "external-integration",
        category: "integration",
        isComponent: true,
      };

      test("BLOCKS external-integration if NOT a popup page", () => {
        setUserTaskMock([], false);
        mockHandleDropHook.mockReturnValue(externalItem);
        const consoleSpy = jest
          .spyOn(console, "warn")
          .mockImplementation(() => {});

        render(<BuilderPane />);
        const dropZone = screen.getByTestId("dropzone-0");

        fireEvent.drop(dropZone);

        expect(consoleSpy).toHaveBeenCalledWith(
          "External Integration component can only be added to popup pages.",
        );
        expect(mockAddComponentAtIndex).not.toHaveBeenCalled();
        expect(mockResetGhostImage).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      test("ALLOWS external-integration if IT IS a popup page", () => {
        setUserTaskMock([], true);
        mockHandleDropHook.mockReturnValue(externalItem);

        render(<BuilderPane />);
        const dropZone = screen.getByTestId("dropzone-0");

        fireEvent.drop(dropZone);

        expect(mockAddComponentAtIndex).toHaveBeenCalled();
      });
    });
  });
});
