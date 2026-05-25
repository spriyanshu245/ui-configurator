import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InputGridPanel from "./InputGridPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { generateRandomId } from "@/app/utils/utils";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("@/app/utils/utils", () => ({
  generateRandomId: jest.fn(() => "mock-id"),
}));

jest.mock("@/app/styles/properties-pane.module.scss", () => {
  return new Proxy({}, { get: (target, prop) => String(prop) });
});

jest.mock("@/app/styles/shared.module.scss", () => {
  return new Proxy({}, { get: (target, prop) => String(prop) });
});

jest.mock("./InputGridPanel.module.scss", () => {
  return new Proxy({}, { get: (target, prop) => String(prop) });
});

jest.mock("../../ExpandableColumn/ExpandableColumn", () => ({
  __esModule: true,
  default: ({ children, label }: any) => (
    <div data-testid="expandable-column">
      <span>{label}</span>
      {children}
    </div>
  ),
  AddExpandableColumn: ({ handleAddCol, label }: any) => (
    <button onClick={handleAddCol}>Add {label || "Column"}</button>
  ),
}));

jest.mock("./InputGridColumnRow", () => () => (
  <div data-testid="input-grid-column-row" />
));

jest.mock("@/app/components/SVGIcons/ChevronDown", () => () => (
  <svg data-testid="chevron-down" />
));

describe("InputGridPanel Component", () => {
  const mockSetProperty = jest.fn();
  const mockSetProperties = jest.fn();
  const mockTogglePanel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => true),
    });
    (generateRandomId as jest.Mock).mockReturnValue("mock-new-id");
  });

  const mockPropertyComponent = {
    id: "grid-1",
    components: [
      {
        id: "row-1",
        type: "input-grid-row",
        properties: { label: "Row 1" },
        components: [{ id: "cell-1" }],
      },
    ],
    properties: {
      columnHeaders: [{ id: "col-1", text: "Column 1" }],
      isLastRowFooter: false,
      hideInputGridHeader: false,
    },
  };

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.ColumnHeaders,
      ComponentProperty.RowHeaders,
      ComponentProperty.IsLastRowFooter,
      ComponentProperty.HideInputGridHeader,
    ],
    propertyComponent: mockPropertyComponent,
    setProperty: mockSetProperty,
    setProperties: mockSetProperties,
  };

  it("renders panel header and toggles visibility", () => {
    render(<InputGridPanel {...defaultProps} />);

    expect(screen.getByText("Input Grid")).toBeInTheDocument();

    const toggleBtn = screen.getByTestId("toggleButton");
    fireEvent.click(toggleBtn);

    expect(mockTogglePanel).toHaveBeenCalledWith("InputGridPanel");
  });

  it("renders correctly when panel is closed", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => false),
    });

    render(<InputGridPanel {...defaultProps} />);

    expect(screen.queryByText("Grid Columns")).not.toBeInTheDocument();

    const toggleBtn = screen.getByTestId("toggleButton");
    expect(toggleBtn).not.toHaveClass("isOpen");
  });

  it("renders Grid Columns section and handles adding a column", () => {
    render(<InputGridPanel {...defaultProps} />);

    expect(screen.getByText("Grid Columns")).toBeInTheDocument();
    expect(screen.getByText("Column 1")).toBeInTheDocument();

    const addBtn = screen.getByText("Add Column");
    fireEvent.click(addBtn);

    expect(mockSetProperties).toHaveBeenCalledWith(
      {
        properties: {
          ...mockPropertyComponent.properties,
          columnHeaders: [
            { id: "col-1", text: "Column 1" },
            {
              id: "mock-new-id",
              text: "Column-2",
              showHelperText: false,
              helperText: "Column-2",
            },
          ],
        },
        components: [
          {
            id: "row-1",
            type: "input-grid-row",
            properties: { label: "Row 1" },
            components: [
              { id: "cell-1" },
              {
                id: "mock-new-id",
                type: "input-grid-column",
                category: "component",
              },
            ],
          },
        ],
      },
      true
    );
  });

  it("renders Grid Rows section and handles adding a row", () => {
    render(<InputGridPanel {...defaultProps} />);

    expect(screen.getByText("Grid Rows")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Row 1")).toBeInTheDocument();

    const addBtn = screen.getByText("Add Row");
    fireEvent.click(addBtn);

    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      [
        ...mockPropertyComponent.components,
        {
          id: "mock-new-id",
          type: "input-grid-row",
          category: "form",
          properties: {
            name: "Input Grid Row-2",
            label: "Input Grid Row-2",
          },
          components: [
            {
              id: "mock-new-id",
              type: "input-grid-column",
              category: "form",
            },
          ],
        },
      ],
      true
    );
  });

  it("handles editing a row label", () => {
    render(<InputGridPanel {...defaultProps} />);

    const rowInput = screen.getByDisplayValue("Row 1");
    fireEvent.change(rowInput, { target: { value: "Updated Row" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      [
        {
          id: "row-1",
          type: "input-grid-row",
          properties: { label: "Updated Row" },
          components: [{ id: "cell-1" }],
        },
      ],
      true
    );
  });

  it("handles IsLastRowFooter checkbox toggle", () => {
    render(<InputGridPanel {...defaultProps} />);

    const checkbox = screen.getByTestId("isLastRowFooter");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsLastRowFooter,
      true
    );
  });

  it("handles HideInputGridHeader checkbox toggle", () => {
    render(<InputGridPanel {...defaultProps} />);

    const checkbox = screen.getByTestId("hideInputGridHeader");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.HideInputGridHeader,
      true
    );
  });

  it("handles empty components and columnHeaders (coverage for ?? [])", () => {
    const emptyProps = {
      ...defaultProps,
      propertyComponent: {
        id: "grid-empty",
        properties: {},
      },
    };

    render(<InputGridPanel {...emptyProps} />);

    const addColBtn = screen.getByText("Add Column");
    fireEvent.click(addColBtn);

    expect(mockSetProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          columnHeaders: [expect.objectContaining({ text: "Column-1" })],
        }),
        components: [],
      }),
      true
    );

    const addRowBtn = screen.getByText("Add Row");
    fireEvent.click(addRowBtn);

    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      [
        expect.objectContaining({
          properties: expect.objectContaining({
            label: "Input Grid Row-1",
          }),
          components: [],
        }),
      ],
      true
    );
  });

  it("handles adding a column when existing row has valid components list", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "grid-1",
        properties: { columnHeaders: [] },
        components: [
          {
            id: "row-1",
            components: [],
          },
        ],
      },
    };

    render(<InputGridPanel {...props} />);
    const addColBtn = screen.getByText("Add Column");
    fireEvent.click(addColBtn);

    expect(mockSetProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        components: [
          expect.objectContaining({
            components: [
              expect.objectContaining({ type: "input-grid-column" }),
            ],
          }),
        ],
      }),
      true
    );
  });

  it("does not render unknown property keys", () => {
    const unknownProps = {
      ...defaultProps,
      propertyKeys: ["UnknownKey" as ComponentProperty],
    };
    const { container } = render(<InputGridPanel {...unknownProps} />);

    expect(container.querySelectorAll(".componentProperty").length).toBe(0);
  });
});
