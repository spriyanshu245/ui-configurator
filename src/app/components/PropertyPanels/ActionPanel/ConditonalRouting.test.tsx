import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConditonalRouting from "./ConditonalRouting";
import { useMicrosite } from "@/app/context/MicrositeContext";
import { useUserTask } from "@/app/context/UserTaskContext";
import { getComponents } from "@/app/utils/utils";

jest.mock("@/app/context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("@/app/utils/utils", () => ({
  getComponents: jest.fn(),
}));

jest.mock("@/app/utils/constants", () => ({
  OPERATORS: [
    { label: "Equals", value: "==" },
    { label: "Not Equals", value: "!=" },
  ],
}));

jest.mock("@/app/styles/properties-pane.module.scss", () => {
  return new Proxy({}, { get: (target, prop) => String(prop) });
});

jest.mock("@/app/styles/shared.module.scss", () => {
  return new Proxy({}, { get: (target, prop) => String(prop) });
});

jest.mock("./ActionPanel.module.scss", () => {
  return new Proxy({}, { get: (target, prop) => String(prop) });
});

jest.mock("../../SVGIcons/Delete", () => () => (
  <div data-testid="delete-icon" />
));

jest.mock("../../PropertyInputs/PropertyInput", () => {
  return function MockPropertyInput({
    label,
    value,
    handleChange,
    type,
    options,
    disabled,
    id,
  }: any) {
    if (type === "select") {
      return (
        <div data-testid={`wrapper-${id}`}>
          <label>{label}</label>
          <select
            data-testid={`input-${id}`}
            value={value}
            onChange={handleChange}
            disabled={disabled}
          >
            <option value="">Select</option>
            {options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div data-testid={`wrapper-${id}`}>
        <label>{label}</label>
        <input
          data-testid={`input-${id}`}
          value={value}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
    );
  };
});

describe("ConditonalRouting Component", () => {
  const mockDeleteCondition = jest.fn();
  const mockHandleAddConditionalRoute = jest.fn();
  const mockHandleRouteChange = jest.fn();

  const mockMicrosite = {
    pages: [
      { pageCode: "Process_Page1" },
      { pageCode: "Process_Page2" },
      { pageCode: "Process_ActivePage" },
    ],
  };

  const mockActivePage = {
    pageCode: "Process_ActivePage",
  };

  const mockUserTask = {
    properties: {
      showAsPopup: false,
    },
    components: [{ id: "comp1" }, { id: "comp2" }],
  };

  const defaultProps = {
    properties: { conditionalRoutes: [] },
    deleteCondition: mockDeleteCondition,
    handleAddConditionalRoute: mockHandleAddConditionalRoute,
    handleRouteChange: mockHandleRouteChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useMicrosite as jest.Mock).mockReturnValue({
      microsite: mockMicrosite,
      activePageCode: mockActivePage.pageCode,
    });

    (useUserTask as jest.Mock).mockReturnValue({
      userTask: mockUserTask,
    });

    (getComponents as jest.Mock).mockReturnValue(["ComponentA", "ComponentB"]);
  });

  it("renders correctly with no routes", () => {
    render(<ConditonalRouting {...defaultProps} />);
    expect(screen.getByText("Conditional Routes")).toBeInTheDocument();
    expect(screen.getByText("Add Conditional Route")).toBeInTheDocument();
  });

  it("triggers add route handler", () => {
    render(<ConditonalRouting {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Conditional Route"));
    expect(mockHandleAddConditionalRoute).toHaveBeenCalledTimes(1);
  });

  it("renders existing conditional routes correctly", () => {
    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [
          {
            condition: {
              leftOperand: "status",
              operator: "==",
              rightOperand: "active",
            },
            route: "Page1",
          },
        ],
      },
    };

    render(<ConditonalRouting {...props} />);

    expect(screen.getByTestId("input-left0")).toHaveValue("status");
    expect(screen.getByTestId("input-operator0")).toHaveValue("==");
    expect(screen.getByTestId("input-right0")).toHaveValue("active");

    expect(screen.getByTestId("route-0")).toHaveValue("Page1");
  });

  it("handles changes to left operand", () => {
    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [{ condition: { leftOperand: "" } }],
      },
    };

    render(<ConditonalRouting {...props} />);

    const input = screen.getByTestId("input-left0");
    fireEvent.change(input, { target: { value: "newVar" } });

    expect(mockHandleRouteChange).toHaveBeenCalledWith(
      "condition",
      expect.objectContaining({
        leftOperand: "newVar",
        operator: "",
        rightOperand: "",
      }),
      0
    );
  });

  it("handles changes to operator", () => {
    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [{ condition: { leftOperand: "status" } }],
      },
    };

    render(<ConditonalRouting {...props} />);

    const select = screen.getByTestId("input-operator0");
    fireEvent.change(select, { target: { value: "!=" } });

    expect(mockHandleRouteChange).toHaveBeenCalledWith(
      "condition",
      expect.objectContaining({ operator: "!=" }),
      0
    );
  });

  it("handles changes to right operand", () => {
    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [{ condition: { leftOperand: "status" } }],
      },
    };

    render(<ConditonalRouting {...props} />);

    const input = screen.getByTestId("input-right0");
    fireEvent.change(input, { target: { value: "inactive" } });

    expect(mockHandleRouteChange).toHaveBeenCalledWith(
      "condition",
      expect.objectContaining({ rightOperand: "inactive" }),
      0
    );
  });

  it("hides operator and right operand fields when left operand starts with '!'", () => {
    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [{ condition: { leftOperand: "!isValid" } }],
      },
    };

    render(<ConditonalRouting {...props} />);

    expect(screen.getByTestId("input-left0")).toHaveValue("!isValid");
    expect(screen.queryByTestId("input-operator0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("input-right0")).not.toBeInTheDocument();
  });

  it("handles route selection change", () => {
    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [{ route: "" }],
      },
    };

    render(<ConditonalRouting {...props} />);

    const routeSelect = screen.getByTestId("route-0");

    fireEvent.change(routeSelect, { target: { value: "Page1" } });

    expect(mockHandleRouteChange).toHaveBeenCalledWith("route", "Page1", 0);
  });

  it("filters out the active page from the route options", () => {
    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [{ route: "" }],
      },
    };

    render(<ConditonalRouting {...props} />);

    const routeSelect = screen.getByTestId("route-0");

    expect(routeSelect).toHaveTextContent("Process_Page1");
    expect(routeSelect).toHaveTextContent("Process_Page2");

    expect(routeSelect).not.toHaveTextContent("Process_ActivePage");
  });

  it("shows onCloseAction dropdown when current task is configured as a popup", () => {
    (useUserTask as jest.Mock).mockReturnValue({
      userTask: {
        ...mockUserTask,
        properties: { showAsPopup: true },
      },
    });

    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [{ route: "Page1", onCloseAction: "" }],
      },
    };

    render(<ConditonalRouting {...props} />);

    expect(screen.getByText("Action on popup close")).toBeInTheDocument();

    const actionSelect = screen.getByTestId("action-0");

    expect(actionSelect).toHaveTextContent("ComponentA");

    fireEvent.change(actionSelect, { target: { value: "ComponentA" } });

    expect(mockHandleRouteChange).toHaveBeenCalledWith(
      "onCloseAction",
      "ComponentA",
      0
    );
  });

  it("hides onCloseAction dropdown when not a popup", () => {
    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [{ route: "Page1" }],
      },
    };

    render(<ConditonalRouting {...props} />);

    expect(screen.queryByText("Action on popup close")).not.toBeInTheDocument();
    expect(screen.queryByTestId("action-0")).not.toBeInTheDocument();
  });

  it("deletes a conditional route", () => {
    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [{ route: "Page1" }],
      },
    };

    render(<ConditonalRouting {...props} />);

    const deleteBtn = screen.getByTestId("delete");
    fireEvent.click(deleteBtn);

    expect(mockDeleteCondition).toHaveBeenCalledWith(0);
  });

  it("renders multiple conditional routes and handles deletion correctly", () => {
    const props = {
      ...defaultProps,
      properties: {
        conditionalRoutes: [{ route: "Page1" }, { route: "Page2" }],
      },
    };

    render(<ConditonalRouting {...props} />);

    const deleteBtns = screen.getAllByTestId("delete");
    expect(deleteBtns).toHaveLength(2);

    fireEvent.click(deleteBtns[1]);
    expect(mockDeleteCondition).toHaveBeenCalledWith(1);
  });

  it("handles undefined properties gracefully", () => {
    render(<ConditonalRouting {...defaultProps} properties={{}} />);

    expect(screen.getByText("Add Conditional Route")).toBeInTheDocument();
  });
});
