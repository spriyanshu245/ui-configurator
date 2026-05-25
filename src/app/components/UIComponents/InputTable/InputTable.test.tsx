import React from "react";
import { render, screen } from "@testing-library/react";
import InputTable from "./InputTable";
import "@testing-library/jest-dom";
import { InputTableComponent } from "@/app/types/types";

// A sample InputTableComponent for testing.
const baseComponent: InputTableComponent = {
  id: "inputTable1",
  type: "input-table",
  category: "form",
  properties: {
    label: "Test Input Table",
    showLabel: true,
    width: 50, // width in percentage
    inputColumns: [
      {
        id: "col1",
        type: "input-table-column",
        properties: { label: "Column 1" },
      },
      {
        id: "col2",
        type: "input-table-column",
        properties: { label: "Column 2" },
      },
    ],
  },
  // validations not used by this component.
};

describe("InputTable Component", () => {
  test("renders label when showLabel is true", () => {
    render(<InputTable component={baseComponent} />);
    // Check that the label element with the provided text is rendered.
    const label = screen.getByText("Test Input Table");
    expect(label).toBeInTheDocument();
    // Verify that the label's htmlFor attribute matches the component id.
    expect(label).toHaveAttribute("for", "inputTable1");
  });

  test("does not render label when showLabel is false", () => {
    const componentNoLabel = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        showLabel: false,
      },
    };
    render(<InputTable component={componentNoLabel} />);
    expect(screen.queryByText("Test Input Table")).not.toBeInTheDocument();
  });

  test("applies container width style when width is provided", () => {
    render(<InputTable component={baseComponent} />);
    // The table is rendered inside a container div.
    const table = screen.getByRole("table");
    const containerDiv = table.parentElement;
    // Expect that the container div has a width style equal to "50%".
    expect(containerDiv).toHaveStyle("width: 50%");
  });

  test("does not apply container width style when width is not provided", () => {
    const componentNoWidth = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        width: undefined,
      },
    };
    render(<InputTable component={componentNoWidth} />);
    const table = screen.getByRole("table");
    const containerDiv = table.parentElement;
    // If width is not provided, the style should be undefined or not include a width property.
    expect(containerDiv?.style.width).toBe("");
  });

  test("renders table header with correct columns and styles", () => {
    render(<InputTable component={baseComponent} />);
    // Get all header cells. In a table, <th> elements have the role "columnheader".
    const headerCells = screen.getAllByRole("columnheader");
    expect(headerCells).toHaveLength(2);
    expect(headerCells[0]).toHaveTextContent("Column 1");
    expect(headerCells[1]).toHaveTextContent("Column 2");

    // Each header cell should have a minWidth style of "100px"
    headerCells.forEach((cell) => {
      expect(cell).toHaveStyle("min-width: 100px");
    });
  });
});
