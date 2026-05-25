import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Input from "./Input";

describe("Input Component", () => {
  test("renders the input component with an icon", () => {
    render(<Input icon={"email"} placeholder="Enter text" />);

    const inputElement = screen.getByPlaceholderText("Enter text");
    expect(inputElement).toBeInTheDocument();

    const iconWrapper = screen.getByTestId("icon-svg");
    expect(iconWrapper).toBeInTheDocument();
  });

  test("accepts and displays user input", () => {
    render(<Input icon={"password"} placeholder="Type here" />);
    const inputElement = screen.getByPlaceholderText(
      "Type here"
    ) as HTMLInputElement;

    fireEvent.change(inputElement, { target: { value: "Hello" } });
    expect(inputElement.value).toBe("Hello");
  });
  test("accepts and displays user input", () => {
    render(<Input placeholder="Type here" />);
    const inputElement = screen.getByPlaceholderText(
      "Type here"
    ) as HTMLInputElement;

    fireEvent.change(inputElement, { target: { value: "Hello" } });
    expect(inputElement.value).toBe("Hello");
  });

  test("applies custom class names", () => {
    const { container } = render(
      <Input icon={"password"} className="custom-class" />
    );
    expect(container.firstChild?.childNodes[1]).toHaveClass("custom-class");
  });
});
