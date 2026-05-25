import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import Table from "./Table";
import { TableComponent } from "../../../types/types";

describe("Table Component", () => {
  const mockComponent: TableComponent = {
    id: "table3",
    type: "table",
    category: "component",
    properties: {
      id: "table",
      name: "table",
      label: "Table with Columns",
      showLabel: true,
      configurePageSize: false,
      defaultPageSize: 20,
      defaultSort: false,
      pageSizeOptions: [],
      tableColumns: [
        { id: "col1", type: "text", properties: { label: "Column 1", name: "column1" } },
        { id: "col2", type: "text", properties: { label: "Column 2", name: "column2" } },
      ],
    },
  };
  test("renders without crashing", () => {
    render(<Table />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  test("renders label when showLabel is true", () => {
    render(<Table component={mockComponent} />);
    expect(screen.getByTestId("label")).toBeInTheDocument();
  });

  test("does not render label when showLabel is false", () => {
    const properties: TableComponent = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        label: "Hidden Label",
        showLabel: false,
        tableColumns: [],
      },
    };

    render(<Table component={properties} />);
    expect(screen.queryByText("Hidden Label")).not.toBeInTheDocument();
  });

  test("renders table columns correctly", () => {
    render(<Table component={mockComponent} />);
    expect(screen.getByText("Column 1")).toBeInTheDocument();
    expect(screen.getByText("Column 2")).toBeInTheDocument();
  });

  test("applies noBorderTable class when hideBorders is true", () => {
    const componentWithNoBorder: TableComponent = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        hideBorders: true,
      },
    };
    render(<Table component={componentWithNoBorder} />);
    const table = screen.getByRole("table");
    expect(table).toHaveClass("noBorderTable");
  });

  test("applies table class when hideBorders is false or undefined", () => {
   
    render(<Table component={mockComponent} />);
     const table = screen.getByRole("table");
    expect(table).toHaveClass("table");

    const componentWithBorder: TableComponent = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        hideBorders: false,
      },
    };
    render(<Table component={componentWithBorder} />);
    expect(table).toHaveClass("table");
  });
});
