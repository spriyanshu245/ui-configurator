import { render, screen, fireEvent } from "@testing-library/react";
import DynamicConditionRenderer from "./DynamicConditionRenderer";
import { DynamicConditions } from "../../types/types";
import { keyFormat } from "../../utils/utils";
import {
  dynamicConditionsType,
  dynamicContionsTitles,
} from "../../utils/constants";
// Mocks
jest.mock("../ToggleSwitch/ToggleSwitch", () => ({
  __esModule: true,
  default: jest.fn((props) => {
    const { isToggled, onToggle, size } = props;
    return (
      <button
        data-testid="toggle-switch"
        onClick={onToggle}
        data-size={size}
        data-toggled={isToggled}
      >
        ToggleSwitch
      </button>
    );
  }),
}));

jest.mock("../MultiSelect/MultiSelect", () => ({
  __esModule: true,
  default: jest.fn((props) => {
    return (
      <div data-testid="multi-select">
        MultiSelect
        <button
          data-testid="multi-select-onremove"
          onClick={props.onRemoveValue}
        >
          Remove
        </button>
        <button
          data-testid="multi-select-onchange"
          onClick={() => props.onChange(["New Element"])}
        >
          Change
        </button>
      </div>
    );
  }),
}));

jest.mock("../SVGIcons/Delete", () => ({
  __esModule: true,
  default: jest.fn(() => <svg data-testid="delete-icon" />),
}));

jest.mock("../SVGIcons/Add", () => ({
  __esModule: true,
  default: jest.fn(() => <svg data-testid="add-icon" />),
}));

jest.mock("../EditIconButton/EditIconButton", () => ({
  __esModule: true,
  default: jest.fn((props) => {
    return (
      <button
        onClick={props.onClick}
        className={props.className}
        title={props.title}
        data-testid="edit-icon-button"
      >
        EditIconButton
      </button>
    );
  }),
}));

jest.mock("../../utils/utils", () => ({
  keyFormat: jest.fn((val) => val.trim().replace(/\s+/g, ",")),
  generateRandomId: jest.fn(() => "randomId"),
}));

describe("DynamicConditionRenderer", () => {
  const mockSetProperty = jest.fn();
  const mockHandleSelectedItem = jest.fn();
  const mockOnRemoveValue = jest.fn();

  // Test for both visibility and enableDisable types
  const testTypes = [
    "visibilityConditions",
    "enableDisableConditions",
    "requiredFieldConditions",
  ]; // Use const assertion

  // Common default props that will be extended for each test type
  const getDefaultProps = (componentProperty: string) => ({
    dynamicConditions: undefined as DynamicConditions | undefined,
    componentProperty,
    setProperty: mockSetProperty,
    formElements: [
      { id: "FormEl1", label: "FormEl1" },
      { id: "FormEl2", label: "FormEl2" },
      { id: "Existing", label: "Existing" },
      { id: "El1", label: "El1" },
      { id: "ElX", label: "ElX" },
    ],
    handleSelectedItem: mockHandleSelectedItem,
    onRemoveValue: mockOnRemoveValue,
    dropdownItems: [
      { id: "ItemA", label: "ItemA" },
      { id: "ItemB", label: "ItemB" },
    ],
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  testTypes.forEach((componentProperty) => {
    describe(`${componentProperty} condition type`, () => {
      test(`renders with no conditions`, () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );
        expect(
          screen.getByText(dynamicContionsTitles[componentProperty])
        ).toBeInTheDocument();
        expect(screen.getByText("Import from")).toBeInTheDocument();
        expect(screen.getByTestId("multi-select")).toBeInTheDocument();
        // No conditions should be rendered
        expect(screen.queryByText("Condition 1:")).toBeNull();
      });

      test(`handles select input onChange for import dropdown`, () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );
        const select = screen.getByTestId(`${componentProperty}-import`);
        fireEvent.change(select, { target: { value: "ItemA" } });
        expect(select).toHaveValue("ItemA");
        expect(mockHandleSelectedItem).toHaveBeenCalledWith(
          "ItemA",
          componentProperty
        );
      });

      test(`MultiSelect onRemoveValue calls onRemoveValue prop`, () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );
        const removeBtn = screen.getByTestId("multi-select-onremove");
        fireEvent.click(removeBtn);
        expect(mockOnRemoveValue).toHaveBeenCalledWith(componentProperty);
      });

      test(`MultiSelect onChange updates parentNames in setProperty`, () => {
        const mockConditions: DynamicConditions = {
          parentNames: ["Existing"],
          conditions: {},
        };
        render(
          <DynamicConditionRenderer
            {...getDefaultProps(componentProperty)}
            dynamicConditions={mockConditions}
          />
        );
        const changeBtn = screen.getByTestId("multi-select-onchange");
        fireEvent.click(changeBtn);
        expect(mockSetProperty).toHaveBeenCalledWith(
          componentProperty,
          expect.objectContaining({
            parentNames: ["New Element"],
          })
        );
      });

      test(`renders existing conditions and toggles them`, () => {
        const mockConditions: DynamicConditions = {
          parentNames: ["El1"],
          conditions: {
            keyA: false,
            keyB: true,
          },
        };

        render(
          <DynamicConditionRenderer
            {...getDefaultProps(componentProperty)}
            dynamicConditions={mockConditions}
          />
        );

        const toggleSwitches = screen.getAllByTestId("toggle-switch");
        // keyA => false, keyB => true
        expect(toggleSwitches[0]).toHaveAttribute("data-toggled", "false");
        expect(toggleSwitches[1]).toHaveAttribute("data-toggled", "true");

        // Toggle the second condition
        fireEvent.click(toggleSwitches[1]);
        expect(mockSetProperty).toHaveBeenCalledWith(
          componentProperty,
          expect.objectContaining({
            conditions: {
              keyA: false,
              keyB: false,
            },
          })
        );
      });

      test(`deletes a condition`, () => {
        const mockConditions: DynamicConditions = {
          parentNames: [],
          conditions: {
            keyA: false,
          },
        };

        render(
          <DynamicConditionRenderer
            {...getDefaultProps(componentProperty)}
            dynamicConditions={mockConditions}
          />
        );

        const deleteButton = screen.getByTestId(`delete-${componentProperty}`);
        fireEvent.click(deleteButton);

        expect(mockSetProperty).toHaveBeenCalledWith(
          componentProperty,
          expect.objectContaining({
            conditions: {},
          })
        );
      });

      test(`edit condition key toggles edit mode and updates key on blur`, () => {
        const mockConditions: DynamicConditions = {
          parentNames: [],
          conditions: {
            oldKey: true,
          },
        };

        render(
          <DynamicConditionRenderer
            {...getDefaultProps(componentProperty)}
            dynamicConditions={mockConditions}
          />
        );

        const editButton = screen.getByTestId("edit-icon-button");
        fireEvent.click(editButton);

        // The input for editing should appear
        const editInput = screen.getAllByRole("textbox")[0];
        expect(editInput).toBeInTheDocument();

        // We'll set the editedKey to " newKey "
        fireEvent.change(editInput, { target: { value: " newKey " } });
        // On blur => handleEditKey
        fireEvent.blur(editInput);
        // keyFormat => "newKey"
        expect(keyFormat).toHaveBeenCalledWith(" newKey ");
        // oldKey => newKey
        expect(mockSetProperty).toHaveBeenCalledWith(
          componentProperty,
          expect.objectContaining({
            conditions: {
              newKey: true,
            },
          })
        );
      });

      test(`edit mode does not update if editedKey is empty or unchanged`, () => {
        const mockConditions: DynamicConditions = {
          conditions: {
            sameKey: false,
          },
          parentNames: [],
        };
        render(
          <DynamicConditionRenderer
            {...getDefaultProps(componentProperty)}
            dynamicConditions={mockConditions}
          />
        );
        const editButton = screen.getByTestId("edit-icon-button");
        fireEvent.click(editButton);

        const editInput = screen.getAllByRole("textbox")[0];
        // Attempt to set same key
        fireEvent.change(editInput, { target: { value: " sameKey " } });
        fireEvent.blur(editInput);
        // Not called because it's the same key
        expect(mockSetProperty).not.toHaveBeenCalled();

        // Re-enter edit mode
        fireEvent.click(screen.getByTestId("edit-icon-button"));
        const editInput2 = screen.getAllByRole("textbox")[0];
        // Attempt to set empty
        fireEvent.change(editInput2, { target: { value: "" } });
        fireEvent.blur(editInput2);
        expect(mockSetProperty).not.toHaveBeenCalled();
      });

      test(`pressing Enter on edit input also updates the key`, () => {
        const mockConditions: DynamicConditions = {
          conditions: {
            oldKey: false,
          },
          parentNames: [],
        };
        render(
          <DynamicConditionRenderer
            {...getDefaultProps(componentProperty)}
            dynamicConditions={mockConditions}
          />
        );
        fireEvent.click(screen.getByTestId("edit-icon-button"));
        const editInput = screen.getAllByRole("textbox")[0];

        fireEvent.change(editInput, { target: { value: "myNewKey" } });
        fireEvent.keyDown(editInput, { key: "Enter" });

        expect(mockSetProperty).toHaveBeenCalled();
      });

      test(`adding new condition by pressing Enter sets new key with default value = false`, () => {
        const mockConditions: DynamicConditions = {
          conditions: {},
          parentNames: ["ElX"],
        };

        render(
          <DynamicConditionRenderer
            {...getDefaultProps(componentProperty)}
            dynamicConditions={mockConditions}
          />
        );

        const addInput = screen.getByPlaceholderText(
          "Parent Values (comma-separated)"
        );
        fireEvent.change(addInput, { target: { value: " conditionOne" } });
        fireEvent.keyDown(addInput, { key: "Enter" });

        // keyFormat => "conditionOne"
        expect(keyFormat).toHaveBeenCalledWith(" conditionOne");
        expect(mockSetProperty).toHaveBeenCalledWith(
          componentProperty,
          expect.objectContaining({
            conditions: {
              conditionOne: false,
            },
          })
        );
        // Input should be cleared
        expect(addInput).toHaveValue("");
      });

      test(`shows correct add condition label based on condition type`, () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );

        const expectedLabel =
          componentProperty === "visibilityConditions"
            ? "Add Visibility condition:"
            : componentProperty !== "requiredFieldConditions"
            ? "Add Enable disable condition:"
            : "Add Required field condition:";
        console.log(componentProperty);

        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      });

      test("renders button with correct id and data-testid", () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );

        const button = screen.getByTestId(`add-${componentProperty}`);

        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("id", `add-${componentProperty}`);
        expect(button).toHaveAttribute(
          "data-testid",
          `add-${componentProperty}`
        );
      });

      test("applies correct CSS classes", () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );

        const button = screen.getByTestId(`add-${componentProperty}`);

        expect(button).toHaveClass("iconButton");
        expect(button).toHaveClass("small");
        expect(button).toHaveClass("mt5");
      });

      test("renders AddIcon component inside button", () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );

        const addIcon = screen.getByTestId("add-icon");
        expect(addIcon).toBeInTheDocument();
      });

      test("calls handleAdd when button is clicked", () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );

        const button = screen.getByTestId(`add-${componentProperty}`);
        fireEvent.click(button);

        expect(mockSetProperty).toHaveBeenCalledTimes(1);
      });

      test("calls handleAdd when button is clicked", () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );

        const checkBox = screen.getByTestId(
          `is${dynamicConditionsType[componentProperty]}ByDefault`
        );
        fireEvent.click(checkBox);

        expect(mockSetProperty).toHaveBeenCalledTimes(1);
      });

      test("calls handleAdd multiple times for multiple clicks", () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );

        const button = screen.getByTestId(`add-${componentProperty}`);

        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);

        expect(mockSetProperty).toHaveBeenCalledTimes(3);
      });

      test("button is enabled by default", () => {
        render(
          <DynamicConditionRenderer {...getDefaultProps(componentProperty)} />
        );

        const button = screen.getByTestId(`add-${componentProperty}`);
        expect(button).toBeEnabled();
      });

      // Test specific to "visibility" type - test the visibility-specific deleteButton ID
      if (componentProperty === "visibilityConditions") {
        test(`visibility delete button has correct ID`, () => {
          const mockConditions: DynamicConditions = {
            parentNames: [],
            conditions: {
              keyA: false,
            },
          };

          render(
            <DynamicConditionRenderer
              {...getDefaultProps("visibilityConditions")}
              dynamicConditions={mockConditions}
            />
          );

          const deleteButton = screen.getByTitle("Delete Visible condition");
          expect(deleteButton).toHaveAttribute(
            "id",
            "delete-visibilityConditions"
          );
        });
      }
    });
  });
});
