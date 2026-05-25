/**
 * @file ConditionsRenderer.test.tsx
 */
import { render, screen } from "@testing-library/react";
import ConditionsRenderer from "./ConditionsRenderer";
import {
  FormComponent,
  DynamicConditions,
  BaseComponent,
} from "../../types/types";
import { ComponentProperty } from "../../data/componentProperties";

// Mock sub-components so we can track their rendering & prop usage
jest.mock("../DynamicOptionsRenderer/DynamicOptionsRenderer", () => ({
  __esModule: true,
  default: function MockDynamicOptionsRenderer(props: any) {
    return (
      <div data-testid="dynamic-options-renderer">
        DynamicOptionsRenderer
        {JSON.stringify(props)}
      </div>
    );
  },
}));

jest.mock("../DynamicConditionRenderer/DynamicConditionRenderer", () => ({
  __esModule: true,
  default: function MockVisibilityConditionsRenderer(props: any) {
    const testId =
      props.componentProperty === "visibilityConditions"
        ? "visibility-conditions-renderer"
        : props.componentProperty === "enableDisableConditions"
        ? "enable-disable-conditions-renderer"
        : "required-field-conditions-renderer";

    return (
      <div data-testid={testId}>
        VisibilityConditionsRenderer
        {JSON.stringify(props)}
      </div>
    );
  },
}));

describe("ConditionsRenderer", () => {
  const mockSetProperty = jest.fn();
  const mockHandleSelectedItem = jest.fn();
  const mockOnRemoveValue = jest.fn();
  const mockParentForm: FormComponent = {
    id: "parent-form-id",
    type: "form",
    category: "form",
    properties: {
      action: "submit",
      method: "POST",
      name: "form-1",
      nameKeyIds: [
        { id: "ele1", label: "ele1" },
        { id: "input1", label: "input1" },
      ],
    },
    components: [
      { id: "comp1", type: "input", category: "form", properties: {} },
      { id: "comp2", type: "select", category: "form", properties: {} },
    ],
  };
  const propertyComponent: BaseComponent = {
    id: "sdfvdfgbdf",
    type: "input",
    category: "form",
    properties: {
      name: "input1",
    },
  };
  const mockDropdownItems = [
    { id: "item1", label: "item1" },
    { id: "item2", label: "item2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Returns null when Property mis-match", () => {
    render(
      <ConditionsRenderer
        property={ComponentProperty.Required}
        type="other"
        setProperty={mockSetProperty}
        visibilityConditions={undefined}
        enableDisableConditions={undefined}
        dynamicOptions={undefined}
        parentForm={mockParentForm}
        handleSelectedItem={mockHandleSelectedItem}
        onRemoveValue={mockOnRemoveValue}
        dropdownItems={mockDropdownItems}
      />
    );
  });

  it("renders DynamicOptionsRenderer if type is included in selectOptionGroup", () => {
    // Suppose selectOptionGroup = ["select", "radio-group", "checkbox-group", ...]
    // We'll mock the array to ensure "select" is included

    render(
      <ConditionsRenderer
        property={ComponentProperty.DynamicOptions}
        type="select"
        setProperty={mockSetProperty}
        visibilityConditions={undefined}
        enableDisableConditions={undefined}
        dynamicOptions={{}}
        parentForm={mockParentForm}
        handleSelectedItem={mockHandleSelectedItem}
        onRemoveValue={mockOnRemoveValue}
        dropdownItems={mockDropdownItems}
      />
    );

    // Expect the dynamic options renderer
    expect(screen.getByTestId("dynamic-options-renderer")).toBeInTheDocument();
  });

  it("does NOT render DynamicOptionsRenderer if type is NOT in selectOptionGroup", () => {
    render(
      <ConditionsRenderer
        property={ComponentProperty.VisibilityConditions}
        type="some-other-type"
        setProperty={mockSetProperty}
        visibilityConditions={undefined}
        enableDisableConditions={undefined}
        dynamicOptions={undefined}
        parentForm={mockParentForm}
        handleSelectedItem={mockHandleSelectedItem}
        onRemoveValue={mockOnRemoveValue}
        dropdownItems={mockDropdownItems}
      />
    );

    expect(screen.queryByTestId("dynamic-options-renderer")).toBeNull();
  });

  it("always renders  EnableDisableConditionsRenderer", () => {
    render(
      <ConditionsRenderer
        property={ComponentProperty.EnableDisableConditions}
        type="input"
        setProperty={mockSetProperty}
        visibilityConditions={{}}
        enableDisableConditions={{}}
        dynamicOptions={undefined}
        parentForm={mockParentForm}
        handleSelectedItem={mockHandleSelectedItem}
        onRemoveValue={mockOnRemoveValue}
        dropdownItems={mockDropdownItems}
      />
    );

    expect(
      screen.getByTestId("enable-disable-conditions-renderer")
    ).toBeInTheDocument();
  });

  it("always renders VisibilityConditionsRenderer", () => {
    render(
      <ConditionsRenderer
        property={ComponentProperty.VisibilityConditions}
        type="input"
        setProperty={mockSetProperty}
        visibilityConditions={{}}
        enableDisableConditions={{}}
        dynamicOptions={undefined}
        parentForm={mockParentForm}
        handleSelectedItem={mockHandleSelectedItem}
        onRemoveValue={mockOnRemoveValue}
        dropdownItems={mockDropdownItems}
      />
    );

    expect(
      screen.getByTestId("visibility-conditions-renderer")
    ).toBeInTheDocument();
  });
  it("passes correct props to VisibilityConditionsRenderer", () => {
    const mockVisibility: DynamicConditions = {
      conditions: { "test-condition": true },
      parentNames: ["parent-name"],
    };

    render(
      <ConditionsRenderer
        property={ComponentProperty.VisibilityConditions}
        type="input"
        setProperty={mockSetProperty}
        visibilityConditions={mockVisibility}
        enableDisableConditions={undefined}
        dynamicOptions={undefined}
        parentForm={mockParentForm}
        handleSelectedItem={mockHandleSelectedItem}
        onRemoveValue={mockOnRemoveValue}
        dropdownItems={mockDropdownItems}
      />
    );

    const rendererDiv = screen.getByTestId("visibility-conditions-renderer");
    // The JSON props are rendered for demonstration in the mock. Let's parse them:
    expect(rendererDiv).toHaveTextContent(
      'VisibilityConditionsRenderer{"dynamicConditions":{"conditions":{"test-condition":true},"parentNames":["parent-name"]},"componentProperty":"visibilityConditions","formElements":[{"id":"ele1","label":"ele1"},{"id":"input1","label":"input1"}],"dropdownItems":[{"id":"item1","label":"item1"},{"id":"item2","label":"item2"}]}'
    );
    expect(rendererDiv).toHaveTextContent(
      '"dropdownItems":[{"id":"item1","label":"item1"},{"id":"item2","label":"item2"}]'
    );
  });

  it("passes correct props to EnableDisableConditionsRenderer", () => {
    const mockEnableDisable: DynamicConditions = {
      conditions: { "disable-if": true },
      parentNames: ["parent-name"],
    };

    render(
      <ConditionsRenderer
        property={ComponentProperty.EnableDisableConditions}
        type="input"
        setProperty={mockSetProperty}
        visibilityConditions={undefined}
        enableDisableConditions={mockEnableDisable}
        dynamicOptions={undefined}
        parentForm={mockParentForm}
        handleSelectedItem={mockHandleSelectedItem}
        onRemoveValue={mockOnRemoveValue}
        dropdownItems={mockDropdownItems}
      />
    );

    const rendererDiv = screen.getByTestId(
      "enable-disable-conditions-renderer"
    );
    expect(rendererDiv).toHaveTextContent(
      'VisibilityConditionsRenderer{"dynamicConditions":{"conditions":{"disable-if":true},"parentNames":["parent-name"]},"componentProperty":"enableDisableConditions","formElements":[{"id":"ele1","label":"ele1"},{"id":"input1","label":"input1"}],"dropdownItems":[{"id":"item1","label":"item1"},{"id":"item2","label":"item2"}]}'
    );
    expect(rendererDiv).toHaveTextContent(
      '"dynamicConditions":{"conditions":{"disable-if":true},"parentNames":["parent-name"]}'
    );
  });

  it("handles null parentForm by passing empty array to formElements", () => {
    render(
      <ConditionsRenderer
        property={ComponentProperty.VisibilityConditions}
        type="input"
        setProperty={mockSetProperty}
        visibilityConditions={{}}
        enableDisableConditions={undefined}
        dynamicOptions={undefined}
        parentForm={null}
        handleSelectedItem={mockHandleSelectedItem}
        onRemoveValue={mockOnRemoveValue}
        dropdownItems={mockDropdownItems}
      />
    );

    const rendererDiv = screen.getByTestId("visibility-conditions-renderer");
    expect(rendererDiv).toHaveTextContent('"formElements":[]');
  });
});
