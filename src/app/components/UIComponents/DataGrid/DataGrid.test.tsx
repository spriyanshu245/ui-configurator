import React from "react";
import { render, screen } from "@testing-library/react";
import DataGrid from "./DataGrid";
import { DataGridComponent, GridData } from "@/app/types/types";

// Mock DataGrid.module.scss for predictable class names.
jest.mock("./DataGrid.module.scss", () => ({
  gridLabel: "gridLabel",
  gridContainer: "gridContainer",
  gridItem: "gridItem",
  vertical: "vertical",
  label: "label",
  value: "value",
}));

describe("DataGrid Component", () => {
  const dummyGridData: GridData[] = [
    {
      id: "row1",
      properties: { label: "Row 1 Label", value: "Row 1 Value" },
    },
    {
      id: "row2",
      properties: { label: "Row 2 Label", value: "Row 2 Value" },
    },
  ];

  const dummyComponent: DataGridComponent = {
    id: "dataGrid1",
    type: "data-grid",
    category: "component",
    properties: {
      width: 80, // percentage width
      label: "Data Grid",
      showLabel: true,
      columns: 3,
      columnGap: 10,
      fieldLayout: "vertical", // expect our mock returns "vertical"
      gridData: dummyGridData,
      // Other properties can be added if needed.
    },
  };

  test("renders container with correct width style", () => {
    const { container } = render(<DataGrid component={dummyComponent} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveStyle({ width: "80%" });
  });

  test("renders label when provided and showLabel is true", () => {
    render(<DataGrid component={dummyComponent} />);
    // Expect a label element with the provided text.
    const labelEl = screen.getByText("Data Grid");
    expect(labelEl).toBeInTheDocument();
    expect(labelEl.tagName).toBe("LABEL");
    expect(labelEl).toHaveClass("gridLabel");
    expect(labelEl).toHaveAttribute("for", "dataGrid1");
  });

  test("does not render label when showLabel is false", () => {
    const compNoLabel: DataGridComponent = {
      ...dummyComponent,
      properties: {
        ...dummyComponent.properties,
        showLabel: false,
      },
    };
    render(<DataGrid component={compNoLabel} />);
    const labelEl = screen.queryByText("Data Grid");
    expect(labelEl).toBeNull();
  });

  test("renders grid container with correct inline styles", () => {
    const { container } = render(<DataGrid component={dummyComponent} />);
    const gridContainer = container.querySelector(
      ".gridContainer"
    ) as HTMLElement;
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveStyle({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      columnGap: "10px",
    });
  });

  test("renders grid items for each gridData entry", () => {
    const { container } = render(<DataGrid component={dummyComponent} />);
    const gridItems = container.querySelectorAll(".gridItem");
    expect(gridItems.length).toBe(dummyGridData.length);

    gridItems.forEach((item, index) => {
      // Expect the grid item to also include the fieldLayout class "vertical"
      expect(item).toHaveClass("vertical");
      // It should have an inline style with display "flex" and flexDirection equal to "vertical".
      expect(item).toHaveStyle({ display: "flex", flexDirection: "vertical" });

      // Within each grid item, there should be elements for the label and value.
      const labelDiv = item.querySelector(`.${"label"}`);
      const valueDiv = item.querySelector(`.${"value"}`);
      expect(labelDiv).toBeInTheDocument();
      expect(valueDiv).toBeInTheDocument();
      expect(labelDiv?.textContent).toBe(dummyGridData[index].properties.label);
      expect(valueDiv?.textContent).toBe(dummyGridData[index].properties.value);
    });
  });

  test("renders no grid items when gridData is empty", () => {
    const compEmptyData: DataGridComponent = {
      ...dummyComponent,
      properties: {
        ...dummyComponent.properties,
        gridData: [],
      },
    };
    const { container } = render(<DataGrid component={compEmptyData} />);
    const gridContainer = container.querySelector(".gridContainer");
    // If gridData is empty, the grid container should have no child grid items.
    // Because the grid container itself is rendered, we check that it has zero children.
    expect(gridContainer?.childElementCount).toBe(0);
  });
});
