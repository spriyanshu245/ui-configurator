import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TransferList from "./TransferList";
import { TransferListComponent } from "../../../types/types";

import "@testing-library/jest-dom";

describe("TransferList Component", () => {
  const mockComponent: TransferListComponent = {
    id: "transfer-list-1",
    type: "transfer-list",
    category: "form",
    properties: {
      label: "Transfer List",
      showLabel: true,
      fromListTitle: "Available Options",
      toListTitle: "Selected Options",
      fromListItems: [
        {
          value: "item1",
          label: "Item 1",
        },
        {
          value: "item2",
          label: "Item 2",
        },
        {
          value: "item3",
          label: "Item 3",
        },
      ],
      toListItems: [
        {
          value: "item4",
          label: "Item 4",
        },
      ],
      searchable: false,
      showSearch: false,
    },
  };

  test("renders with label when showLabel is true", () => {
    render(<TransferList component={mockComponent} />);

    expect(screen.getByText("Transfer List")).toBeInTheDocument();
    expect(screen.getByText("Available Options")).toBeInTheDocument();
    expect(screen.getByText("Selected Options")).toBeInTheDocument();
  });

  test("does not render label when showLabel is false", () => {
    const component = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        showLabel: false,
      },
    };

    render(<TransferList component={component} />);

    expect(screen.queryByText("Transfer List")).not.toBeInTheDocument();
  });

  test("renders default list titles when not provided", () => {
    const component = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        fromListTitle: undefined,
        toListTitle: undefined,
      },
    };

    render(<TransferList component={component} />);

    expect(screen.getByText("Available Items")).toBeInTheDocument();
    expect(screen.getByText("Selected Items")).toBeInTheDocument();
  });

  test("renders from list items correctly", () => {
    render(<TransferList component={mockComponent} />);

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  test("renders to list items correctly", () => {
    render(<TransferList component={mockComponent} />);

    expect(screen.getByText("Item 4")).toBeInTheDocument();
  });

  test("selects and deselects from list items on click", () => {
    render(<TransferList component={mockComponent} />);

    const item1 = screen.getByText("Item 1");

    // Initially not selected
    expect(item1).not.toHaveClass("selected");

    // Click to select
    fireEvent.click(item1);
    expect(item1).toHaveClass("selected");

    // Click again to deselect
    fireEvent.click(item1);
    expect(item1).not.toHaveClass("selected");
  });

  test("selects and deselects to list items on click", () => {
    render(<TransferList component={mockComponent} />);

    const item4 = screen.getByText("Item 4");

    // Initially not selected
    expect(item4).not.toHaveClass("selected");

    // Click to select
    fireEvent.click(item4);
    expect(item4).toHaveClass("selected");

    // Click again to deselect
    fireEvent.click(item4);
    expect(item4).not.toHaveClass("selected");
  });

  test("control buttons are rendered", () => {
    render(<TransferList component={mockComponent} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(6);

    // Check button titles
    expect(screen.getByTitle("Move all items to right")).toBeInTheDocument();
    expect(screen.getByTitle("Move all items to left")).toBeInTheDocument();
  });

  test("move all right button is disabled when from list is empty", () => {
    const component = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        fromListItems: [],
      },
    };

    render(<TransferList component={component} />);

    const moveAllRightButton = screen.getByTitle("Move all items to right");
    expect(moveAllRightButton).toBeDisabled();
  });

  test("move all left button is disabled when to list is empty", () => {
    const component = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        toListItems: [],
      },
    };

    render(<TransferList component={component} />);

    const moveAllLeftButton = screen.getByTitle("Move all items to left");
    expect(moveAllLeftButton).toBeDisabled();
  });

  test("move all right button is enabled when from list has items", () => {
    render(<TransferList component={mockComponent} />);

    const moveAllRightButton = screen.getByTitle("Move all items to right");
    expect(moveAllRightButton).not.toBeDisabled();
  });

  test("move all left button is enabled when to list has items", () => {
    render(<TransferList component={mockComponent} />);

    const moveAllLeftButton = screen.getByTitle("Move all items to left");
    expect(moveAllLeftButton).not.toBeDisabled();
  });

  test("handles undefined fromListItems gracefully", () => {
    const component = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        fromListItems: undefined,
      },
    };

    render(<TransferList component={component} />);

    const moveAllRightButton = screen.getByTitle("Move all items to right");
    expect(moveAllRightButton).toBeDisabled();
  });

  test("handles undefined toListItems gracefully", () => {
    const component = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        toListItems: undefined,
      },
    };

    render(<TransferList component={component} />);

    const moveAllLeftButton = screen.getByTitle("Move all items to left");
    expect(moveAllLeftButton).toBeDisabled();
  });

  test("handles empty properties gracefully", () => {
    const component = {
      ...mockComponent,
      properties: {},
    };

    render(<TransferList component={component} />);

    expect(screen.getByText("Available Items")).toBeInTheDocument();
    expect(screen.getByText("Selected Items")).toBeInTheDocument();
  });

  test("allows multiple item selection", () => {
    render(<TransferList component={mockComponent} />);

    const item1 = screen.getByText("Item 1");
    const item2 = screen.getByText("Item 2");

    fireEvent.click(item1);
    fireEvent.click(item2);

    expect(item1).toHaveClass("selected");
    expect(item2).toHaveClass("selected");
  });

  test("handles empty properties gracefully", () => {
    const component = {
      ...mockComponent,
      properties: {},
    };

    render(<TransferList component={component} />);

    expect(screen.getByText("Available Items")).toBeInTheDocument();
    expect(screen.getByText("Selected Items")).toBeInTheDocument();
  });

  test("allows multiple item selection", () => {
    render(<TransferList component={mockComponent} />);

    const item1 = screen.getByText("Item 1");
    const item2 = screen.getByText("Item 2");

    fireEvent.click(item1);
    fireEvent.click(item2);

    expect(item1).toHaveClass("selected");
    expect(item2).toHaveClass("selected");
  });
});
