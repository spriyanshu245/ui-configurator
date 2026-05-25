import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataColumnRow from "./DataColumnRow";
import { ComponentProperty } from "@/app/data/componentProperties";
import { useMicrosite } from "@/app/context/MicrositeContext";
import { useUserTask } from "@/app/context/UserTaskContext";
import { getColData, getColumnDataPropertyName } from "./DataColumnPanel";

jest.mock("@/app/utils/constants", () => ({
  columnDataTypes: [
    { label: "Text", value: "text" },
    { label: "Number", value: "number" },
    { label: "Date", value: "date" },
    { label: "Api Action", value: "api-action" },
    { label: "Fetch Display", value: "fetchDisplayValueFromApi" },
  ],
  filterTypes: [
    { label: "Exact Match", value: "exactMatch" },
    { label: "Date Range", value: "dateRange" },
  ],
  CURRENCY: [
    { label: "US Dollar", value: "USD" },
    { label: "Euro", value: "EUR" },
  ],
  DATE_FORMAT: [
    { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
    { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
  ],
  textAlignTypes: ["left", "center", "right"],
  InputKeyFormat: /[^a-zA-Z0-9]/g,
}));

jest.mock("@/app/context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("./DataColumnPanel", () => ({
  getColData: jest.fn(),
  getColumnDataPropertyName: jest.fn(),
}));

jest.mock("@/app/utils/utils", () => ({
  getComponents: jest.fn(() => ["Comp1", "Comp2"]),
}));

jest.mock("../../ToggleSwitch/ToggleSwitch", () => ({
  __esModule: true,
  default: ({ onToggle, label, isToggled }: any) => (
    <div data-testid="toggle-switch">
      <label>{label}</label>
      <button onClick={onToggle}>{isToggled ? "ON" : "OFF"}</button>
    </div>
  ),
}));

jest.mock(
  "../../UtilityComponents/DragDropFileUpload/DragDropFileUpload",
  () => ({
    __esModule: true,
    default: ({ handleChange, propertyKey }: any) => (
      <button
        data-testid="file-upload"
        onClick={() => handleChange(propertyKey, "uploaded_file")}
      >
        Upload
      </button>
    ),
  }),
);

jest.mock("../DisplayValuePanel/DisplayValuePanel", () => ({
  __esModule: true,
  default: () => <div data-testid="display-value-panel">DisplayValuePanel</div>,
}));

jest.mock("../ActionPanel/ConditonalRouting", () => ({
  __esModule: true,
  default: ({
    handleAddConditionalRoute,
    handleRouteChange,
    deleteCondition,
    properties,
  }: any) => (
    <div data-testid="conditional-routing">
      <button onClick={handleAddConditionalRoute}>Add Route</button>
      {properties.conditionalRoutes?.map((route: any, index: number) => (
        <div key={index} data-testid={`route-${index}`}>
          <button
            onClick={() => handleRouteChange("route", "new-route", index)}
          >
            Change Route
          </button>
          <button onClick={() => deleteCondition(index)}>Delete Route</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock("../../UIComponents/Slider/Slider", () => ({
  __esModule: true,
  default: ({ onChange, value }: any) => (
    <input
      data-testid="slider"
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  ),
}));

jest.mock("../../JsonTextArea/JsonTextArea", () => ({
  __esModule: true,
  default: ({ onChange, onValidJson, value, id }: any) => (
    <textarea
      data-testid={id}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        try {
          const parsed = JSON.parse(e.target.value);
          onValidJson(parsed);
        } catch (err) {
          console.log(err);
        }
      }}
    />
  ),
}));

jest.mock("../../PropertyInputs/PropertyInput", () => ({
  __esModule: true,
  default: ({ handleChange, value, id }: any) => (
    <input
      data-testid={id}
      value={value || ""}
      onChange={handleChange}
      placeholder={id}
    />
  ),
}));

jest.mock("@/app/components/SVGIcons/Delete", () => () => (
  <span>DeleteIcon</span>
));

describe("DataColumnRow", () => {
  const mockSetProperty = jest.fn();

  const baseColumn = {
    id: "col-1",
    properties: {
      label: "My Column",
      name: "my_col",
      columnInputType: "text",
      columnWidth: 20,
    },
  };

  const basePropertyComponent = {
    id: "table-1",
    type: "table",
    category: "component",
    properties: {},
  };

  const defaultProps = {
    id: 0,
    column: baseColumn,
    propertyComponent: basePropertyComponent,
    setProperty: mockSetProperty,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useMicrosite as jest.Mock).mockReturnValue({
      microsite: {
        pages: [
          { pageCode: "page_Home" },
          { pageCode: "page_Details" },
          { pageCode: "page_Popup" },
        ],
      },
    });

    (useUserTask as jest.Mock).mockReturnValue({
      userTask: {
        components: [],
        properties: { showAsPopup: true },
      },
    });

    (getColData as jest.Mock).mockImplementation(() => [baseColumn]);
    (getColumnDataPropertyName as jest.Mock).mockReturnValue(
      ComponentProperty.TableColumns,
    );
  });

  test("renders basic table column fields", () => {
    render(<DataColumnRow {...defaultProps} />);
    expect(screen.getByDisplayValue("My Column")).toBeInTheDocument();
    expect(screen.getByDisplayValue("my_col")).toBeInTheDocument();
    expect(screen.getByText("Column Data Type")).toBeInTheDocument();
  });

  test("renders basic data-grid fields", () => {
    const props = {
      ...defaultProps,
      propertyComponent: { ...basePropertyComponent, type: "data-grid" },
      column: {
        ...baseColumn,
        properties: { label: "Grid Label", value: "grid_val" },
      },
    };
    (getColData as jest.Mock).mockReturnValue([props.column]);
    (getColumnDataPropertyName as jest.Mock).mockReturnValue(
      ComponentProperty.GridData,
    );

    render(<DataColumnRow {...props} />);
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByDisplayValue("grid_val")).toBeInTheDocument();
  });

  test("updates label property", () => {
    render(<DataColumnRow {...defaultProps} />);
    const labelInput = screen.getByDisplayValue("My Column");
    fireEvent.change(labelInput, { target: { value: "New Label" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ label: "New Label" }),
        }),
      ]),
    );
  });

  test("updates key field for table", () => {
    render(<DataColumnRow {...defaultProps} />);
    const keyInput = screen.getByDisplayValue("my_col");
    fireEvent.change(keyInput, { target: { value: "new_key" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ name: "new_key" }),
        }),
      ]),
    );
  });

  test("renders DisplayValuePanel when type is fetchDisplayValueFromApi", () => {
    const props = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          columnInputType: "fetchDisplayValueFromApi",
        },
      },
    };
    (getColData as jest.Mock).mockReturnValue([props.column]);
    render(<DataColumnRow {...props} />);
    expect(screen.getByTestId("display-value-panel")).toBeInTheDocument();
  });

  test("handles Number type with Currency and Decimal", () => {
    const props = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          columnInputType: "number",
          isCurrency: true,
          currencyName: "USD",
          decimalPrecision: 2,
        },
      },
    };
    (getColData as jest.Mock).mockReturnValue([props.column]);

    render(<DataColumnRow {...props} />);

    const isCurrency = screen.getByLabelText("Is Currency");
    expect(isCurrency).toBeChecked();

    fireEvent.click(isCurrency);
    expect(mockSetProperty).toHaveBeenCalled();

    const currencySelect = screen.getByTestId("currencyName");
    expect(currencySelect).toHaveValue("USD");
    fireEvent.change(currencySelect, { target: { value: "EUR" } });
    expect(mockSetProperty).toHaveBeenCalled();

    const decimalInput = screen.getByTestId("decimal");
    fireEvent.change(decimalInput, { target: { value: "3" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ decimalPrecision: 3 }),
        }),
      ]),
    );
  });

  test("handles decimal input clearing", () => {
    const props = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          columnInputType: "number",
          decimalPrecision: 5,
        },
      },
    };
    (getColData as jest.Mock).mockReturnValue([props.column]);
    render(<DataColumnRow {...props} />);

    const decimalInput = screen.getByTestId("decimal");
    fireEvent.change(decimalInput, { target: { value: "" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ decimalPrecision: "" }),
        }),
      ]),
    );
  });

  test("handles Date type", () => {
    const props = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          columnInputType: "date",
          format: "DD/MM/YYYY",
        },
      },
    };
    (getColData as jest.Mock).mockReturnValue([props.column]);
    render(<DataColumnRow {...props} />);

    const formatSelect = screen.getByTestId("format");
    fireEvent.change(formatSelect, { target: { value: "MM/DD/YYYY" } });
    expect(mockSetProperty).toHaveBeenCalled();
  });

  test("handles Prefix/Suffix logic (Text Type)", () => {
    const props = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          prefixSuffix: "prefix",
          prefixType: "text",
          prefixText: "$",
        },
      },
    };
    (getColData as jest.Mock).mockReturnValue([props.column]);
    render(<DataColumnRow {...props} />);

    const mainSelect = screen.getByDisplayValue("Prefix");
    fireEvent.change(mainSelect, { target: { value: "suffix" } });
    expect(mockSetProperty).toHaveBeenCalled();

    const typeSelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(typeSelect, { target: { value: "icon" } });

    const textInput = screen.getByPlaceholderText("Enter Text");
    fireEvent.change(textInput, { target: { value: "EUR" } });
    expect(mockSetProperty).toHaveBeenCalled();
  });

  test("handles Prefix/Suffix logic (Icon Type + Upload)", () => {
    const props = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          prefixSuffix: "suffix",
          suffixType: "icon",
          suffixIconUploadType: "file-upload",
        },
      },
    };
    (getColData as jest.Mock).mockReturnValue([props.column]);
    render(<DataColumnRow {...props} />);

    const uploadBtn = screen.getByTestId("file-upload");
    fireEvent.click(uploadBtn);
    expect(mockSetProperty).toHaveBeenCalled();
  });

  test("handles Prefix/Suffix logic (Icon Type + URL)", () => {
    const props = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          prefixSuffix: "suffix",
          suffixType: "icon",
          suffixIconUploadType: "url",
          suffixIconUrl: "http://image.com",
        },
      },
    };
    (getColData as jest.Mock).mockReturnValue([props.column]);
    render(<DataColumnRow {...props} />);

    const urlInput = screen.getByTestId("iconUrl");
    fireEvent.change(urlInput, { target: { value: "http://new.com" } });
    expect(mockSetProperty).toHaveBeenCalled();
  });

  test("handles Prefix AND Suffix rendering", () => {
    const props = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          prefixSuffix: "prefix-suffix",
        },
      },
    };
    (getColData as jest.Mock).mockReturnValue([props.column]);
    render(<DataColumnRow {...props} />);
    const typeLabels = screen.getAllByText(/type/i);
    expect(typeLabels.length).toBeGreaterThan(1);
  });

  test("handles Alignment and Width", () => {
    render(<DataColumnRow {...defaultProps} />);

    const centerAlignBtn = screen.getByTestId("center");
    fireEvent.click(centerAlignBtn);
    expect(mockSetProperty).toHaveBeenCalled();

    const slider = screen.getByTestId("slider");
    fireEvent.change(slider, { target: { value: "50" } });
    expect(mockSetProperty).toHaveBeenCalled();
  });

  test("shows error when total width exceeds 100", () => {
    const col1 = { ...baseColumn, properties: { columnWidth: 60 } };
    const col2 = {
      ...baseColumn,
      id: "col-2",
      properties: { columnWidth: 50 },
    };
    (getColData as jest.Mock).mockReturnValue([col1, col2]);

    render(<DataColumnRow {...defaultProps} column={col1} />);
    expect(
      screen.getByText("Total width cannot exceed 100%."),
    ).toBeInTheDocument();
  });

  test("handles width calculation with undefined column widths", () => {
    const col1 = { ...baseColumn, properties: { columnWidth: 95 } };
    const col2 = { ...baseColumn, id: "col-2", properties: {} };
    (getColData as jest.Mock).mockReturnValue([col1, col2]);

    render(<DataColumnRow {...defaultProps} column={col1} />);
    expect(
      screen.queryByText("Total width cannot exceed 100%."),
    ).not.toBeInTheDocument();
  });

  describe("API Action Tests", () => {
    const apiProps = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          columnInputType: "api-action",
          buttonActionType: "text",
          apiName: "MyApi",
          method: "POST",
          apiUrl: "/api/test",
          apiKey: "123",
          requestBodySpecs: "{}",
        },
      },
    };

    beforeEach(() => {
      (getColData as jest.Mock).mockReturnValue([apiProps.column]);
    });

    test("renders API Action specific fields", () => {
      render(<DataColumnRow {...apiProps} />);
      expect(screen.getByTestId("buttonActionType")).toBeInTheDocument();
      expect(screen.getByTestId("apiName")).toBeInTheDocument();
      expect(screen.getByTestId("method")).toBeInTheDocument();
      expect(screen.getByTestId("apiUrl")).toBeInTheDocument();
      expect(screen.getByTestId("apiKey")).toBeInTheDocument();
      expect(screen.getByTestId("requestBodySpecs")).toBeInTheDocument();
    });

    test("updates Action Button Text", () => {
      render(<DataColumnRow {...apiProps} />);
      const btnText = screen.getByTestId("buttonActionText");
      fireEvent.change(btnText, { target: { value: "Click Me" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("handles Icon Button Type", () => {
      const props = {
        ...apiProps,
        column: {
          ...apiProps.column,
          properties: {
            ...apiProps.column.properties,
            buttonActionType: "icon",
            iconUploadType: "url",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      expect(screen.getByTestId("buttonIconUploadType")).toBeInTheDocument();

      const urlInput = screen.getByTestId("buttonIconUrl");
      fireEvent.change(urlInput, { target: { value: "http://icon" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("clears RequestBodySpecs when method is changed to DELETE", () => {
      render(<DataColumnRow {...apiProps} />);
      const methodSelect = screen.getByTestId("method");
      fireEvent.change(methodSelect, { target: { value: "DELETE" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              method: "DELETE",
              requestBodySpecs: "",
            }),
          }),
        ]),
      );
    });

    test("updates Request Body Specs via JsonTextArea", () => {
      render(<DataColumnRow {...apiProps} />);
      const bodySpecsArea = screen.getByTestId("requestBodySpecs");
      fireEvent.change(bodySpecsArea, {
        target: { value: '{"key": "value"}' },
      });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              requestBodySpecs: '{"key":"value"}',
            }),
          }),
        ]),
      );
    });

    test("updates API headers via JsonTextArea", () => {
      render(<DataColumnRow {...apiProps} />);
      const headerArea = screen.getByTestId("apiHeaders");
      fireEvent.change(headerArea, {
        target: { value: '{"Authorization": "Bearer 1"}' },
      });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              apiHeaders: '{"Authorization":"Bearer 1"}',
            }),
          }),
        ]),
      );
    });

    test("toggles showConfirmation checkbox", () => {
      render(<DataColumnRow {...apiProps} />);
      const checkbox = screen.getByTestId("showConfirmation");
      fireEvent.click(checkbox);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ showConfirmation: true }),
          }),
        ]),
      );
    });
  });

  describe("Filter Tests", () => {
    const filterProps = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          enableFilter: true,
          filterDetails: {
            filterType: "exactMatch",
            placeholder: "Search...",
            apiUrl: "/search",
            apiKey: "key",
          },
        },
      },
    };

    test("toggles Enable Filter", () => {
      (getColData as jest.Mock).mockReturnValue([baseColumn]);
      render(<DataColumnRow {...defaultProps} />);
      const toggle = screen.getByLabelText("Enable Filter");
      fireEvent.click(toggle);
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("renders ExactMatch filter inputs", () => {
      (getColData as jest.Mock).mockReturnValue([filterProps.column]);
      render(<DataColumnRow {...filterProps} />);

      const apiUrl = screen.getByTestId("filterApiUrl");
      fireEvent.change(apiUrl, { target: { value: "/new-api" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              filterDetails: expect.objectContaining({ apiUrl: "/new-api" }),
            }),
          }),
        ]),
      );
    });

    test("creates a new filterDetails object when none exists", () => {
      const noFilterDetailsProps = {
        ...defaultProps,
        column: {
          ...baseColumn,
          properties: {
            ...baseColumn.properties,
            enableFilter: true,
            filterDetails: undefined,
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([noFilterDetailsProps.column]);
      render(<DataColumnRow {...noFilterDetailsProps} />);

      const filterTypeSelect = screen.getByTestId("filterType");
      fireEvent.change(filterTypeSelect, { target: { value: "exactMatch" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              filterDetails: expect.objectContaining({
                filterType: "exactMatch",
              }),
            }),
          }),
        ]),
      );
    });

    test("renders DateRange filter inputs", () => {
      const dateFilterProps = {
        ...filterProps,
        column: {
          ...filterProps.column,
          properties: {
            ...filterProps.column.properties,
            enableFilter: true,
            filterDetails: { filterType: "dateRange" },
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([dateFilterProps.column]);
      render(<DataColumnRow {...dateFilterProps} />);

      const min = screen.getByTestId("dateRangeMinValue");
      fireEvent.change(min, { target: { value: "10" } });
      expect(mockSetProperty).toHaveBeenCalled();

      const max = screen.getByTestId("dateRangeMaxValue");
      fireEvent.change(max, { target: { value: "20" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("toggles Enable Sorting", () => {
      render(<DataColumnRow {...defaultProps} />);
      const toggle = screen.getByLabelText("Enable Sorting");
      fireEvent.click(toggle);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ enableSorting: true }),
          }),
        ]),
      );
    });
  });

  describe("Routing Logic", () => {
    const routingProps = {
      ...defaultProps,
      column: {
        ...baseColumn,
        properties: {
          ...baseColumn.properties,
          isClickable: true,
          routingType: "Internal",
          isConditional: false,
          routePage: "Details",
        },
      },
    };

    test("toggles Is Clickable", () => {
      (getColData as jest.Mock).mockReturnValue([baseColumn]);
      render(<DataColumnRow {...defaultProps} />);
      const toggle = screen.getByLabelText("Is Clickable");
      fireEvent.click(toggle);
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("handles Internal Routing (Not Conditional) and filters active page", () => {
      (getColData as jest.Mock).mockReturnValue([routingProps.column]);
      render(<DataColumnRow {...routingProps} />);

      const pageSelect = screen.getByTestId("routePage");
      expect(screen.getByText("Details")).toBeInTheDocument();
      expect(screen.getByText("Popup")).toBeInTheDocument();

      expect(screen.queryByText("Home")).toBeInTheDocument();

      fireEvent.change(pageSelect, { target: { value: "Popup" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("handles page list generation with undefined userTask", () => {
      (useUserTask as jest.Mock).mockReturnValue({
        userTask: undefined,
      });
      (getColData as jest.Mock).mockReturnValue([routingProps.column]);

      render(<DataColumnRow {...routingProps} />);

      const pageSelect = screen.getByTestId("routePage");
      expect(screen.getByText("Details")).toBeInTheDocument();
    });

    test("shows OnCloseAction when selected page is Popup", () => {
      const popupProps = {
        ...routingProps,
        column: {
          ...routingProps.column,
          properties: {
            ...routingProps.column.properties,
            routePage: "Popup",
            onCloseAction: "",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([popupProps.column]);
      render(<DataColumnRow {...popupProps} />);

      const closeActionSelect = screen.getByTestId("onCloseAction");
      fireEvent.change(closeActionSelect, { target: { value: "Comp1" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("handles Conditional Routing", () => {
      const conditionalProps = {
        ...routingProps,
        column: {
          ...routingProps.column,
          properties: {
            ...routingProps.column.properties,
            isConditional: true,
            conditionalRoutes: [{ condition: {}, route: "Home" }],
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([conditionalProps.column]);
      render(<DataColumnRow {...conditionalProps} />);

      const condContainer = screen.getByTestId("conditional-routing");
      expect(condContainer).toBeInTheDocument();

      const addBtn = within(condContainer).getByText("Add Route");
      fireEvent.click(addBtn);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              conditionalRoutes: expect.arrayContaining([
                expect.anything(),
                expect.anything(),
              ]),
            }),
          }),
        ]),
      );

      const deleteBtn = within(condContainer).getByText("Delete Route");
      fireEvent.click(deleteBtn);
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("handles External Routing", () => {
      const extProps = {
        ...routingProps,
        column: {
          ...routingProps.column,
          properties: {
            ...routingProps.column.properties,
            routingType: "External",
            externalURL: "http://google.com",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([extProps.column]);
      render(<DataColumnRow {...extProps} />);

      const urlInput = screen.getByTestId("columnUrl");
      fireEvent.change(urlInput, { target: { value: "http://new.com" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("handles Non-Internal Routing Extra Fields", () => {
      const otherProps = {
        ...routingProps,
        column: {
          ...routingProps.column,
          properties: {
            ...routingProps.column.properties,
            routingType: "External",
            dataTransfer: { name: "test", body: "{}" },
            sessionKeys: "key1",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([otherProps.column]);
      render(<DataColumnRow {...otherProps} />);

      const nameInput = screen.getByTestId(`name-${otherProps.column.id}`);
      fireEvent.change(nameInput, { target: { value: "NewKey!" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              dataTransfer: expect.objectContaining({ name: "NewKey" }),
            }),
          }),
        ]),
      );

      const bodyInput = screen.getByTestId(`body-${otherProps.column.id}`);
      fireEvent.change(bodyInput, { target: { value: '{"a":1}' } });
      expect(mockSetProperty).toHaveBeenCalled();

      const sessionKeysInput = screen.getByTestId(
        `sessionKeys-${otherProps.id + 1}`,
      );
      fireEvent.change(sessionKeysInput, { target: { value: "k1,k2" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("handles SamePage routing type change", () => {
      (getColData as jest.Mock).mockReturnValue([routingProps.column]);
      render(<DataColumnRow {...routingProps} />);
      const routingTypeSelect = screen.getByTestId("routingType");
      fireEvent.change(routingTypeSelect, { target: { value: "SamePage" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ routingType: "SamePage" }),
          }),
        ]),
      );
    });

    test("handles navigateWithoutDataTransfer checkbox", () => {
      (getColData as jest.Mock).mockReturnValue([routingProps.column]);
      render(<DataColumnRow {...routingProps} />);
      const checkbox = screen.getByTestId("navigateWithoutDataTransfer");
      fireEvent.click(checkbox);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              navigateWithoutDataTransfer: true,
            }),
          }),
        ]),
      );
    });

    test("handles isConditional toggle when not conditional", () => {
      (getColData as jest.Mock).mockReturnValue([routingProps.column]);
      render(<DataColumnRow {...routingProps} />);
      const toggleBtn = screen.getByText("OFF");
      fireEvent.click(toggleBtn);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ isConditional: true }),
          }),
        ]),
      );
    });

    test("calls handleRouteChange when changing a conditional route", () => {
      const conditionalProps = {
        ...routingProps,
        column: {
          ...routingProps.column,
          properties: {
            ...routingProps.column.properties,
            isConditional: true,
            conditionalRoutes: [{ condition: {}, route: "Home" }],
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([conditionalProps.column]);
      render(<DataColumnRow {...conditionalProps} />);

      const condContainer = screen.getByTestId("conditional-routing");
      const changeRouteBtn = within(condContainer).getByText("Change Route");
      fireEvent.click(changeRouteBtn);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              conditionalRoutes: expect.arrayContaining([
                expect.objectContaining({ route: "new-route" }),
              ]),
            }),
          }),
        ]),
      );
    });
  });

  describe("Additional coverage tests", () => {
    test("changes columnInputType via select", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnInputType: "",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      const select = screen.getByDisplayValue("Select Data Type");
      fireEvent.change(select, { target: { value: "number" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ columnInputType: "number" }),
          }),
        ]),
      );
    });

    test("changes value for data-grid type", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          type: "data-grid",
        },
        column: {
          ...defaultProps.column,
          properties: { label: "Grid Label", value: "old_val" },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      (getColumnDataPropertyName as jest.Mock).mockReturnValue(
        ComponentProperty.GridData,
      );
      render(<DataColumnRow {...props} />);
      const valueInput = screen.getByDisplayValue("old_val");
      fireEvent.change(valueInput, { target: { value: "new_val" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("changes prefix/suffix type dropdown", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            prefixSuffix: "prefix",
            prefixType: "",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      const typeSelect = screen.getByDisplayValue("Prefix");
      const allSelects = screen.getAllByRole("combobox");
      const prefixTypeSelect = allSelects.find(
        (el) => el.getAttribute("id") === "prefixType-1",
      )!;
      fireEvent.change(prefixTypeSelect, { target: { value: "text" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ prefixType: "text" }),
          }),
        ]),
      );
    });

    test("changes prefix/suffix icon upload type dropdown", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            prefixSuffix: "prefix",
            prefixType: "icon",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      const iconUploadType = screen.getByTestId("iconUploadType");
      fireEvent.change(iconUploadType, { target: { value: "url" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("changes apiName in api-action", () => {
      const apiProps = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnInputType: "api-action",
            buttonActionType: "text",
            apiName: "",
            method: "GET",
            apiUrl: "",
            apiKey: "",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([apiProps.column]);
      render(<DataColumnRow {...apiProps} />);
      const apiNameInput = screen.getByTestId("apiName");
      fireEvent.change(apiNameInput, { target: { value: "MyAPI" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ apiName: "MyAPI" }),
          }),
        ]),
      );
    });

    test("changes apiUrl in api-action", () => {
      const apiProps = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnInputType: "api-action",
            buttonActionType: "text",
            apiName: "",
            method: "GET",
            apiUrl: "",
            apiKey: "",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([apiProps.column]);
      render(<DataColumnRow {...apiProps} />);
      const apiUrlInput = screen.getByTestId("apiUrl");
      fireEvent.change(apiUrlInput, { target: { value: "/api/endpoint" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ apiUrl: "/api/endpoint" }),
          }),
        ]),
      );
    });

    test("changes apiKey in api-action", () => {
      const apiProps = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnInputType: "api-action",
            buttonActionType: "text",
            apiName: "",
            method: "GET",
            apiUrl: "",
            apiKey: "",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([apiProps.column]);
      render(<DataColumnRow {...apiProps} />);
      const apiKeyInput = screen.getByTestId("apiKey");
      fireEvent.change(apiKeyInput, { target: { value: "secret-key" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ apiKey: "secret-key" }),
          }),
        ]),
      );
    });

    test("changes buttonActionType in api-action", () => {
      const apiProps = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnInputType: "api-action",
            buttonActionType: "text",
            method: "GET",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([apiProps.column]);
      render(<DataColumnRow {...apiProps} />);
      const buttonTypeSelect = screen.getByTestId("buttonActionType");
      fireEvent.change(buttonTypeSelect, { target: { value: "icon" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ buttonActionType: "icon" }),
          }),
        ]),
      );
    });

    test("changes iconUploadType in api-action icon button", () => {
      const apiProps = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnInputType: "api-action",
            buttonActionType: "icon",
            iconUploadType: "url",
            method: "GET",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([apiProps.column]);
      render(<DataColumnRow {...apiProps} />);
      const iconUploadTypeSelect = screen.getByTestId("buttonIconUploadType");
      fireEvent.change(iconUploadTypeSelect, {
        target: { value: "file-upload" },
      });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              iconUploadType: "file-upload",
            }),
          }),
        ]),
      );
    });

    test("changes filter placeholder", () => {
      const filterProps = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            enableFilter: true,
            filterDetails: {
              filterType: "exactMatch",
              placeholder: "",
              apiUrl: "",
              apiKey: "",
            },
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([filterProps.column]);
      render(<DataColumnRow {...filterProps} />);
      const placeholderInput = screen.getByPlaceholderText(
        "Enter placeholder here",
      );
      fireEvent.change(placeholderInput, {
        target: { value: "Type to search" },
      });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              filterDetails: expect.objectContaining({
                placeholder: "Type to search",
              }),
            }),
          }),
        ]),
      );
    });

    test("changes filterApiKey in exactMatch filter", () => {
      const filterProps = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            enableFilter: true,
            filterDetails: {
              filterType: "exactMatch",
              placeholder: "",
              apiUrl: "",
              apiKey: "",
            },
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([filterProps.column]);
      render(<DataColumnRow {...filterProps} />);
      const apiKeyInput = screen.getByTestId("filterApiKey");
      fireEvent.change(apiKeyInput, { target: { value: "filter-key" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TableColumns,
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              filterDetails: expect.objectContaining({ apiKey: "filter-key" }),
            }),
          }),
        ]),
      );
    });

    test("covers the identity branch in handleChange when updating one col among multiple", () => {
      const col1 = {
        ...baseColumn,
        id: "col-1",
        properties: { ...baseColumn.properties },
      };
      const col2 = {
        ...baseColumn,
        id: "col-2",
        properties: { ...baseColumn.properties },
      };
      (getColData as jest.Mock).mockReturnValue([col1, col2]);
      render(<DataColumnRow {...defaultProps} column={col1} />);
      const labelInput = screen.getByDisplayValue("My Column");
      fireEvent.change(labelInput, { target: { value: "Updated Label" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test("renders active columnAlign class when columnAlign matches", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnAlign: "center",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      expect(screen.getByTestId("center")).toBeInTheDocument();
    });

    test("renders prefix text input with empty value when prefixText is undefined", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            prefixSuffix: "prefix",
            prefixType: "text",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      const textInput = screen.getByPlaceholderText("Enter Text");
      expect(textInput).toHaveValue("");
    });

    test("renders prefix icon url input with empty value when iconUrl is undefined", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            prefixSuffix: "prefix",
            prefixType: "icon",
            prefixIconUploadType: "url",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      const iconUrlInput = screen.getByTestId("iconUrl");
      expect(iconUrlInput).toHaveValue("");
    });

    test("renders data-grid value input as empty when value is undefined", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          type: "data-grid",
        },
        column: {
          ...defaultProps.column,
          properties: { label: "Grid Label" },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      (getColumnDataPropertyName as jest.Mock).mockReturnValue(
        ComponentProperty.GridData,
      );
      render(<DataColumnRow {...props} />);
      const valueInput = screen.getByPlaceholderText("Enter Value");
      expect(valueInput).toHaveValue("");
    });

    test("renders number type with isCurrency true and no currencyName", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnInputType: "number",
            isCurrency: true,
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      expect(screen.getByTestId("currencyName")).toBeInTheDocument();
    });

    test("renders date type with no format selected", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnInputType: "date",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      expect(screen.getByTestId("format")).toBeInTheDocument();
    });

    test("renders slider with default columnWidth 100 when columnWidth is undefined", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            label: "Test",
            name: "test",
            columnInputType: "text",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      const slider = screen.getByTestId("slider");
      expect(slider).toHaveValue(100);
    });

    test("renders api-action with no buttonActionType defaults to text", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnInputType: "api-action",
            method: "GET",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      expect(screen.getByTestId("buttonActionType")).toHaveValue("text");
    });

    test("renders api-action icon button with no iconUploadType falls back to empty", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            columnInputType: "api-action",
            buttonActionType: "icon",
            method: "GET",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      expect(screen.getByTestId("buttonIconUploadType")).toBeInTheDocument();
    });

    test("renders exactMatch filter with no apiUrl falls back to empty", () => {
      const props = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            enableFilter: true,
            filterDetails: {
              filterType: "exactMatch",
              placeholder: "",
            },
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([props.column]);
      render(<DataColumnRow {...props} />);
      expect(screen.getByTestId("filterApiUrl")).toHaveValue("");
    });

    test("renders External routing with no dataTransfer, uses empty object in body", () => {
      const routingProps = {
        ...defaultProps,
        column: {
          ...defaultProps.column,
          properties: {
            ...defaultProps.column.properties,
            isClickable: true,
            routingType: "External",
          },
        },
      };
      (getColData as jest.Mock).mockReturnValue([routingProps.column]);
      render(<DataColumnRow {...routingProps} />);
      const nameInput = screen.getByTestId(`name-${routingProps.column.id}`);
      fireEvent.change(nameInput, { target: { value: "test" } });
      expect(mockSetProperty).toHaveBeenCalled();
    });
  });
});
