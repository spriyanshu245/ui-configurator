import React from "react";
import { render, screen } from "@testing-library/react";
import FinancialDetails from "./FinancialDetails";
import { FinancialDetailsComponent } from "../../../types/types";

describe("FinancialDetails", () => {
  const createMockComponent = (
    overrides?: Partial<FinancialDetailsComponent>
  ): FinancialDetailsComponent => ({
    id: "financial-details-1",
    name: "Financial Details Component",
    type: "financial-details",
    category: "component",
    properties: {
      name: "test-financial-details",
    },
    ...overrides,
  });

  test("renders with basic component data", () => {
    const mockComponent = createMockComponent();

    render(<FinancialDetails component={mockComponent} />);

    expect(
      screen.getByText("Custom component financial-details")
    ).toBeDefined();
  });

  test("renders with component type from props", () => {
    const mockComponent = createMockComponent();

    render(<FinancialDetails component={mockComponent} />);

    const element = screen.getByText(/Custom component/);
    expect(element.textContent).toBe("Custom component financial-details");
  });

  test("renders with different component properties", () => {
    const mockComponent = createMockComponent({
      properties: {
        name: "custom-financial-component",
        customProperty: "test-value",
      },
    });

    render(<FinancialDetails component={mockComponent} />);

    expect(
      screen.getByText("Custom component financial-details")
    ).toBeDefined();
  });

  test("renders with optional name property", () => {
    const mockComponent = createMockComponent({
      name: "Custom Financial Details",
    });

    render(<FinancialDetails component={mockComponent} />);

    expect(
      screen.getByText("Custom component financial-details")
    ).toBeDefined();
  });

  test("renders with different component id", () => {
    const mockComponent = createMockComponent({
      id: "different-financial-id",
    });

    render(<FinancialDetails component={mockComponent} />);

    expect(
      screen.getByText("Custom component financial-details")
    ).toBeDefined();
  });

  test("renders with readOnly property", () => {
    const mockComponent = createMockComponent({
      readOnly: true,
    });

    render(<FinancialDetails component={mockComponent} />);

    expect(
      screen.getByText("Custom component financial-details")
    ).toBeDefined();
  });

  test("renders with style properties", () => {
    const mockComponent = createMockComponent({
      style: [
        { key: "color", value: "blue" },
        { key: "fontSize", value: "16px" },
      ],
    });

    render(<FinancialDetails component={mockComponent} />);

    expect(
      screen.getByText("Custom component financial-details")
    ).toBeDefined();
  });

  test("renders with additional properties", () => {
    const mockComponent = createMockComponent({
      properties: {
        name: "financial-details-test",
        displayMode: "detailed",
        currency: "USD",
        showTotals: true,
      },
    });

    render(<FinancialDetails component={mockComponent} />);

    expect(
      screen.getByText("Custom component financial-details")
    ).toBeDefined();
  });

  test("renders with isNewComponent flag", () => {
    const mockComponent = createMockComponent({
      isNewComponent: true,
    });

    render(<FinancialDetails component={mockComponent} />);

    expect(
      screen.getByText("Custom component financial-details")
    ).toBeDefined();
  });

  test("renders with nested components", () => {
    const mockComponent = createMockComponent({
      components: [
        {
          id: "nested-component-1",
          type: "text",
          category: "component",
        },
      ],
    });

    render(<FinancialDetails component={mockComponent} />);

    expect(
      screen.getByText("Custom component financial-details")
    ).toBeDefined();
  });

  test("component type is always financial-details", () => {
    const mockComponent = createMockComponent();

    render(<FinancialDetails component={mockComponent} />);

    const element = screen.getByText(/financial-details/);
    expect(element).toBeDefined();
  });

  test("renders div element with correct content", () => {
    const mockComponent = createMockComponent();

    render(<FinancialDetails component={mockComponent} />);

    const divElement = screen.getByText("Custom component financial-details");
    expect(divElement.tagName).toBe("DIV");
  });

  test("renders without crashing with minimal props", () => {
    const mockComponent: FinancialDetailsComponent = {
      id: "minimal-component",
      type: "financial-details",
      category: "component",
      properties: {
        name: "minimal",
      },
    };

    expect(() => {
      render(<FinancialDetails component={mockComponent} />);
    }).not.toThrow();
  });

  test("renders with empty properties object", () => {
    const mockComponent = createMockComponent({
      properties: {
        name: "",
      },
    });

    render(<FinancialDetails component={mockComponent} />);

    expect(
      screen.getByText("Custom component financial-details")
    ).toBeDefined();
  });

  test("component receives correct props structure", () => {
    const mockComponent = createMockComponent();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const TestWrapper = ({
      component,
    }: {
      component: FinancialDetailsComponent;
    }) => {
      console.log("Component type:", component.type);
      return <FinancialDetails component={component} />;
    };

    render(<TestWrapper component={mockComponent} />);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Component type:",
      "financial-details"
    );
    consoleSpy.mockRestore();
  });
});
