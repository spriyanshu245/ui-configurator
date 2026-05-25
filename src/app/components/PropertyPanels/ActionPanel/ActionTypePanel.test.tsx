import { render, screen, fireEvent } from "@testing-library/react";
import ActionTypePanel from "./ActionTypePanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { BaseComponent, DataTableColumn } from "@/app/types/types";
import { PropertiesContext } from "../../../context/PropertiesContext";

jest.mock("@/app/data/componentProperties", () => ({
  ComponentProperty: {
    InputType: "inputType",
    Format: "format",
    Options: "options",
    DateSeparator: "dateSeparator",
    ColumnInputType: "columnInputType",
    MultipleActions: "multipleActions",
    TableColumnActionTypes: "tableColumnActionTypes",
  },
}));

jest.mock("@/app/data/componentPropertiesMap", () => ({
  componentPropertiesMap: {
    "table-column-button": ["inputType", "format"],
    "table-column-link": ["options"],
    "table-column-date": ["dateSeparator", "format"],
    "test-action": ["columnInputType", "inputType"],
    "multi-panel": ["inputType", "format"],
    "separator-test": ["inputType"],
    "empty-props": [],
  },
}));

jest.mock("@/app/data/propertiesPanelMap", () => ({
  propertyPanelsMap: {
    inputType: ({
      propertyKeys,
      setProperty,
      setProperties,
      propertyComponent,
    }: any) => (
      <div data-testid="input-type-panel">
        <button onClick={() => setProperty("inputType", "text")}>Set</button>
        <button onClick={() => setProperties({ inputType: "email" })}>
          Trigger
        </button>
        <button onClick={() => setProperties({ customProp: "xyz" })}>
          TriggerCustom
        </button>
        <button
          onClick={() => setProperties({ custom: "abc", inputType: "number" })}
        >
          TriggerMerge
        </button>
        {propertyKeys?.join(",")}
        {propertyComponent?.properties?.inputType && (
          <span data-testid="prop-val">
            {propertyComponent.properties.inputType}
          </span>
        )}
      </div>
    ),
    format: () => <div data-testid="format-panel">Format Panel</div>,
    options: () => <div data-testid="options-panel">Options Panel</div>,
    dateSeparator: () => (
      <div data-testid="date-separator-panel">Date Separator Panel</div>
    ),
    columnInputType: () => (
      <div data-testid="column-input-type-panel">Should not render</div>
    ),
  },
}));

jest.mock("@/app/utils/constants", () => ({
  columnInputFieldTypes: [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
  ],
  tableColumnActionTypes: [
    { value: "button", label: "Button" },
    { value: "link", label: "Link" },
    { value: "icon", label: "Icon" },
  ],
}));

const mockSetProperty = jest.fn();

const createMockColumn = (overrides: any = {}): DataTableColumn => {
  const { properties = {}, ...rest } = overrides;

  return {
    id: "1",
    type: "table-column-button",
    properties: {
      tableColumnActionTypes: "button",
      label: "Test Label",
      ...properties,
    },
    ...rest,
  };
};

const createMockPropertyComponent = (overrides: any = {}): BaseComponent => {
  const { properties = {}, ...rest } = overrides;

  return {
    id: "1",
    type: "input-table",
    category: "form",
    properties: {
      multipleActions: [createMockColumn()],
      ...properties,
    },
    ...rest,
  };
};

describe("ActionTypePanel - Basic Rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the Action Type label", () => {
    const column = createMockColumn();
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByText("Action Type")).toBeInTheDocument();
  });

  it("should render the select dropdown", () => {
    const column = createMockColumn();
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should display the correct select id based on index", () => {
    const column = createMockColumn();
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={2}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("id", "selectedActionType-3");
  });

  it("should display 'Select Action Type' as default option", () => {
    const column = createMockColumn();
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByText("Select Action Type")).toBeInTheDocument();
  });

  it("should show the current selected value", () => {
    const column = createMockColumn();

    const propertyComponent = createMockPropertyComponent({
      type: "data-table",
      properties: {
        multipleActions: [
          {
            ...column,
            properties: {
              ...column.properties,
              tableColumnActionTypes: "button",
            },
          },
        ],
      },
    });

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("button");
  });

  it("should show empty value when no action type is selected", () => {
    const column = createMockColumn({ properties: {} });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("");
  });
});

describe("ActionTypePanel - Field Type Options", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render columnInputFieldTypes when component type is 'input-table'", () => {
    const column = createMockColumn();
    const propertyComponent = createMockPropertyComponent({
      type: "input-table",
    });

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Number")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("should render tableColumnActionTypes when component type is not 'input-table'", () => {
    const column = createMockColumn();
    const propertyComponent = createMockPropertyComponent({
      type: "data-table",
    });

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByText("Button")).toBeInTheDocument();
    expect(screen.getByText("Link")).toBeInTheDocument();
    expect(screen.getByText("Icon")).toBeInTheDocument();
  });
});

describe("ActionTypePanel - Action Type Change", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call setProperty when action type is changed", () => {
    const column = createMockColumn();
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "link" } });

    expect(mockSetProperty).toHaveBeenCalledTimes(1);
    expect(mockSetProperty).toHaveBeenCalledWith(
      "multipleActions",
      expect.any(Array),
    );
  });
});

describe("ActionTypePanel - Panel Rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render panels when componentPropertiesMap has no entry", () => {
    const column = createMockColumn({
      type: "unknown-type",
      properties: {
        tableColumnActionTypes: "unknown-type",
      },
    });

    const propertyComponent = createMockPropertyComponent({
      properties: {
        multipleActions: [column],
      },
    });

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.queryByTestId("input-type-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("format-panel")).not.toBeInTheDocument();
  });

  it("should render panels for table-column-button type", () => {
    const column = createMockColumn({
      type: "table-column-button",
      properties: { tableColumnActionTypes: "button" },
    });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();
  });

  it("should skip ColumnInputType property panel", () => {
    const column = createMockColumn({
      type: "table-column-button",
      properties: { tableColumnActionTypes: "button" },
    });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(
      screen.queryByTestId("column-input-type-panel"),
    ).not.toBeInTheDocument();
  });

  it("should not render date-only panels when columnInputType is not 'date'", () => {
    const column = createMockColumn({
      type: "table-column-date",
      properties: {
        tableColumnActionTypes: "date",
        columnInputType: "text",
      },
    });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(
      screen.queryByTestId("date-separator-panel"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("format-panel")).not.toBeInTheDocument();
  });

  it("should render date-only panels when columnInputType is 'date'", () => {
    const column = createMockColumn({
      type: "table-column-date",
      properties: {
        tableColumnActionTypes: "date",
        columnInputType: "date",
      },
    });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("date-separator-panel")).toBeInTheDocument();
    expect(screen.getByTestId("format-panel")).toBeInTheDocument();
  });

  it("should not render Options panel when columnInputType is not 'select' or 'checkbox-group'", () => {
    const column = createMockColumn({
      type: "table-column-link",
      properties: {
        tableColumnActionTypes: "link",
        columnInputType: "text",
      },
    });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.queryByTestId("options-panel")).not.toBeInTheDocument();
  });

  it("should render Options panel when columnInputType is 'select'", () => {
    const column = createMockColumn({
      type: "table-column-link",
      properties: {
        tableColumnActionTypes: "link",
        columnInputType: "select",
      },
    });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("options-panel")).toBeInTheDocument();
  });

  it("should render Options panel when columnInputType is 'checkbox-group'", () => {
    const column = createMockColumn({
      type: "table-column-link",
      properties: {
        tableColumnActionTypes: "link",
        columnInputType: "checkbox-group",
      },
    });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("options-panel")).toBeInTheDocument();
  });
});

describe("ActionTypePanel - setProperties method behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call setProperty with updated inputType and columnInputType when inputType is in propsObj", () => {
    const column = createMockColumn({ type: "table-column-button" });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    fireEvent.click(screen.getByText("Trigger"));

    expect(mockSetProperty).toHaveBeenCalledWith(
      "multipleActions",
      expect.arrayContaining([
        expect.objectContaining({
          id: "1",
          properties: expect.objectContaining({
            inputType: "email",
            columnInputType: "email",
          }),
        }),
      ]),
    );
  });

  it("should call setProperty with only merged props when inputType is not in propsObj", () => {
    const column = createMockColumn({ type: "table-column-button" });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    fireEvent.click(screen.getByText("TriggerCustom"));

    expect(mockSetProperty).toHaveBeenCalledWith(
      "multipleActions",
      expect.arrayContaining([
        expect.objectContaining({
          id: "1",
          properties: expect.objectContaining({
            customProp: "xyz",
          }),
        }),
      ]),
    );
  });

  it("should preserve existing properties while adding new ones via setProperties", () => {
    const column = createMockColumn({ type: "table-column-button" });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    fireEvent.click(screen.getByText("TriggerMerge"));

    expect(mockSetProperty).toHaveBeenCalledWith(
      "multipleActions",
      expect.arrayContaining([
        expect.objectContaining({
          id: "1",
          properties: expect.objectContaining({
            columnInputType: "number",
            inputType: "number",
            custom: "abc",
          }),
        }),
      ]),
    );
  });
});

describe("ActionTypePanel - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle column with undefined properties", () => {
    const column = createMockColumn({ properties: undefined });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column as any}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("");
  });
  it("should use table-column prefix with tableColumnActionTypes when present", () => {
    const column = createMockColumn({
      type: "some-other-type",
      properties: {
        tableColumnActionTypes: "button",
      },
    });

    jest.mocked(
      require("@/app/data/componentPropertiesMap"),
    ).componentPropertiesMap = {
      "table-column-button": ["inputType"],
    };

    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();
  });

  it("should use table-column prefix with tableColumnActionTypes when present", () => {
    jest.mocked(
      require("@/app/data/componentPropertiesMap"),
    ).componentPropertiesMap = {
      "table-column-button": ["inputType"],
    };

    jest.mocked(require("@/app/data/propertiesPanelMap")).propertyPanelsMap = {
      inputType: () => <div data-testid="input-type-panel">Input Panel</div>,
    };

    const column = createMockColumn({
      type: "some-other-type",
      properties: {
        tableColumnActionTypes: "button",
      },
    });

    const propertyComponent = createMockPropertyComponent({
      properties: {
        multipleActions: [column],
      },
    });

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();
  });

  it("should fallback to column.type when tableColumnActionTypes is not set", () => {
    const column = createMockColumn({
      properties: {},
    });
    const propertyComponent = createMockPropertyComponent();

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should handle propertyComponent with null properties", () => {
    const column = createMockColumn();
    const propertyComponent = createMockPropertyComponent();
    propertyComponent.properties = null as any;

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByText("Action Type")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should use empty array fallback when all colData sources are undefined", () => {
    const column = createMockColumn();
    const propertyComponent = createMockPropertyComponent();
    propertyComponent.properties = undefined as any;

    render(
      <ActionTypePanel
        id={0}
        column={column}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "button" } });

    expect(mockSetProperty).toHaveBeenCalledWith("multipleActions", []);
  });
});

describe("ActionTypePanel - Full Coverage Test Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should test localValue context isPanelOpen and togglePanel with string parameter", () => {
    let capturedContext: any;

    jest.mocked(
      require("@/app/data/componentPropertiesMap"),
    ).componentPropertiesMap = {
      "table-column-button": ["inputType"],
    };

    jest.mocked(
      require("@/app/data/propertiesPanelMap"),
    ).propertyPanelsMap.inputType = ({ propertyKeys, setProperty }: any) => (
      <PropertiesContext.Consumer>
        {(context: any) => {
          capturedContext = context;
          return (
            <div data-testid="input-type-panel">
              <button onClick={() => setProperty("inputType", "text")}>
                Set
              </button>
              {propertyKeys.join(",")}
            </div>
          );
        }}
      </PropertiesContext.Consumer>
    );

    render(
      <ActionTypePanel
        id={0}
        column={createMockColumn({ type: "table-column-button" })}
        propertyComponent={createMockPropertyComponent()}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();
    expect(capturedContext).toBeDefined();

    expect(capturedContext?.isPanelOpen("testPanel")).toBe(false);

    capturedContext?.togglePanel("testPanel");
    capturedContext?.togglePanel("testPanel");
  });

  it("should test localValue context isPanelOpen and togglePanel with non-string parameter", () => {
    let capturedContext: any;

    jest.mocked(
      require("@/app/data/componentPropertiesMap"),
    ).componentPropertiesMap = {
      "table-column-button": ["inputType"],
    };

    jest.mocked(
      require("@/app/data/propertiesPanelMap"),
    ).propertyPanelsMap.inputType = ({ propertyKeys }: any) => (
      <PropertiesContext.Consumer>
        {(context: any) => {
          capturedContext = context;
          return (
            <div data-testid="input-type-panel">{propertyKeys.join(",")}</div>
          );
        }}
      </PropertiesContext.Consumer>
    );

    render(
      <ActionTypePanel
        id={0}
        column={createMockColumn({ type: "table-column-button" })}
        propertyComponent={createMockPropertyComponent()}
        setProperty={mockSetProperty}
      />,
    );

    expect(capturedContext.isPanelOpen(123)).toBe(false);
    capturedContext.togglePanel(123);

    const objPanel = { id: "test" };
    expect(capturedContext.isPanelOpen(objPanel)).toBe(false);
    capturedContext.togglePanel(objPanel);
  });

  it("should test all localValue context methods without errors", () => {
    let capturedContext: any;

    jest.mocked(
      require("@/app/data/componentPropertiesMap"),
    ).componentPropertiesMap = {
      "table-column-button": ["inputType"],
    };

    jest.mocked(
      require("@/app/data/propertiesPanelMap"),
    ).propertyPanelsMap.inputType = ({ propertyKeys }: any) => (
      <PropertiesContext.Consumer>
        {(context: any) => {
          capturedContext = context;
          return (
            <div data-testid="input-type-panel">{propertyKeys.join(",")}</div>
          );
        }}
      </PropertiesContext.Consumer>
    );

    render(
      <ActionTypePanel
        id={0}
        column={createMockColumn({ type: "table-column-button" })}
        propertyComponent={createMockPropertyComponent()}
        setProperty={mockSetProperty}
      />,
    );

    expect(() => capturedContext.resetActiveComponent()).not.toThrow();
    expect(() => capturedContext.resetActivePage()).not.toThrow();
    expect(() => capturedContext.setActiveComponent()).not.toThrow();
    expect(() => capturedContext.togglePropertyPane()).not.toThrow();
    expect(() => capturedContext.setActivePage()).not.toThrow();

    expect(capturedContext.isPropertyPaneVisible).toBe(true);
    expect(capturedContext.propertyComponentId).toBe(null);
    expect(capturedContext.propertyPageCode).toBe(null);
  });

  it("should set inputType in mergedProps when columnInputType exists", () => {
    let receivedPropertyComponent: any;

    jest.mocked(
      require("@/app/data/componentPropertiesMap"),
    ).componentPropertiesMap = {
      "table-column-button": ["inputType"],
    };

    jest.mocked(
      require("@/app/data/propertiesPanelMap"),
    ).propertyPanelsMap.inputType = ({ propertyComponent }: any) => {
      receivedPropertyComponent = propertyComponent;
      return <div data-testid="input-type-panel">Panel</div>;
    };

    render(
      <ActionTypePanel
        id={0}
        column={createMockColumn({
          type: "table-column-button",
          properties: { columnInputType: "email", someOtherProp: "value" },
        })}
        propertyComponent={createMockPropertyComponent()}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();

    expect(receivedPropertyComponent).toBeDefined();
    expect(receivedPropertyComponent.properties).toBeDefined();

    expect(receivedPropertyComponent.properties.inputType).toBe("email");
    expect(receivedPropertyComponent.properties.columnInputType).toBe("email");
    expect(receivedPropertyComponent.properties.someOtherProp).toBe("value");
  });

  it("should handle mergedProps when columnInputType does not exist", () => {
    let receivedPropertyComponent: any;

    jest.mocked(
      require("@/app/data/componentPropertiesMap"),
    ).componentPropertiesMap = {
      "table-column-button": ["inputType", "format"],
    };

    jest.mocked(
      require("@/app/data/propertiesPanelMap"),
    ).propertyPanelsMap.inputType = ({ propertyComponent }: any) => {
      receivedPropertyComponent = propertyComponent;
      return <div data-testid="input-type-panel">Panel</div>;
    };

    render(
      <ActionTypePanel
        id={0}
        column={createMockColumn({
          type: "table-column-button",
          properties: { someOtherProp: "value" },
        })}
        propertyComponent={createMockPropertyComponent()}
        setProperty={mockSetProperty}
      />,
    );

    expect(receivedPropertyComponent).toBeDefined();
    expect(receivedPropertyComponent?.properties?.inputType).toBeUndefined();
    expect(receivedPropertyComponent?.properties?.someOtherProp).toBe("value");
  });

  it("should handle empty relevantProps array", () => {
    jest.mocked(
      require("@/app/data/componentPropertiesMap"),
    ).componentPropertiesMap = {
      "empty-props": [],
    };

    render(
      <ActionTypePanel
        id={0}
        column={createMockColumn({
          type: "empty-props",
          properties: { tableColumnActionTypes: "empty-props" },
        })}
        propertyComponent={createMockPropertyComponent()}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByText("Action Type")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    expect(screen.queryByTestId("input-type-panel")).not.toBeInTheDocument();
  });
});
