import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ExpandableColumn, { AddExpandableColumn } from "./ExpandableColumn";

jest.mock("../SVGIcons/DragHandle", () =>
  jest.fn(() => <svg data-testid="drag-handle-icon" />),
);
jest.mock("../SVGIcons/Delete", () =>
  jest.fn(() => <svg data-testid="delete-icon" />),
);

describe("ExpandableColumn", () => {
  const mockSetDraggedItemId = jest.fn();
  const mockSetProperty = jest.fn();

  const defaultProps = {
    colData: [{ label: "Column 1" }, { label: "Column 2" }],
    column: { label: "Column 1" },
    draggedItemId: null,
    setDraggedItemId: mockSetDraggedItemId,
    setProperty: mockSetProperty,
    property: "someProperty",
    id: 0,
    children: <div data-testid="child-content">Child Content</div>,
    isDraggable: true,
    minColCount: 1,
    isTab: false,
    label: "Column 1",
  };

  const tabProps = {
    colData: [
      { properties: { title: "Tab 1" } },
      { properties: { title: "Tab 2" } },
    ],
    column: { properties: { title: "Tab 1" } },
    draggedItemId: null,
    setDraggedItemId: mockSetDraggedItemId,
    setProperty: mockSetProperty,
    property: "someProperty",
    id: 0,
    children: <div data-testid="tab-content">Tab Content</div>,
    isDraggable: true,
    minColCount: 1,
    isTab: true,
    label: "Tab 1",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders tab title instead of column label", () => {
    render(<ExpandableColumn {...tabProps} />);
    const labelButton = screen.getByTestId("label");

    expect(labelButton).toHaveTextContent("Tab 1");
  });

  test("drops and reorders tabs using 'components' property", () => {
    const newProps = { ...tabProps, draggedItemId: 1 };
    render(<ExpandableColumn {...newProps} />);
    const tabDiv = screen.getByTestId("column-1");

    fireEvent.drop(tabDiv);

    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      [{ properties: { title: "Tab 2" } }, { properties: { title: "Tab 1" } }],
      true,
    );
    expect(mockSetDraggedItemId).toHaveBeenCalledWith(null);
  });

  test("deletes tab using the 'components' property with isTab=true", () => {
    render(<ExpandableColumn {...tabProps} />);
    const deleteBtn = screen.getByTestId("delete");

    fireEvent.click(deleteBtn);

    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      [{ properties: { title: "Tab 2" } }],
      true,
    );
  });

  test("uses 'components' property when handling drag/drop via keyboard", () => {
    render(<ExpandableColumn {...tabProps} draggedItemId={1} />);
    const tabDiv = screen.getByTestId("column-1");

    fireEvent.keyDown(tabDiv, { key: "Enter" });

    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      [{ properties: { title: "Tab 2" } }, { properties: { title: "Tab 1" } }],
      true,
    );
  });

  test("uses 'components' property when handling touch events", () => {
    render(<ExpandableColumn {...tabProps} draggedItemId={1} />);
    const tabDiv = screen.getByTestId("column-1");

    fireEvent.touchEnd(tabDiv);

    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      [{ properties: { title: "Tab 2" } }, { properties: { title: "Tab 1" } }],
      true,
    );
  });

  test("handles Enter key to drop the dragged item", () => {
    render(<ExpandableColumn {...defaultProps} draggedItemId={1} />);
    const columnDiv = screen.getByTestId("column-1");

    fireEvent.keyDown(columnDiv, { key: "Enter" });

    expect(mockSetProperty).toHaveBeenCalledWith("someProperty", [
      { label: "Column 2" },
      { label: "Column 1" },
    ]);
    expect(mockSetDraggedItemId).toHaveBeenCalledWith(null);
  });

  test("handles Space key to drop the dragged item", () => {
    render(<ExpandableColumn {...defaultProps} draggedItemId={1} />);
    const columnDiv = screen.getByTestId("column-1");

    fireEvent.keyDown(columnDiv, { key: " " });

    expect(mockSetProperty).toHaveBeenCalledWith("someProperty", [
      { label: "Column 2" },
      { label: "Column 1" },
    ]);
    expect(mockSetDraggedItemId).toHaveBeenCalledWith(null);
  });

  test("ignores keydown event if isOpen is true", () => {
    render(<ExpandableColumn {...defaultProps} draggedItemId={1} />);
    const columnDiv = screen.getByTestId("column-1");
    const labelButton = screen.getByTestId("label");

    // First click to open the column
    fireEvent.click(labelButton);

    // Now try the keydown - it should be ignored
    fireEvent.keyDown(columnDiv, { key: "Enter" });

    expect(mockSetProperty).not.toHaveBeenCalled();
    expect(mockSetDraggedItemId).not.toHaveBeenCalled();
  });

  test("handles touch end event for drop", () => {
    render(<ExpandableColumn {...defaultProps} draggedItemId={1} />);
    const columnDiv = screen.getByTestId("column-1");

    fireEvent.touchEnd(columnDiv);

    expect(mockSetProperty).toHaveBeenCalledWith("someProperty", [
      { label: "Column 2" },
      { label: "Column 1" },
    ]);
    expect(mockSetDraggedItemId).toHaveBeenCalledWith(null);
  });

  test("renders column label and toggles expand/collapse on label click", () => {
    render(<ExpandableColumn {...defaultProps} />);
    const labelButton = screen.getByTestId("label");

    expect(labelButton).toBeInTheDocument();
    expect(screen.queryByTestId("child-content")).toBeNull();

    fireEvent.click(labelButton);
    expect(screen.getByTestId("child-content")).toBeInTheDocument();

    fireEvent.click(labelButton);
    expect(screen.queryByTestId("child-content")).toBeNull();
  });

  test("does not render drag handle when isDraggable is false", () => {
    render(<ExpandableColumn {...defaultProps} isDraggable={false} />);
    expect(screen.queryByTestId("drag-handle-icon")).toBeNull();
  });

  test("drags the column handle to start drag", () => {
    render(<ExpandableColumn {...defaultProps} />);
    const handle = screen.getByTestId("drag-handle-icon").closest("button");

    if (handle) {
      fireEvent.dragStart(handle);
    }
    expect(mockSetDraggedItemId).toHaveBeenCalledWith(0);
  });

  test("drops and reorders columns if draggedItemId is set", () => {
    const newProps = { ...defaultProps, draggedItemId: 1 };
    render(<ExpandableColumn {...newProps} />);
    const columnDiv = screen.getByTestId("column-1");

    fireEvent.drop(columnDiv);

    expect(mockSetProperty).toHaveBeenCalledWith("someProperty", [
      { label: "Column 2" },
      { label: "Column 1" },
    ]);
    expect(mockSetDraggedItemId).toHaveBeenCalledWith(null);
  });

  test("does not allow drop if isDraggable is false", () => {
    render(
      <ExpandableColumn
        {...defaultProps}
        isDraggable={false}
        draggedItemId={1}
      />,
    );
    const columnDiv = screen.getByTestId("column-1");

    fireEvent.drop(columnDiv);
    expect(mockSetProperty).not.toHaveBeenCalled();
  });

  test("deletes column if canDelete is true", () => {
    render(<ExpandableColumn {...defaultProps} />);

    const deleteBtn = screen.getByTestId("delete-icon").closest("button");

    expect(deleteBtn).toBeInTheDocument();

    if (deleteBtn) {
      fireEvent.click(deleteBtn);
    }

    expect(mockSetProperty).toHaveBeenCalledWith("someProperty", [
      { label: "Column 2" },
    ]);
  });

  test("does not delete column if minimum column count is reached", () => {
    const singleDataProps = {
      ...defaultProps,
      colData: [{ label: "Column 1" }],
      minColCount: 1,
    };
    render(<ExpandableColumn {...singleDataProps} />);
    const handle = screen.getByTestId("delete").closest("div");
    if (handle) {
      fireEvent.dragStart(handle);
    }

    expect(mockSetProperty).not.toHaveBeenCalled();
  });

  test("does not call setProperty when dragged onto itself", () => {
    render(<ExpandableColumn {...defaultProps} draggedItemId={0} />);
    const columnDiv = screen.getByTestId("column-1");

    fireEvent.drop(columnDiv);
    expect(mockSetProperty).not.toHaveBeenCalled();
  });

  test("does not call setProperty when no dragged item exists", () => {
    render(<ExpandableColumn {...defaultProps} draggedItemId={null} />);
    const columnDiv = screen.getByTestId("column-1");

    fireEvent.drop(columnDiv);

    expect(mockSetProperty).not.toHaveBeenCalled();
    expect(mockSetDraggedItemId).not.toHaveBeenCalled();
  });

  test("does not delete column if minimum column count is reached", () => {
    render(
      <ExpandableColumn
        {...defaultProps}
        colData={[{ label: "Column 1" }]}
        minColCount={1}
      />,
    );

    const deleteBtn = screen.getByTestId("delete");
    fireEvent.click(deleteBtn);

    expect(mockSetProperty).not.toHaveBeenCalled();
  });

  test("does not delete column if minimum column count is reached", () => {
    render(
      <ExpandableColumn
        {...defaultProps}
        colData={[{ label: "Column 1" }]}
        minColCount={1}
      />,
    );

    const deleteBtn = screen.getByTestId("delete");
    fireEvent.click(deleteBtn);

    expect(mockSetProperty).not.toHaveBeenCalled();
  });

  test("does not call preventDefault on drag over when isDraggable is false", () => {
    render(<ExpandableColumn {...defaultProps} isDraggable={false} />);
    const columnDiv = screen.getByTestId("column-1");
    const mockEvent = { preventDefault: jest.fn() };

    fireEvent.dragOver(columnDiv, mockEvent);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });
  test("calls handleDragStart on button click", () => {
    render(<ExpandableColumn {...defaultProps} isDraggable={true} />);
    const dragHandleButton = screen
      .getByTestId("drag-handle-icon")
      .closest("button");

    if (dragHandleButton) {
      fireEvent.click(dragHandleButton);
    }

    expect(mockSetDraggedItemId).toHaveBeenCalledWith(0);
  });

  test("deletes nested property component columns with setProperties", () => {
    const mockSetProperties = jest.fn();

    render(
      <ExpandableColumn
        {...defaultProps}
        property="columns"
        colData={[{ label: "Column 1" }, { label: "Column 2" }]}
        column={{ properties: { label: "Column 1" } }}
        propertyComponent={{
          properties: { title: "Section" },
          components: [
            {
              component: "Row",
              components: [{ id: "first" }, { id: "second" }],
            },
          ],
        }}
        setProperties={mockSetProperties}
      />,
    );

    fireEvent.click(screen.getByTestId("delete"));

    expect(mockSetProperties).toHaveBeenCalledWith(
      {
        properties: {
          title: "Section",
          columns: [{ label: "Column 2" }],
        },
        components: [
          {
            component: "Row",
            components: [{ id: "second" }],
          },
        ],
      },
      true,
    );
  });

  test("falls back to setProperty when nested components are absent", () => {
    render(
      <ExpandableColumn
        {...defaultProps}
        property="columns"
        propertyComponent={{ properties: { title: "Section" } }}
      />,
    );

    fireEvent.click(screen.getByTestId("delete"));

    expect(mockSetProperty).toHaveBeenCalledWith("columns", [
      { label: "Column 2" },
    ]);
  });

  test("renders table column action type when label is unavailable", () => {
    render(
      <ExpandableColumn
        {...defaultProps}
        label={undefined}
        column={{ properties: { tableColumnActionTypes: "Approve" } }}
      />,
    );

    expect(screen.getByTestId("label")).toHaveTextContent("Approve");
  });

  test("renders default action label when no label sources exist", () => {
    render(
      <ExpandableColumn
        {...defaultProps}
        label={undefined}
        column={{ properties: {} }}
      />,
    );

    expect(screen.getByTestId("label")).toHaveTextContent("Action 1");
  });

  test("applies dragging class when the current column is being dragged", () => {
    render(<ExpandableColumn {...defaultProps} draggedItemId={0} />);

    expect(screen.getByTestId("column-1").className).not.toBe("");
  });
});

describe("AddExpandableColumn", () => {
  test("renders Add Column button and calls handleAddCol when clicked", () => {
    const mockHandleAddCol = jest.fn();
    render(<AddExpandableColumn handleAddCol={mockHandleAddCol} />);

    const addButton = screen.getByRole("button", { name: "+ Add Column" });
    fireEvent.click(addButton);
    expect(mockHandleAddCol).toHaveBeenCalledTimes(1);
  });
});
