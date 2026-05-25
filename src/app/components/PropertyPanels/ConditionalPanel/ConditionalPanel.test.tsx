import { render, screen, fireEvent, act } from "@testing-library/react";
import ConditionalPanel from "./ConditionalPanel";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { useParentFormProperties } from "../../../hooks/useParentFormProperties";
import { useFindForm } from "../../../hooks/useFindForm";
import { HeaderProviderV2 } from "../../../context/HeaderContextV2";
import { ComponentProperty } from "../../../data/componentProperties";
import { componentIcons } from "../../../data/componentIcons";
import {
  getKeyValue,
  generateRandomId,
  getSelectedOptions,
} from "../../../utils/utils";
import { NameKeyId } from "../../../types/types";
const mockParentForm = {
  id: "form-1",
  type: "form",
  category: "component",
  properties: {
    nameKeyIds: [
      { id: "formRow", label: "formRow" },
      { id: "Input_Field_6", label: "Input_Field_6" },
      { id: "Input_Field_1", label: "Input_Field_1" },
      { id: "Input_Field_2", label: "Input_Field_2" },
      { id: "Input_Field_3", label: "Input_Field_3" },
      { id: "Select_Field", label: "Select_Field" },
      { id: "Field1", label: "Field1" },
      { id: "Field2", label: "Field2" },
      { id: "newSelect", label: "newSelect" },
    ],
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

jest.mock("../../../context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("../../../hooks/useParentFormProperties", () => ({
  useParentFormProperties: jest.fn(),
}));

jest.mock("../../../hooks/useFindForm", () => ({
  useFindForm: jest.fn(),
}));
jest.mock("../../../utils/utils", () => ({
  getKeyValue: jest.fn(),
  generateRandomId: jest.fn(),
  getSelectedOptions: jest.fn(),
}));

describe("ConditionalPanel Component", () => {
  const mockTogglePanel = jest.fn();
  const mockSetProperty = jest.fn();
  const mockPropertyComponent = {
    id: "1",
    properties: {
      isConditionalComponent: false,
      visibleOnFormResponse: false,
      linkedForm: "",
      isCollapsible: false,
      lineUnderLabel: false,
      key: { parentNames: [] },
    },
    category: "form",
  };

  beforeEach(() => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn().mockReturnValue(true),
    });
    (useParentFormProperties as jest.Mock).mockReturnValue({
      parentForm: mockParentForm,
    });
    (useFindForm as jest.Mock).mockReturnValue({
      formNames: ["Form1", "Form2"],
    });
    (generateRandomId as jest.Mock).mockReturnValue("hn2he434r34f34fefr4");
    (getSelectedOptions as jest.Mock).mockImplementation(
      (selected: string[], options: NameKeyId[]) =>
        selected.map((item) => ({ id: item, label: item }))
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders ConditionalPanel correctly", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[]}
          propertyComponent={{ id: "1", properties: {}, category: "form" }}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );
    expect(screen.getByText("Conditions")).toBeInTheDocument();
  });

  it("toggles panel visibility when button is clicked", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[]}
          propertyComponent={{ id: "1", properties: {}, category: "form" }}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );
    const button = screen.getByRole("button", { name: /conditions/i });
    fireEvent.click(button);
    expect(mockTogglePanel).toHaveBeenCalled();
  });

  it("renders checkbox for Conditional field", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[ComponentProperty.IsConditionalComponent]}
          propertyComponent={{ id: "1", properties: {}, category: "form" }}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );
    expect(screen.getByLabelText("Conditional field")).toBeInTheDocument();
  });

  it("calls setProperty when checkbox is toggled", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[ComponentProperty.IsConditionalComponent]}
          propertyComponent={{ id: "1", properties: {}, category: "form" }}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );
    const checkbox = screen.getByLabelText("Conditional field");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      "isConditionalComponent",
      true
    );
  });

  it("calls setProperty when Reload Session Status checkbox is toggled", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[ComponentProperty.ReloadSessionStatus]}
          propertyComponent={{
            id: "1",
            properties: { reloadSessionStatus: false },
            category: "form",
          }}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    const checkbox = screen.getByTestId("reloadSessionStatus");

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ReloadSessionStatus,
      true
    );
  });

  it("renders and toggles 'Visible on Form Success' switch", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[ComponentProperty.VisibleOnFormResponse]}
          propertyComponent={{
            id: "1",
            properties: { visibleOnFormResponse: false },
            category: "form",
          }}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );
    const toggleSwitch = screen.getByTestId("visibleOnFormResponse");
    expect(toggleSwitch).toBeInTheDocument();
    fireEvent.click(toggleSwitch);
    expect(mockSetProperty).toHaveBeenCalledWith("visibleOnFormResponse", true);
  });

  it("renders and selects a linked form", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[ComponentProperty.LinkedFormForSection]}
          propertyComponent={{
            id: "1",
            properties: { visibleOnFormResponse: true, linkedForm: "Form1" },
            category: "form",
          }}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );
    const select = screen.getByTestId("linkedForm");
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "Form2" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      "linkedFormForSection",
      "Form2"
    );
  });

  it("renders and toggles 'Line Under Label' checkbox", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[ComponentProperty.LineUnderLabel]}
          propertyComponent={{
            id: "1",
            properties: { lineUnderLabel: false },
            category: "form",
          }}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );
    const checkbox = screen.getByLabelText("Line Under Label");
    expect(checkbox).toBeInTheDocument();
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith("lineUnderLabel", true);
  });

  it("triggers useEffect and updates dropdownItems", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[]}
          propertyComponent={mockPropertyComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    act(() => {
      (useParentFormProperties as jest.Mock).mockReturnValue({
        parentForm: {
          components: [
            {
              id: "2",
              properties: {
                nameKeyIds: [
                  { id: "Field1", label: "Field1" },
                  { id: "Field2", label: "Field2" },
                  { id: "newSelect", label: "newSelect" },
                  { id: "Select_Field", label: "Select_Field" },
                ],
                name: "Test Field",
              },
            },
          ],
        },
      });
    });
  });

  it("handles listFormElementObject correctly", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[]}
          propertyComponent={mockPropertyComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    const mockComponents = [
      { id: "2", type: "input", properties: { name: "Field1" } },
      { id: "3", type: "field-group", components: [] },
      { id: "4", type: "select", properties: { name: "Field2" } },
    ];

    act(() => {
      (useParentFormProperties as jest.Mock).mockReturnValue({
        parentForm: { components: mockComponents },
      });
    });
  });
  test("checks the checkbox and verifies checked value is true and select element to import conditions", async () => {
    (getKeyValue as jest.Mock).mockReturnValue({
      parentNames: ["Input_Field_6"],
    });

    const updatedComponent = {
      id: "1",
      type: "select",
      displayName: "Select",
      category: "form",
      properties: {
        label: "Select",
        showLabel: true,
        isMultiSelect: false,
        isConditionalComponent: true,
        placeholder: "Select an option",
        options: [
          {
            value: "option-1",
            label: "Option 1",
          },
        ],
        dynamicOptions: {},
        visibilityConditions: {},
        name: "newSelect",
      },
      icon: componentIcons.find((icon) => icon.type === "select")?.svgCode,
    };
    mockSetProperty.mockImplementation((key, value) => {
      if (key === "isConditionalComponent") {
        updatedComponent.properties.isConditionalComponent = value;
      }
    });

    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.DynamicOptions,
          ]}
          propertyComponent={updatedComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    const checkbox = screen.getByTestId("isConditionalComponent");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
    const dynamicOptions = screen.getByTestId("dynamicOptions");
    expect(dynamicOptions).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("dynamicOptionsSelect"), {
      target: { value: "Select_Field" },
    });
  });

  test("Import dynamic conditions of one element with same parentNames array", async () => {
    (getKeyValue as jest.Mock).mockReturnValue({
      parentNames: ["Input_Field_6"],
    });

    const updatedComponent = {
      id: "1",
      type: "select",
      displayName: "Select",
      category: "form",
      properties: {
        label: "Select",
        showLabel: true,
        isMultiSelect: false,
        isConditionalComponent: true,
        placeholder: "Select an option",
        options: [
          {
            value: "option-1",
            label: "Option 1",
          },
        ],
        dynamicOptions: { parentNames: ["Input_Field_6"] },
        visibilityConditions: {},
        name: "newSelect",
      },
      icon: componentIcons.find((icon) => icon.type === "select")?.svgCode,
    };
    mockSetProperty.mockImplementation((key, value) => {
      if (key === "isConditionalComponent") {
        updatedComponent.properties.isConditionalComponent = value;
      }
    });

    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.DynamicOptions,
          ]}
          propertyComponent={updatedComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    const checkbox = screen.getByTestId("isConditionalComponent");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
    const dynamicOptions = screen.getByTestId("dynamicOptions");
    expect(dynamicOptions).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("dynamicOptionsSelect"), {
      target: { value: "Select_Field" },
    });
  });

  test("Import dynamic conditions of one element without parentNames array", async () => {
    (getKeyValue as jest.Mock).mockReturnValue({});

    const updatedComponent = {
      id: "1",
      type: "select",
      displayName: "Select",
      category: "form",
      properties: {
        label: "Select",
        showLabel: true,
        isMultiSelect: false,
        isConditionalComponent: true,
        placeholder: "Select an option",
        options: [
          {
            value: "option-1",
            label: "Option 1",
          },
        ],
        dynamicOptions: {},
        visibilityConditions: {},
        name: "newSelect",
      },
      icon: componentIcons.find((icon) => icon.type === "select")?.svgCode,
    };
    mockSetProperty.mockImplementation((key, value) => {
      if (key === "isConditionalComponent") {
        updatedComponent.properties.isConditionalComponent = value;
      }
    });

    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.DynamicOptions,
          ]}
          propertyComponent={updatedComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    const checkbox = screen.getByTestId("isConditionalComponent");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
    const dynamicOptions = screen.getByTestId("dynamicOptions");
    expect(dynamicOptions).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("dynamicOptionsSelect"), {
      target: { value: "Select_Field" },
    });
  });

  it("handles handleRemoveValue correctly", () => {
    const updatedComponent = {
      id: "1",
      type: "select",
      displayName: "Select",
      category: "form",
      properties: {
        label: "Select",
        showLabel: true,
        isMultiSelect: false,
        isConditionalComponent: true,
        placeholder: "Select an option",
        options: [
          {
            value: "option-1",
            label: "Option 1",
          },
        ],
        dynamicOptions: {
          parentNames: ["Select_Field"],
          conditions: { key: [] },
        },
        visibilityConditions: {},
        name: "newSelect",
      },
      icon: componentIcons.find((icon) => icon.type === "select")?.svgCode,
    };
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.DynamicOptions,
          ]}
          propertyComponent={updatedComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    const dynamicOptions = screen.getByTestId("dynamicOptions");
    expect(dynamicOptions).toBeInTheDocument();
    act(() => fireEvent.click(screen.getByTestId("parentNames_removeButton")));
  });

  it("handles handleRemoveValue when parentNames is empty array", () => {
    let currentComponent = {
      id: "1",
      type: "select",
      displayName: "Select",
      category: "form",
      properties: {
        label: "Select",
        showLabel: true,
        isMultiSelect: false,
        isConditionalComponent: true,
        placeholder: "Select an option",
        options: [{ value: "option-1", label: "Option 1" }],
        visibilityConditions: {
          parentNames: ["Input_Field_1"],
          conditions: { Input_Field_1: "test" },
        },
        name: "newSelect",
      },
      icon: componentIcons.find((icon) => icon.type === "select")?.svgCode,
    };

    mockSetProperty.mockImplementation((key, value) => {
      if (key === "visibilityConditions") {
        currentComponent.properties.visibilityConditions = value;
      }
    });

    const { rerender } = render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.VisibilityConditions,
          ]}
          propertyComponent={currentComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    act(() => fireEvent.click(screen.getByTestId("parentNames_removeButton")));

    currentComponent = {
      ...currentComponent,
      properties: {
        ...currentComponent.properties,
        visibilityConditions: {
          parentNames: [],
          conditions: { Input_Field_1: "test" },
        },
      },
    };

    rerender(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.VisibilityConditions,
          ]}
          propertyComponent={currentComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );
  });

  it("shows error when trying to import from child field", () => {
    (getKeyValue as jest.Mock).mockReturnValue({
      parentNames: ["newSelect"],
    });

    const updatedComponent = {
      id: "1",
      type: "select",
      displayName: "Select",
      category: "form",
      properties: {
        label: "Select",
        showLabel: true,
        isMultiSelect: false,
        isConditionalComponent: true,
        placeholder: "Select an option",
        options: [{ value: "option-1", label: "Option 1" }],
        dynamicOptions: {},
        visibilityConditions: {},
        name: "newSelect",
      },
    };

    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.DynamicOptions,
          ]}
          propertyComponent={updatedComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    fireEvent.change(screen.getByTestId("dynamicOptionsSelect"), {
      target: { value: "Select_Field" },
    });
  });

  it("imports conditions when currentParents matches parents array", () => {
    (getKeyValue as jest.Mock).mockReturnValue({
      parentNames: ["Input_Field_6"],
      conditions: { Input_Field_6: [{ value: "opt1", label: "Opt 1" }] },
    });

    const updatedComponent = {
      id: "1",
      type: "select",
      displayName: "Select",
      category: "form",
      properties: {
        label: "Select",
        showLabel: true,
        isMultiSelect: false,
        isConditionalComponent: true,
        placeholder: "Select an option",
        options: [{ value: "option-1", label: "Option 1" }],
        dynamicOptions: {
          parentNames: ["Input_Field_6"],
          conditions: { Input_Field_6: [{ value: "opt1", label: "Opt 1" }] },
        },
        visibilityConditions: {},
        name: "newSelect",
      },
      icon: componentIcons.find((icon) => icon.type === "select")?.svgCode,
    };

    const { rerender } = render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.DynamicOptions,
          ]}
          propertyComponent={updatedComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    fireEvent.change(screen.getByTestId("dynamicOptionsSelect"), {
      target: { value: "Select_Field" },
    });

    rerender(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.DynamicOptions,
          ]}
          propertyComponent={updatedComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    fireEvent.change(screen.getByTestId("dynamicOptionsSelect"), {
      target: { value: "Select_Field" },
    });
  });

  it("renders sub-section with Reload on Form Success label", () => {
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[ComponentProperty.VisibleOnFormResponse]}
          propertyComponent={{
            id: "1",
            type: "sub-section",
            properties: { visibleOnFormResponse: false },
            category: "form",
          }}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );
    expect(screen.getByText("Reload on Form Success")).toBeInTheDocument();
  });

  it("returns null when formNames is undefined for LinkedFormForSection", () => {
    (useFindForm as jest.Mock).mockReturnValue({
      formNames: undefined,
    });
    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[ComponentProperty.LinkedFormForSection]}
          propertyComponent={{
            id: "1",
            properties: { visibleOnFormResponse: true },
            category: "form",
          }}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );
    expect(screen.queryByTestId("linkedForm")).not.toBeInTheDocument();
  });

  it("handles input-table-column type for conditions renderer", () => {
    (getKeyValue as jest.Mock).mockReturnValue({
      parentNames: ["Input_Field_6"],
    });

    const mockComponent = {
      id: "table-1",
      type: "table",
      properties: {
        name: "testTable",
        nameKeyIds: [{ id: "col1", label: "col1" }],
      },
      components: [],
    };

    const updatedComponent = {
      id: "col-1",
      type: "input-table-column",
      displayName: "Column",
      category: "form",
      properties: {
        label: "Column",
        showLabel: true,
        isConditionalComponent: true,
        visibilityConditions: {},
        name: "testColumn",
      },
    };

    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.VisibilityConditions,
          ]}
          propertyComponent={updatedComponent}
          component={mockComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    expect(screen.getByTestId("isConditionalComponent")).toBeChecked();
  });

  it("handles table-column type for conditions renderer", () => {
    (getKeyValue as jest.Mock).mockReturnValue({
      parentNames: ["Input_Field_6"],
    });

    const mockComponent = {
      id: "table-1",
      type: "table",
      properties: {
        name: "testTable",
        nameKeyIds: [{ id: "col1", label: "col1" }],
      },
      components: [],
    };

    const updatedComponent = {
      id: "col-1",
      type: "table-column",
      displayName: "Column",
      category: "form",
      properties: {
        label: "Column",
        showLabel: true,
        isConditionalComponent: true,
        visibilityConditions: {},
        name: "testColumn",
      },
    };

    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.VisibilityConditions,
          ]}
          propertyComponent={updatedComponent}
          component={mockComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    expect(screen.getByTestId("isConditionalComponent")).toBeChecked();
  });

  it("uses component nameKeyIds when available", () => {
    const mockComponent = {
      id: "comp-1",
      type: "form",
      properties: {
        name: "testForm",
        nameKeyIds: [
          { id: "field1", label: "field1" },
          { id: "field2", label: "field2" },
        ],
      },
      components: [],
    };

    const updatedComponent = {
      id: "1",
      type: "select",
      properties: {
        isConditionalComponent: true,
        visibilityConditions: {},
        name: "newSelect",
      },
    };

    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.VisibilityConditions,
          ]}
          propertyComponent={updatedComponent}
          component={mockComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    expect(screen.getByTestId("isConditionalComponent")).toBeChecked();
  });

  it("handles empty selectedItem in handleSelectedItem", () => {
    (getKeyValue as jest.Mock).mockReturnValue(undefined);

    const updatedComponent = {
      id: "1",
      type: "select",
      displayName: "Select",
      category: "form",
      properties: {
        label: "Select",
        showLabel: true,
        isConditionalComponent: true,
        placeholder: "Select an option",
        options: [{ value: "option-1", label: "Option 1" }],
        dynamicOptions: {},
        visibilityConditions: {},
        name: "newSelect",
      },
    };

    render(
      <HeaderProviderV2>
        <ConditionalPanel
          propertyKeys={[
            ComponentProperty.IsConditionalComponent,
            ComponentProperty.DynamicOptions,
          ]}
          propertyComponent={updatedComponent}
          setProperty={mockSetProperty}
        />
      </HeaderProviderV2>
    );

    fireEvent.change(screen.getByTestId("dynamicOptionsSelect"), {
      target: { value: "" },
    });
  });
});
