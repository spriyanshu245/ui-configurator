import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import LayoutPanel from "./LayoutPanel";
import { ComponentProperty } from "../../../data/componentProperties";
import { PropertyPanels } from "../../../utils/constants";
import { usePropertyPane } from "../../../context/PropertiesContext";
import sharedPropertiesStyles from "../../../styles/properties-pane.module.scss";

// Mock usePropertyPane
jest.mock("../../../context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

describe("LayoutPanel Component", () => {
  const mockSetProperty = jest.fn();
  const mockSetProperties = jest.fn();
  const mockTogglePanel = jest.fn();
  const mockIsPanelOpen = jest.fn(() => true);

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: mockIsPanelOpen,
    });
  });

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.Width,
      ComponentProperty.Height,
      ComponentProperty.Columns,
      ComponentProperty.FieldLayout,
      ComponentProperty.RepeatRows,
      ComponentProperty.Align,
      ComponentProperty.isFloating,
      ComponentProperty.MarginRight,
      ComponentProperty.MarginLeft,
      ComponentProperty.MarginTop,
      ComponentProperty.MarginBottom,
      ComponentProperty.ColumnGap,
      ComponentProperty.IsVertical,
      ComponentProperty.Transpose,
    ],
    propertyComponent: {
      properties: {
        width: "50",
        height: "100",
        columns: "2",
        fieldLayout: "row",
        repeatRows: false,
        align: "left",
        isFloating: false,
        marginRight: 10,
        marginLeft: 10,
        marginTop: 10,
        marginBottom: 10,
        columnGap: 5,
        position: "",
      },
      type: "data-grid",
    },
    setProperty: mockSetProperty,
    setProperties: mockSetProperties,
  };

  const columnWidthProps = {
    ...defaultProps,
    propertyKeys: [
      ComponentProperty.DefineColumnWidth,
      ComponentProperty.TableColumnWidth,
    ],
    propertyComponent: {
      ...defaultProps.propertyComponent,
      properties: {
        ...defaultProps.propertyComponent.properties,
        defineColumnWidth: true,
        inputColumns: [
          { id: "col1", properties: { label: "Column 1" } },
          { id: "col2", properties: { label: "Column 2" } },
          { id: "col3", properties: { label: "Column 3" } },
        ],
        tableColumnWidth: [30, 40, 30],
      },
    },
  };

  it("renders the LayoutPanel and toggle button", () => {
    render(<LayoutPanel {...defaultProps} />);
    expect(screen.getByText("Layout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Layout/i })).toBeInTheDocument();
  });

  it("toggles the panel when clicking the button", () => {
    render(<LayoutPanel {...defaultProps} />);
    const toggleButton = screen.getByRole("button", { name: /Layout/i });
    fireEvent.click(toggleButton);
    expect(mockTogglePanel).toHaveBeenCalledWith(PropertyPanels.LayoutPanel);
  });

  it("updates width when slider is changed", () => {
    render(<LayoutPanel {...defaultProps} />);
    const widthSlider = screen.getByTestId("width");
    fireEvent.change(widthSlider, { target: { value: "60" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Width,
      Number("60"),
    );
  });

  it("updates height when slider is changed", () => {
    render(<LayoutPanel {...defaultProps} />);
    const heightSlider = screen.getByTestId("height");
    fireEvent.change(heightSlider, { target: { value: "120" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Height,
      Number("120"),
    );
  });

  it("updates columns when slider is changed", () => {
    render(<LayoutPanel {...defaultProps} />);
    const columnsSlider = screen.getByTestId("columns");
    fireEvent.change(columnsSlider, { target: { value: "3" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Columns,
      Number("3"),
    );
  });

  it("updates field layout when dropdown is changed", () => {
    render(<LayoutPanel {...defaultProps} />);
    const fieldLayoutDropdown = screen.getByTestId("fieldLayout");
    fireEvent.change(fieldLayoutDropdown, { target: { value: "column" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.FieldLayout,
      "column",
    );
  });

  it("updates repeat rows when checkbox is checked", () => {
    render(<LayoutPanel {...defaultProps} />);
    const repeatRowsCheckbox = screen.getByLabelText("Repeat Rows");
    fireEvent.click(repeatRowsCheckbox);
    expect(mockSetProperty).toHaveBeenCalledWith("repeatRows", true);
  });

  it("updates isVertical when checkbox is checked", () => {
    render(<LayoutPanel {...defaultProps} />);
    const verticalCheckbox = screen.getByLabelText("Align Vertical");
    fireEvent.click(verticalCheckbox);
    expect(mockSetProperty).toHaveBeenCalledWith("isVertical", true);
  });

  it("updates alignment when a button is clicked", () => {
    render(<LayoutPanel {...defaultProps} />);
    const alignButton = screen.getByTestId("center");
    fireEvent.click(alignButton);
    expect(mockSetProperty).toHaveBeenCalledWith("align", "center");
  });

  it("toggles floating buttons and updates properties", () => {
    render(<LayoutPanel {...defaultProps} />);
    const floatingToggle = screen.getByTestId("isFloating");
    fireEvent.click(floatingToggle);
    expect(mockSetProperties).toHaveBeenCalledWith({
      isFloating: true,
      marginRight: 0,
      marginLeft: 0,
      marginTop: 0,
      marginBottom: 0,
    });
  });

  it("does not render margin controls when floating is disabled", () => {
    render(<LayoutPanel {...defaultProps} />);
    expect(screen.queryByLabelText("Margin Right")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Margin Left")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Margin Top")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Margin Bottom")).not.toBeInTheDocument();
  });

  it("updates right margin values when sliders are changed", () => {
    const floatingProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          align: "right",
          isFloating: true,
        },
      },
    };
    render(<LayoutPanel {...floatingProps} />);

    const marginRightSlider = screen.getByTestId("marginRight");
    fireEvent.change(marginRightSlider, { target: { value: "20" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MarginRight,
      20,
    );
  });

  it("updates left margin values when sliders are changed", () => {
    const floatingProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          align: "left",
          isFloating: true,
        },
      },
    };
    render(<LayoutPanel {...floatingProps} />);

    const marginLeftSlider = screen.getByTestId("marginLeft");
    fireEvent.change(marginLeftSlider, { target: { value: "15" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MarginLeft,
      15,
    );
  });

  it("updates top margin values when sliders are changed", () => {
    const floatingProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          position: "Top",
          isFloating: true,
        },
      },
    };
    render(<LayoutPanel {...floatingProps} />);

    const marginTopSlider = screen.getByTestId("marginTop");
    fireEvent.change(marginTopSlider, { target: { value: "15" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MarginTop,
      15,
    );
  });

  it("updates bottom margin values when sliders are changed", () => {
    const floatingProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          position: "Bottom",
          isFloating: true,
        },
      },
    };
    render(<LayoutPanel {...floatingProps} />);

    const marginBottomSlider = screen.getByTestId("marginBottom");
    fireEvent.change(marginBottomSlider, { target: { value: "15" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MarginBottom,
      15,
    );
  });

  it("does not render any UI when an invalid propertyKey is provided", () => {
    const invalidProps = {
      propertyComponent: { properties: {} },
      setProperty: mockSetProperty,
      setProperties: mockSetProperties,
      propertyKeys: ["InvalidPropertyKey"] as unknown as ComponentProperty[], // Pass an invalid property key
    };

    render(<LayoutPanel {...invalidProps} />);

    expect(screen.queryByText("InvalidPropertyKey")).not.toBeInTheDocument();
  });

  it("updates column gap when slider is changed", () => {
    render(<LayoutPanel {...defaultProps} />);
    const columnGapSlider = screen.getByTestId("columnGap");
    fireEvent.change(columnGapSlider, { target: { value: "10" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ColumnGap,
      Number("10"),
    );
  });

  it("sets default values when properties are missing", () => {
    const missingProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {},
      },
    };
    render(<LayoutPanel {...missingProps} />);

    expect(screen.getByTestId("width")).toHaveValue("100");
    expect(screen.getByTestId("height")).toHaveValue("5");
    expect(screen.getByTestId("columns")).toHaveValue("2");
    expect(screen.getByTestId("fieldLayout")).toHaveValue("column");
    if (defaultProps.propertyComponent.properties.isFloating) {
      expect(screen.getByTestId("marginTop")).toHaveValue(0);
      expect(screen.getByTestId("marginBottom")).toHaveValue(0);
      expect(screen.getByTestId("marginRight")).toHaveValue(0);
      expect(screen.getByTestId("marginLeft")).toHaveValue(0);
    }
  });

  it("calls handlePositionChange when a position is selected", () => {
    const mockSetProperties = jest.fn();

    const testProps = {
      ...defaultProps,
      setProperties: mockSetProperties,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isFloating: true,
        },
      },
    };

    render(<LayoutPanel {...testProps} />);

    const topRadio = screen.getByTestId("position-top");
    const bottomRadio = screen.getByTestId("position-bottom");

    fireEvent.click(topRadio);
    expect(mockSetProperties).toHaveBeenCalledWith({
      position: "Top",
      marginRight: 0,
      marginLeft: 0,
      marginTop: 0,
      marginBottom: 0,
    });

    fireEvent.click(bottomRadio);
    expect(mockSetProperties).toHaveBeenCalledWith({
      position: "Bottom",
      marginRight: 0,
      marginLeft: 0,
      marginTop: 0,
      marginBottom: 0,
    });
  });

  it("calls setProperty with transpose value when the transpose checkbox is toggled", () => {
    const mockSetProperty = jest.fn();

    const testProps = {
      ...defaultProps,
      setProperty: mockSetProperty,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isFloating: true,
        },
      },
    };

    render(<LayoutPanel {...testProps} />);

    const transposeCheckbox = screen.getByTestId("transpose");

    fireEvent.click(transposeCheckbox);
    expect(mockSetProperty).toHaveBeenCalledWith("transpose", true);

    act(() => fireEvent.click(transposeCheckbox));
    waitFor(() =>
      expect(mockSetProperty).toHaveBeenCalledWith("transpose", false),
    );
  });

  it("sets margin Top and margin Left default values when properties are missing", () => {
    const missingProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          isFloating: true,
          align: "left",
          position: "Top",
        },
      },
    };
    render(<LayoutPanel {...missingProps} />);

    expect(screen.getByTestId("marginTop")).toHaveValue("5");
    expect(screen.getByTestId("marginLeft")).toHaveValue("5");
  });

  it("sets margin Bottom and margin Right default values when properties are missing", () => {
    const missingProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          isFloating: true,
          align: "right",
          position: "Bottom",
        },
      },
    };
    render(<LayoutPanel {...missingProps} />);

    expect(screen.getByTestId("marginBottom")).toHaveValue("5");
    expect(screen.getByTestId("marginRight")).toHaveValue("5");
  });

  test("applies open class if panel is open", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: jest.fn(),
      isPanelOpen: jest.fn(() => true),
    });

    render(<LayoutPanel {...defaultProps} />);

    const button = screen.getByTestId("toggleButton");
    expect(button).toHaveClass(sharedPropertiesStyles.isOpen);
  });

  test("does not apply open class if panel is not open", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: jest.fn(),
      isPanelOpen: jest.fn(() => false),
    });

    render(<LayoutPanel {...defaultProps} />);

    const button = screen.getByRole("button");
    expect(button).not.toHaveClass(sharedPropertiesStyles.isOpen);
  });

  it("does not crash when togglePanel is undefined", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: undefined,
      isPanelOpen: jest.fn(() => true),
    });

    render(<LayoutPanel {...defaultProps} />);
    const toggleButton = screen.getByTestId("toggleButton");
    fireEvent.click(toggleButton);

    expect(toggleButton).toBeInTheDocument();
  });

  it("does not render Columns when hasFixedColumns is false and type is stack", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "stack",
        properties: {
          ...defaultProps.propertyComponent.properties,
          hasFixedColumns: false,
        },
      },
      propertyKeys: [ComponentProperty.Columns, ComponentProperty.ColumnGap],
    };

    render(<LayoutPanel {...props} />);

    expect(screen.queryByTestId("columns")).not.toBeInTheDocument();
  });

  it("renders Direction select when hasFixedColumns is false", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          hasFixedColumns: false,
        },
      },
      propertyKeys: [ComponentProperty.Direction],
    };

    render(<LayoutPanel {...props} />);
    expect(screen.getByTestId("direction")).toBeInTheDocument();
  });

  it("does not render Direction select when hasFixedColumns is true", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "stack",
        properties: {
          ...defaultProps.propertyComponent.properties,
          hasFixedColumns: true,
        },
      },
      propertyKeys: [ComponentProperty.Direction],
    };

    render(<LayoutPanel {...props} />);
    expect(screen.queryByTestId("direction")).not.toBeInTheDocument();
  });

  it("updates hasFixedColumns when checkbox is toggled", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.HasFixedColumns],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          hasFixedColumns: false,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId("hasFixedColumns") as HTMLInputElement;

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.HasFixedColumns,
      true,
    );
  });

  it("renders EnableVerticalScroll checkbox when included in propertyKeys", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.EnableVerticalScroll],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          enableVerticalScroll: false,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    expect(screen.getByTestId("enableVerticalScroll")).toBeInTheDocument();
  });

  it("does not render EnableVerticalScroll checkbox when not included in propertyKeys", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.Columns], // Different property
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          enableVerticalScroll: true,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    expect(
      screen.queryByTestId("enableVerticalScroll"),
    ).not.toBeInTheDocument();
  });

  it("renders EnableVerticalScroll checkbox as unchecked when enableVerticalScroll is false", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.EnableVerticalScroll],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          enableVerticalScroll: false,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId(
      "enableVerticalScroll",
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("renders EnableVerticalScroll checkbox as checked when enableVerticalScroll is true", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.EnableVerticalScroll],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          enableVerticalScroll: true,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId(
      "enableVerticalScroll",
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("renders EnableVerticalScroll checkbox as unchecked when enableVerticalScroll is undefined", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.EnableVerticalScroll],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId(
      "enableVerticalScroll",
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("updates enableVerticalScroll to true when checkbox is clicked from false", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.EnableVerticalScroll],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          enableVerticalScroll: false,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId(
      "enableVerticalScroll",
    ) as HTMLInputElement;

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.EnableVerticalScroll,
      true,
    );
  });

  it("updates enableVerticalScroll to false when checkbox is clicked from true", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.EnableVerticalScroll],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          enableVerticalScroll: true,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId(
      "enableVerticalScroll",
    ) as HTMLInputElement;

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.EnableVerticalScroll,
      false,
    );
  });

  it("updates direction when select option is changed", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.Direction],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          hasFixedColumns: false,
          direction: "row",
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const select = screen.getByTestId("direction");
    fireEvent.change(select, { target: { value: "column" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Direction,
      "column",
    );
  });

  it("updates alignment when select option is changed", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.Alignment],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const select = screen.getByTestId("alignment");
    fireEvent.change(select, { target: { value: "center" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Alignment,
      "center",
    );
  });

  it("updates justification when select option is changed", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.Justification],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const select = screen.getByTestId("justification");
    fireEvent.change(select, { target: { value: "space-between" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Justification,
      "space-between",
    );
  });

  it("initializes equal widths when tableColumnWidth length differs from inputColumns length", () => {
    const propsWithMismatch = {
      ...columnWidthProps,
      propertyComponent: {
        ...columnWidthProps.propertyComponent,
        properties: {
          ...columnWidthProps.propertyComponent.properties,
          inputColumns: [
            { id: "col1", properties: { label: "Column 1" } },
            { id: "col2", properties: { label: "Column 2" } },
          ],
          tableColumnWidth: [50],
        },
      },
    };

    render(<LayoutPanel {...propsWithMismatch} />);

    // Should initialize with equal widths (50% each for 2 columns)
    const column1Slider = screen.getByTestId("columnWidth-0");
    const column2Slider = screen.getByTestId("columnWidth-1");

    expect(column1Slider).toHaveValue("50");
    expect(column2Slider).toHaveValue("50");
  });

  it("uses existing tableColumnWidth when lengths match", () => {
    render(<LayoutPanel {...columnWidthProps} />);

    const column1Slider = screen.getByTestId("columnWidth-0");
    const column2Slider = screen.getByTestId("columnWidth-1");
    const column3Slider = screen.getByTestId("columnWidth-2");

    expect(column1Slider).toHaveValue("30");
    expect(column2Slider).toHaveValue("40");
    expect(column3Slider).toHaveValue("30");
  });

  it("handles column width change with maximum width restriction", () => {
    render(<LayoutPanel {...columnWidthProps} />);

    const column1Slider = screen.getByTestId("columnWidth-0");

    // Try to set column 1 to 80% (should be restricted to max allowed)
    fireEvent.change(column1Slider, { target: { value: "80" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumnWidth,
      expect.any(Array),
    );
  });

  it("toggles defineColumnWidth and resets tableColumnWidth appropriately", () => {
    const propsWithDefineOff = {
      ...columnWidthProps,
      propertyComponent: {
        ...columnWidthProps.propertyComponent,
        properties: {
          ...columnWidthProps.propertyComponent.properties,
          defineColumnWidth: false,
        },
      },
    };

    render(<LayoutPanel {...propsWithDefineOff} />);

    const defineColumnWidthCheckbox = screen.getByTestId("defineColumnWidth");
    fireEvent.click(defineColumnWidthCheckbox);

    expect(mockSetProperties).toHaveBeenCalledWith({
      [ComponentProperty.DefineColumnWidth]: true,
      [ComponentProperty.TableColumnWidth]: [],
    });
  });

  it("does not render TableColumnWidth when defineColumnWidth is false", () => {
    const propsWithDefineOff = {
      ...columnWidthProps,
      propertyComponent: {
        ...columnWidthProps.propertyComponent,
        properties: {
          ...columnWidthProps.propertyComponent.properties,
          defineColumnWidth: false,
        },
      },
    };

    render(<LayoutPanel {...propsWithDefineOff} />);

    expect(screen.queryByText("Column Widths")).not.toBeInTheDocument();
    expect(screen.queryByTestId("columnWidth-0")).not.toBeInTheDocument();
  });

  it("renders column labels correctly in TableColumnWidth section", () => {
    render(<LayoutPanel {...columnWidthProps} />);

    expect(screen.getByText("Column 1")).toBeInTheDocument();
    expect(screen.getByText("Column 2")).toBeInTheDocument();
    expect(screen.getByText("Column 3")).toBeInTheDocument();
  });

  it("falls back to default column name when label is missing", () => {
    const propsWithMissingLabel = {
      ...columnWidthProps,
      propertyComponent: {
        ...columnWidthProps.propertyComponent,
        properties: {
          ...columnWidthProps.propertyComponent.properties,
          inputColumns: [
            { id: "col1", properties: {} }, // No label
            { id: "col2", properties: { label: "Column 2" } },
          ],
          tableColumnWidth: [50, 50],
        },
      },
    };

    render(<LayoutPanel {...propsWithMissingLabel} />);

    expect(screen.getByText("Column 1")).toBeInTheDocument(); // Default fallback
    expect(screen.getByText("Column 2")).toBeInTheDocument();
  });

  it("displays error message when column widths do not sum to 100%", () => {
    const propsWithInvalidWidths = {
      ...columnWidthProps,
      propertyComponent: {
        ...columnWidthProps.propertyComponent,
        properties: {
          ...columnWidthProps.propertyComponent.properties,
          tableColumnWidth: [30, 30, 30], // Sum = 90%, not 100%
        },
      },
    };

    render(<LayoutPanel {...propsWithInvalidWidths} />);

    expect(
      screen.getByText("Column widths must sum up to 100%"),
    ).toBeInTheDocument();
  });

  it("does not display error message when column widths sum to 100%", () => {
    render(<LayoutPanel {...columnWidthProps} />);

    expect(
      screen.queryByText("Column widths must sum up to 100%"),
    ).not.toBeInTheDocument();
  });

  it("calls setProperty with updated column widths on change", () => {
    render(<LayoutPanel {...columnWidthProps} />);

    const column2Slider = screen.getByTestId("columnWidth-1");
    fireEvent.change(column2Slider, { target: { value: "35" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumnWidth,
      [30, 35, 30], // Updated array with new value
    );
  });

  it("calculates maximum width for column correctly", () => {
    // Column 1: 30%, Column 2: 40%, Column 3: 30%
    // Max for Column 2 should be 100 - (30 + 30) = 40%
    render(<LayoutPanel {...columnWidthProps} />);

    const column2Slider = screen.getByTestId("columnWidth-1");

    // Try to set beyond maximum (should be restricted)
    fireEvent.change(column2Slider, { target: { value: "80" } });

    // The actual restricted value would be calculated by getMaxWidthForColumn
    expect(mockSetProperty).toHaveBeenCalled();
  });

  it("handles empty inputColumns array gracefully", () => {
    const propsWithEmptyColumns = {
      ...columnWidthProps,
      propertyComponent: {
        ...columnWidthProps.propertyComponent,
        properties: {
          ...columnWidthProps.propertyComponent.properties,
          inputColumns: [],
          tableColumnWidth: [],
        },
      },
    };

    render(<LayoutPanel {...propsWithEmptyColumns} />);

    expect(screen.queryByTestId("columnWidth-0")).not.toBeInTheDocument();
  });
  it("updates row count when slider is changed", () => {
    const propsWithRowCount = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.RowCount],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          rowCount: 3,
        },
      },
    };

    render(<LayoutPanel {...propsWithRowCount} />);
    const rowCountSlider = screen.getByTestId("rows");
    fireEvent.change(rowCountSlider, { target: { value: "4" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.RowCount,
      Number("4"),
    );
  });

  it("renders row count slider with correct default value", () => {
    const propsWithRowCount = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.RowCount],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
        },
      },
    };

    render(<LayoutPanel {...propsWithRowCount} />);
    const rowCountSlider = screen.getByTestId("rows");
    expect(rowCountSlider).toHaveValue("3");
  });

  it("renders row count slider with correct min and max attributes", () => {
    const propsWithRowCount = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.RowCount],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          rowCount: 3,
        },
      },
    };

    render(<LayoutPanel {...propsWithRowCount} />);
    const rowCountSlider = screen.getByTestId("rows");
    expect(rowCountSlider).toHaveAttribute("min", "2");
    expect(rowCountSlider).toHaveAttribute("max", "5");
    expect(rowCountSlider).toHaveAttribute("step", "1");
  });

  it("updates row count with boundary values", () => {
    const propsWithRowCount = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.RowCount],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          rowCount: 3,
        },
      },
    };

    render(<LayoutPanel {...propsWithRowCount} />);
    const rowCountSlider = screen.getByTestId("rows");

    // Test minimum value
    fireEvent.change(rowCountSlider, { target: { value: "2" } });
    expect(mockSetProperty).toHaveBeenCalledWith(ComponentProperty.RowCount, 2);

    // Test maximum value
    fireEvent.change(rowCountSlider, { target: { value: "5" } });
    expect(mockSetProperty).toHaveBeenCalledWith(ComponentProperty.RowCount, 5);
  });

  it("updates generic column widths when slider is changed and respects max width", () => {
    const genericColumnCount = 3;
    const genericColumnWidths = [40, 30, 20];
    const mockSetProperty = jest.fn();

    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.ColumnWidths],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "stack",
        properties: {
          ...defaultProps.propertyComponent.properties,
          columns: genericColumnCount,
          columnWidths: genericColumnWidths,
          hasFixedColumns: true,
        },
      },
      setProperty: mockSetProperty,
    };

    render(<LayoutPanel {...props} />);

    const sliderId = "genericColumnWidth-0";
    const slider = screen.getByTestId(sliderId);

    fireEvent.change(slider, { target: { value: "90" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ColumnWidths,
      [50, 30, 20],
    );
  });

  it("renders row count slider with custom property value", () => {
    const propsWithCustomRowCount = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.RowCount],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          rowCount: 4,
        },
      },
    };

    render(<LayoutPanel {...propsWithCustomRowCount} />);
    const rowCountSlider = screen.getByTestId("rows");
    expect(rowCountSlider).toHaveValue("4");
  });

  it("displays correct property label for row count", () => {
    const propsWithRowCount = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.RowCount],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          rowCount: 3,
        },
      },
    };

    render(<LayoutPanel {...propsWithRowCount} />);
    expect(screen.getByText("Rows")).toBeInTheDocument();
  });

  it("renders MobileCardViewEnabled checkbox when included in propertyKeys", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.MobileCardViewEnabled],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          mobileCardViewEnabled: false,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    expect(screen.getByTestId("mobileCardViewEnabled")).toBeInTheDocument();
  });

  it("does not render MobileCardViewEnabled checkbox when not included in propertyKeys", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.Columns],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          mobileCardViewEnabled: true,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    expect(
      screen.queryByTestId("mobileCardViewEnabled"),
    ).not.toBeInTheDocument();
  });

  it("renders MobileCardViewEnabled checkbox as unchecked when mobileCardViewEnabled is false", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.MobileCardViewEnabled],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          mobileCardViewEnabled: false,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId(
      "mobileCardViewEnabled",
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("renders MobileCardViewEnabled checkbox as checked when mobileCardViewEnabled is true", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.MobileCardViewEnabled],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          mobileCardViewEnabled: true,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId(
      "mobileCardViewEnabled",
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("renders MobileCardViewEnabled checkbox as unchecked when mobileCardViewEnabled is undefined", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.MobileCardViewEnabled],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId(
      "mobileCardViewEnabled",
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("updates mobileCardViewEnabled to true when checkbox is clicked from false", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.MobileCardViewEnabled],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          mobileCardViewEnabled: false,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId(
      "mobileCardViewEnabled",
    ) as HTMLInputElement;

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MobileCardViewEnabled,
      true,
    );
  });

  it("updates mobileCardViewEnabled to false when checkbox is clicked from true", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.MobileCardViewEnabled],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          mobileCardViewEnabled: true,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    const checkbox = screen.getByTestId(
      "mobileCardViewEnabled",
    ) as HTMLInputElement;

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MobileCardViewEnabled,
      false,
    );
  });

  it("displays correct label for MobileCardViewEnabled checkbox", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.MobileCardViewEnabled],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
        },
      },
    };

    render(<LayoutPanel {...props} />);
    expect(screen.getByText("Enable Card View on Mobile")).toBeInTheDocument();
  });

  describe("CardViewVisibility", () => {
    const cardVisibilityProps = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.CardViewVisibility],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          cardViewVisibility: "always",
        },
      },
    };

    it("renders CardViewVisibility select when included in propertyKeys", () => {
      render(<LayoutPanel {...cardVisibilityProps} />);
      expect(screen.getByText("Card View Visibility")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("does not render CardViewVisibility select when not in propertyKeys", () => {
      render(<LayoutPanel {...defaultProps} />);
      expect(
        screen.queryByText("Card View Visibility"),
      ).not.toBeInTheDocument();
    });

    it("renders all three visibility options", () => {
      render(<LayoutPanel {...cardVisibilityProps} />);
      expect(screen.getByText("Always Visible")).toBeInTheDocument();
      expect(screen.getByText("Expanded Only")).toBeInTheDocument();
      expect(screen.getByText("Hidden")).toBeInTheDocument();
    });

    it("reflects pre-set cardViewVisibility value", () => {
      render(<LayoutPanel {...cardVisibilityProps} />);
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("always");
    });

    it("defaults to 'expanded' when cardViewVisibility is undefined", () => {
      const props = {
        ...cardVisibilityProps,
        propertyComponent: {
          ...cardVisibilityProps.propertyComponent,
          properties: {
            ...cardVisibilityProps.propertyComponent.properties,
            cardViewVisibility: undefined,
          },
        },
      };
      render(<LayoutPanel {...props} />);
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("expanded");
    });

    it("calls setProperty with 'expanded' when option is changed", () => {
      render(<LayoutPanel {...cardVisibilityProps} />);
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "expanded" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.CardViewVisibility,
        "expanded",
      );
    });

    it("calls setProperty with 'hidden' when option is changed", () => {
      render(<LayoutPanel {...cardVisibilityProps} />);
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "hidden" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.CardViewVisibility,
        "hidden",
      );
    });

    it("calls setProperty with 'always' when option is changed back", () => {
      const props = {
        ...cardVisibilityProps,
        propertyComponent: {
          ...cardVisibilityProps.propertyComponent,
          properties: {
            ...cardVisibilityProps.propertyComponent.properties,
            cardViewVisibility: "hidden",
          },
        },
      };
      render(<LayoutPanel {...props} />);
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "always" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.CardViewVisibility,
        "always",
      );
    });
  });

  it("updates displayAsBlocks when checkbox is toggled", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.DisplayAsBlocks],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          displayAsBlocks: false,
        },
      },
    };

    render(<LayoutPanel {...props} />);

    fireEvent.click(screen.getByLabelText("Display As Blocks"));

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DisplayAsBlocks,
      true,
    );
  });

  it("updates button type when select option changes", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.ButtonType],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          buttonType: "primary",
        },
      },
    };

    render(<LayoutPanel {...props} />);

    fireEvent.change(screen.getByTestId("buttonType"), {
      target: { value: "secondary" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ButtonType,
      "secondary",
    );
  });

  it("updates button size when option button is clicked", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.ButtonSize],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          buttonSize: "S",
        },
      },
    };

    render(<LayoutPanel {...props} />);

    fireEvent.click(screen.getByTestId("buttonSize-M"));

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ButtonSize,
      "M",
    );
  });

  it("updates field size when option button is clicked", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.FieldSize],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          fieldSize: "S",
        },
      },
    };

    render(<LayoutPanel {...props} />);

    fireEvent.click(screen.getByTestId("fieldSize-M"));

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.FieldSize,
      "M",
    );
  });

  it("does not render generic ColumnWidths for stack when hasFixedColumns is false", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.ColumnWidths],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "stack",
        properties: {
          ...defaultProps.propertyComponent.properties,
          hasFixedColumns: false,
          columns: 3,
          columnWidths: [40, 30, 30],
        },
      },
    };

    render(<LayoutPanel {...props} />);

    expect(
      screen.queryByTestId("genericColumnWidth-0"),
    ).not.toBeInTheDocument();
  });

  it("updates slider value position when changed", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.SliderValuePosition],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          sliderValuePosition: "top",
        },
      },
    };

    render(<LayoutPanel {...props} />);

    fireEvent.change(screen.getByTestId("sliderValuePosition"), {
      target: { value: "bottom" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SliderValuePosition,
      "bottom",
    );
  });

  it("updates slider value alignment when changed", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.SliderValueAlignment],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          sliderValueAlignment: "center",
        },
      },
    };

    render(<LayoutPanel {...props} />);

    fireEvent.change(screen.getByTestId("sliderValueAlignment"), {
      target: { value: "right" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SliderValueAlignment,
      "right",
    );
  });

  it("updates slider value gap when changed", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.SliderValueGap],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          sliderValueGap: 8,
        },
      },
    };

    render(<LayoutPanel {...props} />);

    fireEvent.change(screen.getByTestId("sliderValueGap"), {
      target: { value: "12" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SliderValueGap,
      12,
    );
  });
});
