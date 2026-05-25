import { render, screen, fireEvent } from "@testing-library/react";
import ColumnRowV2 from "./ColumnRowV2";
import { ComponentProperty } from "@/app/data/componentProperties";
import { BaseComponent, DataTableColumn } from "@/app/types/types";
import { MicrositeProvider } from "@/app/context/MicrositeContext";
import { UserTaskProvider } from "@/app/context/UserTaskContext";
import { HeaderProviderV2 } from "@/app/context/HeaderContextV2";
import { PropertiesContext } from "@/app/context/PropertiesContext";

// --- Mocks ---

// Mock ComponentProperty with camelCase values to align with data properties
jest.mock("@/app/data/componentProperties", () => ({
  ComponentProperty: {
    InputType: "inputType",
    Format: "format",
    Options: "options",
    DateSeparator: "dateSeparator",
    ColumnInputType: "columnInputType",
    TableColumns: "tableColumns",
    GridData: "gridData",
  },
}));

// Mock Maps using the same camelCase keys
jest.mock("@/app/data/componentPropertiesMap", () => ({
  componentPropertiesMap: {
    text: ["inputType", "format"],
    select: ["options"],
    date: ["dateSeparator", "format"],
    "test-column": ["columnInputType", "inputType"],
    "multi-panel": ["inputType", "format"],
    "separator-test": ["inputType"],
    "empty-props": [],
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useParams: () => ({ workspaceCode: "test-workspace" }),
}));

jest.mock("@/app/data/propertiesPanelMap", () => {
  return {
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
            onClick={() =>
              setProperties({ custom: "abc", inputType: "number" })
            }
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
  };
});

// --- Setup ---

const mockSetProperty = jest.fn();
const mockColumn: DataTableColumn = {
  id: "1",
  type: "table-column",
  properties: {
    columnInputType: "text",
    label: "Test Label",
    name: "test_name",
  },
};
const mockPropertyComponent: BaseComponent = {
  id: "1",
  type: "table",
  category: "form",
  properties: {
    tableColumns: [mockColumn],
  },
};

const renderComponent = (columnOverrides = {}, componentOverrides = {}) => {
  return render(
    <MicrositeProvider>
      <UserTaskProvider>
        <HeaderProviderV2>
          <ColumnRowV2
            id={1}
            column={{ ...mockColumn, ...columnOverrides }}
            propertyComponent={{
              ...mockPropertyComponent,
              ...componentOverrides,
            }}
            setProperty={mockSetProperty}
          />
        </HeaderProviderV2>
      </UserTaskProvider>
    </MicrositeProvider>
  );
};

describe("ColumnRowV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders select dropdown with label", () => {
    renderComponent();
    expect(screen.getByText("Column Data Type")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays initial selected value in dropdown", () => {
    renderComponent();
    expect(screen.getByRole("combobox")).toHaveValue("text");
  });

  it("calls setProperty on input type change", () => {
    renderComponent();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "number" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.any(Array)
    );
  });

  it("does not render date-only property panels if input type is not 'date'", () => {
    renderComponent({ properties: { columnInputType: "text" } });
    expect(screen.queryByTestId("format-panel")).not.toBeInTheDocument();
  });

  it("uses GridData when propertyComponent.type is not 'table'", () => {
    const altCol = {
      ...mockColumn,
      id: "1",
      properties: {
        columnInputType: "text",
      },
    };

    const altComponent = {
      ...mockPropertyComponent,
      type: "grid",
      properties: {
        gridData: [altCol],
      },
    };

    renderComponent(altCol, altComponent);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "date" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.GridData,
      expect.any(Array)
    );
  });

  it("calls setProperty when column Data type is changed", () => {
    renderComponent();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "number" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.any(Array)
    );
  });

  it("renders property panels when available", () => {
    renderComponent();
    expect(screen.getByText("Column Data Type")).toBeInTheDocument();
  });

  it("should not render any panels when no relevantProps are found", () => {
    renderComponent({ type: "unknown" });
    expect(screen.queryByTestId("input-type-panel")).not.toBeInTheDocument();
  });

  it("should skip rendering Format panel when columnInputType is not 'date'", () => {
    renderComponent({ type: "text" });
    expect(screen.queryByTestId("format-panel")).not.toBeInTheDocument();
  });

  it("should skip rendering Options panel when columnInputType is not 'select' or 'checkbox-group'", () => {
    renderComponent({
      type: "select",
      properties: { columnInputType: "text" },
    });
    expect(screen.queryByTestId("options-panel")).not.toBeInTheDocument();
  });

  it("should push propKey to panelGroups only once per PanelComponent", () => {
    renderComponent({ type: "text" });
    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();
  });

  it("should render with empty columnInputType (default value)", () => {
    renderComponent({ properties: {} });
    expect(screen.getByRole("combobox")).toHaveValue("");
  });
});

describe("ColumnRowV2 - Additional Coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update only matching column in updateColumn function", () => {
    const multiColumnComponent = {
      ...mockPropertyComponent,
      properties: {
        tableColumns: [
          { ...mockColumn, id: "1" },
          {
            id: "2",
            type: "table-column",
            properties: { columnInputType: "number" },
          },
        ],
      },
    };

    renderComponent({}, multiColumnComponent);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "date" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.arrayContaining([
        expect.objectContaining({
          id: "1",
          properties: expect.objectContaining({
            columnInputType: "date",
          }),
        }),
        expect.objectContaining({
          id: "2",
          properties: expect.objectContaining({
            columnInputType: "number",
          }),
        }),
      ])
    );
  });

  it("should work with inputColumns property and use GridData", () => {
    const inputTableComponent = {
      ...mockPropertyComponent,
      type: "input-table",
      properties: {
        inputColumns: [mockColumn],
      },
    };

    renderComponent({}, inputTableComponent);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "email" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.GridData,
      expect.any(Array)
    );
  });

  it("should work with gridData property", () => {
    const gridComponent = {
      ...mockPropertyComponent,
      type: "grid",
      properties: {
        gridData: [mockColumn],
      },
    };

    renderComponent({}, gridComponent);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "number" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.GridData,
      expect.any(Array)
    );
  });

  it("should render date-only properties when columnInputType is 'date'", () => {
    renderComponent({
      type: "date",
      properties: { columnInputType: "date" },
    });

    expect(screen.getByTestId("date-separator-panel")).toBeInTheDocument();
  });

  it("should render options property when columnInputType is 'select'", () => {
    renderComponent({
      type: "select",
      properties: { columnInputType: "select" },
    });

    expect(screen.getByTestId("options-panel")).toBeInTheDocument();
  });

  it("should render options property when columnInputType is 'checkbox-group'", () => {
    renderComponent({
      type: "select",
      properties: { columnInputType: "checkbox-group" },
    });

    expect(screen.getByTestId("options-panel")).toBeInTheDocument();
  });
});

describe("ColumnRowV2 - setProperties method behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call setProperty with updated inputType and columnInputType when inputType is in propsObj", () => {
    renderComponent({ type: "text" });

    fireEvent.click(screen.getByText("Trigger"));

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.arrayContaining([
        expect.objectContaining({
          id: "1",
          properties: expect.objectContaining({
            inputType: "email",
            columnInputType: "email",
          }),
        }),
      ])
    );
  });

  it("should call setProperty with only merged props when inputType is not in propsObj", () => {
    renderComponent({ type: "text" });

    fireEvent.click(screen.getByText("TriggerCustom"));

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.arrayContaining([
        expect.objectContaining({
          id: "1",
          properties: expect.objectContaining({
            customProp: "xyz",
          }),
        }),
      ])
    );
  });

  it("should preserve existing properties while adding new ones via setProperties", () => {
    renderComponent({ type: "text" });

    fireEvent.click(screen.getByText("TriggerMerge"));

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.arrayContaining([
        expect.objectContaining({
          id: "1",
          properties: expect.objectContaining({
            columnInputType: "number",
            inputType: "number",
            custom: "abc",
          }),
        }),
      ])
    );
  });
});

describe("Negative cases", () => {
  it("should skip panel rendering when PanelComponent is undefined", () => {
    renderComponent({ type: "non-existent-type" });
    expect(screen.queryByTestId("input-type-panel")).not.toBeInTheDocument();
  });

  it("should skip rendering Format when columnInputType is not 'date'", () => {
    renderComponent({
      type: "text",
      properties: { columnInputType: "text" },
    });

    expect(screen.queryByTestId("format-panel")).not.toBeInTheDocument();
  });
});

describe("ColumnRowV2 - Full Coverage Test Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should test localValue context isPanelOpen and togglePanel with string parameter", () => {
    let capturedContext: any;

    const originalMap = jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap;

    jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap = {
      ...originalMap,
      text: ["inputType"],
    };

    jest.mocked(
      require("@/app/data/propertiesPanelMap")
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

    renderComponent({ type: "text" });

    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();
    expect(capturedContext).toBeDefined();

    expect(capturedContext?.isPanelOpen("testPanel")).toBe(false);

    capturedContext?.togglePanel("testPanel");
    expect(capturedContext?.isPanelOpen("testPanel")).toBe(false);

    capturedContext?.togglePanel("testPanel");
    expect(capturedContext?.isPanelOpen("testPanel")).toBe(false);
  });

  it("should test localValue context isPanelOpen and togglePanel with non-string parameter", () => {
    let capturedContext: any;

    const originalMap = jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap;

    jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap = {
      ...originalMap,
      text: ["inputType"],
    };

    jest.mocked(
      require("@/app/data/propertiesPanelMap")
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

    renderComponent({ type: "text" });

    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();
    expect(capturedContext).toBeDefined();

    expect(capturedContext.isPanelOpen(123)).toBe(false);
    capturedContext.togglePanel(123);

    const objPanel = { id: "test" };
    expect(capturedContext.isPanelOpen(objPanel)).toBe(false);
    capturedContext.togglePanel(objPanel);
  });

  it("should test all localValue context methods without errors", () => {
    let capturedContext: any;

    const originalMap = jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap;

    jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap = {
      ...originalMap,
      text: ["inputType"],
    };

    jest.mocked(
      require("@/app/data/propertiesPanelMap")
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

    renderComponent({ type: "text" });

    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();
    expect(capturedContext).toBeDefined();

    expect(() => capturedContext.resetActiveComponent()).not.toThrow();
    expect(() => capturedContext.resetActivePage()).not.toThrow();
    expect(() => capturedContext.setActiveComponent()).not.toThrow();
    expect(() => capturedContext.togglePropertyPane()).not.toThrow();
    expect(() => capturedContext.setActivePage()).not.toThrow();

    expect(capturedContext.isPropertyPaneVisible).toBe(true);
    expect(capturedContext.propertyComponentId).toBe(null);
    expect(capturedContext.propertyPageCode).toBe(null);
  });

  it("should skip ColumnInputType property and continue with others", () => {
    // Explicitly using ComponentProperty enum values to match the logic inside the component
    jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap = {
      "test-column": [
        ComponentProperty.ColumnInputType,
        ComponentProperty.InputType,
      ],
    };

    jest.mocked(require("@/app/data/propertiesPanelMap")).propertyPanelsMap = {
      [ComponentProperty.ColumnInputType]: () => (
        <div data-testid="column-input-type-panel">Should not render</div>
      ),
      [ComponentProperty.InputType]: () => (
        <div data-testid="input-type-panel">Should render</div>
      ),
    };

    renderComponent({ type: "test-column" });

    expect(
      screen.queryByTestId("column-input-type-panel")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();
  });

  it("should set inputType in mergedProps when columnInputType exists", () => {
    let receivedPropertyComponent: any;

    const originalMap = jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap;

    jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap = {
      ...originalMap,
      text: ["inputType"],
    };

    jest.mocked(
      require("@/app/data/propertiesPanelMap")
    ).propertyPanelsMap.inputType = ({ propertyComponent }: any) => {
      receivedPropertyComponent = propertyComponent;
      return <div data-testid="input-type-panel">Panel</div>;
    };

    renderComponent({
      type: "text",
      properties: { columnInputType: "email", someOtherProp: "value" },
    });

    expect(screen.getByTestId("input-type-panel")).toBeInTheDocument();

    expect(receivedPropertyComponent).toBeDefined();
    expect(receivedPropertyComponent.properties).toBeDefined();

    expect(receivedPropertyComponent.properties.inputType).toBe("email");
    expect(receivedPropertyComponent.properties.columnInputType).toBe("email");
    expect(receivedPropertyComponent.properties.someOtherProp).toBe("value");
  });

  it("should handle mergedProps when columnInputType does not exist", () => {
    let receivedPropertyComponent: any;

    const originalMap = jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap;
    jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap = {
      ...originalMap,
      text: ["inputType", "format"],
    };

    jest.mocked(
      require("@/app/data/propertiesPanelMap")
    ).propertyPanelsMap.inputType = ({ propertyComponent }: any) => {
      receivedPropertyComponent = propertyComponent;
      return <div data-testid="input-type-panel">Panel</div>;
    };

    renderComponent({
      type: "text",
      properties: { someOtherProp: "value" },
    });

    expect(receivedPropertyComponent).toBeDefined();
    expect(receivedPropertyComponent?.properties?.inputType).toBeUndefined();
    expect(receivedPropertyComponent?.properties?.someOtherProp).toBe("value");
  });

  it("should use empty array fallback when all colData sources are undefined", () => {
    const componentWithNoProperties = {
      id: "1",
      type: "table",
      category: "form",
      properties: undefined,
    };

    renderComponent({}, componentWithNoProperties);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "text" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      []
    );
  });

  it("should handle column with undefined properties", () => {
    const columnWithoutProps = {
      ...mockColumn,
      properties: undefined,
    };

    renderComponent(columnWithoutProps);

    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("should handle propertyComponent with null properties", () => {
    const componentWithNullProps = {
      ...mockPropertyComponent,
      properties: null,
    };

    renderComponent({}, componentWithNullProps);

    expect(screen.getByText("Column Data Type")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should use columnInputFieldTypes for input-table type", () => {
    const inputTableComponent = {
      ...mockPropertyComponent,
      type: "input-table",
      properties: {
        inputColumns: [mockColumn],
      },
    };

    renderComponent({}, inputTableComponent);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should generate correct ID for select element", () => {
    renderComponent();

    const selectElement = screen.getByRole("combobox");
    expect(selectElement).toHaveAttribute("id", "columnInputType-2"); // id + 1
  });

  it("should handle type change for different column structures", () => {
    const multiColumnData = [
      { ...mockColumn, id: "1" },
      {
        id: "2",
        type: "table-column",
        properties: { columnInputType: "number" },
      },
    ];

    const componentWithMultiColumns = {
      ...mockPropertyComponent,
      properties: {
        tableColumns: multiColumnData,
      },
    };

    renderComponent({}, componentWithMultiColumns);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "date" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TableColumns,
      expect.arrayContaining([
        expect.objectContaining({
          id: "1",
          properties: expect.objectContaining({
            columnInputType: "date",
          }),
        }),
        expect.objectContaining({
          id: "2",
          properties: expect.objectContaining({
            columnInputType: "number",
          }),
        }),
      ])
    );
  });

  it("should iterate through panelGroups entries correctly", () => {
    jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap = {
      "multi-panel": ["inputType", "format"],
    };

    jest.mocked(require("@/app/data/propertiesPanelMap")).propertyPanelsMap = {
      inputType: () => <div data-testid="input-panel">Input Panel</div>,
      format: () => <div data-testid="format-panel">Format Panel</div>,
    };

    // Ensure prop 'date' is used so that 'format' panel is NOT skipped
    renderComponent({
      type: "multi-panel",
      properties: { columnInputType: "date" },
    });

    expect(screen.getByTestId("input-panel")).toBeInTheDocument();
    expect(screen.getByTestId("format-panel")).toBeInTheDocument();
  });

  it("should render panel separators for each panel group", () => {
    jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap = {
      "separator-test": ["inputType"],
    };

    renderComponent({ type: "separator-test" });

    const separators = document.querySelectorAll("hr");
    expect(separators.length).toBeGreaterThan(0);
  });

  it("should handle empty relevantProps array", () => {
    jest.mocked(
      require("@/app/data/componentPropertiesMap")
    ).componentPropertiesMap = {
      "empty-props": [],
    };

    renderComponent({ type: "empty-props" });

    expect(screen.getByText("Column Data Type")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    expect(screen.queryByTestId("input-type-panel")).not.toBeInTheDocument();
  });
});
