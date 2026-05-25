import { render, screen, fireEvent } from "@testing-library/react";
import DynamicIconColorConditions from "./DynamicIconColorConditions";
import { IconColorCondition } from "../../../types/types";

describe("DynamicIconColorConditions Component", () => {
  const mockSetProperty = jest.fn();
  const mockHandleAddCondition = jest.fn();

  const mockConditions: IconColorCondition[] = [
    {
      id: "condition-1",
      leftOperand: "$status",
      operator: "==",
      rightOperand: "Active",
      color: "#00FF00",
    },
    {
      id: "condition-2",
      leftOperand: "$status",
      operator: "==",
      rightOperand: "Inactive",
      color: "#FF0000",
    },
  ];

  const defaultProps = {
    properties: {
      prefixDynamicIconColorConditions: mockConditions,
    },
    prefixSuffix: "prefix",
    setProperty: mockSetProperty,
    handleAddCondition: mockHandleAddCondition,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Color Conditions header", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);
    expect(screen.getByText("Color Conditions")).toBeInTheDocument();
  });

  it("renders all color conditions", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);
    expect(screen.getByText("Condition 1")).toBeInTheDocument();
    expect(screen.getByText("Condition 2")).toBeInTheDocument();
  });

  it("renders Add Color Condition button", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);
    const addButton = screen.getByTestId("addColumnButton");
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("+ Add Color Condition");
  });

  it("calls handleAddCondition when Add button is clicked", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);
    const addButton = screen.getByTestId("addColumnButton");
    fireEvent.click(addButton);
    expect(mockHandleAddCondition).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when no conditions exist", () => {
    const emptyProps = {
      ...defaultProps,
      properties: {
        prefixDynamicIconColorConditions: [],
      },
    };
    render(<DynamicIconColorConditions {...emptyProps} />);
    expect(screen.getByText("Color Conditions")).toBeInTheDocument();
    expect(screen.getByTestId("addColumnButton")).toBeInTheDocument();
    expect(screen.queryByText("Condition 1")).not.toBeInTheDocument();
  });

  it("updates leftOperand field when changed", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);

    // Expand the first condition
    const condition1 = screen.getByText("Condition 1");
    fireEvent.click(condition1);

    const leftOperandInput = screen.getByPlaceholderText("e.g., #promiseStatus");
    fireEvent.change(leftOperandInput, { target: { value: "$newStatus" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      "prefixDynamicIconColorConditions",
      expect.arrayContaining([
        expect.objectContaining({
          id: "condition-1",
          leftOperand: "$newStatus",
        }),
      ])
    );
  });

  it("updates operator field when changed", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);

    // Expand the first condition
    const condition1 = screen.getByText("Condition 1");
    fireEvent.click(condition1);

    const operatorSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(operatorSelect, { target: { value: "!=" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      "prefixDynamicIconColorConditions",
      expect.arrayContaining([
        expect.objectContaining({
          id: "condition-1",
          operator: "!=",
        }),
      ])
    );
  });

  it("updates rightOperand field when changed", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);

    // Expand the first condition
    const condition1 = screen.getByText("Condition 1");
    fireEvent.click(condition1);

    const rightOperandInput = screen.getByPlaceholderText("e.g., Active");
    fireEvent.change(rightOperandInput, { target: { value: "Pending" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      "prefixDynamicIconColorConditions",
      expect.arrayContaining([
        expect.objectContaining({
          id: "condition-1",
          rightOperand: "Pending",
        }),
      ])
    );
  });

  it("updates color field when changed", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);

    // Expand the first condition
    const condition1 = screen.getByText("Condition 1");
    fireEvent.click(condition1);

    const colorInput = screen.getByPlaceholderText("e.g., #FF0000");
    fireEvent.change(colorInput, { target: { value: "#0000FF" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      "prefixDynamicIconColorConditions",
      expect.arrayContaining([
        expect.objectContaining({
          id: "condition-1",
          color: "#0000FF",
        }),
      ])
    );
  });

  it("renders delete button for each condition", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);
    const deleteButtons = screen.getAllByTestId("delete");
    expect(deleteButtons).toHaveLength(2);
  });

  it("deletes condition when delete button is clicked", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);

    const deleteButtons = screen.getAllByTestId("delete");
    const deleteButton = deleteButtons[0];
    fireEvent.click(deleteButton);

    expect(mockSetProperty).toHaveBeenCalledWith(
      "prefixDynamicIconColorConditions",
      expect.arrayContaining([
        expect.objectContaining({
          id: "condition-2",
        }),
      ])
    );
    expect(mockSetProperty.mock.calls[0][1]).toHaveLength(1);
  });

  it("handles suffix prefix correctly", () => {
    const suffixProps = {
      ...defaultProps,
      prefixSuffix: "suffix",
      properties: {
        suffixDynamicIconColorConditions: mockConditions,
      },
    };

    render(<DynamicIconColorConditions {...suffixProps} />);
    expect(screen.getByText("Color Conditions")).toBeInTheDocument();
  });

  it("supports drag and drop functionality", () => {
    render(<DynamicIconColorConditions {...defaultProps} />);

    // Check if drag handles are present (from ExpandableColumn)
    const condition1 = screen.getByText("Condition 1");
    expect(condition1).toBeInTheDocument();

    // The ExpandableColumn component handles drag and drop
    // so we just verify the component renders with draggable rows
    const draggableRows = screen.getByText("Condition 1").closest("[role='button']");
    expect(draggableRows).toBeInTheDocument();
  });
});
