import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TextPanel from "./TextPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { useParentFormProperties } from "@/app/hooks/useParentFormProperties";
import { useUserTask } from "@/app/context/UserTaskContext";
import { getFormElementsList } from "@/app/utils/formsUtils";

// --- Mocks ---

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("@/app/hooks/useParentFormProperties", () => ({
  useParentFormProperties: jest.fn(),
}));

// NEW MOCK: UserTaskContext
jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("@/app/utils/formsUtils", () => ({
  getFormElementsList: jest.fn(),
}));

jest.mock("@/app/utils/utils", () => ({
  generateRandomId: jest.fn(() => "random-id-123"),
  getDateFormats: jest.fn(() => ["DD/MM/YYYY", "MM/DD/YYYY"]),
}));

jest.mock("@/app/utils/constants", () => {
  const original = jest.requireActual("@/app/utils/constants");
  return {
    ...original,
    InputKeyFormat: /[^a-zA-Z0-9]/g,
    contactTypes: ["email", "phone"],
    inputTypes: ["text", "number"],
    textAlignTypes: ["left", "center", "right"],
    textAreaTypes: ["plain-text", "json"],
    TEXT_CASE: ["uppercase", "lowercase", "capitalize"],
    DATE_FORMAT: [
      { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
      { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
    ],
    HELPER_TEXT_POSITION: [
      { label: "Below Input", value: "belowInput" },
      { label: "Above Input", value: "aboveInput" },
    ],
    separatorOptions: [
      { label: "/", value: "/" },
      { label: "-", value: "-" },
    ],
    timerUnits: [
      { value: "min", label: "Min" },
      { value: "sec", label: "Sec" },
    ],
  };
});

// Styles Mocks
jest.mock("@/app/styles/properties-pane.module.scss", () => ({
  panelHeading: "panelHeading",
  isOpen: "isOpen",
  componentProperty: "componentProperty",
  column: "column",
  propertyLabel: "propertyLabel",
  textInput: "textInput",
  textArea: "textArea",
  checkBoxCenter: "checkBoxCenter",
  conditionalCheckBox: "conditionalCheckBox",
  optionGrid: "optionGrid",
  option: "option",
  active: "active",
}));

jest.mock("@/app/styles/shared.module.scss", () => ({
  mt5: "mt5",
  flexCenter: "flexCenter",
}));

jest.mock("../DataColumnPanel/DataColumnPanel.module.scss", () => ({}));

jest.mock("../../ExpandableColumn/ExpandableColumn.module.scss", () => ({}));

// Component Mocks
jest.mock("../../SVGIcons/ChevronDown", () => () => (
  <div data-testid="chevron-down" />
));

jest.mock("@/app/components/SVGIcons/Add", () => () => (
  <span data-testid="add-icon" />
));

jest.mock("../../UIComponents/Slider/Slider", () => ({
  __esModule: true,
  default: ({ onChange, value, id }: any) => (
    <input
      data-testid={id}
      type="range"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  ),
}));

jest.mock(
  "../../UtilityComponents/DragDropFileUpload/DragDropFileUpload",
  () => ({
    __esModule: true,
    default: ({ handleChange, propertyKey }: any) => (
      <div data-testid="file-upload">
        <button onClick={() => handleChange(propertyKey, "uploaded-file.png")}>
          Upload
        </button>
      </div>
    ),
  }),
);

jest.mock("../../ExpandableColumn/ExpandableColumn", () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="expandable-column">{children}</div>
  ),
  AddExpandableColumn: ({ handleAddCol }: any) => (
    <button data-testid="add-pill-btn" onClick={handleAddCol}>
      + Add Pill
    </button>
  ),
}));

jest.mock("../../UIComponents/TextEditor/TextEditor", () => ({
  __esModule: true,
  default: ({ onChange, value, id }: any) => (
    <textarea
      data-testid={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

jest.mock("../../PropertyInputs/PropertyInput", () => ({
  __esModule: true,
  default: ({ handleChange, value, id, type, options, label }: any) => {
    if (type === "checkbox") {
      return (
        <label htmlFor={id}>
          {label}
          <input
            id={id}
            data-testid={id}
            type="checkbox"
            checked={!!value}
            onChange={handleChange}
          />
        </label>
      );
    }
    if (type === "select") {
      return (
        <select id={id} data-testid={id} value={value} onChange={handleChange}>
          {options?.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        id={id}
        data-testid={id}
        value={value || ""}
        onChange={handleChange}
      />
    );
  },
}));

jest.mock("../SubsectionHeaderColumn/SubsectionHeaderColumn", () => ({
  __esModule: true,
  default: () => <div data-testid="subsection-header-column" />,
}));

jest.mock("./DynamicIconColorConditions", () => ({
  __esModule: true,
  default: ({ handleAddCondition }: any) => (
    <button data-testid="add-condition-btn" onClick={handleAddCondition}>
      Add Condition
    </button>
  ),
}));

jest.mock("../../InternalComponents/SelectDropdown/SelectDropdown", () => ({
  __esModule: true,
  default: ({ id, options, value, onChange }: any) => (
    <select
      id={id}
      data-testid={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

describe("TextPanel Component", () => {
  const mockSetProperty = jest.fn();
  const mockSetProperties = jest.fn();
  const mockTogglePanel = jest.fn();

  const mockPropertyComponent = {
    id: "comp-1",
    category: "component",
    type: "input",
    properties: {
      name: "testField",
      text: "Initial Text",
      showLabel: true,
      label: "My Label",
      showHelperText: true,
      helperText: "Help me",
      helperTextPosition: "belowLabel",
      placeholder: "Placeholder",
      inputType: "text",
      contactType: "email",
      dateSeparator: "/",
      format: "DD/MM/YYYY",
      textColor: "#000000",
      textSize: 14,
      textAlign: "left",
      textCase: "lowercase",
      showConfirmation: false,
      isCollapsible: false,
      isExpandedByDefault: false,
      isHorizontalCollapsible: false,
      subsectionHeaders: [],
      processIdKey: "",
      applicationKey: "",
      fromListTitle: "",
      toListTitle: "",
      languageMode: "plain-text",
      prefixSuffix: "",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => true),
    });
    (useParentFormProperties as jest.Mock).mockReturnValue({
      parentForm: { components: [] },
    });
    (useUserTask as jest.Mock).mockReturnValue({
      tablesNameKeys: {},
    });
    (getFormElementsList as jest.Mock).mockReturnValue([]);
  });

  const defaultProps = {
    propertyKeys: [],
    propertyComponent: mockPropertyComponent,
    component: mockPropertyComponent,
    setProperty: mockSetProperty,
    setProperties: mockSetProperties,
  };

  it("renders panel header and toggles visibility", () => {
    render(
      <TextPanel {...defaultProps} propertyKeys={[ComponentProperty.Name]} />,
    );

    expect(screen.getByTestId("textPanelHeading")).toBeInTheDocument();

    const toggleBtn = screen.getByRole("button", { name: /text/i });
    fireEvent.click(toggleBtn);
    expect(mockTogglePanel).toHaveBeenCalledWith(PropertyPanels.TextPanel);
  });

  it("renders Name as textarea for 'component' category", () => {
    render(
      <TextPanel {...defaultProps} propertyKeys={[ComponentProperty.Name]} />,
    );
    const input = screen.getByTestId("name");
    expect(input.tagName).toBe("TEXTAREA");

    fireEvent.change(input, { target: { value: "New_Name!" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Name,
      "NewName",
    );
  });

  it("renders Name as select for 'form' category", () => {
    const formComponent = {
      ...mockPropertyComponent,
      category: "form",
      type: "input-table-column",
    };
    const componentProp = {
      properties: {
        nameKeyIds: [{ id: "opt1", label: "Option 1" }],
      },
    };

    render(
      <TextPanel
        {...defaultProps}
        propertyComponent={formComponent}
        component={componentProp}
        propertyKeys={[ComponentProperty.Name]}
      />,
    );

    const select = screen.getByTestId("name");
    expect(select.tagName).toBe("SELECT");

    fireEvent.change(select, { target: { value: "opt1" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Name,
      "opt1",
    );
  });

  it("uses tablesNameKeys for multiple-actions columnInputType", () => {
    const tableNameKeys = [
      { id: "action1", label: "Action 1" },
      { id: "action2", label: "Action 2" },
    ];

    (useUserTask as jest.Mock).mockReturnValue({
      tablesNameKeys: { "table-1": tableNameKeys },
    });

    const componentProp = {
      ...mockPropertyComponent,
      category: "form",
      properties: {
        ...mockPropertyComponent.properties,
        columnInputType: "multiple-actions",
      },
    };

    const component = {
      properties: {
        columnInputType: "multiple-actions",
        nameKeyIds: [],
      },
    };

    render(
      <TextPanel
        {...defaultProps}
        propertyComponent={componentProp}
        component={component}
        parentComponentName="table-1"
        propertyKeys={[ComponentProperty.Name]}
      />,
    );

    const select = screen.getByTestId("name");
    expect(select).toBeInTheDocument();

    // Verify options are from tablesNameKeys
    fireEvent.change(select, { target: { value: "action1" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Name,
      "action1",
    );
  });

  it("shows error when name is already taken", () => {
    (getFormElementsList as jest.Mock).mockReturnValue(["testField"]);
    render(
      <TextPanel
        {...defaultProps}
        propertyComponent={{ ...mockPropertyComponent, category: "form" }}
        component={{ properties: { nameKeyIds: [] } }}
        propertyKeys={[ComponentProperty.Name]}
      />,
    );

    expect(
      screen.getByText("This path is already in use."),
    ).toBeInTheDocument();
  });

  it("renders Text input and updates", () => {
    render(
      <TextPanel {...defaultProps} propertyKeys={[ComponentProperty.Text]} />,
    );
    const input = screen.getByPlaceholderText("Enter text here");
    fireEvent.change(input, { target: { value: "Updated" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Text,
      "Updated",
    );
  });

  it("renders Text as textarea for typograph", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyComponent={{ ...mockPropertyComponent, type: "typograph" }}
        propertyKeys={[ComponentProperty.Text]}
      />,
    );
    const textarea = screen.getByPlaceholderText("Enter text here");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(
      screen.getByText("Formatting & Dynamic Typograph Guide"),
    ).toBeInTheDocument();
  });

  it("hides Text input if IsRichTextEditor is true for typograph", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyComponent={{
          ...mockPropertyComponent,
          type: "typograph",
          properties: {
            ...mockPropertyComponent.properties,
            isRichTextEditor: true,
          },
        }}
        propertyKeys={[ComponentProperty.Text]}
      />,
    );
    expect(
      screen.queryByPlaceholderText("Enter text here"),
    ).not.toBeInTheDocument();
  });

  it("renders Rich Text Editor toggle and editor", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        type: "typograph",
        properties: {
          ...mockPropertyComponent.properties,
          isRichTextEditor: true,
        },
      },
      propertyKeys: [
        ComponentProperty.IsRichTextEditor,
        ComponentProperty.RichTextEditor,
      ],
    };
    render(<TextPanel {...props} />);

    const toggle = screen.getByTestId("isRichTextEditor");
    fireEvent.click(toggle);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsRichTextEditor,
      false,
    );

    const editor = screen.getByTestId("richTextEditor");
    fireEvent.change(editor, { target: { value: "<p>Rich</p>" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.RichTextEditor,
      "<p>Rich</p>",
    );
  });

  it("renders Text Align buttons and updates", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.TextAlign]}
      />,
    );
    const centerBtn = screen.getByTestId("center");
    fireEvent.click(centerBtn);
    expect(mockSetProperty).toHaveBeenCalledWith("textAlign", "center");
  });

  it("renders Text Color input", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.TextColor]}
      />,
    );
    const input = screen.getByPlaceholderText("Enter text color here");
    fireEvent.change(input, { target: { value: "#333" } });
    expect(mockSetProperty).toHaveBeenCalledWith("textColor", "#333");
  });

  it("renders Text Size slider", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.TextSize]}
      />,
    );
    const slider = screen.getByTestId("textSize");
    fireEvent.change(slider, { target: { value: 20 } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.TextSize,
      20,
    );
  });

  it("toggles Show Label and updates Label text", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.ShowLabel, ComponentProperty.Label]}
      />,
    );

    const checkbox = screen.getByLabelText("Show Label");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ShowLabel,
      false,
    );

    const input = screen.getByTestId("label");
    fireEvent.change(input, { target: { value: "New Label" } });
    expect(mockSetProperty).toHaveBeenCalledWith("label", "New Label");
  });

  it("toggles Helper Text and updates fields", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.HelperText]}
      />,
    );

    const checkbox = screen.getByTestId("showHelperText");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ShowHelperText,
      false,
    );

    const input = screen.getByTestId("helperText");
    fireEvent.change(input, { target: { value: "Help" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.HelperText,
      "Help",
    );

    const select = screen.getByTestId("helperTextPosition");
    fireEvent.change(select, { target: { value: "aboveInput" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.HelperTextPosition,
      "aboveInput",
    );
  });

  it("renders Placeholder", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.Placeholder]}
      />,
    );
    const input = screen.getByPlaceholderText("Enter placeholder here");
    fireEvent.change(input, { target: { value: "New Place" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Placeholder,
      "New Place",
    );
  });

  it("hides Placeholder if columnDataType is display", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        properties: {
          ...mockPropertyComponent.properties,
          columnDataType: "display",
        },
      },
      propertyKeys: [ComponentProperty.Placeholder],
    };
    render(<TextPanel {...props} />);
    expect(
      screen.queryByPlaceholderText("Enter placeholder here"),
    ).not.toBeInTheDocument();
  });

  it("renders Input Type buttons and resets properties", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.InputType]}
      />,
    );

    const numberBtn = screen.getByTestId("number");
    fireEvent.click(numberBtn);
    expect(mockSetProperty).toHaveBeenCalledWith("inputType", "number");

    const textBtn = screen.getByTestId("text");
    fireEvent.click(textBtn);
    expect(mockSetProperties).toHaveBeenCalledWith({
      isCalculated: false,
      formula: "",
      inputType: "text",
    });
  });

  it("renders Contact Type buttons", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.ContactType]}
      />,
    );
    const btn = screen.getByTestId("email");
    fireEvent.click(btn);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ContactType,
      "email",
    );
  });

  it("handles Date Separator change", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.DateSeparator]}
      />,
    );
    const select = screen.getByTestId("dateSeparator");
    fireEvent.change(select, { target: { value: "-" } });

    expect(mockSetProperties).toHaveBeenCalledWith({
      [ComponentProperty.DateSeparator]: "-",
      [ComponentProperty.Format]: "DD/MM/YYYY",
      [ComponentProperty.Placeholder]: "DD/MM/YYYY",
    });
  });

  it("handles Format change", () => {
    render(
      <TextPanel {...defaultProps} propertyKeys={[ComponentProperty.Format]} />,
    );
    const select = screen.getByTestId("format");
    fireEvent.change(select, { target: { value: "MM/DD/YYYY" } });
    expect(mockSetProperties).toHaveBeenCalledWith({
      [ComponentProperty.Format]: "MM/DD/YYYY",
    });
  });

  it("renders Text Case only for text input", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.TextCase]}
      />,
    );
    const select = screen.getByTestId("textCase");
    fireEvent.change(select, { target: { value: "uppercase" } });
    expect(mockSetProperties).toHaveBeenCalledWith({
      [ComponentProperty.TextCase]: "uppercase",
    });
  });

  it("handles Collapsible and Expanded Default", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        properties: {
          ...mockPropertyComponent.properties,
          isCollapsible: true,
        },
      },
      propertyKeys: [
        ComponentProperty.IsCollapsible,
        ComponentProperty.IsExpandedByDefault,
      ],
    };
    render(<TextPanel {...props} />);

    const collapseCheck = screen.getByLabelText("Is Collapsible");
    fireEvent.click(collapseCheck);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsCollapsible,
      false,
    );

    const expandCheck = screen.getByLabelText("Is Expanded by Default");
    fireEvent.click(expandCheck);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsExpandedByDefault,
      true,
    );
  });

  it("renders Subsection Headers (Pills) and handles Add Pill", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        properties: {
          ...mockPropertyComponent.properties,
          isCollapsible: true,
          subsectionHeaders: [],
        },
      },
      propertyKeys: [ComponentProperty.SubsectionHeaders],
    };
    render(<TextPanel {...props} />);

    const addBtn = screen.getByTestId("add-pill-btn");
    fireEvent.click(addBtn);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SubsectionHeaders,
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ label: "Pill 1" }),
        }),
      ]),
    );
  });

  it("hides Add Pill button if limit reached (8 pills)", () => {
    const headers = Array(8).fill({ id: "1" });
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        properties: {
          ...mockPropertyComponent.properties,
          isCollapsible: true,
          subsectionHeaders: headers,
        },
      },
      propertyKeys: [ComponentProperty.SubsectionHeaders],
    };
    render(<TextPanel {...props} />);
    expect(screen.queryByTestId("add-pill-btn")).not.toBeInTheDocument();
  });

  it("renders Prefix/Suffix controls", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.PrefixSuffix]}
      />,
    );
    const mainSelect = screen.getByTestId("prefixSuffix");
    fireEvent.change(mainSelect, { target: { value: "prefix" } });
    expect(mockSetProperty).toHaveBeenCalledWith("prefixSuffix", "prefix");
  });

  it("renders Prefix Type select and Text Input", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        properties: {
          ...mockPropertyComponent.properties,
          prefixSuffix: "prefix",
          prefixType: "text",
        },
      },
      propertyKeys: [ComponentProperty.PrefixSuffix],
    };
    render(<TextPanel {...props} />);

    const typeSelect = document.getElementById("prefixType");
    fireEvent.change(typeSelect!, { target: { value: "icon" } });
    expect(mockSetProperty).toHaveBeenCalledWith("prefixType", "icon");

    const textInput = document.getElementById("prefixText");
    fireEvent.change(textInput!, { target: { value: "Pre" } });
    expect(mockSetProperty).toHaveBeenCalledWith("prefixText", "Pre");
  });

  it("renders Prefix Icon Upload options", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        properties: {
          ...mockPropertyComponent.properties,
          prefixSuffix: "prefix",
          prefixType: "icon",
          prefixIconUploadType: "url",
        },
      },
      propertyKeys: [ComponentProperty.PrefixSuffix],
    };
    render(<TextPanel {...props} />);

    const uploadTypeSelect = screen.getByTestId("prefixIconUploadType");
    fireEvent.change(uploadTypeSelect, { target: { value: "file-upload" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      "prefixIconUploadType",
      "file-upload",
    );

    const urlInput = screen.getByTestId("iconUrl");
    fireEvent.change(urlInput, { target: { value: "http://img" } });
    expect(mockSetProperty).toHaveBeenCalledWith("prefixIconUrl", "http://img");
  });

  it("handles Dynamic Icon Upload Type setting defaults", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        properties: {
          ...mockPropertyComponent.properties,
          prefixSuffix: "prefix",
          prefixType: "icon",
        },
      },
      propertyKeys: [ComponentProperty.PrefixSuffix],
    };
    render(<TextPanel {...props} />);

    const uploadTypeSelect = screen.getByTestId("prefixIconUploadType");
    fireEvent.change(uploadTypeSelect, { target: { value: "dynamic" } });

    expect(mockSetProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        prefixIconUploadType: "dynamic",
        prefixDynamicIconName: "circle-solid",
      }),
    );
  });

  it("renders Dynamic Icon controls and handles logic", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        properties: {
          ...mockPropertyComponent.properties,
          prefixSuffix: "prefix",
          prefixType: "icon",
          prefixIconUploadType: "dynamic",
        },
      },
      propertyKeys: [ComponentProperty.PrefixSuffix],
    };
    render(<TextPanel {...props} />);

    const nameSelect = screen.getByTestId("prefixDynamicIconName");
    fireEvent.change(nameSelect, { target: { value: "phone" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      "prefixDynamicIconName",
      "phone",
    );

    const sizeInput = screen.getByTestId("prefixDynamicIconSize");
    fireEvent.change(sizeInput, { target: { value: "24" } });
    expect(mockSetProperty).toHaveBeenCalledWith("prefixDynamicIconSize", 24);

    const hideCheck = screen.getByTestId("prefixHideIconOnNoMatch");
    fireEvent.click(hideCheck);
    expect(mockSetProperty).toHaveBeenCalledWith(
      "prefixHideIconOnNoMatch",
      true,
    );

    const colorInput = screen.getByTestId("prefixDynamicIconDefaultColor");
    fireEvent.change(colorInput, { target: { value: "#FFF" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      "prefixDynamicIconDefaultColor",
      "#FFF",
    );

    const addBtn = screen.getByTestId("add-condition-btn");
    fireEvent.click(addBtn);
    expect(mockSetProperty).toHaveBeenCalledWith(
      "prefixDynamicIconColorConditions",
      expect.arrayContaining([expect.objectContaining({ color: "#000000" })]),
    );
  });

  it("handles Prefix AND Suffix logic", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        properties: {
          ...mockPropertyComponent.properties,
          prefixSuffix: "prefix-suffix",
          prefixType: "text",
          suffixType: "text",
        },
      },
      propertyKeys: [ComponentProperty.PrefixSuffix],
    };
    render(<TextPanel {...props} />);

    expect(document.getElementById("prefixType")).toBeInTheDocument();
    expect(document.getElementById("suffixType")).toBeInTheDocument();
  });

  it("renders IsHorizontalCollapsible", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.IsHorizontalCollapsible]}
      />,
    );
    const checkbox = screen.getByTestId("isHorizontalCollapsible");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IsHorizontalCollapsible,
      true,
    );
  });

  it("renders ShowConfirmation", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.ShowConfirmation]}
      />,
    );
    const checkbox = screen.getByTestId("showConfirmation");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ShowConfirmation,
      true,
    );
  });

  it("renders ShowHyphen", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.ShowHyphen]}
      />,
    );
    const checkbox = screen.getByTestId("showHyphen");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ShowHyphen,
      true,
    );
  });

  it("renders ProcessIdKey, ApplicationKey, FromList/ToList Titles", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[
          ComponentProperty.ProcessIdKey,
          ComponentProperty.ApplicationKey,
          ComponentProperty.FromListTitle,
          ComponentProperty.ToListTitle,
        ]}
      />,
    );

    const procInput = document.getElementById("processIdKey");
    fireEvent.change(procInput!, { target: { value: "pid" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ProcessIdKey,
      "pid",
    );

    const appInput = screen.getByTestId("applicationKey");
    fireEvent.change(appInput, { target: { value: "aid" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ApplicationKey,
      "aid",
    );

    const fromInput = document.getElementById("fromListTitle");
    fireEvent.change(fromInput!, { target: { value: "Source" } });
    expect(mockSetProperty).toHaveBeenCalledWith("fromListTitle", "Source");

    const toInput = document.getElementById("toListTitle");
    fireEvent.change(toInput!, { target: { value: "Dest" } });
    expect(mockSetProperty).toHaveBeenCalledWith("toListTitle", "Dest");
  });

  it("renders Language Mode options", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.LanguageMode]}
      />,
    );
    const jsonBtn = screen.getByTestId("json");
    fireEvent.click(jsonBtn);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.LanguageMode,
      "json",
    );
  });

  it("renders Dialect Code select and updates value", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={[ComponentProperty.DialectCode]}
        propertyComponent={{
          ...defaultProps.propertyComponent,
          properties: {
            ...defaultProps.propertyComponent.properties,
            columnInputType: "condition-builder",
            dialectCode: "LOS",
          },
        }}
      />,
    );

    const dialectSelect = screen.getByTestId("dialectCode");
    expect(dialectSelect).toBeInTheDocument();
    expect(dialectSelect).toHaveValue("LOS");

    fireEvent.change(dialectSelect, { target: { value: "COLLECT" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DialectCode,
      "COLLECT",
    );
  });

  it("returns null for unknown property", () => {
    render(
      <TextPanel
        {...defaultProps}
        propertyKeys={["Unknown" as ComponentProperty]}
      />,
    );

    expect(screen.queryByTestId("name")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter text here"),
    ).not.toBeInTheDocument();
  });

  it("hides Prefix/Suffix for api-action columnInputType", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        properties: {
          ...mockPropertyComponent.properties,
          columnInputType: "api-action",
        },
      },
      propertyKeys: [ComponentProperty.PrefixSuffix],
    };
    render(<TextPanel {...props} />);
    expect(screen.queryByTestId("prefixSuffix")).not.toBeInTheDocument();
  });

  it("hides DialectCode for non-condition-builder types", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        type: "input",
        properties: {
          ...mockPropertyComponent.properties,
          columnInputType: "text",
        },
      },
      propertyKeys: [ComponentProperty.DialectCode],
    };
    render(<TextPanel {...props} />);
    expect(screen.queryByTestId("dialectCode")).not.toBeInTheDocument();
  });

  describe("ConfigureTimer property", () => {
    it("renders ConfigureTimer checkbox for button-v2 with actionType submit", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "submit",
            configureTimer: false,
          },
        },
        propertyKeys: [ComponentProperty.ConfigureTimer],
      };
      render(<TextPanel {...props} />);
      const checkbox = screen.getByTestId("configureTimer");
      expect(checkbox).toBeInTheDocument();
      fireEvent.click(checkbox);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.ConfigureTimer,
        true,
      );
    });

    it("does not render ConfigureTimer for button-v2 with non-submit actionType", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "route",
          },
        },
        propertyKeys: [ComponentProperty.ConfigureTimer],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("configureTimer")).not.toBeInTheDocument();
    });
  });

  describe("Timer property", () => {
    it("renders Timer input when configureTimer is true and actionType is submit", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "submit",
            configureTimer: true,
            timer: "5",
          },
        },
        propertyKeys: [ComponentProperty.Timer],
      };
      render(<TextPanel {...props} />);
      const input = screen.getByTestId("timer");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("5");
      fireEvent.change(input, { target: { value: "10" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.Timer,
        "10",
      );
    });

    it("does not render Timer when configureTimer is false", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "submit",
            configureTimer: false,
          },
        },
        propertyKeys: [ComponentProperty.Timer],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("timer")).not.toBeInTheDocument();
    });

    it("does not render Timer for button-v2 with non-submit actionType", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "route",
            configureTimer: true,
          },
        },
        propertyKeys: [ComponentProperty.Timer],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("timer")).not.toBeInTheDocument();
    });
  });

  describe("TimerText property", () => {
    it("renders TimerText input when configureTimer is true and actionType is submit", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "submit",
            configureTimer: true,
            timerText: "Please wait",
          },
        },
        propertyKeys: [ComponentProperty.TimerText],
      };
      render(<TextPanel {...props} />);
      const input = screen.getByTestId("timerText");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("Please wait");
      fireEvent.change(input, { target: { value: "Processing" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TimerText,
        "Processing",
      );
    });

    it("does not render TimerText when configureTimer is false", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "submit",
            configureTimer: false,
          },
        },
        propertyKeys: [ComponentProperty.TimerText],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("timerText")).not.toBeInTheDocument();
    });

    it("does not render TimerText for button-v2 with non-submit actionType", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "route",
            configureTimer: true,
          },
        },
        propertyKeys: [ComponentProperty.TimerText],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("timerText")).not.toBeInTheDocument();
    });
  });

  describe("TimerUnit property", () => {
    it("renders TimerUnit options when configureTimer is true and actionType is submit", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "submit",
            configureTimer: true,
          },
        },
        propertyKeys: [ComponentProperty.TimerUnit],
      };
      render(<TextPanel {...props} />);
      expect(screen.getByTestId("timerUnit-min")).toBeInTheDocument();
      expect(screen.getByTestId("timerUnit-sec")).toBeInTheDocument();
    });

    it("marks min as active by default when timerUnit is undefined", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "submit",
            configureTimer: true,
            timerUnit: undefined,
          },
        },
        propertyKeys: [ComponentProperty.TimerUnit],
      };
      render(<TextPanel {...props} />);
      const minBtn = screen.getByTestId("timerUnit-min");
      expect(minBtn).toBeInTheDocument();
    });

    it("calls setProperty when a timer unit is selected", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "submit",
            configureTimer: true,
          },
        },
        propertyKeys: [ComponentProperty.TimerUnit],
      };
      render(<TextPanel {...props} />);
      fireEvent.click(screen.getByTestId("timerUnit-sec"));
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TimerUnit,
        "sec",
      );
    });

    it("does not render TimerUnit when configureTimer is false", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "submit",
            configureTimer: false,
          },
        },
        propertyKeys: [ComponentProperty.TimerUnit],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("timerUnit-min")).not.toBeInTheDocument();
    });

    it("does not render TimerUnit for button-v2 with non-submit actionType", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "button-v2",
          properties: {
            ...mockPropertyComponent.properties,
            actionType: "route",
            configureTimer: true,
          },
        },
        propertyKeys: [ComponentProperty.TimerUnit],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("timerUnit-min")).not.toBeInTheDocument();
    });
  });

  describe("TextCase property", () => {
    it("does not render TextCase when inputType is not text", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            inputType: "number",
          },
        },
        propertyKeys: [ComponentProperty.TextCase],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("textCase")).not.toBeInTheDocument();
    });

    it("renders TextCase when inputType is text", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            inputType: "text",
          },
        },
        propertyKeys: [ComponentProperty.TextCase],
      };
      render(<TextPanel {...props} />);
      expect(screen.getByTestId("textCase")).toBeInTheDocument();
    });
  });

  describe("DateSeparator property", () => {
    it("hides DateSeparator if columnDataType is display", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            columnDataType: "display",
          },
        },
        propertyKeys: [ComponentProperty.DateSeparator],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("dateSeparator")).not.toBeInTheDocument();
    });

    it("renders DateSeparator when columnDataType is not display", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            columnDataType: "input",
          },
        },
        propertyKeys: [ComponentProperty.DateSeparator],
      };
      render(<TextPanel {...props} />);
      expect(screen.getByTestId("dateSeparator")).toBeInTheDocument();
    });
  });

  describe("IsExpandedByDefault property", () => {
    it("returns null when isCollapsible is not true", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            isCollapsible: false,
          },
        },
        propertyKeys: [ComponentProperty.IsExpandedByDefault],
      };
      render(<TextPanel {...props} />);
      expect(
        screen.queryByLabelText("Is Expanded by Default"),
      ).not.toBeInTheDocument();
    });

    it("renders IsExpandedByDefault when isCollapsible is true", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            isCollapsible: true,
          },
        },
        propertyKeys: [ComponentProperty.IsExpandedByDefault],
      };
      render(<TextPanel {...props} />);
      expect(
        screen.getByLabelText("Is Expanded by Default"),
      ).toBeInTheDocument();
    });
  });

  describe("SubsectionHeaders property", () => {
    it("returns null when isCollapsible is not true", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            isCollapsible: false,
            subsectionHeaders: [],
          },
        },
        propertyKeys: [ComponentProperty.SubsectionHeaders],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("subsectionHeaders")).not.toBeInTheDocument();
    });

    it("renders SubsectionHeaders when isCollapsible is true", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            isCollapsible: true,
            subsectionHeaders: [],
          },
        },
        propertyKeys: [ComponentProperty.SubsectionHeaders],
      };
      render(<TextPanel {...props} />);
      expect(screen.getByTestId("subsectionHeaders")).toBeInTheDocument();
    });
  });

  describe("Slider properties", () => {
    it("renders SliderMin", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.SliderMin]}
        />,
      );
      const input = screen.getByTestId("sliderMin");
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: "10" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.SliderMin,
        "10",
      );
    });

    it("renders SliderMax", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.SliderMax]}
        />,
      );
      const input = screen.getByTestId("sliderMax");
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: "200" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.SliderMax,
        "200",
      );
    });

    it("renders SliderStep", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.SliderStep]}
        />,
      );
      const input = screen.getByTestId("sliderStep");
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: "5" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.SliderStep,
        5,
      );
    });

    it("renders SliderPrefixText", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.SliderPrefixText]}
        />,
      );
      const input = screen.getByTestId("sliderPrefixText");
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: "$" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.SliderPrefixText,
        "$",
      );
    });

    it("renders SliderSuffixText", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.SliderSuffixText]}
        />,
      );
      const input = screen.getByTestId("sliderSuffixText");
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: "%" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.SliderSuffixText,
        "%",
      );
    });

    it("renders SliderValueFontSize", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.SliderValueFontSize]}
        />,
      );
      const input = screen.getByTestId("sliderValueFontSize");
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: "32" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.SliderValueFontSize,
        32,
      );
    });

    it("renders SliderValueFontWeight", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.SliderValueFontWeight]}
        />,
      );
      const select = screen.getByTestId("sliderValueFontWeight");
      expect(select).toBeInTheDocument();
      fireEvent.change(select, { target: { value: "700" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.SliderValueFontWeight,
        "700",
      );
    });
  });

  describe("DialectCode property", () => {
    it("renders DialectCode when type is condition-builder", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "condition-builder",
          properties: {
            ...mockPropertyComponent.properties,
          },
        },
        propertyKeys: [ComponentProperty.DialectCode],
      };
      render(<TextPanel {...props} />);
      expect(screen.getByTestId("dialectCode")).toBeInTheDocument();
    });

    it("returns null when neither columnInputType nor type is condition-builder", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          type: "input",
          properties: {
            ...mockPropertyComponent.properties,
            columnInputType: "text",
          },
        },
        propertyKeys: [ComponentProperty.DialectCode],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("dialectCode")).not.toBeInTheDocument();
    });
  });

  describe("ContactType property", () => {
    it("renders ContactType options and handles selection", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.ContactType]}
        />,
      );
      const phoneBtn = screen.getByTestId("phone");
      expect(phoneBtn).toBeInTheDocument();
      fireEvent.click(phoneBtn);
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.ContactType,
        "phone",
      );
    });
  });

  describe("TextAlign icons", () => {
    it("renders TextAlign with all alignment options", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.TextAlign]}
        />,
      );
      expect(screen.getByTestId("left")).toBeInTheDocument();
      expect(screen.getByTestId("right")).toBeInTheDocument();
    });
  });

  describe("HelperText with helperTextSpacing", () => {
    it("renders helperTextSpacing when helperTextPosition is belowInput", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            showHelperText: true,
            helperTextPosition: "belowInput",
            helperTextSpacing: 10,
          },
        },
        propertyKeys: [ComponentProperty.HelperText],
      };
      render(<TextPanel {...props} />);
      const spacingInput = screen.getByTestId("helperTextSpacing");
      expect(spacingInput).toBeInTheDocument();
      expect(spacingInput).toHaveValue(10);
    });

    it("does not render helperTextSpacing when helperTextPosition is aboveInput", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            showHelperText: true,
            helperTextPosition: "aboveInput",
            helperTextSpacing: 10,
          },
        },
        propertyKeys: [ComponentProperty.HelperText],
      };
      render(<TextPanel {...props} />);
      expect(screen.queryByTestId("helperTextSpacing")).not.toBeInTheDocument();
    });
  });

  describe("Name key ID rendering", () => {
    it("renders name select with nameKeyIds from component when type is input-table-column", () => {
      const nameKeyIds = [
        { id: "id1", label: "Field 1" },
        { id: "id2", label: "Field 2" },
      ];
      const componentProp = {
        ...mockPropertyComponent,
        category: "form",
        type: "input-table-column",
        properties: {
          ...mockPropertyComponent.properties,
          nameKeyIds,
        },
      };
      const props = {
        ...defaultProps,
        propertyComponent: componentProp,
        component: {
          properties: {
            nameKeyIds,
          },
        },
        propertyKeys: [ComponentProperty.Name],
      };
      render(<TextPanel {...props} />);
      const select = screen.getByTestId("name");
      expect(select.tagName).toBe("SELECT");
    });

    it("renders name select with nameKeyIds from parentForm when type is table-column", () => {
      (useParentFormProperties as jest.Mock).mockReturnValue({
        parentForm: {
          properties: {
            nameKeyIds: [{ id: "parentId1", label: "Parent Field 1" }],
          },
        },
      });
      const componentProp = {
        ...mockPropertyComponent,
        category: "form",
        type: "table-column",
      };
      const props = {
        ...defaultProps,
        propertyComponent: componentProp,
        component: {
          properties: {},
        },
        propertyKeys: [ComponentProperty.Name],
      };
      render(<TextPanel {...props} />);
      const select = screen.getByTestId("name");
      expect(select.tagName).toBe("SELECT");
    });
  });

  describe("Add name key functionality", () => {
    const mockUpdateComponentProperties = jest.fn();
    const mockSetFormsNamekeys = jest.fn();

    const formPropsWithParent = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        category: "form",
        type: "input",
      },
      component: {
        properties: {
          nameKeyIds: [{ id: "existing-id", label: "existing-key" }],
        },
      },
      propertyKeys: [ComponentProperty.Name],
    };

    beforeEach(() => {
      (useUserTask as jest.Mock).mockReturnValue({
        tablesNameKeys: {},
        updateComponentProperties: mockUpdateComponentProperties,
        formsNamekeys: {},
        setFormsNamekeys: mockSetFormsNamekeys,
      });
      (useParentFormProperties as jest.Mock).mockReturnValue({
        parentForm: {
          id: "form-1",
          properties: {
            nameKeyIds: [{ id: "existing-id", label: "existing-key" }],
            name: "test-form",
          },
          components: [],
        },
      });
    });

    it("toggles showAddKey when button is clicked", () => {
      render(<TextPanel {...formPropsWithParent} />);
      const toggleBtn = screen.getByRole("button", {
        name: "Add new field path",
      });
      fireEvent.click(toggleBtn);
      expect(
        screen.getByPlaceholderText("Enter field path"),
      ).toBeInTheDocument();
    });

    it("shows duplicate error when adding an existing key", () => {
      render(<TextPanel {...formPropsWithParent} />);
      fireEvent.click(
        screen.getByRole("button", { name: "Add new field path" }),
      );
      const textarea = screen.getByPlaceholderText("Enter field path");
      fireEvent.change(textarea, { target: { value: "existing-key" } });
      expect(screen.getByText("This key already exists.")).toBeInTheDocument();
    });

    it("calls handleAddNameKey when Add button is clicked with valid key", () => {
      render(<TextPanel {...formPropsWithParent} />);
      fireEvent.click(
        screen.getByRole("button", { name: "Add new field path" }),
      );
      const textarea = screen.getByPlaceholderText("Enter field path");
      fireEvent.change(textarea, { target: { value: "new-key" } });
      fireEvent.click(screen.getByTitle("Add Field Path"));
      expect(mockUpdateComponentProperties).toHaveBeenCalled();
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.Name,
        expect.any(String),
      );
    });

    it("handles Enter key press to submit new key", () => {
      render(<TextPanel {...formPropsWithParent} />);
      fireEvent.click(
        screen.getByRole("button", { name: "Add new field path" }),
      );
      const textarea = screen.getByPlaceholderText("Enter field path");
      fireEvent.change(textarea, { target: { value: "new-key" } });
      fireEvent.keyDown(textarea, { key: "Enter" });
      expect(mockUpdateComponentProperties).toHaveBeenCalled();
    });

    it("does not submit on non-Enter key press", () => {
      render(<TextPanel {...formPropsWithParent} />);
      fireEvent.click(
        screen.getByRole("button", { name: "Add new field path" }),
      );
      const textarea = screen.getByPlaceholderText("Enter field path");
      fireEvent.change(textarea, { target: { value: "new-key" } });
      fireEvent.keyDown(textarea, { key: "Tab" });
      expect(mockUpdateComponentProperties).not.toHaveBeenCalled();
    });
  });

  describe("RichTextEditor false branch", () => {
    it("returns nothing when RichTextEditor case has type not typograph", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.RichTextEditor]}
        />,
      );
      expect(screen.queryByTestId("richTextEditor")).not.toBeInTheDocument();
    });
  });

  describe("HelperText spacing input change", () => {
    it("calls setProperty with undefined when helperTextSpacing is cleared", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...mockPropertyComponent,
          properties: {
            ...mockPropertyComponent.properties,
            showHelperText: true,
            helperTextPosition: "belowInput",
            helperTextSpacing: 10,
          },
        },
        propertyKeys: [ComponentProperty.HelperText],
      };
      render(<TextPanel {...props} />);
      const spacingInput = screen.getByTestId("helperTextSpacing");
      fireEvent.change(spacingInput, { target: { value: "" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.HelperTextSpacing,
        undefined,
      );
    });
  });

  describe("TypographGuide expansion toggle", () => {
    it("toggles guide expansion when guide button is clicked", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyComponent={{
            ...mockPropertyComponent,
            type: "typograph",
            properties: {
              ...mockPropertyComponent.properties,
              isRichTextEditor: false,
            },
          }}
          propertyKeys={[ComponentProperty.Text]}
        />,
      );
      const guideBtn = screen.getByRole("button", {
        name: /Formatting & Dynamic Typograph Guide/i,
      });
      fireEvent.click(guideBtn);
      expect(screen.getByText(/format is case-sensitive/i)).toBeInTheDocument();
    });
  });

  describe("Null/undefined property branch coverage", () => {
    const emptyProps = { ...mockPropertyComponent, properties: {} };

    it("renders Name (component) with undefined name uses empty string", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyComponent={emptyProps}
          propertyKeys={[ComponentProperty.Name]}
        />,
      );
      expect(screen.getByTestId("name")).toHaveValue("");
    });

    it("renders Text (non-typograph) with undefined text uses empty string", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyComponent={emptyProps}
          propertyKeys={[ComponentProperty.Text]}
        />,
      );
      expect(screen.getByPlaceholderText("Enter text here")).toHaveValue("");
    });

    it("renders Text (typograph) with undefined text uses empty string", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyComponent={{ ...emptyProps, type: "typograph" }}
          propertyKeys={[ComponentProperty.Text]}
        />,
      );
      expect(screen.getByPlaceholderText("Enter text here")).toHaveValue("");
    });

    it("renders TextColor with undefined textColor uses empty string", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyComponent={emptyProps}
          propertyKeys={[ComponentProperty.TextColor]}
        />,
      );
      expect(screen.getByPlaceholderText("Enter text color here")).toHaveValue(
        "",
      );
    });

    it("renders HelperText with undefined helperText uses empty string", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyComponent={{
            ...emptyProps,
            properties: {
              showHelperText: true,
              helperTextPosition: "belowInput",
            },
          }}
          propertyKeys={[ComponentProperty.HelperText]}
        />,
      );
      expect(screen.getByTestId("helperText")).toHaveValue("");
    });

    it("renders helperTextSpacing with undefined value uses empty string", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyComponent={{
            ...emptyProps,
            properties: {
              showHelperText: true,
              helperTextPosition: "belowInput",
            },
          }}
          propertyKeys={[ComponentProperty.HelperText]}
        />,
      );
      expect(screen.getByTestId("helperTextSpacing")).toHaveValue(null);
    });

    it("renders Placeholder with undefined placeholder uses empty string", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyComponent={emptyProps}
          propertyKeys={[ComponentProperty.Placeholder]}
        />,
      );
      expect(screen.getByPlaceholderText("Enter placeholder here")).toHaveValue(
        "",
      );
    });

    it("renders TimerText with configureTimer=true and undefined timerText uses empty string", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyComponent={{
            ...emptyProps,
            properties: { configureTimer: true },
          }}
          propertyKeys={[ComponentProperty.TimerText]}
        />,
      );
      expect(screen.getByTestId("timerText")).toHaveValue("");
    });

    it("renders without isPanelOpen (null branch)", () => {
      (usePropertyPane as jest.Mock).mockReturnValue({
        togglePanel: mockTogglePanel,
        isPanelOpen: undefined,
      });
      render(
        <TextPanel {...defaultProps} propertyKeys={[ComponentProperty.Name]} />,
      );
      expect(screen.getByTestId("textPanelHeading")).toBeInTheDocument();
    });

    it("renders subsectionHeaders with undefined falls back to empty array", () => {
      render(
        <TextPanel
          {...defaultProps}
          propertyComponent={emptyProps}
          propertyKeys={[ComponentProperty.SubsectionHeaders]}
        />,
      );
      expect(screen.getByTestId("textPanelHeading")).toBeInTheDocument();
    });
  });
});
