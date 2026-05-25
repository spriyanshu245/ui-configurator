import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FormElementDropZone from "./FormElementDropZone";
import { useControlPanel } from "@/app/context/ControlPanelContext";

jest.mock("@/app/context/ControlPanelContext", () => ({
  useControlPanel: jest.fn(),
}));

describe("FormElementDropZone", () => {
  const mockHandleDrop = jest.fn();
  const mockUseControlPanel = useControlPanel as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseControlPanel.mockReturnValue({ showDropZones: true });
  });

  const renderDropZone = (props = {}) => {
    return render(
      <FormElementDropZone
        index={0}
        handleDrop={mockHandleDrop}
        isDraggingFormElement={false}
        dragOverIndex={-1}
        handleDragOver={jest.fn()}
        handleDragLeave={jest.fn()}
        {...props}
      />
    );
  };

  test("renders with default props", () => {
    renderDropZone();
    const dropZoneElement = screen.getByTestId("form-dropzone");
    expect(dropZoneElement).toHaveClass("dropZone");
    expect(dropZoneElement).not.toHaveClass("verticalDropZone");
    expect(dropZoneElement.textContent).toBe("Drop a form element here");
    expect(dropZoneElement).toHaveStyle("height: auto");
  });

  test("applies verticalDropZone class if isVertical = true", () => {
    renderDropZone({ isVertical: true });
    const dropZoneElement = screen.getByTestId("form-dropzone");
    expect(dropZoneElement).toHaveClass("verticalDropZone");
  });

  test("when isDraggingFormElement is true, text changes to 'Drop it here'", () => {
    renderDropZone({ isDraggingFormElement: true });
    const dropZoneElement = screen.getByTestId("form-dropzone");
    expect(dropZoneElement.textContent).toBe("Drop it here");
  });

  test("uses showDropZones to hide drop zones if false and isDraggingFormElement is false", () => {
    mockUseControlPanel.mockReturnValue({ showDropZones: false });
    renderDropZone();
    const dropZoneElement = screen.getByTestId("form-dropzone");
    expect(dropZoneElement).toHaveClass("hideDropZones");
  });

  test("custom height applies inline style", () => {
    renderDropZone({ height: "50px" });
    const dropZoneElement = screen.getByTestId("form-dropzone");
    expect(dropZoneElement).toHaveStyle("height: 50px");
  });

  test("Should call handleDrop with the correct index when an item is dropped", () => {
    renderDropZone();
    const dropZoneElement = screen.getByTestId("form-dropzone");
    fireEvent.drop(dropZoneElement);
    expect(mockHandleDrop).toHaveBeenCalledWith(expect.any(Object), 0);
  });

  test("Should reset isDragOver state after an item is dropped", () => {
    renderDropZone();
    const dropZoneElement = screen.getByTestId("form-dropzone");
    fireEvent.drop(dropZoneElement);
    expect(dropZoneElement).not.toHaveClass("dragOver");
  });

  test("Should call handleDragOver when dragging over the drop zone", () => {
    renderDropZone({ isDraggingFormElement: true });
    const dropZoneElement = screen.getByTestId("form-dropzone");

    fireEvent.dragOver(dropZoneElement);

    expect(dropZoneElement.classList.contains("dragOver")).toBe(true);
  });

  test("Should call handleDragLeave when dragging leaves the drop zone", () => {
    renderDropZone();
    const dropZoneElement = screen.getByTestId("form-dropzone");

    fireEvent.dragOver(dropZoneElement);
    fireEvent.dragLeave(dropZoneElement);

    expect(dropZoneElement).not.toHaveClass("dragOver");
  });

  test("Should not apply dragOver class if isDraggingFormElement is false", async () => {
    renderDropZone({ isDraggingFormElement: false });
    const dropZoneElement = screen.getByTestId("form-dropzone");
    fireEvent.dragOver(dropZoneElement);
    await waitFor(() => {
      expect(dropZoneElement).not.toHaveClass("dragOver");
    });
  });

  test("Should maintain hideDropZones class when showDropZones is false, even after drag events", async () => {
    mockUseControlPanel.mockReturnValue({ showDropZones: false });
    renderDropZone();
    const dropZoneElement = screen.getByTestId("form-dropzone");
    fireEvent.dragOver(dropZoneElement);
    fireEvent.dragLeave(dropZoneElement);
    await waitFor(() => {
      expect(dropZoneElement).toHaveClass("hideDropZones");
    });
  });
});
