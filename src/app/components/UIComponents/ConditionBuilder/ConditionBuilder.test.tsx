import { render, screen } from "@testing-library/react";
import ConditionBuilder from "./ConditionBuilder";
import { ConditionBuilderComponent } from "@/app/types/types";

describe("ConditionBuilder", () => {
  const mockComponent: ConditionBuilderComponent = {
    id: "condition-builder-1",
    type: "condition-builder",
    category: "form",
    properties: {
      name: "testConditionBuilder",
      label: "Test Condition Builder",
      showLabel: true,
      placeholder: "Enter condition",
      dialectCode: "LOS",
    },
  };

  it("should render the component", () => {
    render(<ConditionBuilder component={mockComponent} />);
    const input = screen.getByPlaceholderText("Enter condition");
    expect(input).toBeInTheDocument();
  });

  it("should render the label when showLabel is true", () => {
    render(<ConditionBuilder component={mockComponent} />);
    const label = screen.getByText("Test Condition Builder");
    expect(label).toBeInTheDocument();
  });

  it("should not render the label when showLabel is false", () => {
    const componentWithoutLabel: ConditionBuilderComponent = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        showLabel: false,
      },
    };
    render(<ConditionBuilder component={componentWithoutLabel} />);
    const label = screen.queryByText("Test Condition Builder");
    expect(label).not.toBeInTheDocument();
  });

  it("should render the input as disabled", () => {
    render(<ConditionBuilder component={mockComponent} />);
    const input = screen.getByPlaceholderText("Enter condition");
    expect(input).toBeDisabled();
  });

  it("should render the RuleIcon", () => {
    const { container } = render(<ConditionBuilder component={mockComponent} />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should apply correct placeholder", () => {
    render(<ConditionBuilder component={mockComponent} />);
    const input = screen.getByPlaceholderText("Enter condition");
    expect(input).toHaveAttribute("placeholder", "Enter condition");
  });

  it("should use component id for input name and id", () => {
    render(<ConditionBuilder component={mockComponent} />);
    const input = screen.getByPlaceholderText("Enter condition");
    expect(input).toHaveAttribute("name", "condition-builder-1");
    expect(input).toHaveAttribute("id", "condition-builder-1");
  });

  it("should render without label when label is not provided", () => {
    const componentWithoutLabelText: ConditionBuilderComponent = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        label: undefined,
      },
    };
    render(<ConditionBuilder component={componentWithoutLabelText} />);
    const label = screen.queryByText("Test Condition Builder");
    expect(label).not.toBeInTheDocument();
  });

  it("should render with empty placeholder", () => {
    const componentWithoutPlaceholder: ConditionBuilderComponent = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        placeholder: "",
      },
    };
    render(<ConditionBuilder component={componentWithoutPlaceholder} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "");
  });

  it("should have correct CSS classes applied", () => {
    const { container } = render(<ConditionBuilder component={mockComponent} />);
    const formGroup = container.querySelector('[id="condition-builder-1"]');
    expect(formGroup).toHaveClass("formGroup");
  });

  it("should render icon container with correct margin", () => {
    const { container } = render(<ConditionBuilder component={mockComponent} />);
    const iconContainer = container.querySelector('[class*="iconContainer"]');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveStyle({ marginLeft: "6px" });
  });
});
