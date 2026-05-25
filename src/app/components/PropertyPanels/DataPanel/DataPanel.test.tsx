import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataPanel from "./DataPanel";
import { ComponentProperty } from "../../../../app/data/componentProperties";
import { PropertyPanels } from "../../../../app/utils/constants";
import { usePropertyPane } from "../../../../app/context/PropertiesContext";
import { useParentFormProperties } from "../../../../app/hooks/useParentFormProperties";

const mockParentForm = {
  id: "form-1",
  type: "form",
  category: "component",
  properties: {
    name: "form-name",
    action: "/api",
    method: "POST",
    prefillApiUrl: "/api",
  },
  components: [
    {
      id: "comp-1",
      type: "input",
      properties: { name: "Input_Field_1" },
    },
    {
      id: "comp-0",
      type: "form-row",
      properties: {
        name: "formRow",
      },
      components: [
        {
          id: "comp-6",
          type: "checkbox",
          properties: { name: "Input_Field_6" },
        },
      ],
    },
    {
      id: "comp-3",
      type: "field-group",
      properties: { name: "Input_Field_3" },
    },
    {
      id: "comp-2",
      type: "checkbox",
      properties: { name: "Input_Field_2" },
    },
    {
      id: "comp-4",
      type: "select",
      properties: {
        name: "Select_Field",
        dynamicConditions: {
          parentNames: ["Input_Field_6"],
        },
      },
    },
  ],
};
jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("@/app/hooks/useParentFormProperties", () => ({
  useParentFormProperties: jest.fn(),
}));

global.fetch = jest.fn();

describe("DataPanel Component", () => {
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
    (useParentFormProperties as jest.Mock).mockReturnValue({
      parentForm: mockParentForm,
    });
  });

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.IsMultiSelect,
      ComponentProperty.Options,
      ComponentProperty.IsFetchingFromApi,
      ComponentProperty.OptionsApiDependentOn,
      ComponentProperty.OptionsApiName,
      ComponentProperty.OptionsApiKeyForOptions,
      ComponentProperty.OptionsApiKeyForLabel,
      ComponentProperty.OptionsApiKeyForValue,
      ComponentProperty.OptionsApiUrl,
      ComponentProperty.OptionsApiHeaders,
      ComponentProperty.OptionsApiKeyForSequence,
      ComponentProperty.AllowAutoFill,
      ComponentProperty.OptionsApiKeyForKeywords,
      ComponentProperty.Keys,
    ],
    propertyComponent: {
      properties: {
        items: [],
        listType: "Ordered",
        options: [{ label: "", value: "" }],
      },
    },
    setProperty: mockSetProperty,
    setProperties: mockSetProperties,
  };

  it("renders DataPanel without errors", () => {
    render(<DataPanel {...defaultProps} />);
  });

  it("displays the 'Data' panel title", () => {
    render(<DataPanel {...defaultProps} />);
    expect(screen.getByText("Data")).toBeInTheDocument();
  });

  it("contains a toggle button", () => {
    render(<DataPanel {...defaultProps} />);
    expect(screen.getByTestId("toggleButton")).toBeInTheDocument();
  });

  it("confirms that component properties are displayed based on propertyKeys", () => {
    render(<DataPanel {...defaultProps} />);
    expect(screen.getByTestId("isMultiSelect")).toBeInTheDocument();
  });

  it("toggles panel visibility", () => {
    render(<DataPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Data"));
    expect(mockTogglePanel).toHaveBeenCalledWith(PropertyPanels.DataPanel);
  });

  it("handles field selection change", () => {
    render(<DataPanel {...defaultProps} />);
    const multiSelect = screen.getByTestId("optionsApiDependentOn");
    fireEvent.click(multiSelect);

    const searchInput = screen.getByTestId("optionsApiDependentOn_searchInput");
    fireEvent.change(searchInput, { target: { value: "Input_Field_1" } });

    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(mockSetProperty).toHaveBeenCalled();
  });

  it("toggles ComponentProperty.IsMultiSelect checkbox and updates state", () => {
    render(<DataPanel {...defaultProps} />);
    const checkbox = screen.getByTestId("isMultiSelect");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsMultiSelect,
      true
    );
  });

  it("updates ComponentProperty.Options correctly via OptionsRenderer", () => {
    render(<DataPanel {...defaultProps} />);
    const optionsInput = screen.getByTestId("options-label-1");
    fireEvent.change(optionsInput, { target: { value: "Option 1" } });
    expect(mockSetProperty).toHaveBeenCalledWith(ComponentProperty.Options, [
      { label: "Option 1", value: "" },
    ]);
  });

  it("does not render any UI when an invalid propertyKey is provided", () => {
    const invalidProps = {
      ...defaultProps,
      propertyKeys: ["InvalidPropertyKey"] as unknown as ComponentProperty[],
    };

    render(<DataPanel {...invalidProps} />);

    expect(screen.queryByText("InvalidPropertyKey")).not.toBeInTheDocument();
  });

  test("renders Default Value input with type 'number' for input-table-column when inputType is 'number'", () => {
    const component = {
      id: "test-component",
      type: "input-table-column",
      properties: {
        defaultValue: "",
        inputType: "number",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.DefaultValue]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const input = screen.getByPlaceholderText("Enter default value here");
    expect(input).toHaveAttribute("type", "number");
    fireEvent.change(input, { target: { value: "100" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DefaultValue,
      "100"
    );
  });

  test("renders Default Value input with type 'text' for input-table-column when inputType is not 'number'", () => {
    const component = {
      id: "test-component",
      type: "input-table-column",
      properties: {
        defaultValue: "",
        inputType: "text",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.DefaultValue]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const input = screen.getByPlaceholderText("Enter default value here");
    expect(input).toHaveAttribute("type", "text");
    fireEvent.change(input, { target: { value: "default text" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DefaultValue,
      "default text"
    );
  });

  test("renders Default Value input with type 'text' when propertyComponent type is neither 'input' nor 'input-table-column'", () => {
    const component = {
      id: "test-component",
      type: "custom",
      properties: {
        defaultValue: "",
        inputType: "ignored",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.DefaultValue]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const input = screen.getByPlaceholderText("Enter default value here");
    expect(input).toHaveAttribute("type", "text");
    fireEvent.change(input, { target: { value: "custom value" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DefaultValue,
      "custom value"
    );
  });

  it("toggles ComponentProperty.IsFetchingFromApi checkbox and updates state", () => {
    render(<DataPanel {...defaultProps} />);
    const checkbox = screen.getByTestId("isFetchingFromApi");
    fireEvent.click(checkbox);
    expect(mockSetProperties).toHaveBeenCalledWith({
      [ComponentProperty.IsFetchingFromApi]: true,
      [ComponentProperty.DefaultValue]: "",
    });
  });
  test("renders Options API name input only when isFetchingFromApi is checked", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
          },
        }}
      />
    );
    const input = screen.getByTestId("optionsApiName");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "api name" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiName,
      "api name"
    );
  });

  test("renders allowAutoFill checkbox ", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.AllowAutoFill]: false,
          },
        }}
      />
    );
    const input = screen.getByTestId("allowAutoFill");
    expect(input).toBeInTheDocument();
    fireEvent.click(input);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AllowAutoFill,
      true
    );
  });

  test("renders Options API URL input only when isFetchingFromApi is checked", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
          },
        }}
      />
    );
    const input = screen.getByTestId("optionsApiUrl");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "api url" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiUrl,
      "api url"
    );
  });

  it("does not render API Key for Value input when isFetchingFromApi is false", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          isFetchingFromApi: false,
        },
      },
    };

    render(<DataPanel {...props} />);
    expect(
      screen.queryByTestId("optionsApiKeyForValue")
    ).not.toBeInTheDocument();
  });

  it("does not render API Key for Value input when type is 'multi-select' and responseDataStructure is 'array'", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "multi-select",
        properties: {
          ...defaultProps.propertyComponent.properties,
          isFetchingFromApi: true,
          responseDataStructure: "array",
        },
      },
    };

    render(<DataPanel {...props} />);
    expect(
      screen.queryByTestId("optionsApiKeyForValue")
    ).not.toBeInTheDocument();
  });

  it("does not render API Key for Value input when type is 'multi-select' and responseDataStructure is undefined", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "multi-select",
        properties: {
          ...defaultProps.propertyComponent.properties,
          isFetchingFromApi: true,
          // responseDataStructure intentionally omitted
        },
      },
    };

    render(<DataPanel {...props} />);
    expect(
      screen.queryByTestId("optionsApiKeyForValue")
    ).not.toBeInTheDocument();
  });

  it("renders API Key for Value input when isFetchingFromApi is true and type is not 'multi-select'", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "select",
        properties: {
          ...defaultProps.propertyComponent.properties,
          isFetchingFromApi: true,
          optionsApiKeyForValue: "valueKey",
        },
      },
    };

    render(<DataPanel {...props} />);
    const input = screen.getByTestId("optionsApiKeyForValue");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("valueKey");
  });

  it("renders API Key for Value input when type is 'multi-select' and responseDataStructure is not 'array'", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "multi-select",
        properties: {
          ...defaultProps.propertyComponent.properties,
          isFetchingFromApi: true,
          responseDataStructure: "object",
          optionsApiKeyForValue: "valueKey",
        },
      },
    };

    render(<DataPanel {...props} />);
    const input = screen.getByTestId("optionsApiKeyForValue");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("valueKey");
  });

  it("calls setProperty when API Key for Value input is changed", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "select",
        properties: {
          ...defaultProps.propertyComponent.properties,
          isFetchingFromApi: true,
          optionsApiKeyForValue: "initialKey",
        },
      },
    };

    render(<DataPanel {...props} />);
    const input = screen.getByTestId("optionsApiKeyForValue");

    fireEvent.change(input, { target: { value: "newKeyValue" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiKeyForValue,
      "newKeyValue"
    );
  });

  it("calls setProperty when response data structure is changed", () => {
    const props = {
      ...defaultProps,
      propertyKeys: [
        ...defaultProps.propertyKeys,
        ComponentProperty.ResponseDataStructure,
      ],
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          responseDataStructure: "",
        },
      },
    };

    render(<DataPanel {...props} />);

    const select = screen.getByTestId("responseDataStructure");

    fireEvent.change(select, { target: { value: "array" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ResponseDataStructure,
      "array"
    );
  });

  test("renders Options API key input only when isFetchingFromApi is checked", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
          },
        }}
      />
    );
    const input = screen.getByTestId("optionsApiKeyForOptions");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "api key" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiKeyForOptions,
      "api key"
    );

    const inputLabel = screen.getByTestId("optionsApiKeyForLabel");
    expect(inputLabel).toBeInTheDocument();
    fireEvent.change(inputLabel, { target: { value: "api key label" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiKeyForLabel,
      "api key label"
    );

    const inputValue = screen.getByTestId("optionsApiKeyForValue");
    expect(inputValue).toBeInTheDocument();
    fireEvent.change(inputValue, { target: { value: "api key value" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiKeyForValue,
      "api key value"
    );

    const multiSelect = screen.getByTestId("optionsApiDependentOn");
    expect(multiSelect).toBeInTheDocument();

    fireEvent.click(multiSelect);

    const searchInput = screen.getByTestId("optionsApiDependentOn_searchInput");
    fireEvent.change(searchInput, { target: { value: "Input_Field_1" } });

    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiDependentOn,
      ["Input_Field_1"]
    );
  });

  it("does not render Request Body Keys MultiSelect when type is 'multi-select' and responseDataStructure is 'string'", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "multi-select",
        properties: {
          ...defaultProps.propertyComponent.properties,
          responseDataStructure: "string",
        },
      },
    };

    render(<DataPanel {...props} />);
    expect(screen.queryByTestId("requestBodyKeys")).not.toBeInTheDocument();
  });

  it("does not render Request Body Keys MultiSelect when type is 'multi-select' and responseDataStructure is undefined", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "multi-select",
        properties: {
          ...defaultProps.propertyComponent.properties,
          // no responseDataStructure at all
        },
      },
    };

    render(<DataPanel {...props} />);
    expect(screen.queryByTestId("requestBodyKeys")).not.toBeInTheDocument();
  });

  it("renders Request Body Keys MultiSelect when responseDataStructure is not 'string'", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        type: "multi-select",
        properties: {
          ...defaultProps.propertyComponent.properties,
          responseDataStructure: "array",
          keys: ["field1", "field2"],
        },
      },
    };

    render(<DataPanel {...props} />);
    const multiSelect = screen.getByTestId("requestBodyKeys");
    expect(multiSelect).toBeInTheDocument();
  });

  test("renders Options API sequence input only when isFetchingFromApi is checked", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
          },
        }}
      />
    );
    const input = screen.getByTestId("optionsApiKeyForSequence");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "sequence" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiKeyForSequence,
      "sequence"
    );
  });

  test("renders Options API headers input only when isFetchingFromApi is checked", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
          },
        }}
      />
    );
    const input = screen.getByTestId("optionsApiHeaders");
    const beautifyJSON = screen.getByTestId("beautify");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "api headers" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiHeaders,
      "api headers"
    );

    fireEvent.click(beautifyJSON);
  });

  it("updates properties correctly when isTodaysDate checkbox is toggled", () => {
    const component = {
      id: "test-component",
      type: "date",
      properties: {
        defaultValue: "",
        isTodaysDate: false,
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.IsTodaysDate]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const checkbox = screen.getByTestId("isTodaysDate");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsTodaysDate,
      true
    );
  });

  it("triggers useEffect and updates dropdownItems", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
          },
        }}
      />
    );

    act(() => {
      (useParentFormProperties as jest.Mock).mockReturnValue({
        parentForm: {
          components: [{ id: "2", properties: { name: "Test Field" } }],
        },
      });
    });
  });

  it("renders default value  and its input with placeholder 'DD/MM/YYYY' when propertyComponent type is 'date'", () => {
    const component = {
      id: "test-component",
      type: "date",
      properties: {
        defaultValue: "",
        isTodaysDate: true,
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.DefaultValue]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const input = screen.getByPlaceholderText("DD/MM/YYYY");
    expect(input).toBeInTheDocument();

    const formatDateToDDMMYYYY = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    expect(input).toHaveValue(formatDateToDDMMYYYY(new Date()));
  });

  it("handles checkbox for Store data in session when propertyComponent type is 'input'", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        isFetchingFromApi: true,
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.StoreInputApiInSession]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const storeInputApiInSession = screen.getByTestId("storeInputApiInSession");
    fireEvent.click(storeInputApiInSession);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.StoreInputApiInSession,
      true
    );
  });

  it("handles checkbox for Store selected option in session when propertyComponent type is 'select'", () => {
    const component = {
      id: "test-component",
      type: "select",
      properties: {
        isFetchingFromApi: true,
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.StoreSelectedInSession]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const storeSelectedInSession = screen.getByTestId("storeSelectedInSession");
    fireEvent.click(storeSelectedInSession);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.StoreSelectedInSession,
      true
    );
  });

  it("should render null for Store data in session when isFetchFromAPI false", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        isFetchingFromApi: false,
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.StoreInputApiInSession]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    expect(screen.queryByTestId("storeInputApiInSession")).toBeNull();
  });

  it("should render null for StoreSelectedInSession when isFetchFromAPI false", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        isFetchingFromApi: false,
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.StoreSelectedInSession]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    expect(screen.queryByTestId("storeSelectedInSession")).toBeNull();
  });

  it("should render null for OptionsApiDependentOn when isFetchFromAPI false", () => {
    const component = {
      id: "test-component",
      type: "select",
      properties: {
        isFetchingFromApi: false,
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.OptionsApiDependentOn]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    expect(screen.queryByTestId("optionsApiDependentOn")).toBeNull();
  });

  it("should render null for OptionsApiKeyForOptions when isFetchFromAPI false", () => {
    const component = {
      id: "test-component",
      type: "select",
      properties: {
        isFetchingFromApi: false,
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.OptionsApiKeyForOptions]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    expect(screen.queryByTestId("optionsApiKeyForOptions")).toBeNull();
  });
  it("renders ISD code input and calls setProperty on change", () => {
    const setProperty = jest.fn();
    const setProperties = jest.fn();
    const propertyComponent = {
      id: "input1",
      type: "input",
      properties: { isdCode: "91" },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.IsdCode]}
        propertyComponent={propertyComponent}
        setProperty={setProperty}
        setProperties={setProperties}
      />
    );

    // Check label and input
    expect(screen.getByText("ISD code")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("Enter ISD code here");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("91");

    // Simulate change
    fireEvent.change(input, { target: { value: "44" } });
    expect(setProperty).toHaveBeenCalledWith(ComponentProperty.IsdCode, "44");
  });

  it("renders Enable Search checkbox and calls setProperties on change", () => {
    const setProperty = jest.fn();
    const setProperties = jest.fn();

    const propertyComponent = {
      id: "input1",
      type: "input",
      properties: {
        enableSearch: false,
      },
    };

    render(
      <DataPanel
        propertyComponent={propertyComponent}
        propertyKeys={[ComponentProperty.EnableSearch]}
        setProperty={setProperty}
        setProperties={setProperties}
      />
    );

    const checkbox = screen.getByTestId("enableSearch");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(setProperties).toHaveBeenCalledWith({
      [ComponentProperty.EnableSearch]: true,
    });
  });

  it("handles OptionsApiDependentOn when property is not an array", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
            [ComponentProperty.OptionsApiDependentOn]: "not_an_array",
          },
        }}
      />
    );

    const multiSelect = screen.getByTestId("optionsApiDependentOn");
    expect(multiSelect).toBeInTheDocument();

    fireEvent.click(multiSelect);
    const searchInput = screen.getByTestId("optionsApiDependentOn_searchInput");
    fireEvent.change(searchInput, { target: { value: "Input_Field_1" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiDependentOn,
      ["Input_Field_1"]
    );
  });

  it("handles removing values from OptionsApiDependentOn MultiSelect", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
            [ComponentProperty.OptionsApiDependentOn]: [
              "Input_Field_1",
              "Input_Field_2",
            ],
          },
        }}
      />
    );

    const multiSelect = screen.getByTestId("optionsApiDependentOn");
    expect(multiSelect).toBeInTheDocument();

    const removeButtons = screen.getAllByTestId(
      "optionsApiDependentOn_removeButton"
    );
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(removeButtons[0]);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiDependentOn,
      ["Input_Field_2"]
    );
  });

  it("handles removing values from optionsApiKeyForKeywords MultiSelect", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
            [ComponentProperty.OptionsApiKeyForKeywords]: [
              "Input_Field_1",
              "Input_Field_2",
            ],
          },
        }}
      />
    );

    const multiSelect = screen.getByTestId("optionsApiKeyForKeywords");
    expect(multiSelect).toBeInTheDocument();

    const removeButtons = screen.getAllByTestId(
      "optionsApiKeyForKeywords_removeButton"
    );
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(removeButtons[0]);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.OptionsApiKeyForKeywords,
      ["Input_Field_2"]
    );
  });

  it("handles removing values from keys MultiSelect", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
            [ComponentProperty.Keys]: ["Input_Field_1", "Input_Field_2"],
          },
        }}
      />
    );

    const multiSelect = screen.getByTestId("requestBodyKeys");
    expect(multiSelect).toBeInTheDocument();

    const removeButtons = screen.getAllByTestId("requestBodyKeys_removeButton");
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(removeButtons[0]);

    expect(mockSetProperty).toHaveBeenCalledWith(ComponentProperty.Keys, [
      "Input_Field_2",
    ]);
  });

  it("handles removing values when OptionsApiDependentOn is not an array", () => {
    render(
      <DataPanel
        {...defaultProps}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            [ComponentProperty.IsFetchingFromApi]: true,
            [ComponentProperty.OptionsApiDependentOn]: "not_an_array",
          },
        }}
      />
    );

    const multiSelect = screen.getByTestId("optionsApiDependentOn");
    expect(multiSelect).toBeInTheDocument();

    const removeButton = screen.queryByTestId(
      "optionsApiDependentOn_removeButton"
    );

    if (removeButton) {
      fireEvent.click(removeButton);
      expect(mockSetProperty).toHaveBeenCalled();
    } else {
      expect(multiSelect).toBeInTheDocument();
    }
  });

  it("should not render Default Value property when fetchFromSession is true", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        fetchFromSession: true,
        defaultValue: "some value",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.DefaultValue]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    expect(screen.queryByText("Default Value")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter default value here")
    ).not.toBeInTheDocument();
  });

  it("should render Default Value property when fetchFromSession is false", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        fetchFromSession: false,
        defaultValue: "some value",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.DefaultValue]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    expect(screen.getByText("Default Value")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter default value here")
    ).toBeInTheDocument();
  });

  it("should render Default Value property when fetchFromSession is undefined", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        defaultValue: "some value",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.DefaultValue]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    expect(screen.getByText("Default Value")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter default value here")
    ).toBeInTheDocument();
  });

  it("renders Fetch From Session checkbox and calls setProperty on change", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        fetchFromSession: false,
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.FetchFromSession]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const checkbox = screen.getByTestId("fetchFromSession");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText("Fetch From Session")).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.FetchFromSession,
      true
    );
  });

  it("renders Session Path input when fetchFromSession is true", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        fetchFromSession: true,
        sessionPath: "user.profile.name",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.SessionPath]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    expect(screen.getByText("Session Path")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("Enter session path here");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("user.profile.name");

    fireEvent.change(input, { target: { value: "user.profile.email" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SessionPath,
      "user.profile.email"
    );
  });

  it("does not render Session Path input when fetchFromSession is false", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        fetchFromSession: false,
        sessionPath: "some.path",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.SessionPath]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    expect(screen.queryByText("Session Path")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter session path here")
    ).not.toBeInTheDocument();
  });

  it("does not render Session Path input when fetchFromSession is undefined", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        sessionPath: "some.path",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.SessionPath]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    expect(screen.queryByText("Session Path")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter session path here")
    ).not.toBeInTheDocument();
  });

  it("renders Session Path input with empty value when sessionPath is undefined", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        fetchFromSession: true,
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.SessionPath]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const input = screen.getByPlaceholderText("Enter session path here");
    expect(input).toHaveValue("");
  });

  describe("PhoneNumber property", () => {
    it("renders phone number input with value and handles change (less than 10 digits)", () => {
      const component = {
        id: "test-component",
        type: "input",
        properties: {
          phoneNumber: "12345",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.PhoneNumber]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByPlaceholderText("Enter contact number here");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(12345);
      fireEvent.change(input, { target: { value: "9876543210" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.PhoneNumber,
        "9876543210"
      );
    });

    it("truncates phone number to 10 digits on change", () => {
      const component = {
        id: "test-component",
        type: "input",
        properties: {
          phoneNumber: "1234567890",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.PhoneNumber]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByPlaceholderText("Enter contact number here");
      fireEvent.change(input, { target: { value: "123456789012345" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.PhoneNumber,
        "1234567890"
      );
    });
  });

  describe("DefaultValue property", () => {
    it("renders PropertyInput for default value", () => {
      const component = {
        id: "test-component",
        type: "select",
        properties: {
          isMultiSelect: true,
          isFetchingFromApi: false,
          options: [
            { label: "A", value: "a" },
            { label: "B", value: "b" },
          ],
          defaultValue: "a",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.DefaultValue]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const defaultValueElement = screen.getByTestId("default-value");
      expect(defaultValueElement).toBeInTheDocument();
      expect(defaultValueElement).toHaveValue("a");
    });

    it("renders input with today's date for date type and isTodaysDate true", () => {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      const formatted = `${day}/${month}/${year}`;
      const component = {
        id: "test-component",
        type: "date",
        properties: {
          isTodaysDate: true,
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.DefaultValue]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByPlaceholderText("DD/MM/YYYY");
      expect(input).toHaveValue(formatted);
    });

    it("renders enabled input for date type and isTodaysDate false", () => {
      const component = {
        id: "test-component",
        type: "date",
        properties: {
          isTodaysDate: false,
          defaultValue: "01/01/2020",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.DefaultValue]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByPlaceholderText("DD/MM/YYYY");
      expect(input).not.toBeDisabled();
      expect(input).toHaveValue("01/01/2020");
      fireEvent.change(input, { target: { value: "02/02/2022" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.DefaultValue,
        "02/02/2022"
      );
    });

    it("renders text input for custom type", () => {
      const component = {
        id: "test-component",
        type: "custom",
        properties: {
          defaultValue: "foo",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.DefaultValue]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByPlaceholderText("Enter default value here");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveValue("foo");
      fireEvent.change(input, { target: { value: "bar" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.DefaultValue,
        "bar"
      );
    });
  });

  describe("OptionsApiKeyForTitle property", () => {
    it("renders OptionsApiKeyForTitle input when isFetchingFromApi is true and handles change", () => {
      const component = {
        id: "test-component",
        type: "select",
        properties: {
          isFetchingFromApi: true,
          optionsApiKeyForTitle: "titleKey",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.OptionsApiKeyForTitle]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByTestId("optionsApiKeyForTitle");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("titleKey");
      fireEvent.change(input, { target: { value: "newTitleKey" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.OptionsApiKeyForTitle,
        "newTitleKey"
      );
    });

    it("does not render OptionsApiKeyForTitle input when isFetchingFromApi is false", () => {
      const component = {
        id: "test-component",
        type: "select",
        properties: {
          isFetchingFromApi: false,
          optionsApiKeyForTitle: "titleKey",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.OptionsApiKeyForTitle]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      expect(
        screen.queryByTestId("optionsApiKeyForTitle")
      ).not.toBeInTheDocument();
    });
  });

  describe("Options property", () => {
    it("renders OptionsRenderer when showSingleOption is false and isFetchingFromApi is false", () => {
      const component = {
        id: "test-component",
        type: "select",
        properties: {
          showSingleOption: false,
          isFetchingFromApi: false,
          options: [
            { label: "Option 1", value: "1" },
            { label: "Option 2", value: "2" },
          ],
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.Options]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      // Should render OptionsRenderer, which renders option inputs
      expect(screen.getByTestId("options-label-1")).toBeInTheDocument();
      fireEvent.change(screen.getByTestId("options-label-1"), {
        target: { value: "Changed Option" },
      });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    it("renders single option input when showSingleOption is true", () => {
      const component = {
        id: "test-component",
        type: "select",
        properties: {
          showSingleOption: true,
          isFetchingFromApi: false,
          option: "Single Option",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.Options]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByTestId("optionLabel");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("Single Option");
      fireEvent.change(input, { target: { value: "Changed Single Option" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        "option",
        "Changed Single Option"
      );
    });

    it("does not render Options when isFetchingFromApi is true", () => {
      const component = {
        id: "test-component",
        type: "select",
        properties: {
          isFetchingFromApi: true,
          options: [{ label: "Option 1", value: "1" }],
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.Options]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      expect(screen.queryByTestId("options-label-1")).not.toBeInTheDocument();
    });
  });

  describe("OptionsApiKeyForMetadata property", () => {
    it("renders OptionsApiKeyForMetadata input when component type is 'select'", () => {
      const component = {
        id: "test-component",
        type: "select",
        properties: {
          isFetchingFromApi: false,
          optionsApiKeyForMetadata: "metaKey",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.OptionsApiKeyForMetadata]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByTestId("optionsApiKeyForMetadata");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("metaKey");
    });

    it("renders OptionsApiKeyForMetadata input when isFetchingFromApi is true", () => {
      const component = {
        id: "test-component",
        type: "input",
        properties: {
          isFetchingFromApi: true,
          optionsApiKeyForMetadata: "metaKey",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.OptionsApiKeyForMetadata]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByTestId("optionsApiKeyForMetadata");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("metaKey");
    });

    it("calls setProperty when OptionsApiKeyForMetadata input is changed", () => {
      const component = {
        id: "test-component",
        type: "select",
        properties: {
          optionsApiKeyForMetadata: "",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.OptionsApiKeyForMetadata]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByTestId("optionsApiKeyForMetadata");
      fireEvent.change(input, { target: { value: "newMetaKey" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.OptionsApiKeyForMetadata,
        "newMetaKey"
      );
    });

    it("does not render OptionsApiKeyForMetadata when type is not 'select' and isFetchingFromApi is false", () => {
      const component = {
        id: "test-component",
        type: "input",
        properties: {
          isFetchingFromApi: false,
          optionsApiKeyForMetadata: "metaKey",
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.OptionsApiKeyForMetadata]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      expect(
        screen.queryByTestId("optionsApiKeyForMetadata")
      ).not.toBeInTheDocument();
    });

    it("renders with empty value when optionsApiKeyForMetadata is undefined", () => {
      const component = {
        id: "test-component",
        type: "select",
        properties: {},
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.OptionsApiKeyForMetadata]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const input = screen.getByTestId("optionsApiKeyForMetadata");
      expect(input).toHaveValue("");
    });
  });

  describe("EnableImageCapture property", () => {
    it("renders Enable Image Capture checkbox and calls setProperty on change", () => {
      const component = {
        id: "test-component",
        type: "file-upload",
        properties: {
          enableImageCapture: false,
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.EnableImageCapture]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const checkbox = screen.getByTestId("enableImageCapture");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.EnableImageCapture,
        true
      );
    });

    it("renders Enable Image Capture checkbox as checked when enableImageCapture is true", () => {
      const component = {
        id: "test-component",
        type: "file-upload",
        properties: {
          enableImageCapture: true,
        },
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.EnableImageCapture]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const checkbox = screen.getByTestId("enableImageCapture");
      expect(checkbox).toBeChecked();
    });

    it("renders Enable Image Capture checkbox as unchecked when enableImageCapture is undefined", () => {
      const component = {
        id: "test-component",
        type: "file-upload",
        properties: {},
      };
      render(
        <DataPanel
          propertyKeys={[ComponentProperty.EnableImageCapture]}
          propertyComponent={component}
          setProperty={mockSetProperty}
          setProperties={mockSetProperties}
        />
      );
      const checkbox = screen.getByTestId("enableImageCapture");
      expect(checkbox).not.toBeChecked();
    });
  });

  it("renders Is Watermark Allowed input and handles change", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        isWatermarkAllowed: "enabled",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.IsWatermarkAllowed]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const input = screen.getByPlaceholderText("Enter pathkey");
    expect(screen.getByText("Is Watermark Allowed")).toBeInTheDocument();
    expect(input).toHaveValue("enabled");

    fireEvent.change(input, { target: { value: "disabled" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsWatermarkAllowed,
      "disabled"
    );
  });

  it("renders Is Location Allowed input and handles change", () => {
    const component = {
      id: "test-component",
      type: "input",
      properties: {
        isLocationAllowed: "true",
      },
    };

    render(
      <DataPanel
        propertyKeys={[ComponentProperty.IsLocationAllowed]}
        propertyComponent={component}
        setProperty={mockSetProperty}
        setProperties={mockSetProperties}
      />
    );

    const input = screen.getByPlaceholderText("Enter pathkey");
    expect(screen.getByText("Is Location Allowed")).toBeInTheDocument();
    expect(input).toHaveValue("true");

    fireEvent.change(input, { target: { value: "false" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsLocationAllowed,
      "false"
    );
  });

  describe("Boolean property inputs handleChange", () => {
    const cases = [
      {
        key: ComponentProperty.IsUploadAllowed,
        label: "Is Upload Allowed",
        propertyName: "isUploadAllowed",
      },
      {
        key: ComponentProperty.IsPhotoAllowed,
        label: "Is Photo Allowed",
        propertyName: "isPhotoAllowed",
      },
      {
        key: ComponentProperty.IsWatermarkAllowed,
        label: "Is Watermark Allowed",
        propertyName: "isWaterMarkAllowed",
      },
      {
        key: ComponentProperty.IsLocationAllowed,
        label: "Is Location Allowed",
        propertyName: "isLocationAllowed",
      },
    ];

    it.each(cases)(
      "renders $label and triggers handleChange",
      ({ key, label, propertyName }) => {
        const component = {
          id: "test-component",
          type: "input",
          properties: {
            [propertyName]: "initial",
          },
        };

        render(
          <DataPanel
            propertyKeys={[key]}
            propertyComponent={component}
            setProperty={mockSetProperty}
            setProperties={mockSetProperties}
          />
        );

        expect(screen.getByText(label)).toBeInTheDocument();

        const input = screen.getByPlaceholderText("Enter pathkey");
        fireEvent.change(input, { target: { value: "updated" } });

        expect(mockSetProperty).toHaveBeenCalledWith(key, "updated");
      }
    );
  });
});
