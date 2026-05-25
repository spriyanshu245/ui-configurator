import React from "react";

import { render, screen, fireEvent } from "@testing-library/react";

import ComponentDropZone from "./ComponentDropZone";

import { useDragContext } from "../../../app/context/DragContext";
import { useControlPanel } from "../../../app/context/ControlPanelContext";

jest.mock("@/app/context/DragContext", () => ({
  useDragContext: jest.fn(),
}));

jest.mock("@/app/context/ControlPanelContext", () => ({
  ControlPanelProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useControlPanel: jest.fn(),
}));

describe("ComponentDropZone", () => {
  const mockHandleDragOver = jest.fn();
  const mockHandleDragLeave = jest.fn();
  const mockHandleDrop = jest.fn();

  const mockDragContext = {
    isDraggingComponent: false,
    ghostElementProperties: null,
  };

  const mockControlPanelContext = {
    showDropZones: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDragContext as jest.Mock).mockReturnValue(mockDragContext);
    (useControlPanel as jest.Mock).mockReturnValue(mockControlPanelContext);
  });

  test("renders without crashing", () => {
    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    expect(screen.getByText("Drop a page component here")).toBeInTheDocument();
  });

  test("displays 'Drop it here' when dragging", () => {
    (useDragContext as jest.Mock).mockReturnValue({
      isDraggingComponent: true,
      ghostElementProperties: null,
    });

    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    expect(screen.getByText("Drop it here")).toBeInTheDocument();
  });

  test("applies the correct styles when dragging over", () => {
    (useDragContext as jest.Mock).mockReturnValue({
      isDraggingComponent: true,
      ghostElementProperties: null,
    });

    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={0}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText("Drop it here").parentElement;

    expect(dropZone).toHaveClass("dragOver");
    expect(dropZone).toHaveClass("canDrop");
  });

  test("calls handleDragOver on drag over", () => {
    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText(
      "Drop a page component here"
    ).parentElement;

    fireEvent.dragOver(dropZone!, { preventDefault: jest.fn() });

    expect(mockHandleDragOver).toHaveBeenCalledWith(expect.any(Object), 0);
  });

  test("calls handleDragLeave on drag leave", () => {
    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText(
      "Drop a page component here"
    ).parentElement;

    fireEvent.dragLeave(dropZone!);

    expect(mockHandleDragLeave).toHaveBeenCalledTimes(1);
  });

  test("calls handleDrop on drop", () => {
    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText(
      "Drop a page component here"
    ).parentElement;

    fireEvent.drop(dropZone!);

    expect(mockHandleDrop).toHaveBeenCalledWith(expect.any(Object), 0);
  });

  test("renders ghost preview when dragging over with ghostElementProperties", () => {
    (useDragContext as jest.Mock).mockReturnValue({
      isDraggingComponent: true,
      ghostElementProperties: { icon: "<svg>Icon</svg>" },
    });

    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={0}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    expect(screen.getByText("Drop it here")).toBeInTheDocument();

    // Uncomment the following line when ghost preview is active
    // expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
  });

  test("applies hideDropZones class when showDropZones is false and not dragging", () => {
    (useDragContext as jest.Mock).mockReturnValue({
      isDraggingComponent: false,
      ghostElementProperties: null,
    });
    (useControlPanel as jest.Mock).mockReturnValue({
      showDropZones: false,
    });

    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText("Drop a page component here").parentElement;
    expect(dropZone).toHaveClass("hideDropZones");
  });

  test("does not apply hideDropZones class when showDropZones is false but is dragging", () => {
    (useDragContext as jest.Mock).mockReturnValue({
      isDraggingComponent: true,
      ghostElementProperties: null,
    });
    (useControlPanel as jest.Mock).mockReturnValue({
      showDropZones: false,
    });

    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText("Drop it here").parentElement;
    expect(dropZone).not.toHaveClass("hideDropZones");
  });

  test("does not apply hideDropZones class when showDropZones is true", () => {
    (useDragContext as jest.Mock).mockReturnValue({
      isDraggingComponent: false,
      ghostElementProperties: null,
    });
    (useControlPanel as jest.Mock).mockReturnValue({
      showDropZones: true,
    });

    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText("Drop a page component here").parentElement;
    expect(dropZone).not.toHaveClass("hideDropZones");
  });

  test("applies emptySection class when emptySection prop is true", () => {
    render(
      <ComponentDropZone
        index={0}
        emptySection={true}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText("Drop a page component here").parentElement;
    expect(dropZone).toHaveClass("emptySection");
  });

  test("does not apply emptySection class when emptySection prop is false", () => {
    render(
      <ComponentDropZone
        index={0}
        emptySection={false}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText("Drop a page component here").parentElement;
    expect(dropZone).not.toHaveClass("emptySection");
  });

  test("does not apply emptySection class when emptySection prop is undefined", () => {
    render(
      <ComponentDropZone
        index={0}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText("Drop a page component here").parentElement;
    expect(dropZone).not.toHaveClass("emptySection");
  });

  test("applies both hideDropZones and emptySection classes when conditions are met", () => {
    (useDragContext as jest.Mock).mockReturnValue({
      isDraggingComponent: false,
      ghostElementProperties: null,
    });
    (useControlPanel as jest.Mock).mockReturnValue({
      showDropZones: false,
    });

    render(
      <ComponentDropZone
        index={0}
        emptySection={true}
        dragOverIndex={-1}
        handleDragOver={mockHandleDragOver}
        handleDragLeave={mockHandleDragLeave}
        handleDrop={mockHandleDrop}
      />
    );

    const dropZone = screen.getByText("Drop a page component here").parentElement;
    expect(dropZone).toHaveClass("hideDropZones");
    expect(dropZone).toHaveClass("emptySection");
  });
});