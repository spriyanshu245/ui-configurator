import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CheckboxGroup from "./CheckboxGroup";
import { CheckboxGroupComponent } from "@/app/types/types";

describe("CheckboxGroup Component", () => {
  const mockComponent: CheckboxGroupComponent = {
    id: "checkbox-group-1",
    name: "test-checkbox-group",
    type: "checkbox-group",
    category: "form",
    properties: {
      label: "Test Checkbox Group",
      options: [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
        { value: "option3", label: "Option 3" },
      ],
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders with label and all options", () => {
    render(<CheckboxGroup component={mockComponent} />);

    expect(screen.getByText("Test Checkbox Group")).toBeInTheDocument();

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });

  test("renders without label when not provided", () => {
    const componentWithoutLabel = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        label: undefined,
      },
    };

    render(<CheckboxGroup component={componentWithoutLabel} />);
    expect(screen.queryByText("Test Checkbox Group")).not.toBeInTheDocument();

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  test("renders no options when they are not provided", () => {
    const componentWithoutOptions = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        options: undefined,
      },
    };

    render(<CheckboxGroup component={componentWithoutOptions} />);

    expect(screen.getByText("Test Checkbox Group")).toBeInTheDocument();

    const checkboxes = screen.queryAllByRole("checkbox");
    expect(checkboxes).toHaveLength(0);
  });

  test("applies correct CSS classes", () => {
    render(<CheckboxGroup component={mockComponent} />);

    const formGroup = screen.getByText("Test Checkbox Group").closest("div");
    expect(formGroup).toHaveClass("formGroup");

    const checkboxDivs = document.querySelectorAll(".checkbox");
    expect(checkboxDivs.length).toBe(3);
  });

  test("handles empty options array", () => {
    const componentWithEmptyOptions = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        options: [],
      },
    };

    render(<CheckboxGroup component={componentWithEmptyOptions} />);

    expect(screen.getByText("Test Checkbox Group")).toBeInTheDocument();

    const checkboxes = screen.queryAllByRole("checkbox");
    expect(checkboxes).toHaveLength(0);
  });

  test("assigns correct value to each checkbox", () => {
    render(<CheckboxGroup component={mockComponent} />);

    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes[0]).toHaveAttribute("value", "option1");
    expect(checkboxes[1]).toHaveAttribute("value", "option2");
    expect(checkboxes[2]).toHaveAttribute("value", "option3");
  });

  test("assigns correct name to all checkboxes", () => {
    render(<CheckboxGroup component={mockComponent} />);

    const checkboxes = screen.getAllByRole("checkbox");

    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute("name", "test-checkbox-group");
    });
  });

  test("renders single option when showSingleOption is true", () => {
    const singleOptionComponent = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        showSingleOption: true,
        option: "OnlyOption",
        options: [
          // ignored when showSingleOption is true
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
        ],
      },
    };

    render(<CheckboxGroup component={singleOptionComponent} />);

    // Should render only the single option from `option`
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0]).toHaveAttribute("value", "OnlyOption");
    expect(screen.getByText("OnlyOption")).toBeInTheDocument();
  });

  test("renders checkbox with empty string value and label when option is undefined", () => {
    const componentWithUndefinedOption = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        showSingleOption: true,
        option: undefined,
      },
    };

    render(<CheckboxGroup component={componentWithUndefinedOption} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0]).toHaveAttribute("value", "");

    // Validate label is rendered but empty
    const label = checkboxes[0].closest("label");
    expect(label?.textContent?.trim()).toBe("");
  });
});
