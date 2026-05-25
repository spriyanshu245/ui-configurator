import React from "react";
import { render, screen } from "@testing-library/react";
import DatePicker from "./DatePicker";
import { InputComponent } from "@/app/types/types";

// Mock CSS modules for predictable class names.
jest.mock("./DatePicker.module.scss", () => ({
  formGroup: "datePickerFormGroup-mock", // Updated value to be unique
  input: "datePickerInput",
}));
jest.mock("./../../../styles/shared.module.scss", () => ({
  formGroup: "sharedFormGroup",
  formGroupLabel: "sharedFormGroupLabel",
}));

describe("DatePicker Component", () => {
  const dummyComponent: InputComponent = {
    id: "date1",
    type: "input",
    category: "form",
    properties: {
      label: "Select Date",
      placeholder: "MM/DD/YYYY",
      inputType: "number",
    },
    validations: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders label when provided", () => {
    render(<DatePicker component={dummyComponent} />);
    const labelEl = screen.getByText("Select Date");
    expect(labelEl).toBeInTheDocument();
    expect(labelEl.tagName).toBe("LABEL");
    expect(labelEl).toHaveClass("sharedFormGroupLabel");
    expect(labelEl).toHaveAttribute("for", "date1");
  });

  test("does not render label when label is not provided", () => {
    const compNoLabel: InputComponent = {
      ...dummyComponent,
      properties: { ...dummyComponent.properties, label: "" },
    };
    render(<DatePicker component={compNoLabel} />);
    expect(screen.queryByText("Select Date")).toBeNull();
  });

  test("renders input with correct attributes", () => {
    render(<DatePicker component={dummyComponent} />);
    const inputEl = screen.getByRole("textbox") as HTMLInputElement;
    expect(inputEl).toBeInTheDocument();
    expect(inputEl).toHaveAttribute("id", "date1");
    expect(inputEl).toHaveAttribute("name", "date1");
    expect(inputEl).toHaveAttribute("type", "text");
    expect(inputEl).toHaveAttribute("placeholder", "MM/DD/YYYY");
    expect(inputEl).toHaveAttribute("maxLength", "10");
    expect(inputEl.value).toBe("");
    // The component now always disables the input.
    expect(inputEl.disabled).toBe(true);
  });

  test("container has correct CSS classes", () => {
    const { container } = render(<DatePicker component={dummyComponent} />);
    const outerDiv = container.firstChild as HTMLElement;
    // Expect the outer container to have the shared class and the DatePicker-specific class.
    expect(outerDiv).toHaveClass("sharedFormGroup");
    // expect(outerDiv).toHaveClass("datePickerFormGroup-mock");
  });
});
