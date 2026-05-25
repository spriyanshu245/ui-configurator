import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InputTablePanel from "./InputTablePanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { usePropertyPane } from "@/app/context/PropertiesContext";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("@/app/utils/utils", () => ({
  generateRandomId: jest.fn(() => "random-id-123"),
  deepClone: jest.fn((obj) => JSON.parse(JSON.stringify(obj))),
}));

jest.mock("@/app/styles/properties-pane.module.scss", () => ({
  componentProperty: "componentProperty",
  column: "column",
  row: "row",
  propertyLabel: "propertyLabel",
  textInput: "textInput",
  checkBoxCenter: "checkBoxCenter",
  conditionalCheckBox: "conditionalCheckBox",
  panelHeading: "panelHeading",
  isOpen: "isOpen",
}));

jest.mock("@/app/styles/shared.module.scss", () => ({
  mt5: "mt5",
}));

jest.mock("./InputTablePanel.module.scss", () => ({
  columns: "columns",
  columnHeader: "columnHeader",
}));

jest.mock("../../ExpandableColumn/ExpandableColumn.module.scss", () => ({
  draggableRows: "draggableRows",
}));

jest.mock("../../ExpandableColumn/ExpandableColumn", () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="expandable-column">{children}</div>
  ),
  AddExpandableColumn: ({ handleAddCol }: any) => (
    <button onClick={handleAddCol} data-testid="add-column-button">
      Add Column
    </button>
  ),
}));

jest.mock("./InputTableColumnRow", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="input-table-column-row">
      <input data-testid="label" />
    </div>
  ),
}));

jest.mock("@/app/components/SVGIcons/ChevronDown", () => () => (
  <div data-testid="chevron-icon" />
));

describe("InputTablePanel Component", () => {
  const mockSetProperty = jest.fn();
  const mockTogglePanel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => true),
    });
  });

  const mockPropertyComponent = {
    id: "test-component",
    properties: {
      inputColumns: [
        {
          id: "col-1",
          type: "input-table-column",
          properties: {
            label: "Column-1",
            columnInputType: "text",
            name: "",
            showLabel: true,
          },
        },
      ],
      minimumTableRow: "3",
      maximumTableRow: "10",
      fixedRows: false,
      showInputFooterRow: true,
    },
  };

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.InputColumns,
      ComponentProperty.MinimumTableRow,
      ComponentProperty.MaximumTableRow,
    ],
    propertyComponent: mockPropertyComponent,
    setProperty: mockSetProperty,
  };

  it("renders Input Table panel correctly", () => {
    render(<InputTablePanel {...defaultProps} />);
    expect(screen.getByText("Input Table")).toBeInTheDocument();
    expect(screen.getByText("Columns")).toBeInTheDocument();
  });

  it("toggles Input Table panel visibility", () => {
    render(<InputTablePanel {...defaultProps} />);
    const toggleButton = screen.getByTestId("toggleButton");
    fireEvent.click(toggleButton);
    expect(mockTogglePanel).toHaveBeenCalledWith("InputTablePanel");
  });

  it("renders existing columns", () => {
    render(<InputTablePanel {...defaultProps} />);
    expect(screen.getByTestId("label")).toBeInTheDocument();
  });

  it("adds a new column when clicking the add button", () => {
    render(<InputTablePanel {...defaultProps} />);

    const addButton = screen.getByTestId("add-column-button");
    fireEvent.click(addButton);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.InputColumns,
      expect.arrayContaining([
        expect.objectContaining({
          type: "input-table-column",
          properties: expect.objectContaining({
            label: "Column-2",
            columnInputType: "text",
            name: "",
            showLabel: true,
          }),
        }),
      ])
    );
  });

  it("renders expandable column component", () => {
    render(<InputTablePanel {...defaultProps} />);
    expect(screen.getByTestId("expandable-column")).toBeInTheDocument();
    expect(screen.getByTestId("input-table-column-row")).toBeInTheDocument();
  });

  test("toggle button does not have isOpen class when panel is closed", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => false),
    });

    render(
      <InputTablePanel
        propertyKeys={[]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const toggleButton = screen.getByTestId("toggleButton");
    expect(toggleButton.className).not.toContain("isOpen");
  });

  test('renders paragraph tag with "Minimum Rows" text', () => {
    render(<InputTablePanel {...defaultProps} />);
    const minimumRowsLabel = screen.getByText("Minimum Rows");
    expect(minimumRowsLabel).toBeInTheDocument();
    expect(minimumRowsLabel.tagName).toBe("P");
  });

  test("renders minimum rows input field", () => {
    render(<InputTablePanel {...defaultProps} />);

    const minimumRowsInput = screen.getByTestId("minimumTableRow");
    expect(minimumRowsInput).toBeInTheDocument();
    expect(minimumRowsInput).toHaveAttribute("type", "text");
    expect(minimumRowsInput).toHaveAttribute(
      "placeholder",
      "Enter Minimum Row"
    );
  });

  test("allows entering positive integer for minimum rows", () => {
    render(<InputTablePanel {...defaultProps} />);

    const minimumRowsInput = screen.getByTestId("minimumTableRow");
    fireEvent.change(minimumRowsInput, { target: { value: "5" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MinimumTableRow,
      "5"
    );
  });

  test("sets property with empty string when minimum rows input is cleared", () => {
    render(<InputTablePanel {...defaultProps} />);

    const minimumRowsInput = screen.getByTestId("minimumTableRow");
    fireEvent.change(minimumRowsInput, { target: { value: "" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MinimumTableRow,
      ""
    );
  });

  test('renders paragraph tag with "Maximum Rows" text', () => {
    render(<InputTablePanel {...defaultProps} />);
    const maximumRowsLabel = screen.getByText("Maximum Rows");
    expect(maximumRowsLabel).toBeInTheDocument();
    expect(maximumRowsLabel.tagName).toBe("P");
  });

  test("renders maximum rows input field", () => {
    render(<InputTablePanel {...defaultProps} />);

    const maximumRowsInput = screen.getByTestId("maximumTableRow");
    expect(maximumRowsInput).toBeInTheDocument();
    expect(maximumRowsInput).toHaveAttribute("type", "text");
    expect(maximumRowsInput).toHaveAttribute(
      "placeholder",
      "Enter Maximum Row"
    );
  });

  test("allows entering positive integer for maximum rows", () => {
    render(<InputTablePanel {...defaultProps} />);

    const maximumRowsInput = screen.getByTestId("maximumTableRow");
    fireEvent.change(maximumRowsInput, { target: { value: "5" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MaximumTableRow,
      "5"
    );
  });

  test("sets property with empty string when maximum rows input is cleared", () => {
    render(<InputTablePanel {...defaultProps} />);

    const maximumRowsInput = screen.getByTestId("maximumTableRow");
    fireEvent.change(maximumRowsInput, { target: { value: "" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MaximumTableRow,
      ""
    );
  });

  test("renders fixed rows checkbox when specified in propertyKeys", () => {
    render(
      <InputTablePanel
        propertyKeys={[ComponentProperty.FixedRows]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const checkbox = screen.getByTestId("fixedRows");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  test("calls setProperty when fixed rows checkbox is clicked", () => {
    render(
      <InputTablePanel
        propertyKeys={[ComponentProperty.FixedRows]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const checkbox = screen.getByTestId("fixedRows");
    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.FixedRows,
      true
    );
  });

  test("renders show footer row checkbox when specified in propertyKeys", () => {
    render(
      <InputTablePanel
        propertyKeys={[ComponentProperty.ShowInputFooterRow]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const checkbox = screen.getByTestId("showInputFooterRow");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  test("calls setProperty when show footer row checkbox is clicked", () => {
    render(
      <InputTablePanel
        propertyKeys={[ComponentProperty.ShowInputFooterRow]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const checkbox = screen.getByTestId("showInputFooterRow");
    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ShowInputFooterRow,
      false
    );
  });

  test("does not render panel content when panel is closed", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => false),
    });

    render(
      <InputTablePanel
        propertyKeys={[
          ComponentProperty.InputColumns,
          ComponentProperty.FixedRows,
          ComponentProperty.ShowInputFooterRow,
        ]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.queryByText("Columns")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fixedRows")).not.toBeInTheDocument();
    expect(screen.queryByTestId("showInputFooterRow")).not.toBeInTheDocument();
  });

  test("handles default values when properties are undefined", () => {
    const emptyPropertyComponent = {
      id: "test-component",
      properties: {},
    };

    render(
      <InputTablePanel
        propertyKeys={[
          ComponentProperty.InputColumns,
          ComponentProperty.FixedRows,
          ComponentProperty.ShowInputFooterRow,
        ]}
        propertyComponent={emptyPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.queryByTestId("expandable-column")).not.toBeInTheDocument();

    const fixedRowsCheckbox = screen.getByTestId("fixedRows");
    expect(fixedRowsCheckbox).not.toBeChecked();

    const showFooterRowCheckbox = screen.getByTestId("showInputFooterRow");
    expect(showFooterRowCheckbox).not.toBeChecked();
  });

  it("returns null when an invalid property key is passed", () => {
    render(
      <InputTablePanel
        propertyKeys={["InvalidPropertyKey"] as unknown as ComponentProperty[]}
        propertyComponent={{ properties: {} }}
        setProperty={mockSetProperty}
      />
    );

    const panelContent = screen.queryByText("Columns");
    expect(panelContent).toBeNull();
  });

  test("renders all properties when all are in propertyKeys", () => {
    render(
      <InputTablePanel
        propertyKeys={[
          ComponentProperty.InputColumns,
          ComponentProperty.FixedRows,
          ComponentProperty.ShowInputFooterRow,
          ComponentProperty.MinimumTableRow,
        ]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByText("Columns")).toBeInTheDocument();
    expect(screen.getByTestId("fixedRows")).toBeInTheDocument();
    expect(screen.getByTestId("showInputFooterRow")).toBeInTheDocument();
    expect(screen.getByTestId("minimumTableRow")).toBeInTheDocument();
  });

  test("renders with undefined minimumTableRow using default value", () => {
    const props = {
      propertyKeys: [ComponentProperty.MinimumTableRow],
      propertyComponent: {
        id: "test-component",
        properties: {
          minimumTableRow: undefined,
        },
      },
      setProperty: mockSetProperty,
    };
    render(<InputTablePanel {...props} />);
    const input = screen.getByTestId("minimumTableRow") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  test("renders with undefined maximumTableRow using default value", () => {
    const props = {
      propertyKeys: [ComponentProperty.MaximumTableRow],
      propertyComponent: {
        id: "test-component",
        properties: {
          maximumTableRow: undefined,
        },
      },
      setProperty: mockSetProperty,
    };
    render(<InputTablePanel {...props} />);
    const input = screen.getByTestId("maximumTableRow") as HTMLInputElement;
    expect(input.value).toBe("");
  });
});
