import React from "react";
import { render, screen } from "@testing-library/react";
import Select from "./Select";
import { SelectComponent } from "@/app/types/types";

// Mock the usePreview hook to control the preview mode.
const dummyComponent: SelectComponent = {
  id: "test-select",
  type: "select",
  category: "component",
  properties: {
    label: "Test Label",
    showLabel: true,
    defaultValue: "",
    placeholder: "Select an option",
    options: [
      { value: "1", label: "Option One" },
      { value: "2", label: "Option Two" },
      { value: "3", label: "Option Three" },
    ],
  },
  validations: [{ type: "required", value: "true", message: "Required" }],
};

describe("Select Component", () => {
  let container: HTMLElement;
  beforeEach(() => {
    const rendered = render(<Select component={dummyComponent} />);
    container = rendered.container;
  });

  test("renders label when labelVisible is true", () => {
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });
});
