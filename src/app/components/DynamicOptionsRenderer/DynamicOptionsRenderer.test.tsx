import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DynamicOptionsRenderer from "./DynamicOptionsRenderer";
import { OptionsRenderer } from "../OptionsRenderer/OptionsRenderer";
import MultiSelect from "../../components/MultiSelect/MultiSelect";
import { deepClone, keyFormat } from "../../utils/utils";
import { ComponentProperty } from "../../data/componentProperties";
import { DynamicOptions } from "../../types/types";

jest.mock("../OptionsRenderer/OptionsRenderer", () => ({
  OptionsRenderer: jest.fn(() => (
    <div data-testid="options-renderer">OptionsRenderer</div>
  )),
}));

jest.mock("@/app/components/MultiSelect/MultiSelect", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="multi-select">MultiSelect</div>),
}));

jest.mock("@/app/utils/utils", () => ({
  deepClone: jest.fn((obj) => JSON.parse(JSON.stringify(obj))),
  keyFormat: jest.fn((val) => val.trim().replace(/\s+/g, ",")),
  generateRandomId: jest.fn(() => "randomid"),
}));

describe("DynamicOptionsRenderer", () => {
  const mockSetProperty = jest.fn();
  const mockHandleSelectedItem = jest.fn();
  const mockOnRemoveValue = jest.fn();

  const defaultProps = {
    setProperty: mockSetProperty,
    dynamicOptions: undefined,
    type: "select",
    styles: {
      propertyHeaders: "propertyHeaders",
      componentProperty: "componentProperty",
      column: "column",
      listItem: "listItem",
      conditions: "conditions",
      textInput: "textInput",
      importContainer: "importContainer",
    },
    formElements: [
      { id: "Form Element 2", label: "Form Element 2" },
      { id: "Form Element 1", label: "Form Element 1" },
    ],
    handleSelectedItem: mockHandleSelectedItem,
    onRemoveValue: mockOnRemoveValue,
    dropdownItems: [
      { id: "Item A", label: "Item A" },
      { id: "Item B", label: "Item B" },
    ],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders with no dynamicOptions", () => {
    render(<DynamicOptionsRenderer {...defaultProps} />);
    expect(screen.getByText("Dynamic options")).toBeInTheDocument();
    expect(screen.getByText("Import from")).toBeInTheDocument();
    expect(screen.getByTestId("multi-select")).toBeInTheDocument();
    expect(screen.queryByTestId("options-renderer")).not.toBeInTheDocument();
  });

  test("renders existing conditions when dynamicOptions is provided", () => {
    const dynamicOptions: DynamicOptions = {
      parentNames: ["Form Element 1"],
      conditions: {
        key1: [
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
        ],
        key2: [{ value: "optionA", label: "Option A" }],
      },
    };

    render(
      <DynamicOptionsRenderer
        {...defaultProps}
        dynamicOptions={dynamicOptions}
      />,
    );

    expect(screen.getByText("Condition 1:")).toBeInTheDocument();
    expect(screen.getByText("Condition 2:")).toBeInTheDocument();
    expect(screen.getAllByTestId("options-renderer")).toHaveLength(2);

    const keyInputs = screen.getAllByPlaceholderText(
      "Parent Values (comma-separated)",
    );
    expect(keyInputs[0]).toHaveValue("key1");
    expect(keyInputs[1]).toHaveValue("key2");
  });

  test("handles import select onChange", () => {
    render(<DynamicOptionsRenderer {...defaultProps} />);
    const select = screen.getByTestId("dynamicOptionsSelect");

    fireEvent.change(select, { target: { value: "Item A" } });
    expect(select).toHaveValue("Item A");
    expect(mockHandleSelectedItem).toHaveBeenCalledWith(
      "Item A",
      ComponentProperty.DynamicOptions,
    );
  });

  test("calls onRemoveValue from MultiSelect on remove", () => {
    render(<DynamicOptionsRenderer {...defaultProps} />);
    expect(screen.getByTestId("multi-select")).toBeInTheDocument();
  });

  test("MultiSelect onChange updates parentNames in setProperty", () => {
    render(<DynamicOptionsRenderer {...defaultProps} />);
    const multiSelectProps = (MultiSelect as jest.Mock).mock.calls[0][0];
    const newSelection = ["Form Element 3", "Form Element 4"];
    multiSelectProps.onChange(newSelection);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DynamicOptions,
      { parentNames: newSelection },
    );
  });

  test("deletes a condition", () => {
    const dynamicOptions: DynamicOptions = {
      parentNames: [],
      conditions: {
        conditionKey: [{ value: "optionX", label: "Option X" }],
      },
    };

    render(
      <DynamicOptionsRenderer
        {...defaultProps}
        dynamicOptions={dynamicOptions}
      />,
    );
    const deleteButton = screen.getByTitle("Delete condition");
    fireEvent.click(deleteButton);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DynamicOptions,
      expect.objectContaining({
        parentNames: [],
        conditions: {},
      }),
    );
  });

  test("does nothing if trying to delete condition but dynamicOptions is undefined", () => {
    render(
      <DynamicOptionsRenderer {...defaultProps} dynamicOptions={undefined} />,
    );
    expect(screen.queryByTitle("Delete condition")).toBeNull();
  });

  test("adds a condition with an empty key and default option", () => {
    const dynamicOptions: DynamicOptions = {
      parentNames: [],
      conditions: {},
    };

    render(
      <DynamicOptionsRenderer
        {...defaultProps}
        dynamicOptions={dynamicOptions}
      />,
    );
    const addButton = screen.getByTitle("Add Condition");
    fireEvent.click(addButton);

    expect(deepClone).toHaveBeenCalledWith(dynamicOptions);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DynamicOptions,
      expect.objectContaining({
        conditions: {
          "": [{ value: "option1", label: "Option 1" }],
        },
      }),
    );
  });

  test("adds a condition even when dynamicOptions is undefined", () => {
    render(
      <DynamicOptionsRenderer {...defaultProps} dynamicOptions={undefined} />,
    );

    fireEvent.click(screen.getByTitle("Add Condition"));

    expect(deepClone).toHaveBeenCalledWith({});
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DynamicOptions,
      expect.objectContaining({
        conditions: {
          "": [{ value: "option1", label: "Option 1" }],
        },
      }),
    );
  });

  test("addCondition does nothing if validatePreviousConditionKey returns false", () => {
    const dynamicOptions: DynamicOptions = {
      parentNames: [],
      conditions: {
        "": [{ value: "optionX", label: "Option X" }],
      },
    };

    render(
      <DynamicOptionsRenderer
        {...defaultProps}
        dynamicOptions={dynamicOptions}
      />,
    );
    const addButton = screen.getByTitle("Add Condition");
    fireEvent.click(addButton);

    expect(mockSetProperty).not.toHaveBeenCalled();
  });

  test("updates a condition key on blur", () => {
    const dynamicOptions: DynamicOptions = {
      parentNames: [],
      conditions: {
        oldKey: [{ value: "option1", label: "Option 1" }],
      },
    };

    render(
      <DynamicOptionsRenderer
        {...defaultProps}
        dynamicOptions={dynamicOptions}
      />,
    );
    const keyInput = screen.getByPlaceholderText(
      "Parent Values (comma-separated)",
    );
    fireEvent.blur(keyInput, { target: { value: " newKey " } });

    expect(keyFormat).toHaveBeenCalledWith(" newKey ");
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DynamicOptions,
      expect.objectContaining({
        conditions: {
          newKey: [{ value: "option1", label: "Option 1" }],
        },
      }),
    );
  });

  test("does not update key if identical or empty after trim", () => {
    const dynamicOptions: DynamicOptions = {
      conditions: {
        sameKey: [{ value: "optionX", label: "Option X" }],
      },
    };

    render(
      <DynamicOptionsRenderer
        {...defaultProps}
        dynamicOptions={dynamicOptions}
      />,
    );
    const keyInput = screen.getByPlaceholderText(
      "Parent Values (comma-separated)",
    );
    fireEvent.blur(keyInput, { target: { value: " sameKey " } });

    expect(mockSetProperty).not.toHaveBeenCalled();
  });

  test("pressing Enter in key input triggers blur logic", () => {
    const dynamicOptions: DynamicOptions = {
      conditions: {
        oldKey: [{ value: "option1", label: "Option 1" }],
      },
    };

    render(
      <DynamicOptionsRenderer
        {...defaultProps}
        dynamicOptions={dynamicOptions}
      />,
    );
    const keyInput = screen.getByPlaceholderText(
      "Parent Values (comma-separated)",
    );
    fireEvent.keyDown(keyInput, { key: "Enter" });
    fireEvent.blur(keyInput, { target: { value: "EnterKey" } });

    expect(mockSetProperty).toHaveBeenCalled();
  });

  test("calls setOptions from OptionsRenderer", () => {
    const dynamicOptions: DynamicOptions = {
      conditions: {
        oldKey: [
          { value: "val1", label: "Label 1" },
          { value: "val2", label: "Label 2" },
        ],
      },
    };

    render(
      <DynamicOptionsRenderer
        {...defaultProps}
        dynamicOptions={dynamicOptions}
      />,
    );
    const props = (OptionsRenderer as jest.Mock).mock.calls[0][0];
    props.setOptions([{ value: "valX", label: "Label X" }], "oldKey");

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DynamicOptions,
      expect.objectContaining({
        conditions: {
          oldKey: [{ value: "valX", label: "Label X" }],
        },
      }),
    );
  });

  test("setOptions falls back to an empty conditions object when conditions are removed", () => {
    const dynamicOptions: DynamicOptions = {
      conditions: {
        oldKey: [{ value: "val1", label: "Label 1" }],
      },
    };

    render(
      <DynamicOptionsRenderer
        {...defaultProps}
        dynamicOptions={dynamicOptions}
      />,
    );

    const props = (OptionsRenderer as jest.Mock).mock.calls[0][0];
    dynamicOptions.conditions = undefined;
    props.setOptions([{ value: "fallback", label: "Fallback" }], "newKey");

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DynamicOptions,
      expect.objectContaining({
        conditions: {
          newKey: [{ value: "fallback", label: "Fallback" }],
        },
      }),
    );
  });
});
