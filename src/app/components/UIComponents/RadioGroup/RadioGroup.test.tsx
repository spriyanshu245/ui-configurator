import React from "react";
import { render, screen } from "@testing-library/react";
import RadioGroup from "./RadioGroup";
import "@testing-library/jest-dom";

import { RadioGroupComponent } from "@/app/types/types";

describe("RadioGroup Component", () => {
  // Define a base RadioGroupComponent for testing.
  const baseComponent: RadioGroupComponent = {
    id: "radioGroup1",
    name: "testRadioGroup",
    type: "radio-group",
    category: "form",
    properties: {
      label: "Test Radio Group",
      showLabel: true,
      options: [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
      ],
    },
    validations: [
      { type: "required", value: "", message: "This field is required" },
    ],
  };

  test("renders label when showLabel is true", () => {
    render(<RadioGroup component={baseComponent} />);
    // The label should be rendered with the provided text.
    const label = screen.getByText("Test Radio Group");
    expect(label).toBeInTheDocument();
    // The label should be associated with the radio group via htmlFor equal to component.name.
    expect(label).toHaveAttribute("for", "testRadioGroup");
  });

  test("does not render label when showLabel is false", () => {
    const component = {
      ...baseComponent,
      properties: { ...baseComponent.properties, showLabel: false },
    };
    render(<RadioGroup component={component} />);
    expect(screen.queryByText("Test Radio Group")).not.toBeInTheDocument();
  });

  test("renders all radio options correctly", () => {
    render(<RadioGroup component={baseComponent} />);
    // Get all radio input elements.
    const radioInputs = screen.getAllByRole("radio");
    expect(radioInputs).toHaveLength(2);

    // Verify that each radio input has the proper name and value.
    expect(radioInputs[0]).toHaveAttribute("name", "testRadioGroup");
    expect(radioInputs[0]).toHaveAttribute("value", "option1");
    expect(screen.getByText("Option 1")).toBeInTheDocument();

    expect(radioInputs[1]).toHaveAttribute("name", "testRadioGroup");
    expect(radioInputs[1]).toHaveAttribute("value", "option2");
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  test("radio inputs are required when a required validation is provided", () => {
    render(<RadioGroup component={baseComponent} />);
    const radioInputs = screen.getAllByRole("radio");
    radioInputs.forEach((input) => {
      expect(input).toBeRequired();
    });
  });
});
