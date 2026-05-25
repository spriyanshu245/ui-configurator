// DragContext.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DragProvider, useDragContext } from "./DragContext";

// A test consumer component that uses the drag context.
const TestConsumer: React.FC = () => {
  const {
    isDragging,
    setIsDragging,
    isDraggingComponent,
    setIsDraggingComponent,
    isDraggingFormElement,
    setIsDraggingFormElement,
    draggingComponentId,
    setDraggingComponentId,
    isFormRowValidation,
    setIsFormRowValidation,
  } = useDragContext();

  return (
    <div>
      <div data-testid="isDragging">{isDragging.toString()}</div>
      <button
        data-testid="toggle-dragging"
        onClick={() => setIsDragging(!isDragging)}
      >
        Toggle Dragging
      </button>

      <div data-testid="isDraggingComponent">
        {isDraggingComponent.toString()}
      </div>
      <button
        data-testid="toggle-dragging-component"
        onClick={() => setIsDraggingComponent(!isDraggingComponent)}
      >
        Toggle Dragging Component
      </button>

      <div data-testid="isDraggingFormElement">
        {isDraggingFormElement.toString()}
      </div>
      <button
        data-testid="toggle-dragging-form-element"
        onClick={() => setIsDraggingFormElement(!isDraggingFormElement)}
      >
        Toggle Dragging Form Element
      </button>

      <div data-testid="draggingComponentId">
        {draggingComponentId || "null"}
      </div>
      <button
        data-testid="set-dragging-component-id"
        onClick={() => setDraggingComponentId("comp1")}
      >
        Set Dragging Component ID
      </button>

      <div data-testid="isFormRowValidation">
        {isFormRowValidation.toString()}
      </div>
      <button
        data-testid="toggle-form-row-validation"
        onClick={() => setIsFormRowValidation(!isFormRowValidation)}
      >
        Toggle Form Row Validation
      </button>
    </div>
  );
};

describe("DragContext", () => {
  it("provides default values and updates correctly", () => {
    render(
      <DragProvider>
        <TestConsumer />
      </DragProvider>
    );

    // Check default values.
    expect(screen.getByTestId("isDragging")).toHaveTextContent("false");
    expect(screen.getByTestId("isDraggingComponent")).toHaveTextContent(
      "false"
    );
    expect(screen.getByTestId("isDraggingFormElement")).toHaveTextContent(
      "false"
    );
    expect(screen.getByTestId("draggingComponentId")).toHaveTextContent("null");
    expect(screen.getByTestId("isFormRowValidation")).toHaveTextContent(
      "false"
    );

    // Toggle isDragging.
    fireEvent.click(screen.getByTestId("toggle-dragging"));
    expect(screen.getByTestId("isDragging")).toHaveTextContent("true");


    // Toggle isDraggingComponent.
    fireEvent.click(screen.getByTestId("toggle-dragging-component"));
    expect(screen.getByTestId("isDraggingComponent")).toHaveTextContent("true");

    // Toggle isDraggingFormElement.
    fireEvent.click(screen.getByTestId("toggle-dragging-form-element"));
    expect(screen.getByTestId("isDraggingFormElement")).toHaveTextContent(
      "true"
    );

    // Set draggingComponentId.
    fireEvent.click(screen.getByTestId("set-dragging-component-id"));
    expect(screen.getByTestId("draggingComponentId")).toHaveTextContent(
      "comp1"
    );

    // Toggle isFormRowValidation.
    fireEvent.click(screen.getByTestId("toggle-form-row-validation"));
    expect(screen.getByTestId("isFormRowValidation")).toHaveTextContent("true");

    

  });

  it("throws an error when used outside DragProvider", () => {
    const TestConsumerWithoutProvider: React.FC = () => {
      useDragContext();
      return <div>Test</div>;
    };

    expect(() => render(<TestConsumerWithoutProvider />)).toThrow(
      "useDragContext must be used within a DragProvider"
    );
  });
});
