
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TabsConditionsRenderer from "./TabsConditionsRenderer";
import { TabsConditions } from "./../../../types/types";


describe("TabsConditionsRender", () => {
  const mockSetProperty = jest.fn();

  const defaultProps = {
    tabConditions: undefined,
    setProperty: mockSetProperty,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("should render with default initial conditions when tabConditions is undefined", () => {
      render(<TabsConditionsRenderer {...defaultProps} />);

      expect(screen.getByText("Build Conditions")).toBeInTheDocument();
      expect(screen.getByText("Logical Operator")).toBeInTheDocument();
      expect(screen.getByText("Conditions")).toBeInTheDocument();
      expect(screen.getByText("Condition 1")).toBeInTheDocument();
      expect(screen.getByText("Add Condition")).toBeInTheDocument();
    });

    it("should render with provided tabConditions", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "||",
        expressions: [
          { leftOperand: "a", operator: "==", rightOperand: "b" },
          { leftOperand: "c", operator: "!=", rightOperand: "d" },
        ],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      expect(screen.getByText("Condition 1")).toBeInTheDocument();
      expect(screen.getByText("Condition 2")).toBeInTheDocument();
      expect(screen.getByDisplayValue("a")).toBeInTheDocument();
      expect(screen.getByDisplayValue("b")).toBeInTheDocument();
      expect(screen.getByDisplayValue("c")).toBeInTheDocument();
      expect(screen.getByDisplayValue("d")).toBeInTheDocument();
    });

    it("should render logical operator select with correct value", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "||",
        expressions: [{ leftOperand: "", operator: "", rightOperand: "" }],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      const logicalOpSelect = screen.getByTestId("logicalOp");
      expect(logicalOpSelect).toHaveValue("||");
    });
  });

  describe("Add Condition", () => {
    it("should add a new condition when Add Condition button is clicked", () => {
      render(<TabsConditionsRenderer {...defaultProps} />);

      const addButton = screen.getByTestId("addTabCondition");
      fireEvent.click(addButton);

      expect(screen.getByText("Condition 1")).toBeInTheDocument();
      expect(screen.getByText("Condition 2")).toBeInTheDocument();
      expect(mockSetProperty).toHaveBeenCalledWith("conditions", {
        logicalOp: "&&",
        expressions: [
          { leftOperand: "", operator: "", rightOperand: "" },
          { leftOperand: "", operator: "", rightOperand: "" },
        ],
      });
    });

    it("should call setProperty with updated conditions when adding condition", () => {
      render(<TabsConditionsRenderer {...defaultProps} />);

      const addButton = screen.getByTestId("addTabCondition");
      fireEvent.click(addButton);

      expect(mockSetProperty).toHaveBeenCalledTimes(1);
      expect(mockSetProperty).toHaveBeenCalledWith(
        "conditions",
        expect.objectContaining({
          logicalOp: "&&",
          expressions: expect.arrayContaining([
            expect.objectContaining({
              leftOperand: "",
              operator: "",
              rightOperand: "",
            }),
          ]),
        })
      );
    });
  });

  describe("Remove Condition", () => {
    it("should remove condition when delete button is clicked", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [
          { leftOperand: "a", operator: "==", rightOperand: "b" },
          { leftOperand: "c", operator: "!=", rightOperand: "d" },
        ],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      const deleteButton = screen.getByTestId("delete0");
      fireEvent.click(deleteButton);

      expect(mockSetProperty).toHaveBeenCalledWith("conditions", {
        logicalOp: "&&",
        expressions: [{ leftOperand: "c", operator: "!=", rightOperand: "d" }],
      });
    });

    it("should render delete buttons for each condition", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [
          { leftOperand: "a", operator: "==", rightOperand: "b" },
          { leftOperand: "c", operator: "!=", rightOperand: "d" },
        ],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      expect(screen.getByTestId("delete0")).toBeInTheDocument();
      expect(screen.getByTestId("delete1")).toBeInTheDocument();
    });

    it("should have correct title attribute on delete button", () => {
      render(<TabsConditionsRenderer {...defaultProps} />);

      const deleteButton = screen.getByTestId("delete0");
      expect(deleteButton).toHaveAttribute("title", "delete condition");
    });
  });

  describe("Update Condition Fields", () => {
    it("should update left operand when input changes", () => {
      render(<TabsConditionsRenderer {...defaultProps} />);

      const leftInput = screen.getByTestId("left0");
      fireEvent.change(leftInput, { target: { value: "newLeft" } });

      expect(mockSetProperty).toHaveBeenCalledWith("conditions", {
        logicalOp: "&&",
        expressions: [
          { leftOperand: "newLeft", operator: "", rightOperand: "" },
        ],
      });
    });

    it("should update operator when select changes", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [{ leftOperand: "a", operator: "", rightOperand: "" }],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      const operatorSelect = screen.getByTestId("operator0");
      fireEvent.change(operatorSelect, { target: { value: "==" } });

      expect(mockSetProperty).toHaveBeenCalledWith("conditions", {
        logicalOp: "&&",
        expressions: [{ leftOperand: "a", operator: "==", rightOperand: "" }],
      });
    });

    it("should update right operand when input changes", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [{ leftOperand: "a", operator: "==", rightOperand: "" }],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      const rightInput = screen.getByTestId("right0");
      fireEvent.change(rightInput, { target: { value: "newRight" } });

      expect(mockSetProperty).toHaveBeenCalledWith("conditions", {
        logicalOp: "&&",
        expressions: [
          { leftOperand: "a", operator: "==", rightOperand: "newRight" },
        ],
      });
    });
  });

  describe("Update Logical Operator", () => {
    it("should update logical operator when select changes", () => {
      render(<TabsConditionsRenderer {...defaultProps} />);

      const logicalOpSelect = screen.getByTestId("logicalOp");
      fireEvent.change(logicalOpSelect, { target: { value: "||" } });

      expect(mockSetProperty).toHaveBeenCalledWith("conditions", {
        logicalOp: "||",
        expressions: [{ leftOperand: "", operator: "", rightOperand: "" }],
      });
    });
  });

  describe("Conditional Rendering", () => {
    it('should hide operator and right operand fields when left operand starts with "!"', () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [{ leftOperand: "!flag", operator: "", rightOperand: "" }],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      // Should not render operator and right operand fields
      expect(screen.queryByTestId("operator0")).not.toBeInTheDocument();
      expect(screen.queryByTestId("right0")).not.toBeInTheDocument();
    });

    it('should show operator and right operand fields when left operand does not start with "!"', () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [{ leftOperand: "flag", operator: "", rightOperand: "" }],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      // Should render operator and right operand fields
      expect(screen.getByTestId("operator0")).toBeInTheDocument();
      expect(screen.getByTestId("right0")).toBeInTheDocument();
    });

    it("should disable operator field when left operand is empty", () => {
      render(<TabsConditionsRenderer {...defaultProps} />);

      const operatorSelect = screen.getByTestId("operator0");
      expect(operatorSelect).toBeDisabled();
    });

    it("should enable operator field when left operand has value", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [{ leftOperand: "a", operator: "", rightOperand: "" }],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      const operatorSelect = screen.getByTestId("operator0");
      expect(operatorSelect).not.toBeDisabled();
    });

    it("should disable right operand field when left operand is empty", () => {
      render(<TabsConditionsRenderer {...defaultProps} />);

      const rightInput = screen.getByTestId("right0");
      expect(rightInput).toBeDisabled();
    });

    it("should enable right operand field when left operand has value", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [{ leftOperand: "a", operator: "", rightOperand: "" }],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      const rightInput = screen.getByTestId("right0");
      expect(rightInput).not.toBeDisabled();
    });
  });

  describe("Multiple Conditions", () => {
    it("should handle multiple conditions correctly", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [
          { leftOperand: "a", operator: "==", rightOperand: "b" },
          { leftOperand: "c", operator: "!=", rightOperand: "d" },
          { leftOperand: "!flag", operator: "", rightOperand: "" },
        ],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      expect(screen.getByText("Condition 1")).toBeInTheDocument();
      expect(screen.getByText("Condition 2")).toBeInTheDocument();
      expect(screen.getByText("Condition 3")).toBeInTheDocument();

      // Check that the negation condition doesn't have operator/right operand fields
      expect(screen.queryByTestId("operator2")).not.toBeInTheDocument();
      expect(screen.queryByTestId("")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null/undefined values in condition fields", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [
          {
            leftOperand: null as any,
            operator: undefined as any,
            rightOperand: null as any,
          },
        ],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      expect(screen.getByTestId("left0")).toHaveValue("");
      expect(screen.getByTestId("operator0")).toHaveValue("");
      expect(screen.getByTestId("right0")).toHaveValue("");
    });

    it("should handle empty expressions array", () => {
      const tabConditions: TabsConditions = {
        logicalOp: "&&",
        expressions: [],
      };

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      expect(screen.queryByText("Condition 1")).not.toBeInTheDocument();
      expect(screen.getByText("Add Condition")).toBeInTheDocument();
    });

    it("should handle invalid tabConditions object", () => {
      const tabConditions = "invalid" as any;

      render(
        <TabsConditionsRenderer
          tabConditions={tabConditions}
          setProperty={mockSetProperty}
        />
      );

      // Should fall back to initial conditions
      expect(screen.getByText("Condition 1")).toBeInTheDocument();
      expect(screen.getByTestId("logicalOp")).toHaveValue("&&");
    });
  });

});
