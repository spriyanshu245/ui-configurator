import { render, screen, fireEvent } from "@testing-library/react";
import SubsectionHeaderColumn from "./SubsectionHeaderColumn";
import { ComponentProperty } from "../../../..//app/data/componentProperties";

const mockSetProperty = jest.fn();

const baseProps = {
  id: 0,
  column: {
    id: "test-id",
    type: "subsection-header",
    properties: {
      label: "Label 1",
      value: "Value 1",
      colSpan: "1",
      columnInputType: "",
    },
  },
  propertyComponent: {
    properties: {
      subsectionHeaders: [
        {
          id: "test-id",
          type: "subsection-header",
          properties: {
            label: "Label 1",
            value: "Value 1",
            colSpan: "1",
            columnInputType: "",
          },
        },
      ],
    },
  },
  setProperty: mockSetProperty,
};

describe("SubsectionHeaderColumn", () => {
  beforeEach(() => {
    mockSetProperty.mockClear();
  });

  test("renders all fields with default values", () => {
    render(<SubsectionHeaderColumn {...baseProps} />);
    expect(screen.getByTestId("pill-label-input")).toHaveValue("Label 1");
    expect(screen.getByTestId("pill-value-input")).toHaveValue("Value 1");
    expect(screen.getByTestId("pill-colspan-input")).toHaveValue("1");
    expect(screen.getByTestId("pill-columnInputType")).toBeInTheDocument();
  });

  test("calls setProperty with updated label on change", () => {
    render(<SubsectionHeaderColumn {...baseProps} />);
    const labelInput = screen.getByTestId("pill-label-input");
    fireEvent.change(labelInput, { target: { value: "New Label" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SubsectionHeaders,
      expect.arrayContaining([
        expect.objectContaining({
          id: "test-id",
          properties: expect.objectContaining({ label: "New Label" }),
        }),
      ])
    );
  });

  test("renders input with empty string when label is undefined", () => {
    const props = {
      ...baseProps,
      column: {
        ...baseProps.column,
        properties: { ...baseProps.column.properties, label: undefined },
      },
    };
    render(<SubsectionHeaderColumn {...props} />);
    const labelInput = screen.getByTestId("pill-label-input");
    expect(labelInput).toHaveValue(""); // covers ?? "" fallback
  });

  test("calls setProperty with updated value on change", () => {
    render(<SubsectionHeaderColumn {...baseProps} />);
    const valueInput = screen.getByTestId("pill-value-input");
    fireEvent.change(valueInput, { target: { value: "New Value" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SubsectionHeaders,
      expect.arrayContaining([
        expect.objectContaining({
          id: "test-id",
          properties: expect.objectContaining({ value: "New Value" }),
        }),
      ])
    );
  });

  test("renders input with empty string when value is undefined", () => {
    const props = {
      ...baseProps,
      column: {
        ...baseProps.column,
        properties: { ...baseProps.column.properties, value: undefined },
      },
    };
    render(<SubsectionHeaderColumn {...props} />);
    const valueInput = screen.getByTestId("pill-value-input");
    expect(valueInput).toHaveValue("");
  });

  test("calls setProperty with updated colSpan on change", () => {
    render(<SubsectionHeaderColumn {...baseProps} />);
    const colSpanInput = screen.getByTestId("pill-colspan-input");
    fireEvent.change(colSpanInput, { target: { value: "3" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SubsectionHeaders,
      expect.arrayContaining([
        expect.objectContaining({
          id: "test-id",
          properties: expect.objectContaining({ colSpan: "3" }),
        }),
      ])
    );
  });

  test('renders input with fallback "1" when colSpan is undefined', () => {
    const props = {
      ...baseProps,
      column: {
        ...baseProps.column,
        properties: { ...baseProps.column.properties, colSpan: undefined },
      },
    };
    render(<SubsectionHeaderColumn {...props} />);
    const colSpanInput = screen.getByTestId("pill-colspan-input");
    expect(colSpanInput).toHaveValue("1");
  });

  it("updates column input type and only updates the matching column", () => {
    // Prepare pillsData with another non-matching column
    const anotherPill = {
      id: "other-id",
      type: "subsection-header",
      properties: {
        label: "Other Label",
        value: "Other Value",
        colSpan: "2",
        columnInputType: "",
      },
    };

    const props = {
      ...baseProps,
      propertyComponent: {
        properties: {
          subsectionHeaders: [baseProps.column, anotherPill],
        },
      },
    };

    render(<SubsectionHeaderColumn {...props} />);

    const inputTypeSelect = screen.getByTestId("pill-columnInputType");
    fireEvent.change(inputTypeSelect, { target: { value: "text" } });

    // Verify setProperty is called once
    expect(mockSetProperty).toHaveBeenCalledTimes(1);

    // Grab the updated array passed to setProperty
    const updatedArray = mockSetProperty.mock.calls[0][1];

    // The matching column should have updated columnInputType
    const updatedMatchingColumn = updatedArray.find(
      (c) => c.id === baseProps.column.id
    );
    expect(updatedMatchingColumn).toBeDefined();
    expect(updatedMatchingColumn.properties.columnInputType).toBe("text");

    // The other column should remain unchanged
    const otherColumn = updatedArray.find((c) => c.id === anotherPill.id);
    expect(otherColumn).toBeDefined();
    expect(otherColumn.properties.columnInputType).toBe("");
  });

  test("displays additional options when columnInputType is 'number'", () => {
    const props = {
      ...baseProps,
      column: {
        ...baseProps.column,
        properties: {
          ...baseProps.column.properties,
          columnInputType: "number",
          isCurrency: true,
          currencyName: "USD",
        },
      },
      propertyComponent: {
        properties: {
          subsectionHeaders: [
            {
              id: "test-id",
              type: "subsection-header",
              properties: {
                ...baseProps.column.properties,
                columnInputType: "number",
                isCurrency: true,
                currencyName: "USD",
              },
            },
          ],
        },
      },
    };
    render(<SubsectionHeaderColumn {...props} />);
    expect(screen.getByText("Is Currency")).toBeInTheDocument();
    expect(screen.getByTestId("currencyName")).toHaveValue("en-US");
  });

  it("toggles isCurrency checkbox", () => {
    const numberProps = {
      ...baseProps,
      column: {
        ...baseProps.column,
        properties: {
          ...baseProps.column.properties,
          columnInputType: "number",
        },
      },
    };

    render(<SubsectionHeaderColumn {...numberProps} />);

    const currencyCheckbox = screen.getByLabelText("Is Currency");
    fireEvent.click(currencyCheckbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SubsectionHeaders,
      [
        expect.objectContaining({
          id: "test-id",
          properties: expect.objectContaining({
            isCurrency: true,
          }),
        }),
      ]
    );
  });

  it("changes the date format when a new value is selected", () => {
    const dateProps = {
      ...baseProps,
      column: {
        ...baseProps.column,
        properties: {
          ...baseProps.column.properties,
          columnInputType: "date",
        },
      },
    };

    render(<SubsectionHeaderColumn {...dateProps} />);

    const format = screen.getByTestId("format");

    fireEvent.change(format, { target: { value: "en-GB" } });

    expect(format).toHaveValue("en-GB");
  });

  it("changes the currency when a new value is selected", () => {
    const currencyProps = {
      ...baseProps,
      column: {
        ...baseProps.column,
        properties: {
          ...baseProps.column.properties,
          columnInputType: "number",
          isCurrency: true,
        },
      },
    };

    render(<SubsectionHeaderColumn {...currencyProps} />);

    const currencySelect = screen.getByTestId("currencyName");

    fireEvent.change(currencySelect, { target: { value: "en-US" } });

    expect(currencySelect).toHaveValue("en-US");
  });
});
