import { render, screen, fireEvent } from "@testing-library/react";
import FieldRestrictionsPanel from "./FieldRestrictionsPanel";
import { ComponentProperty } from "../../../data/componentProperties";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { PropertyPanels } from "../../../utils/constants";

jest.mock("../../../context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("../../../components/SVGIcons/ChevronDown", () => {
  return function ChevronDownIcon() {
    return <div data-testid="chevron-down-icon" />;
  };
});

describe("FieldRestrictionsPanel", () => {
  const mockTogglePanel = jest.fn();
  const mockSetProperty = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => true),
    });
  });

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.AllowAutoFill,
      ComponentProperty.AllowNegative,
      ComponentProperty.Disabled,
      ComponentProperty.IsCurrency,
      ComponentProperty.CurrencyName,
      ComponentProperty.DecimalPrecision,
      ComponentProperty.IsRowPrecision,
      ComponentProperty.RowDecimalPrecisionKey,
      ComponentProperty.ActionType,
    ],
    propertyComponent: {
      id: "test-component",
      properties: {
        allowAutoFill: false,
        allowNegative: false,
        disabled: false,
        isCurrency: false,
        isRowPrecision: false,
        rowDecimalPrecisionKey: null,
        decimalPrecision: 2,
        currencyName: null,
        inputType: "number",
      },
    },
    setProperty: mockSetProperty,
  };

  it("renders without crashing", () => {
    render(<FieldRestrictionsPanel {...defaultProps} />);
    expect(screen.getByText(/Field Restrictions/i)).toBeInTheDocument();
  });

  it("renders the toggle button with correct attributes", () => {
    render(<FieldRestrictionsPanel {...defaultProps} />);
    const toggleButton = screen.getByTestId("toggleButton");
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute("id", "toggleButton");
    expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
  });

  it("calls togglePanel when toggle button is clicked", () => {
    render(<FieldRestrictionsPanel {...defaultProps} />);
    const toggleButton = screen.getByTestId("toggleButton");
    fireEvent.click(toggleButton);
    expect(mockTogglePanel).toHaveBeenCalledWith(
      PropertyPanels.FieldRestrictionsPanel
    );
  });

  it("shows panel content when isPanelOpen returns true", () => {
    render(<FieldRestrictionsPanel {...defaultProps} />);
    expect(screen.getByLabelText("allow auto-fill")).toBeInTheDocument();
  });

  it("hides panel content when isPanelOpen returns false", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => false),
    });
    render(<FieldRestrictionsPanel {...defaultProps} />);
    expect(screen.queryByLabelText("allow auto-fill")).not.toBeInTheDocument();
  });

  describe("AllowAutoFill property", () => {
    it("renders AllowAutoFill checkbox with correct properties", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      const checkbox = screen.getByLabelText("allow auto-fill");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
      expect(checkbox).not.toBeChecked();
    });

    it("calls setProperty when AllowAutoFill checkbox is changed", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      const checkbox = screen.getByLabelText("allow auto-fill");
      fireEvent.click(checkbox);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.AllowAutoFill,
        true
      );
    });
  });

  describe("AllowNegative property", () => {
    it("renders AllowNegative checkbox for number input type", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      expect(
        screen.getByLabelText("Allow Negative Number")
      ).toBeInTheDocument();
    });

    it("does not render AllowNegative for non-number input types", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            inputType: "text",
            columnInputType: "text",
          },
        },
      };
      render(<FieldRestrictionsPanel {...props} />);
      expect(
        screen.queryByLabelText("Allow Negative Number")
      ).not.toBeInTheDocument();
    });

    it("calls setProperty when AllowNegative checkbox is changed", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      const checkbox = screen.getByLabelText("Allow Negative Number");
      fireEvent.click(checkbox);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.AllowNegative,
        true
      );
    });
  });

  describe("Disabled property", () => {
    it("renders Disabled checkbox", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      expect(screen.getByLabelText("Disabled Field")).toBeInTheDocument();
    });

    it("calls setProperty when Disabled checkbox is changed", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      const checkbox = screen.getByLabelText("Disabled Field");
      fireEvent.click(checkbox);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.Disabled,
        true
      );
    });
  });

  describe("IsCurrency property", () => {
    it("renders IsCurrency checkbox", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      expect(screen.getByLabelText("Is Currency")).toBeInTheDocument();
    });

    it("calls setProperty when IsCurrency checkbox is changed", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      const checkbox = screen.getByLabelText("Is Currency");
      fireEvent.click(checkbox);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.IsCurrency,
        true
      );
    });
  });

  describe("CurrencyName property", () => {
    it("does not render CurrencyName when isCurrency is false", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      expect(screen.queryByLabelText("Currency Name")).not.toBeInTheDocument();
    });

    it("renders CurrencyName select when isCurrency is true", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            isCurrency: true,
          },
        },
      };
      render(<FieldRestrictionsPanel {...props} />);
      expect(screen.getByTestId("currencyName")).toBeInTheDocument();
    });

    it("calls setProperty when CurrencyName select is changed", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            isCurrency: true,
          },
        },
      };
      render(<FieldRestrictionsPanel {...props} />);
      const select = screen.getByTestId("currencyName");
      fireEvent.change(select, { target: { value: "en-US" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.CurrencyName,
        "en-US"
      );
    });
  });

  describe("DecimalPrecision property", () => {
    it("renders DecimalPrecision number input", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      expect(screen.getByTestId("decimal")).toBeInTheDocument();
    });

    it("calls setProperty when DecimalPrecision input is changed with valid number", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      const input = screen.getByTestId("decimal");
      fireEvent.change(input, { target: { value: "3" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.DecimalPrecision,
        3
      );
    });

    it("calls setProperty with empty string when DecimalPrecision input is cleared", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      const input = screen.getByTestId("decimal");
      fireEvent.change(input, { target: { value: "" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.DecimalPrecision,
        ""
      );
    });
  });

  describe("IsRowPrecision property", () => {
    it("renders IsRowPrecision checkbox", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      expect(
        screen.getByLabelText("Set Dynamic Decimal Precision")
      ).toBeInTheDocument();
    });

    it("calls setProperty when IsRowPrecision checkbox is changed", () => {
      render(<FieldRestrictionsPanel {...defaultProps} />);
      const checkbox = screen.getByLabelText("Set Dynamic Decimal Precision");
      fireEvent.click(checkbox);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.IsRowPrecision,
        true
      );
    });
  });

  describe("RowDecimalPrecisionKey property", () => {
    it("renders RowDecimalPrecisionKey text input when isRowPrecision is true", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            isRowPrecision: true,
          },
        },
      };
      render(<FieldRestrictionsPanel {...props} />);
      expect(screen.getByTestId("rowDecimalPrecisionKey")).toBeInTheDocument();
    });

    it("calls setProperty when RowDecimalPrecisionKey input is changed", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            isRowPrecision: true,
          },
        },
      };
      render(<FieldRestrictionsPanel {...props} />);
      const input = screen.getByTestId("rowDecimalPrecisionKey");
      fireEvent.change(input, { target: { value: "precision_key" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.RowDecimalPrecisionKey,
        "precision_key"
      );
    });
  });

  it("renders correct CSS classes for panel heading", () => {
    render(<FieldRestrictionsPanel {...defaultProps} />);
    const toggleButton = screen.getByTestId("toggleButton");
    expect(toggleButton).toHaveClass("panelHeading", "isOpen");
  });

  it("renders correct CSS classes when panel is closed", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => false),
    });
    render(<FieldRestrictionsPanel {...defaultProps} />);
    const toggleButton = screen.getByTestId("toggleButton");
    expect(toggleButton).toHaveClass("panelHeading");
    expect(toggleButton).not.toHaveClass("isOpen");
  });

  it("handles missing properties gracefully", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "test-component",
        properties: {},
      },
    };
    render(<FieldRestrictionsPanel {...props} />);
    expect(screen.getByText(/Field Restrictions/i)).toBeInTheDocument();
  });

  it("renders only specified property keys", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [
        ComponentProperty.AllowAutoFill,
        ComponentProperty.Disabled,
      ],
    };
    render(<FieldRestrictionsPanel {...props} />);
    expect(screen.getByLabelText("allow auto-fill")).toBeInTheDocument();
    expect(screen.getByLabelText("Disabled Field")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Allow Negative Number")
    ).not.toBeInTheDocument();
  });

  it("handles columnInputType for AllowNegative property", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,

          columnInputType: "number",
        },
      },
    };
    render(<FieldRestrictionsPanel {...props} />);
    expect(screen.getByLabelText("Allow Negative Number")).toBeInTheDocument();
  });

  it("handles null/undefined togglePanel gracefully", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: null,
      isPanelOpen: jest.fn(() => true),
    });
    render(<FieldRestrictionsPanel {...defaultProps} />);
    const toggleButton = screen.getByTestId("toggleButton");
    fireEvent.click(toggleButton);
    // Should not throw an error
    expect(toggleButton).toBeInTheDocument();
  });
});
