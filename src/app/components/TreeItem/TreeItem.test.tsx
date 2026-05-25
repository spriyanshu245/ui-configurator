import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TreeItem from "./TreeItem";

jest.mock("../SVGIcons/ArrowUp", () =>
  jest.fn(() => <svg data-testid="arrow-up" />)
);
jest.mock("../SVGIcons/Bin", () =>
  jest.fn(() => <svg data-testid="bin-icon" />)
);
jest.mock("../SVGIcons/Edit", () =>
  jest.fn(() => <svg data-testid="edit-icon" />)
);
jest.mock("../SVGIcons/DragHandle", () =>
  jest.fn(() => <svg data-testid="drag-icon" />)
);

const baseItem = {
  menuName: "root",
  menuTitle: "Root Title",
  subMenus: [],
};

const renderTree = (props = {}) =>
  render(
    <TreeItem
      mode="edit"
      item={baseItem}
      level={0}
      expanded={{}}
      toggleExpand={jest.fn()}
      onAdd={jest.fn()}
      onDelete={jest.fn()}
      onEdit={jest.fn()}
      onSelect={jest.fn()}
      selectedItems={[]}
      onDragStart={jest.fn()}
      onDragOver={jest.fn()}
      onDrop={jest.fn()}
      dropTarget={null}
      draggedItem={null}
      isDescendant={jest.fn().mockReturnValue(false)}
      deleteConfirmFor={null}
      setDeleteConfirmFor={jest.fn()}
      {...props}
    />
  );

describe("TreeItem", () => {
  test("renders title", () => {
    renderTree();
    expect(screen.getByText("Root Title")).toBeInTheDocument();
  });

  test("renders expand button when item has children", () => {
    renderTree({
      item: { ...baseItem, subMenus: [{ menuName: "c1", menuTitle: "Child" }] },
      expanded: { root: false },
    });

    expect(screen.getByTestId("arrow-up")).toBeInTheDocument();
  });

  test("calls toggleExpand when expand button clicked", () => {
    const toggleExpand = jest.fn();
    renderTree({
      toggleExpand,
      item: { ...baseItem, subMenus: [{}] },
      expanded: { root: false },
    });

    fireEvent.click(screen.getByTestId("arrow-up").closest("button")!);
    expect(toggleExpand).toHaveBeenCalledWith("root");
  });

  test("checkbox appears in select mode and calls onSelect", () => {
    const onSelect = jest.fn();
    renderTree({
      mode: "select",
      onSelect,
      selectedItems: [],
    });

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onSelect).toHaveBeenCalledWith("root", true);
  });

  test("shows edit + add + delete buttons in edit mode", () => {
    renderTree();

    expect(screen.getByTestId("edit-icon")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByTestId("bin-icon")).toBeInTheDocument();
  });

  test("delete confirmation replaces delete button", () => {
    const setDeleteConfirmFor = jest.fn();

    renderTree({ deleteConfirmFor: "root", setDeleteConfirmFor });

    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  test("calls onDelete when confirming delete", async () => {
    const onDelete = jest.fn(() => Promise.resolve());
    const setDeleteConfirmFor = jest.fn();

    renderTree({
      deleteConfirmFor: "root",
      onDelete,
      setDeleteConfirmFor,
    });

    fireEvent.click(screen.getByText("Yes"));

    expect(onDelete).toHaveBeenCalledWith("root");
  });

  test("applies dropTarget style for valid drop location", () => {
    renderTree({
      dropTarget: "root",
      draggedItem: { menuName: "other" },
    });

    const rootDiv = screen.getByText("Root Title").closest("div")!.parentNode!
      .parentNode!;
    expect(rootDiv.className).toMatch(/dropTarget/);
  });

  test("renders recursive children when expanded", () => {
    const itemWithChildren = {
      ...baseItem,
      subMenus: [{ menuName: "child1", menuTitle: "Child 1", subMenus: [] }],
    };

    renderTree({
      item: itemWithChildren,
      expanded: { root: true },
    });

    expect(screen.getByText("Child 1")).toBeInTheDocument();
  });
});

describe("TreeItem - Additional Tests", () => {
  test("does not render expand button when item has no children", () => {
    renderTree({
      item: { ...baseItem, subMenus: [] },
    });

    expect(screen.queryByTestId("arrow-up")).not.toBeInTheDocument();
  });

  test("expand button has expanded class when item is expanded", () => {
    renderTree({
      item: { ...baseItem, subMenus: [{ menuName: "c1", menuTitle: "Child" }] },
      expanded: { root: true },
    });

    const button = screen.getByTestId("arrow-up").closest("button")!;
    expect(button.className).toMatch(/expanded/);
  });

  test("checkbox is checked when item is in selectedItems", () => {
    renderTree({
      mode: "select",
      selectedItems: [{ menuName: "root", menuTitle: "Root Title" }],
    });

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  test("checkbox is unchecked when item is not in selectedItems", () => {
    renderTree({
      mode: "select",
      selectedItems: [],
    });

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  test("calls onEdit when edit button clicked", () => {
    const onEdit = jest.fn();
    renderTree({ onEdit });

    fireEvent.click(screen.getByTestId("edit-icon").closest("button")!);
    expect(onEdit).toHaveBeenCalledWith(baseItem);
  });

  test("calls onAdd when add button clicked", () => {
    const onAdd = jest.fn();
    renderTree({ onAdd });

    fireEvent.click(screen.getByText("+"));
    expect(onAdd).toHaveBeenCalledWith("root");
  });

  test("calls setDeleteConfirmFor when delete button clicked", () => {
    const setDeleteConfirmFor = jest.fn();
    renderTree({ setDeleteConfirmFor });

    fireEvent.click(screen.getByTestId("bin-icon").closest("button")!);
    expect(setDeleteConfirmFor).toHaveBeenCalledWith("root");
  });

  test("calls setDeleteConfirmFor with null when cancel is clicked", () => {
    const setDeleteConfirmFor = jest.fn();
    renderTree({
      deleteConfirmFor: "root",
      setDeleteConfirmFor,
    });

    fireEvent.click(screen.getByText("Cancel"));
    expect(setDeleteConfirmFor).toHaveBeenCalledWith(null);
  });

  test("setDeleteConfirmFor is called after onDelete resolves", async () => {
    const onDelete = jest.fn(() => Promise.resolve());
    const setDeleteConfirmFor = jest.fn();

    renderTree({
      deleteConfirmFor: "root",
      onDelete,
      setDeleteConfirmFor,
    });

    fireEvent.click(screen.getByText("Yes"));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(setDeleteConfirmFor).toHaveBeenCalledWith(null);
  });

  test("does not apply dropTarget style when dragging same item", () => {
    renderTree({
      dropTarget: "root",
      draggedItem: { menuName: "root" },
    });

    const rootDiv = screen.getByText("Root Title").closest("div")!.parentNode!;
    expect(rootDiv.className).not.toMatch(/dropTarget/);
  });

  test("drag and drop handlers are called correctly", () => {
    const onDragStart = jest.fn();
    const onDragOver = jest.fn();
    const onDrop = jest.fn();

    renderTree({ onDragStart, onDragOver, onDrop });

    const dragButton = screen.getByTestId("drag-icon").closest("button")!;

    fireEvent.dragStart(dragButton);
    expect(onDragStart).toHaveBeenCalledWith(expect.any(Object), baseItem);

    fireEvent.dragOver(dragButton);
    expect(onDragOver).toHaveBeenCalledWith(expect.any(Object), baseItem);

    fireEvent.drop(dragButton);
    expect(onDrop).toHaveBeenCalledWith(expect.any(Object), baseItem);
  });

  test("does not render drag button in select mode", () => {
    renderTree({ mode: "select" });

    expect(screen.queryByTestId("drag-icon")).not.toBeInTheDocument();
  });

  test("does not render edit controls in select mode", () => {
    renderTree({ mode: "select" });

    expect(screen.queryByTestId("edit-icon")).not.toBeInTheDocument();
    expect(screen.queryByText("+")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bin-icon")).not.toBeInTheDocument();
  });

  test("does not render children when not expanded", () => {
    const itemWithChildren = {
      ...baseItem,
      subMenus: [{ menuName: "child1", menuTitle: "Child 1", subMenus: [] }],
    };

    renderTree({
      item: itemWithChildren,
      expanded: { root: false },
    });

    expect(screen.queryByText("Child 1")).not.toBeInTheDocument();
  });

  test("renders nested children recursively", () => {
    const nestedItem = {
      ...baseItem,
      subMenus: [
        {
          menuName: "child1",
          menuTitle: "Child 1",
          subMenus: [
            {
              menuName: "grandchild1",
              menuTitle: "Grandchild 1",
              subMenus: [],
            },
          ],
        },
      ],
    };

    renderTree({
      item: nestedItem,
      expanded: { root: true, child1: true },
    });

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Grandchild 1")).toBeInTheDocument();
  });

  test("passes all props to child TreeItem components", () => {
    const props = {
      mode: "edit" as const,
      item: {
        ...baseItem,
        subMenus: [{ menuName: "child1", menuTitle: "Child 1", subMenus: [] }],
      },
      expanded: { root: true },
      toggleExpand: jest.fn(),
      onAdd: jest.fn(),
      onDelete: jest.fn(),
      onEdit: jest.fn(),
      onSelect: jest.fn(),
      selectedItems: [],
      onDragStart: jest.fn(),
      onDragOver: jest.fn(),
      onDrop: jest.fn(),
      dropTarget: "child1",
      draggedItem: { menuName: "other" },
      isDescendant: jest.fn(),
      deleteConfirmFor: "child1",
      setDeleteConfirmFor: jest.fn(),
    };

    renderTree(props);

    // Verify child is rendered with correct props by checking it receives deleteConfirmFor
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  test("onSelect is called with false when unchecking checkbox", () => {
    const onSelect = jest.fn();
    renderTree({
      mode: "select",
      onSelect,
      selectedItems: [{ menuName: "root", menuTitle: "Root Title" }],
    });

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onSelect).toHaveBeenCalledWith("root", false);
  });
});
