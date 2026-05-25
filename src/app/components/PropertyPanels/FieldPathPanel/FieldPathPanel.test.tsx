import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FieldPathPanel from "./FieldPathPanel";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { useUserTask } from "../../../context/UserTaskContext";
import { ComponentProperty } from "../../../data/componentProperties";
import { PropertyPanels } from "../../../utils/constants";
import { generateRandomId } from "../../../utils/utils";
import { traversFormComponentsNameKeyIdContions } from "../../../utils/formsUtils";
import { FormComponent } from "../../../types/types";

// Mock dependencies
jest.mock("../../../context/PropertiesContext");
jest.mock("../../../context/UserTaskContext");
jest.mock("../../../utils/utils");
jest.mock("../../../utils/formsUtils");
jest.mock("../../SVGIcons/ChevronDown", () => () => <div>ChevronDownIcon</div>);
jest.mock("../../SVGIcons/Delete", () => () => <div>DeleteIcon</div>);
jest.mock("../../SVGIcons/Add", () => () => <div>AddIcon</div>);
jest.mock(
  "../../EditIconButton/EditIconButton",
  () =>
    ({ onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        EditIcon
      </button>
    ),
);
jest.mock(
  "../../InternalComponents/Modal/Modal",
  () =>
    ({
      isOpen,
      onClose,
      onSubmit,
      title,
      description,
      submitText,
      cancelText,
    }: any) =>
      isOpen ? (
        <div data-testid="modal">
          <h2>{title}</h2>
          <p>{description}</p>
          <button onClick={onSubmit}>{submitText}</button>
          <button onClick={onClose}>{cancelText}</button>
        </div>
      ) : null,
);

const mockUsePropertyPane = usePropertyPane as jest.MockedFunction<
  typeof usePropertyPane
>;
const mockUseUserTask = useUserTask as jest.Mock;
const mockGenerateRandomId = generateRandomId as jest.MockedFunction<
  typeof generateRandomId
>;
const mockTraversFormComponents =
  traversFormComponentsNameKeyIdContions as jest.MockedFunction<
    typeof traversFormComponentsNameKeyIdContions
  >;

describe("FieldPathPanel Component", () => {
  const mockTogglePanel = jest.fn();
  const mockIsPanelOpen = jest.fn();
  const mockSetProperty = jest.fn();
  const mockSetFormsNamekeys = jest.fn();
  const mockSetTablesNamekeys = jest.fn();

  const defaultProps = {
    propertyKeys: [ComponentProperty.NameKeyIds],
    propertyComponent: {
      id: "test-component-1",
      displayName: "Form",
      category: "component",
      type: "form",
      properties: {
        action: "",
        method: "GET",
        name: "testForm",
        nameKeyIds: [],
      },
    } as FormComponent,
    setProperty: mockSetProperty,
  };

  const defaultContextValues = {
    formsNamekeys: {},
    tablesNameKeys: {},
    setFormsNamekeys: mockSetFormsNamekeys,
    setTablesNameKeys: mockSetTablesNamekeys,
    tasks: [],
    setTasks: jest.fn(),
    selectedTask: null,
    setSelectedTask: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePropertyPane.mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: mockIsPanelOpen,
      isPropertyPaneVisible: false,
      propertyComponentId: null,
      propertyPageId: null,
      setActiveComponent: function (componentId: string): void {
        throw new Error("Function not implemented.");
      },
      togglePropertyPane: function (): void {
        throw new Error("Function not implemented.");
      },
      resetActiveComponent: function (): void {
        throw new Error("Function not implemented.");
      },
      setActivePage: function (sectionId: string): void {
        throw new Error("Function not implemented.");
      },
      resetActivePage: function (): void {
        throw new Error("Function not implemented.");
      },
    });

    mockUseUserTask.mockReturnValue(defaultContextValues);
    mockIsPanelOpen.mockReturnValue(true);
    mockGenerateRandomId.mockReturnValue("random-id-123");
  });

  // HAPPY PATH TESTS
  describe("Happy Path - Basic Rendering", () => {
    it("should render the panel with toggle button", () => {
      render(<FieldPathPanel {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Field Path Manager/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("ChevronDownIcon")).toBeInTheDocument();
    });

    it("should render panel content when open", () => {
      render(<FieldPathPanel {...defaultProps} />);

      expect(screen.getByText("Add Field Path")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter field path"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("add-name-key")).toBeInTheDocument();
    });

    it('should display "No field paths added yet" when nameKeyIds is empty', () => {
      render(<FieldPathPanel {...defaultProps} />);

      expect(screen.getByText(/No field paths added yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Field Paths \(0\)/i)).toBeInTheDocument();
    });
  });

  describe("Happy Path - Adding Field Paths", () => {
    it("should add a new field path when input is valid", () => {
      render(<FieldPathPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("Enter field path");
      const addButton = screen.getByTestId("add-name-key");

      fireEvent.change(textarea, { target: { value: "New Name Key" } });
      fireEvent.click(addButton);

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.NameKeyIds,
        [{ label: "New Name Key", id: "random-id-123" }],
      );
      expect(mockSetFormsNamekeys).toHaveBeenCalledWith({
        testForm: [{ label: "New Name Key", id: "random-id-123" }],
      });
    });

    it("should add field path on Enter key press", () => {
      render(<FieldPathPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("Enter field path");

      fireEvent.change(textarea, { target: { value: "Enter Key" } });
      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

      expect(mockSetProperty).toHaveBeenCalled();
    });

    it("should clear input after adding field path", async () => {
      render(<FieldPathPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(
        "Enter field path",
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: "Test Key" } });
      fireEvent.click(screen.getByTestId("add-name-key"));

      await waitFor(() => {
        expect(textarea.value).toBe("");
      });
    });
  });

  describe("Happy Path - Displaying Field Paths", () => {
    it("should display existing field paths", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          displayName: "Form",
          properties: {
            name: "testForm",
            action: "",
            method: "GET",
            nameKeyIds: [
              { label: "Key 1", id: "id-1" },
              { label: "Key 2", id: "id-2" },
            ],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      expect(screen.getByText("Key 1")).toBeInTheDocument();
      expect(screen.getByText("Key 2")).toBeInTheDocument();
      expect(screen.getByText(/Field Paths \(2\)/i)).toBeInTheDocument();
    });

    it("should display header with field path and actions columns", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          displayName: "Form",
          properties: {
            action: "",
            method: "GET",
            name: "testForm",
            nameKeyIds: [{ label: "Key 1", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      expect(screen.getByText("Key 1")).toBeInTheDocument();
      expect(screen.getByTestId("delete-id-1")).toBeInTheDocument();
    });
  });

  describe("Happy Path - Editing Field Paths", () => {
    it("should enable edit mode when edit button is clicked", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Original Key", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      const editButton = screen.getByTestId("edit-id-1");
      fireEvent.click(editButton);

      const editTextarea = screen.getByDisplayValue("Original Key");
      expect(editTextarea).toBeInTheDocument();
    });

    it("should save edited field path on blur", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Original Key", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("edit-id-1"));

      const editTextarea = screen.getByDisplayValue("Original Key");
      fireEvent.change(editTextarea, { target: { value: "Updated Key" } });
      fireEvent.blur(editTextarea);

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.NameKeyIds,
        [{ label: "Updated Key", id: "id-1" }],
      );
    });

    it("should save edited field path on Enter press", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Original Key", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("edit-id-1"));

      const editTextarea = screen.getByDisplayValue("Original Key");
      fireEvent.change(editTextarea, { target: { value: "Updated Key" } });
      fireEvent.keyDown(editTextarea, { key: "Enter", code: "Enter" });

      expect(mockSetProperty).toHaveBeenCalled();
    });

    it("should not save when edited field path is empty", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Original Key", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("edit-id-1"));

      const editTextarea = screen.getByDisplayValue("Original Key");
      fireEvent.change(editTextarea, { target: { value: "" } });
      fireEvent.blur(editTextarea);

      expect(mockSetProperty).not.toHaveBeenCalled();
    });

    it("should not save when edited field path is only whitespace", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Original Key", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("edit-id-1"));

      const editTextarea = screen.getByDisplayValue("Original Key");
      fireEvent.change(editTextarea, { target: { value: "   " } });
      fireEvent.blur(editTextarea);

      expect(mockSetProperty).not.toHaveBeenCalled();
    });

    it("should show error when editing to a duplicate field path", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [
              { label: "Key 1", id: "id-1" },
              { label: "Key 2", id: "id-2" },
            ],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("edit-id-1"));

      const editTextarea = screen.getByDisplayValue("Key 1");
      fireEvent.change(editTextarea, { target: { value: "Key 2" } });

      expect(
        screen.getByText("This path is already in use."),
      ).toBeInTheDocument();
    });

    it("should not save when edited name key is duplicate", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [
              { label: "Key 1", id: "id-1" },
              { label: "Key 2", id: "id-2" },
            ],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("edit-id-1"));

      const editTextarea = screen.getByDisplayValue("Key 1");
      fireEvent.change(editTextarea, { target: { value: "Key 2" } });
      fireEvent.blur(editTextarea);

      expect(mockSetProperty).not.toHaveBeenCalled();
    });

    it("should allow editing to same name (no duplicate error for self)", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [
              { label: "Key 1", id: "id-1" },
              { label: "Key 2", id: "id-2" },
            ],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("edit-id-1"));

      const editTextarea = screen.getByDisplayValue("Key 1");
      fireEvent.change(editTextarea, { target: { value: "Key 1" } });

      expect(
        screen.queryByText("This path is already in use."),
      ).not.toBeInTheDocument();
    });

    it("should clear duplicate error when editedKey becomes empty", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [
              { label: "Key 1", id: "id-1" },
              { label: "Key 2", id: "id-2" },
            ],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("edit-id-1"));

      const editTextarea = screen.getByDisplayValue("Key 1");

      // First set to duplicate
      fireEvent.change(editTextarea, { target: { value: "Key 2" } });
      expect(
        screen.getByText("This path is already in use."),
      ).toBeInTheDocument();

      // Then clear the input
      fireEvent.change(editTextarea, { target: { value: "" } });
      expect(
        screen.queryByText("This path is already in use."),
      ).not.toBeInTheDocument();
    });
  });

  describe("Happy Path - Deleting Field Paths", () => {
    it("should open modal when delete button is clicked", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Key to Delete", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("delete-id-1"));

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByText("Remove referenced field?")).toBeInTheDocument();
    });

    it("should delete field path when modal is confirmed", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [
              { label: "Key 1", id: "id-1" },
              { label: "Key 2", id: "id-2" },
            ],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("delete-id-1"));
      fireEvent.click(screen.getByText("Delete and remove references"));

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.NameKeyIds,
        [{ label: "Key 2", id: "id-2" }],
      );
      expect(mockTraversFormComponents).toHaveBeenCalledWith(
        propsWithKeys.propertyComponent,
        "id-1",
      );
    });

    it("should close modal when cancel is clicked", async () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Key 1", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("delete-id-1"));
      expect(screen.getByTestId("modal")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Cancel"));

      await waitFor(() => {
        expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
      });
    });
  });

  // CONDITIONAL TESTS
  describe("Conditions - Panel Toggle", () => {
    it("should toggle panel when toggle button is clicked", () => {
      render(<FieldPathPanel {...defaultProps} />);

      const toggleButton = screen.getByRole("button", {
        name: /Field Path Manager/i,
      });
      fireEvent.click(toggleButton);

      expect(mockTogglePanel).toHaveBeenCalledWith(
        PropertyPanels.FieldPathPanel,
      );
    });

    it("should not render panel content when panel is closed", () => {
      mockIsPanelOpen.mockReturnValue(false);

      render(<FieldPathPanel {...defaultProps} />);

      expect(screen.queryByText("Add Field Path")).not.toBeInTheDocument();
    });

    it("should apply isOpen class when panel is open", () => {
      mockIsPanelOpen.mockReturnValue(true);

      render(<FieldPathPanel {...defaultProps} />);

      const toggleButton = screen.getByRole("button", {
        name: /Field Path Manager/i,
      });
      expect(toggleButton).toHaveClass("isOpen");
    });
  });

  describe("Conditions - Input Validation", () => {
    it("should disable add button when input is empty", () => {
      render(<FieldPathPanel {...defaultProps} />);

      const addButton = screen.getByTestId("add-name-key");
      expect(addButton).toBeDisabled();
    });

    it("should disable add button when input is only whitespace", () => {
      render(<FieldPathPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("Enter field path");
      fireEvent.change(textarea, { target: { value: "   " } });

      const addButton = screen.getByTestId("add-name-key");
      expect(addButton).toBeDisabled();
    });

    it("should show error message when duplicate field path is entered", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Existing Key", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      const textarea = screen.getByPlaceholderText("Enter field path");
      fireEvent.change(textarea, { target: { value: "Existing Key" } });

      expect(
        screen.getByText("This path is already in use."),
      ).toBeInTheDocument();
    });

    it("should disable add button when duplicate field path is entered", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Existing Key", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      const textarea = screen.getByPlaceholderText("Enter field path");
      fireEvent.change(textarea, { target: { value: "Existing Key" } });

      const addButton = screen.getByTestId("add-name-key");
      expect(addButton).toBeDisabled();
    });

    it("should trim whitespace from input value", () => {
      render(<FieldPathPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("Enter field path");
      fireEvent.change(textarea, { target: { value: "  Trimmed Key  " } });
      fireEvent.click(screen.getByTestId("add-name-key"));

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.NameKeyIds,
        [{ label: "Trimmed Key", id: "random-id-123" }],
      );
    });
  });

  describe("Conditions - Component Type (Form vs Table)", () => {
    it("should use formsNamekeys for form component type", () => {
      const formsContext = {
        ...defaultContextValues,
        formsNamekeys: { testForm: [] },
      };
      mockUseUserTask.mockReturnValue(formsContext);

      render(<FieldPathPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("Enter field path");
      fireEvent.change(textarea, { target: { value: "Test Key" } });
      fireEvent.click(screen.getByTestId("add-name-key"));

      expect(mockSetFormsNamekeys).toHaveBeenCalled();
      expect(mockSetTablesNamekeys).not.toHaveBeenCalled();
    });

    it("should use tablesNameKeys for table component type", () => {
      const tableProps = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          type: "table" as const,
        },
      };

      render(<FieldPathPanel {...tableProps} />);

      const textarea = screen.getByPlaceholderText("Enter field path");
      fireEvent.change(textarea, { target: { value: "Table Key" } });
      fireEvent.click(screen.getByTestId("add-name-key"));

      expect(mockSetTablesNamekeys).toHaveBeenCalled();
      expect(mockSetFormsNamekeys).not.toHaveBeenCalled();
    });
  });

  describe("Conditions - Edge Cases", () => {
    it("should handle undefined properties gracefully", () => {
      const propsWithoutProperties = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          id: "test-component",
          type: "form" as const,
          category: "component" as const,
          properties: undefined as any,
        },
      };

      expect(() =>
        render(<FieldPathPanel {...propsWithoutProperties} />),
      ).not.toThrow();
    });

    it("should handle missing nameKeyIds in properties", () => {
      const propsWithoutNameKeys = {
        ...defaultProps,
        propertyComponent: {
          id: "test-component",
          type: "form" as const,
          category: "component" as const,
          displayName: "Form",
          properties: {
            name: "testForm",
          },
        },
      };

      render(<FieldPathPanel {...propsWithoutNameKeys} />);
      expect(screen.getByText(/No field paths added yet/i)).toBeInTheDocument();
    });

    it("should hide edit button when in editing mode", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          displayName: "Form",
          ...defaultProps.propertyComponent,
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Key 1", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("edit-id-1"));

      expect(screen.queryByTestId("edit-id-1")).not.toBeInTheDocument();
    });

    it("should return null when propertyKey is not NameKeyIds", () => {
      const propsWithDifferentKey = {
        ...defaultProps,
        propertyKeys: ["OtherProperty" as ComponentProperty],
      };

      const { container } = render(
        <FieldPathPanel {...propsWithDifferentKey} />,
      );

      // Should only have the toggle button, no content
      expect(
        container.querySelector(".fieldPathPanelContainer"),
      ).not.toBeInTheDocument();
    });

    it("should handle multiple field paths in list", () => {
      const propsWithMultipleKeys = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          displayName: "Form",
          properties: {
            name: "testForm",
            nameKeyIds: [
              { label: "Key 1", id: "id-1" },
              { label: "Key 2", id: "id-2" },
              { label: "Key 3", id: "id-3" },
            ],
          },
        },
      };

      render(<FieldPathPanel {...propsWithMultipleKeys} />);

      expect(screen.getByText("Key 1")).toBeInTheDocument();
      expect(screen.getByText("Key 2")).toBeInTheDocument();
      expect(screen.getByText("Key 3")).toBeInTheDocument();
      expect(screen.getByTestId("delete-id-1")).toBeInTheDocument();
      expect(screen.getByTestId("delete-id-2")).toBeInTheDocument();
      expect(screen.getByTestId("delete-id-3")).toBeInTheDocument();
    });
  });

  describe("Conditions - Textarea Trimming", () => {
    it("should trim input value in edit mode", () => {
      const propsWithKeys = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          displayName: "Form",
          properties: {
            name: "testForm",
            nameKeyIds: [{ label: "Original", id: "id-1" }],
          },
        },
      };

      render(<FieldPathPanel {...propsWithKeys} />);

      fireEvent.click(screen.getByTestId("edit-id-1"));

      const editTextarea = screen.getByDisplayValue("Original");
      fireEvent.change(editTextarea, { target: { value: "  Trimmed  " } });
      fireEvent.blur(editTextarea);

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.NameKeyIds,
        [{ label: "Trimmed", id: "id-1" }],
      );
    });
  });
});
