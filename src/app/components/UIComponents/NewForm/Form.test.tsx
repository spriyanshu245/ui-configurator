import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Form from "./Form";
import "@testing-library/jest-dom";

// ----- Mocks -----
// Mock ComponentRenderer so that each child renders predictably.
jest.mock("../../ComponentRenderer/ComponentRenderer", () => (props: any) => (
  <div data-testid={`component-${props.component.id}`}>
    Component {props.component.id}
  </div>
));

// Mock FormElementDropZone to render a simple div that accepts drop events.
jest.mock(
  "../../FormElementDropZone/FormElementDropZone",
  () => (props: any) =>
    (
      <div data-testid={`dropzone-${props.index}`} onDrop={props.handleDrop}>
        DropZone {props.index}
      </div>
    )
);

// Mock context hooks.
jest.mock("@/app/context/UserTaskContext");
jest.mock("@/app/context/DragContext");
jest.mock("@/app/hooks/useComponentDragOver");
jest.mock("@/app/context/PropertiesContext");
jest.mock("@/app/context/HeaderContextV2");

// Import the mocked hooks and utils.
import { useUserTask } from "@/app/context/UserTaskContext";
import { useDragContext } from "@/app/context/DragContext";
import { useComponentDragOver } from "@/app/hooks/useComponentDragOver";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { generateRandomId, resetGhostImage } from "@/app/utils/utils";
import { FormComponent } from "@/app/types/types";

// Create jest mocks for functions returned by contexts.
const addComponentToComponentMock = jest.fn();
const moveComponentMock = jest.fn();
const removeComponentMock = jest.fn();
const setActiveComponentMock = jest.fn();
const setUserNotificationMock = jest.fn();
const setIsDraggingMock = jest.fn();
const setIsDraggingComponentMock = jest.fn();
const setDraggingComponentIdMock = jest.fn();
const setIsDraggingFormElementMock = jest.fn();
const handleDragOverMock = jest.fn();
const handleDragLeaveMock = jest.fn();

// Set up mocks for utils.
jest.mock("@/app/utils/utils", () => ({
  generateRandomId: jest.fn(),
  resetGhostImage: jest.fn(),
}));

// Provide default implementations in beforeEach.
beforeEach(() => {
  jest.clearAllMocks();

  (useUserTask as jest.Mock).mockReturnValue({
    addComponentToComponent: addComponentToComponentMock,
    moveComponent: moveComponentMock,
    userTask: {},
    removeComponent: removeComponentMock,
  });
  (useDragContext as jest.Mock).mockReturnValue({
    draggingComponentId: null,
    setIsDragging: setIsDraggingMock,
    setIsDraggingComponent: setIsDraggingComponentMock,
    setDraggingComponentId: setDraggingComponentIdMock,
    setIsDraggingFormElement: setIsDraggingFormElementMock,
    isDraggingFormElement: false,
  });
  (useComponentDragOver as jest.Mock).mockReturnValue({
    handleDragOver: handleDragOverMock,
    handleDragLeave: handleDragLeaveMock,
  });
  (usePropertyPane as jest.Mock).mockReturnValue({
    setActiveComponent: setActiveComponentMock,
  });
  (useHeaderV2 as jest.Mock).mockReturnValue({
    setUserNotification: setUserNotificationMock,
  });
  (generateRandomId as jest.Mock).mockReturnValue("randomId");
});

// Define a base FormComponent for testing.
const baseComponent: FormComponent = {
  id: "form1",
  type: "form",
  category: "form",
  properties: {
    name: "form-1",
    action: "/submit",
    method: "POST",
  },
  // For simplicity, include one child form element.
  components: [
    {
      id: "child1",
      type: "input",
      category: "form",
      properties: { label: "Child 1", inputType: "text" },
    },
  ],
};

describe("Form Component", () => {
  test("renders form element with correct action, method, and drop zones", () => {
    render(<Form component={baseComponent} />);
    const formEl = screen.getByTestId("form1");
    expect(formEl).toBeInTheDocument();
    expect(formEl).toHaveAttribute("action", "/submit");
    expect(formEl).toHaveAttribute("method", "POST");

    // With no dragging component, drop zones should be rendered.
    // One drop zone before any children (index 0) and one after the single child (index 1)
    expect(screen.getByTestId("dropzone-0")).toBeInTheDocument();
    expect(screen.getByTestId("dropzone-1")).toBeInTheDocument();

    // Also, the child component should be rendered.
    expect(screen.getByTestId("component-child1")).toBeInTheDocument();
  });

  test("handleDrop calls moveComponent when dropped item has an id (existing form element)", () => {
    render(<Form component={baseComponent} />);
    // Simulate a drop event on drop zone 0.
    const dropZone = screen.getByTestId("dropzone-0");
    // Prepare a dropped item with an id (already exists in the form).
    const droppedItem = { id: "child1", category: "form", type: "input" };
    const dataTransfer = {
      getData: jest.fn(() => JSON.stringify(droppedItem)),
    };

    fireEvent.drop(dropZone, { dataTransfer });

    // Since the dropped item id exists in the form, moveComponent should be called.
    expect(moveComponentMock).toHaveBeenCalledWith("child1", "form1", 0);
    expect(setActiveComponentMock).toHaveBeenCalledWith("child1");

    // Verify that cleanup functions are called.
    expect(setIsDraggingComponentMock).toHaveBeenCalledWith(false);
    expect(setIsDraggingFormElementMock).toHaveBeenCalledWith(false);
    expect(setIsDraggingMock).toHaveBeenCalledWith(false);
    expect(setDraggingComponentIdMock).toHaveBeenCalledWith(null);
    expect(resetGhostImage).toHaveBeenCalled();
  });

  test("handleDrop calls addComponentToComponent when dropped item has no id", () => {
    render(<Form component={baseComponent} />);
    const dropZone = screen.getByTestId("dropzone-0");
    // Simulate a dropped item without an id.
    const droppedItem = { category: "form", type: "input" };
    const dataTransfer = {
      getData: jest.fn(() => JSON.stringify(droppedItem)),
    };

    fireEvent.drop(dropZone, { dataTransfer });

    // New component should be assigned an id ("randomId") from the generateRandomId mock.
    expect(addComponentToComponentMock).toHaveBeenCalledWith(
      "form1",
      expect.objectContaining({
        id: "randomId",
        category: "form",
        type: "input",
      }),
      0
    );
    expect(setActiveComponentMock).toHaveBeenCalledWith("randomId");

    expect(setIsDraggingComponentMock).toHaveBeenCalledWith(false);
    expect(setIsDraggingFormElementMock).toHaveBeenCalledWith(false);
    expect(setIsDraggingMock).toHaveBeenCalledWith(false);
    expect(setDraggingComponentIdMock).toHaveBeenCalledWith(null);
    expect(resetGhostImage).toHaveBeenCalled();
  });

  test("handleDrop warns when dropped item is not a form element", () => {
    render(<Form component={baseComponent} />);
    const dropZone = screen.getByTestId("dropzone-0");
    // Simulate a dropped item with a category other than "form".
    const droppedItem = { category: "other", type: "input" };
    const dataTransfer = {
      getData: jest.fn(() => JSON.stringify(droppedItem)),
    };

    // Spy on console.warn.
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    fireEvent.drop(dropZone, { dataTransfer });

    expect(warnSpy).toHaveBeenCalledWith(
      "Only form elements can be dropped into a form."
    );
    // Neither moveComponent nor addComponentToComponent should be called.
    expect(moveComponentMock).not.toHaveBeenCalled();
    expect(addComponentToComponentMock).not.toHaveBeenCalled();

    // Cleanup functions should be called.
    expect(setIsDraggingComponentMock).toHaveBeenCalledWith(false);
    expect(setIsDraggingFormElementMock).toHaveBeenCalledWith(false);
    expect(setIsDraggingMock).toHaveBeenCalledWith(false);
    expect(setDraggingComponentIdMock).toHaveBeenCalledWith(null);
    expect(resetGhostImage).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
