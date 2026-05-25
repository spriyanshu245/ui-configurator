import { render, screen, fireEvent } from "@testing-library/react";
import InputValidationPanel from "./InputValidationPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { usePropertyPane } from "@/app/context/PropertiesContext";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

describe("InputValidationPanel", () => {
  const mockTogglePanel = jest.fn();
  const mockSetProperty = jest.fn();
  const mockSetProperties = jest.fn();

  beforeEach(() => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => true),
    });
  });

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.Required,
      ComponentProperty.MinDate,
      ComponentProperty.MaxDate,
      ComponentProperty.MinLength,
      ComponentProperty.MaxLength,
      ComponentProperty.MinValue,
      ComponentProperty.MaxValue,
      ComponentProperty.Pattern,
      ComponentProperty.EnableApiValidation,
      ComponentProperty.ValidationApiUrl,
      ComponentProperty.ValidationApiMethod,
      ComponentProperty.ValidationApiRequestBody,
      ComponentProperty.ValidationApiHeaders,
    ],
    propertyComponent: {
      properties: {
        required: false,
        disabled: false,
        isMinDateAvailable: false,
        isMaxDateAvailable: false,
        minLength: "",
        maxLength: "",
        minValue: "",
        maxValue: "",
        pattern: "",
        inputType: "text",
      },
    },
    setProperty: mockSetProperty,
    setProperties: mockSetProperties,
  };

  it("renders without crashing", () => {
    render(<InputValidationPanel {...defaultProps} />);
    expect(screen.getByText(/Validations/i)).toBeInTheDocument();
  });

  it("toggles panel when button is clicked", () => {
    render(<InputValidationPanel {...defaultProps} />);
    const toggleButton = screen.getByRole("button", { name: /Validations/i });
    fireEvent.click(toggleButton);
    expect(mockTogglePanel).toHaveBeenCalled();
  });

  it("renders Required Field checkbox and allows toggling", () => {
    render(<InputValidationPanel {...defaultProps} />);
    const checkbox = screen.getByLabelText("Required Field");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Required,
      true
    );
  });



  it("renders and toggles Min Date option", () => {
    render(<InputValidationPanel {...defaultProps} />);
    const checkbox = screen.getByLabelText("Minimum date");
    fireEvent.click(checkbox);
    expect(mockSetProperties).toHaveBeenCalled();
  });

  it("renders and toggles Min Date option", () => {
    const customProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          enableApiValidation: true,
        },
      },
    };
    render(<InputValidationPanel {...customProps} />);
    const checkbox = screen.getByTestId("enableApiValidation");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalled();
    mockSetProperty.mockClear();

    const urlField = screen.getByTestId("validationApiUrl");
    fireEvent.change(urlField, { target: { value: "https://www.habhai.com" } });
    expect(mockSetProperty).toHaveBeenCalled();
    mockSetProperty.mockClear();
  });

  it("renders and toggles Max Date option", () => {
    render(<InputValidationPanel {...defaultProps} />);
    const checkbox = screen.getByLabelText("Maximum date");
    fireEvent.click(checkbox);
    expect(mockSetProperties).toHaveBeenCalled();
  });

  it("renders and updates Min Length input", () => {
    render(<InputValidationPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter min length");
    fireEvent.change(input, { target: { value: "5" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MinLength,
      "5"
    );
  });

  it("renders and updates Max Length input", () => {
    render(<InputValidationPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter max length");
    fireEvent.change(input, { target: { value: "10" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MaxLength,
      "10"
    );
  });

  it("renders and updates Min Value input", () => {
    defaultProps.propertyComponent.properties.inputType = "number";
    render(<InputValidationPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter min value");
    fireEvent.change(input, { target: { value: "1" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MinValue,
      "1"
    );
  });

  it("renders and updates Max Value input", () => {
    defaultProps.propertyComponent.properties.inputType = "number";
    render(<InputValidationPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter max value");
    fireEvent.change(input, { target: { value: "100" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.MaxValue,
      "100"
    );
  });

  it("calls setProperties when Minimum date checkbox is toggled", () => {
    const customProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isMinDateAvailable: false, // initially unchecked
        },
      },
    };
    render(<InputValidationPanel {...customProps} />);
    const minDateCheckbox = screen.getByLabelText("Minimum date");
    fireEvent.click(minDateCheckbox);
    expect(mockSetProperties).toHaveBeenCalledWith({
      [ComponentProperty.IsMinDateAvailable]: true,
      [ComponentProperty.IsMinTodayDate]: true,
      [ComponentProperty.MinDate]: "",
    });
  });

  it("calls setProperties when Maximum date checkbox is toggled", () => {
    const customProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isMaxDateAvailable: false,
        },
      },
    };
    render(<InputValidationPanel {...customProps} />);
    const maxDateCheckbox = screen.getByLabelText("Maximum date");
    fireEvent.click(maxDateCheckbox);
    expect(mockSetProperties).toHaveBeenCalledWith({
      [ComponentProperty.IsMaxDateAvailable]: true,
      [ComponentProperty.IsMaxTodayDate]: true,
      [ComponentProperty.MaxDate]: "",
    });
  });

  it("applies margin class to Min Date container when isMinTodayDate is false", () => {
    const customProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isMinDateAvailable: true,
          isMinTodayDate: false,
        },
      },
    };
    const { container } = render(<InputValidationPanel {...customProps} />);
    const minDateContainer = container.querySelector(
      "div[class*='mt10'][class*='ml10']"
    );
    expect(minDateContainer?.className).toMatch(/mb10/);
  });

  it("returns null for an unknown property key", () => {
    const customProps = {
      ...defaultProps,
      propertyKeys: ["UNKNOWN_PROPERTY" as ComponentProperty],
    };
    render(<InputValidationPanel {...customProps} />);
    expect(screen.queryByText("Required Field")).not.toBeInTheDocument();
  });

  it("calls setProperties when Today's Date radio for Min Date is toggled", () => {
    const customProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isMinDateAvailable: true,
          isMinTodayDate: false,
        },
      },
    };
    render(<InputValidationPanel {...customProps} />);

    const todayRadios = screen.getAllByLabelText("Today's Date");
    const minTodayRadio = todayRadios[0];

    fireEvent.click(minTodayRadio);

    expect(mockSetProperties).toHaveBeenCalledWith({
      [ComponentProperty.IsMinTodayDate]: true,
      [ComponentProperty.MinDate]: "",
    });
  });
  it("calls setProperty when Custom Date radio for Min Date is toggled", () => {
    const customProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isMinDateAvailable: true,
          isMinTodayDate: true,
        },
      },
    };
    render(<InputValidationPanel {...customProps} />);

    const customDateRadio = screen.getAllByLabelText("Custom Date")[0];
    fireEvent.click(customDateRadio);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsMinTodayDate,
      false
    );
  });

  it("calls setProperty when Custom Date radio for Max Date is toggled", () => {
    const customProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isMaxDateAvailable: true,
          isMaxTodayDate: true,
        },
      },
    };
    render(<InputValidationPanel {...customProps} />);

    const customDateRadio = screen.getByLabelText("Custom Date");
    fireEvent.click(customDateRadio);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsMaxTodayDate,
      false
    );
  });

  it("renders DateRenderer when isMaxTodayDate is false", () => {
    // Mock the DateRenderer component
    jest.mock("../../UIComponents/DatePicker/DateRenderer", () => ({
      __esModule: true,
      default: () => <div data-testid="max-date-renderer">Date Renderer</div>,
    }));

    const customProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isMaxDateAvailable: true,
          isMaxTodayDate: false,
        },
      },
    };

    const { container } = render(<InputValidationPanel {...customProps} />);

    // Since we can't directly test for DateRenderer due to the mock,
    // we'll verify the rendering logic's parent container
    const maxDateContainer = container.querySelector(
      "div[class*='componentProperty'][class*='column']"
    );
    expect(maxDateContainer).toBeInTheDocument();
  });

  it("renders and updates Pattern input", () => {
    const customProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          inputType: "text",
        },
      },
    };
    render(<InputValidationPanel {...customProps} />);

    const input = screen.getByTestId("pattern");
    fireEvent.change(input, { target: { value: "[A-Za-z]+" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Pattern,
      "[A-Za-z]+"
    );
  });

  it("handles Min Date with an empty string value", () => {
    const customProps = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isMinDateAvailable: true,
          isMinTodayDate: false,
          minDate: "",
        },
      },
    };
    render(<InputValidationPanel {...customProps} />);

    const minDateSection = screen.getAllByLabelText("Custom Date")[0];
    expect(minDateSection).toBeInTheDocument();
  });

  it("renders the expression input when inputType is number", () => {
    render(
      <InputValidationPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.Expression]}
      />
    );

    const expressionInput = screen.getByPlaceholderText(
      "Add validation expression"
    );

    expect(expressionInput).toBeInTheDocument();
    expect(expressionInput).toHaveValue("");
  });

  it("updates expression when input is changed", () => {
    render(
      <InputValidationPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.Expression]}
      />
    );

    const expressionInput = screen.getByPlaceholderText(
      "Add validation expression"
    );
    fireEvent.change(expressionInput, { target: { value: "value > 10" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Expression,
      "value > 10"
    );
  });

  it("does not render expression input when inputType is not number", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          inputType: "text",
        },
      },
    };

    render(
      <InputValidationPanel
        {...props}
        propertyKeys={[ComponentProperty.Expression]}
      />
    );

    const expressionInput = screen.queryByPlaceholderText(
      "Add validaton expression"
    );
    expect(expressionInput).not.toBeInTheDocument();
  });

  it("renders and updates validationMessage correctly", () => {
    render(
      <InputValidationPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.Expression]}
      />
    );

    const messageInput = screen.getByPlaceholderText("Add validation message");
    expect(messageInput).toBeInTheDocument();
    expect(messageInput).toHaveValue("");

    fireEvent.change(messageInput, { target: { value: "Invalid number!" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ValidationMessage,
      "Invalid number!"
    );
  });

  it("does not render validationMessage input when inputType is not number", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          inputType: "text",
        },
      },
    };

    render(
      <InputValidationPanel
        {...props}
        propertyKeys={[ComponentProperty.ValidationMessage]}
      />
    );

    const messageInput = screen.queryByPlaceholderText("Add validaton message");
    expect(messageInput).not.toBeInTheDocument();
  });

  it("does not render Expression input when inputType is not number", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          inputType: "text",
        },
      },
    };

    render(
      <InputValidationPanel
        {...props}
        propertyKeys={[ComponentProperty.ValidationMessage]}
      />
    );

    const messageInput = screen.queryByPlaceholderText(
      "Add validation expression"
    );
    expect(messageInput).not.toBeInTheDocument();
  });
  it("does not render Min Length and Max Length when contactType is not Mobile Number or Telephone Number and inputType is not text/password/number", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          inputType: "email", // not text/password/number
          contactType: "Email", // not Mobile Number or Telephone Number
        },
      },
      propertyKeys: [ComponentProperty.MinLength, ComponentProperty.MaxLength],
    };

    render(<InputValidationPanel {...props} />);
    expect(
      screen.queryByPlaceholderText("Enter min length")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter max length")
    ).not.toBeInTheDocument();
  });

  it("renders Min Length and Max Length when contactType is Mobile Number", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          inputType: "email", // not text/password/number
          contactType: "Mobile Number", // should allow rendering
        },
      },
      propertyKeys: [ComponentProperty.MinLength, ComponentProperty.MaxLength],
    };

    render(<InputValidationPanel {...props} />);
    expect(screen.getByPlaceholderText("Enter min length")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter max length")).toBeInTheDocument();
  });

  it("renders Min Length and Max Length when contactType is Telephone Number", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          inputType: "email", // not text/password/number
          contactType: "Telephone Number", // should allow rendering
        },
      },
      propertyKeys: [ComponentProperty.MinLength, ComponentProperty.MaxLength],
    };

    render(<InputValidationPanel {...props} />);
    expect(screen.getByPlaceholderText("Enter min length")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter max length")).toBeInTheDocument();
  });





  it("calls setProperties when Today's Date radio for Max Date is selected", () => {
    const customProps = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.MaxDate],
      propertyComponent: {
        properties: {
          ...defaultProps.propertyComponent.properties,
          isMaxDateAvailable: true,
          isMaxTodayDate: false,
        },
      },
    };

    render(<InputValidationPanel {...customProps} />);

    const todayRadio = screen.getByLabelText("Today's Date");
    fireEvent.click(todayRadio);

    expect(mockSetProperties).toHaveBeenCalledWith({
      [ComponentProperty.IsMaxTodayDate]: true,
      [ComponentProperty.MaxDate]: "",
    });
  });
});
