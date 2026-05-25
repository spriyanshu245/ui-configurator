import React from "react";
import { render, screen } from "@testing-library/react";
import Input from "./Input";
import "@testing-library/jest-dom";

// Mock next/image to simply render an <img> element with the same props.
jest.mock("next/image", () => (props: any) => {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} />;
});

// Sample base component for testing.
const baseComponent: InputComponent = {
  id: "input1",
  type: "input",
  category: "form",
  properties: {
    label: "Test Label",
    showLabel: true,
    inputType: "text",
    placeholder: "Enter text",
    defaultValue: "default value",
    iconUrl: "https://example.com/icon.png",
    iconSize: 24,
    iconPosition: "left", // default position for icon tests
    iconSpacing: 10,
    disabled: false,
  },
  validations: [
    { type: "required", value: "", message: "Field is required" },
    { type: "pattern", value: "^[A-Za-z]+$", message: "Only letters allowed" },
    { type: "min", value: "5", message: "Minimum value 5" },
    { type: "max", value: "10", message: "Maximum value 10" },
  ],
};

import { InputComponent } from "../../../types/types";

describe("Input Component", () => {
  test("renders label when showLabel is true", () => {
    render(<Input component={baseComponent} />);
    // Expect a label with text "Test Label" to be rendered.
    expect(screen.getByText("Test Label")).toBeInTheDocument();
    // Check if the input with correct ID exists
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "input1");
  });

  test("does not render label when showLabel is false", () => {
    const component = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        showLabel: false,
      },
    };
    render(<Input component={component} />);
    expect(screen.queryByText("Test Label")).not.toBeInTheDocument();
  });

  test("renders left icon when iconPosition is left and iconUrl is valid", () => {
    const component = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        iconPosition: "left",
      },
    };
    render(<Input component={component} />);
    // The mocked next/image renders an <img> with alt "Img".
    const img = screen.getByRole("img", { name: /Img/i });
    expect(img).toBeInTheDocument();
    // The parent container should have a right margin equal to iconSpacing.
    expect(img.parentElement).toHaveStyle("margin-right: 10px");
  });

  test("renders right icon when iconPosition is right and iconUrl is valid", () => {
    const component = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        iconPosition: "right",
      },
    };
    render(<Input component={component} />);
    const img = screen.getByRole("img", { name: /Img/i });
    expect(img).toBeInTheDocument();
    // When rendered on the right, the container should have a left margin.
    expect(img.parentElement).toHaveStyle("margin-left: 10px");
  });

  test("does not render icon when iconUrl is empty", () => {
    const component = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        iconUrl: "   ", // whitespace-only, considered invalid
      },
    };
    render(<Input component={component} />);
    expect(screen.queryByRole("img", { name: /Img/i })).not.toBeInTheDocument();
  });

  test("renders input with correct attributes", () => {
    render(<Input component={baseComponent} />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("name", "input1");
    expect(input).toHaveAttribute("id", "input1");
  });

  test("uses default icon size when iconSize is not provided for left icon", () => {
    const component = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        iconPosition: "left",
        iconSize: undefined,
      },
    };
    render(<Input component={component} />);
    const img = screen.getByRole("img", { name: /Img/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("width", "30");
    expect(img).toHaveAttribute("height", "30");
  });

  test("uses default icon size when iconSize is not provided for right icon", () => {
    const component = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        iconPosition: "right",
        iconSize: undefined,
      },
    };
    render(<Input component={component} />);
    const img = screen.getByRole("img", { name: /Img/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("width", "30");
    expect(img).toHaveAttribute("height", "30");
  });
});
