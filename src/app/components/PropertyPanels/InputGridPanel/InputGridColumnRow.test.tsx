import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InputGridColumnRow from "./InputGridColumnRow";
import { ComponentProperty } from "../../../../app/data/componentProperties";
import "@testing-library/jest-dom";

describe("InputGridColumnRow Component", () => {
  const mockHeader = {
    id: "header-1",
    text: "Test Header",
  };

  const mockHeaders = [mockHeader];
  const mockSetProperty = jest.fn();

  const defaultProps = {
    headers: mockHeaders,
    header: mockHeader,
    headerType: "column",
    index: 0,
    setProperty: mockSetProperty,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders component with correct header type label", () => {
    render(<InputGridColumnRow {...defaultProps} />);

    expect(screen.getByText("Column Header")).toBeInTheDocument();

    // Render with row type
    render(<InputGridColumnRow {...defaultProps} headerType="row" />);
    expect(screen.getByText("Row Header")).toBeInTheDocument();
  });

  test("renders input with correct value and placeholder(column)", () => {
    render(<InputGridColumnRow {...defaultProps} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Test Header");
    expect(input).toHaveAttribute(
      "placeholder",
      "Enter column header value here"
    );
  });

  test("renders input with correct value and placeholder(row)", () => {
    // Render with row type
    render(<InputGridColumnRow {...defaultProps} headerType="row" />);
    const rowInput = screen.getByRole("textbox");
    expect(rowInput).toHaveAttribute(
      "placeholder",
      "Enter row header value here"
    );
  });

  test("handles column header input value change correctly", () => {
    render(<InputGridColumnRow {...defaultProps} />);

    // Change input value
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Updated Header value" } });

    // The setProperty should be called with ComponentProperty.ColumnHeaders and the updated headers array
    // In the component, it maps through the headers and updates the one with matching id
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ColumnHeaders,
      [{ ...mockHeader, text: "Updated Header value" }]
    );
  });

  test("handles row header input value change correctly", () => {
    render(<InputGridColumnRow {...defaultProps} headerType="row" />);

    // Change input value
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Updated Row Header" } });

    // For row headers, it should call with ComponentProperty.RowHeaders
    expect(mockSetProperty).toHaveBeenCalledWith(ComponentProperty.RowHeaders, [
      { ...mockHeader, text: "Updated Row Header" },
    ]);
  });

  test("generates correct input id based on headerType(column)", () => {
    render(<InputGridColumnRow {...defaultProps} />);

    const columnInput = screen.getByRole("textbox");
    expect(columnInput).toHaveAttribute("id", "columnHeader-1");
  });

  test("generates correct input id based on headerType(row)", () => {
    render(<InputGridColumnRow {...defaultProps} headerType="row" />);
    const rowInput = screen.getByRole("textbox");
    expect(rowInput).toHaveAttribute("id", "rowHeader-1");
  });

  test("handles multiple headers correctly", () => {
    const multipleHeaders = [
      { id: "header-1", text: "First Header" },
      { id: "header-2", text: "Second Header" },
    ];

    render(
      <InputGridColumnRow
        {...defaultProps}
        headers={multipleHeaders}
        header={multipleHeaders[0]}
      />
    );

    // Change input value for the first header
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Updated First Header" } });

    // Only the first header should be updated, the second one should remain unchanged
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ColumnHeaders,
      [
        { id: "header-1", text: "Updated First Header" },
        { id: "header-2", text: "Second Header" },
      ]
    );
  });
});
