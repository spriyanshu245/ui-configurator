import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SelectedLeafList from "./SelectedLeafList";

jest.mock("../SVGIcons/Close", () => () => (
  <span data-testid="close-icon">X</span>
));

describe("SelectedLeafList", () => {
  const mockClearAll = jest.fn();
  const mockRemoveSelectedItem = jest.fn();

  const selectedItemsMock = [
    { menuName: "item1", menuTitle: "Item 1" },
    { menuName: "item2", menuTitle: "Item 2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when no items are selected", () => {
    render(
      <SelectedLeafList
        clearAllSelected={mockClearAll}
        removeSelectedItem={mockRemoveSelectedItem}
        selectedItems={[]}
      />
    );

    expect(screen.getByText("Selected Items")).toBeInTheDocument();
    expect(screen.getByText("No items selected.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Clear All/i })
    ).toBeInTheDocument();
  });

  it("renders selected items when provided", () => {
    render(
      <SelectedLeafList
        clearAllSelected={mockClearAll}
        removeSelectedItem={mockRemoveSelectedItem}
        selectedItems={selectedItemsMock}
      />
    );

    expect(screen.queryByText("No items selected.")).not.toBeInTheDocument();

    selectedItemsMock.forEach((item) => {
      expect(screen.getByText(item.menuTitle)).toBeInTheDocument();
    });

    const closeIcons = screen.getAllByTestId("close-icon");
    expect(closeIcons.length).toBe(selectedItemsMock.length);
    closeIcons.forEach((icon) => {
      expect(icon).toBeInTheDocument();
    });
  });

  it("calls clearAllSelected when 'Clear All' button is clicked", () => {
    render(
      <SelectedLeafList
        clearAllSelected={mockClearAll}
        removeSelectedItem={mockRemoveSelectedItem}
        selectedItems={selectedItemsMock}
      />
    );

    const clearButton = screen.getByRole("button", { name: /Clear All/i });
    fireEvent.click(clearButton);

    expect(mockClearAll).toHaveBeenCalledTimes(1);
  });

  it("calls removeSelectedItem with correct argument when remove button is clicked", () => {
    render(
      <SelectedLeafList
        clearAllSelected={mockClearAll}
        removeSelectedItem={mockRemoveSelectedItem}
        selectedItems={selectedItemsMock}
      />
    );

    const removeButtons = screen.getAllByRole("button", { name: "X" });
    fireEvent.click(removeButtons[0]);

    expect(mockRemoveSelectedItem).toHaveBeenCalledTimes(1);
    expect(mockRemoveSelectedItem).toHaveBeenCalledWith("item1");
  });
});
