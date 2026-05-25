import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InputCalculationsPanel from "./InputCalculationsPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";
import { InputTypes } from "@/app/utils/enums";

jest.mock("@/app/context/PropertiesContext", () => ({
  ...jest.requireActual("@/app/context/PropertiesContext"),
  usePropertyPane: jest.fn(),
}));

jest.mock("@/app/hooks/useParentFormProperties", () => ({
  useParentFormProperties: jest.fn(),
}));

interface MathExpressionInputProps {
  variables: string[];
  expression: string;
  updateExpression: (e: string) => void;
}
jest.mock(
  "../../UIComponents/CustomComponents/MathExpression/MathExpression",
  () => ({
    __esModule: true,
    default: ({
      updateExpression,
      expression,
      variables,
    }: MathExpressionInputProps) => (
      <div data-testid="math-expression">
        <input
          data-testid="math-input"
          value={expression || ""}
          onChange={(e) => updateExpression(e.target.value)}
        />
        <div data-testid="variables">{JSON.stringify(variables)}</div>
      </div>
    ),
  })
);

import { usePropertyPane } from "@/app/context/PropertiesContext";
import { useParentFormProperties } from "@/app/hooks/useParentFormProperties";

describe("InputCalculationsPanel", () => {
  const setPropertyMock = jest.fn();
  const togglePanelMock = jest.fn();
  const isPanelOpenMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: togglePanelMock,
      isPanelOpen: isPanelOpenMock,
    });

    (useParentFormProperties as jest.Mock).mockReturnValue({
      parentForm: null,
    });
  });

  test("should render only when inputType is number", () => {
    isPanelOpenMock.mockReturnValue(true);

    const propertyComponent = {
      properties: { inputType: "number" },
    };

    const { rerender } = render(
      <InputCalculationsPanel
        propertyKeys={[
          ComponentProperty.IsCalculated,
          ComponentProperty.Formula,
        ]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.getByText("Calculations")).toBeInTheDocument();

    propertyComponent.properties.inputType = "text";

    rerender(
      <InputCalculationsPanel
        propertyKeys={[
          ComponentProperty.IsCalculated,
          ComponentProperty.Formula,
        ]}
        propertyComponent={propertyComponent}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.queryByText("Calculations")).not.toBeInTheDocument();
  });

  test("toggle button should call togglePanel with correct panel name", () => {
    isPanelOpenMock.mockReturnValue(false);

    render(
      <InputCalculationsPanel
        propertyKeys={[]}
        propertyComponent={{ properties: { inputType: "number" } }}
        setProperty={setPropertyMock}
      />
    );

    const toggleButton = screen.getByText("Calculations").closest("button");
    fireEvent.click(toggleButton as HTMLButtonElement);

    expect(togglePanelMock).toHaveBeenCalledWith(
      PropertyPanels.InputCalculationsPanel
    );
  });

  test("panel should apply open class when isOpen returns true", () => {
    isPanelOpenMock.mockReturnValue(false);

    const { rerender } = render(
      <InputCalculationsPanel
        propertyKeys={[]}
        propertyComponent={{ properties: { inputType: "number" } }}
        setProperty={setPropertyMock}
      />
    );

    const heading = screen.getByText("Calculations").closest("button");
    expect(heading).not.toHaveClass("isOpen");

    isPanelOpenMock.mockReturnValue(true);

    rerender(
      <InputCalculationsPanel
        propertyKeys={[]}
        propertyComponent={{ properties: { inputType: "number" } }}
        setProperty={setPropertyMock}
      />
    );

    expect(heading).toHaveClass("isOpen");
  });

  test("should render and interact with IsCalculated property", () => {
    isPanelOpenMock.mockReturnValue(true);

    render(
      <InputCalculationsPanel
        propertyKeys={[ComponentProperty.IsCalculated]}
        propertyComponent={{ properties: { inputType: "number" } }}
        setProperty={setPropertyMock}
      />
    );

    const checkbox = screen.getByLabelText("Calculated Field");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.IsCalculated,
      true
    );
  });

  test("IsCalculated checkbox should be checked if property is true", () => {
    isPanelOpenMock.mockReturnValue(true);

    render(
      <InputCalculationsPanel
        propertyKeys={[ComponentProperty.IsCalculated]}
        propertyComponent={{
          properties: { inputType: "number", isCalculated: true },
        }}
        setProperty={setPropertyMock}
      />
    );

    const checkbox = screen.getByLabelText("Calculated Field");
    expect(checkbox).toBeChecked();
  });

  test("IsCalculated property should not render when inputType is not number", () => {
    isPanelOpenMock.mockReturnValue(true);

    render(
      <InputCalculationsPanel
        propertyKeys={[ComponentProperty.IsCalculated]}
        propertyComponent={{ properties: { inputType: "text" } }}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.queryByLabelText("Calculated Field")).not.toBeInTheDocument();
  });

  test("Formula property should render only when isCalculated is true", () => {
    isPanelOpenMock.mockReturnValue(true);

    const { rerender } = render(
      <InputCalculationsPanel
        propertyKeys={[ComponentProperty.Formula]}
        propertyComponent={{
          properties: {
            inputType: "number",
            isCalculated: true,
            name: "testField",
            formula: "a + b",
          },
        }}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.getByText("Formula")).toBeInTheDocument();
    expect(screen.getByTestId("math-expression")).toBeInTheDocument();

    rerender(
      <InputCalculationsPanel
        propertyKeys={[ComponentProperty.Formula]}
        propertyComponent={{
          properties: {
            inputType: "number",
            isCalculated: false,
          },
        }}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.queryByText("Formula")).not.toBeInTheDocument();
  });

  test("Formula input should update expression", () => {
    isPanelOpenMock.mockReturnValue(true);

    render(
      <InputCalculationsPanel
        propertyKeys={[ComponentProperty.Formula]}
        propertyComponent={{
          properties: {
            inputType: "number",
            isCalculated: true,
            name: "testField",
            formula: "a + b",
          },
        }}
        setProperty={setPropertyMock}
      />
    );

    const input = screen.getByTestId("math-input");
    fireEvent.change(input, { target: { value: "a + b + c" } });

    expect(setPropertyMock).toHaveBeenCalledWith("formula", "a + b + c");
  });

  test("getOperands should collect number input names from parent form", () => {
    isPanelOpenMock.mockReturnValue(true);

    (useParentFormProperties as jest.Mock).mockReturnValue({
      parentForm: {
        components: [
          {
            type: "input",
            properties: {
              name: "numberInput1",
              inputType: InputTypes.NUMBER,
            },
          },
          {
            type: "form-row",
            components: [
              {
                type: "input",
                properties: {
                  name: "numberInput2",
                  inputType: InputTypes.NUMBER,
                },
              },
              {
                type: "form-row",
                components: [
                  {
                    type: "input",
                    properties: {
                      name: "numberInput3",
                      inputType: InputTypes.NUMBER,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    render(
      <InputCalculationsPanel
        propertyKeys={[ComponentProperty.Formula]}
        propertyComponent={{
          properties: {
            inputType: "number",
            isCalculated: true,
            name: "testField",
          },
        }}
        setProperty={setPropertyMock}
      />
    );

    const variables = screen.getByTestId("variables");
    expect(variables.textContent).toContain("numberInput1");
    expect(variables.textContent).toContain("numberInput2");
    expect(variables.textContent).toContain("numberInput3");
    expect(variables.textContent).not.toContain("textInput");
    expect(variables.textContent).not.toContain("emailInput");
  });

  test("getOperands should handle empty or undefined components", () => {
    isPanelOpenMock.mockReturnValue(true);

    (useParentFormProperties as jest.Mock).mockReturnValue({
      parentForm: {
        components: undefined,
      },
    });

    render(
      <InputCalculationsPanel
        propertyKeys={[ComponentProperty.Formula]}
        propertyComponent={{
          properties: {
            inputType: "number",
            isCalculated: true,
            name: "testField",
          },
        }}
        setProperty={setPropertyMock}
      />
    );

    const variables = screen.getByTestId("variables");
    expect(variables.textContent).toBe("[]");
  });

  test("Unknown property key should return null", () => {
    isPanelOpenMock.mockReturnValue(true);

    render(
      <InputCalculationsPanel
        propertyKeys={["unknownProperty"] as any}
        propertyComponent={{
          properties: {
            inputType: "number",
            isCalculated: true,
          },
        }}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.queryByLabelText("Calculated Field")).not.toBeInTheDocument();
    expect(screen.queryByText("Formula")).not.toBeInTheDocument();
  });

  test("Should handle case when isPanelOpen is undefined", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: togglePanelMock,
      isPanelOpen: undefined,
    });

    render(
      <InputCalculationsPanel
        propertyKeys={[ComponentProperty.IsCalculated]}
        propertyComponent={{ properties: { inputType: "number" } }}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.getByText("Calculations")).toBeInTheDocument();
  });

  test("Full integration test with both IsCalculated and Formula properties", () => {
    isPanelOpenMock.mockReturnValue(true);

    (useParentFormProperties as jest.Mock).mockReturnValue({
      parentForm: {
        components: [
          {
            type: "input",
            properties: {
              name: "price",
              inputType: InputTypes.NUMBER,
            },
          },
          {
            type: "input",
            properties: {
              name: "quantity",
              inputType: InputTypes.NUMBER,
            },
          },
        ],
      },
    });

    render(
      <InputCalculationsPanel
        propertyKeys={[
          ComponentProperty.IsCalculated,
          ComponentProperty.Formula,
        ]}
        propertyComponent={{
          properties: {
            inputType: "number",
            name: "total",
          },
        }}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.queryByText("Formula")).not.toBeInTheDocument();

    const checkbox = screen.getByLabelText("Calculated Field");
    fireEvent.click(checkbox);
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.IsCalculated,
      true
    );

    setPropertyMock.mockClear();

    render(
      <InputCalculationsPanel
        propertyKeys={[
          ComponentProperty.IsCalculated,
          ComponentProperty.Formula,
        ]}
        propertyComponent={{
          properties: {
            inputType: "number",
            name: "total",
            isCalculated: true,
          },
        }}
        setProperty={setPropertyMock}
      />
    );

    expect(screen.getByText("Formula")).toBeInTheDocument();

    const input = screen.getByTestId("math-input");
    fireEvent.change(input, { target: { value: "price * quantity" } });

    expect(setPropertyMock).toHaveBeenCalledWith("formula", "price * quantity");

    const variables = screen.getByTestId("variables");
    expect(variables.textContent).toContain("price");
    expect(variables.textContent).toContain("quantity");
  });
});
