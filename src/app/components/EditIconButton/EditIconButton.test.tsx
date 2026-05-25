import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EditIconButton from "./EditIconButton";

describe("EditIconButton", () => {
  const mockOnClick = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders with default props", () => {
    render(<EditIconButton onClick={mockOnClick} />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("title", "Edit");
    expect(button).toHaveAttribute("name", "Edit-icon");

    const svg = button.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24px");
    expect(svg).toHaveAttribute("height", "24px");
    expect(svg).toHaveAttribute("fill", "black");
  });

  test("calls onClick when button is clicked", () => {
    render(<EditIconButton onClick={mockOnClick} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test("renders with custom props", () => {
    render(
      <EditIconButton
        onClick={mockOnClick}
        title="Custom Title"
        name="custom-name"
        className="extra-class"
        size="32px"
        color="red"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "Custom Title");
    expect(button).toHaveAttribute("name", "custom-name");
    expect(button.className).toMatch(/extra-class/);

    const svg = button.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32px");
    expect(svg).toHaveAttribute("height", "32px");
    expect(svg).toHaveAttribute("fill", "red");
  });
});
