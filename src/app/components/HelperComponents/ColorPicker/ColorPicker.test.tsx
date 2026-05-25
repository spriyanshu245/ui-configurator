import { render, screen, fireEvent } from "@testing-library/react";
import ColorPicker from "./ColorPicker";

describe("ColorPicker", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with initial value", () => {
    render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("#ff0000");
  });

  it("renders with custom id", () => {
    render(
      <ColorPicker id="test-id" value="#ff0000" onChange={mockOnChange} />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "test-id");
  });

  it("renders color swatch button", () => {
    render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
    const swatchButton = screen.getByRole("button", { name: "Choose color" });
    expect(swatchButton).toBeInTheDocument();
    expect(swatchButton).toHaveStyle({ backgroundColor: "#ff0000" });
  });

  it("opens popover when swatch button is clicked", () => {
    const { container } = render(
      <ColorPicker value="#ff0000" onChange={mockOnChange} />
    );
    const swatchButton = screen.getByRole("button", { name: "Choose color" });
    fireEvent.click(swatchButton);
    const colorInput = container.querySelector('input[type="color"]');
    expect(colorInput).toBeInTheDocument();
  });

  it("closes popover when swatch button is clicked again", () => {
    const { container } = render(
      <ColorPicker value="#ff0000" onChange={mockOnChange} />
    );
    const swatchButton = screen.getByRole("button", { name: "Choose color" });
    fireEvent.click(swatchButton);
    fireEvent.click(swatchButton);
    const colorInput = container.querySelector('input[type="color"]');
    expect(colorInput).not.toBeInTheDocument();
  });

  it("calls onChange when valid hex color is entered in text input", () => {
    render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "#00ff00" } });
    expect(mockOnChange).toHaveBeenCalledWith("#00ff00");
  });

  it("does not call onChange for invalid hex color in text input", () => {
    render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "#gg" } });
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("resets input value on blur if invalid", () => {
    render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "#invalid" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("#ff0000");
  });

  it("keeps valid value on blur", () => {
    render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "#00ff00" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("#00ff00");
  });

  it("calls onChange when color is selected from native picker", () => {
    const { container } = render(
      <ColorPicker value="#ff0000" onChange={mockOnChange} />
    );
    const swatchButton = screen.getByRole("button", { name: "Choose color" });
    fireEvent.click(swatchButton);
    const colorInput = container.querySelector(
      'input[type="color"]'
    ) as HTMLInputElement;
    fireEvent.change(colorInput, { target: { value: "#0000ff" } });
    expect(mockOnChange).toHaveBeenCalledWith("#0000ff");
  });

  it("does not open popover when disabled", () => {
    const { container } = render(
      <ColorPicker value="#ff0000" onChange={mockOnChange} disabled />
    );
    const swatchButton = screen.getByRole("button", { name: "Choose color" });
    fireEvent.click(swatchButton);
    const colorInput = container.querySelector('input[type="color"]');
    expect(colorInput).not.toBeInTheDocument();
  });

  it("disables text input when disabled prop is true", () => {
    render(<ColorPicker value="#ff0000" onChange={mockOnChange} disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("disables swatch button when disabled prop is true", () => {
    render(<ColorPicker value="#ff0000" onChange={mockOnChange} disabled />);
    const swatchButton = screen.getByRole("button", { name: "Choose color" });
    expect(swatchButton).toBeDisabled();
  });

  it("updates input value when value prop changes", () => {
    const { rerender } = render(
      <ColorPicker value="#ff0000" onChange={mockOnChange} />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("#ff0000");
    rerender(<ColorPicker value="#00ff00" onChange={mockOnChange} />);
    expect(input).toHaveValue("#00ff00");
  });

  it("closes popover when clicking outside", () => {
    const { container } = render(
      <div>
        <div data-testid="outside">Outside</div>
        <ColorPicker value="#ff0000" onChange={mockOnChange} />
      </div>
    );
    const swatchButton = screen.getByRole("button", { name: "Choose color" });
    fireEvent.click(swatchButton);
    expect(container.querySelector('input[type="color"]')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(
      container.querySelector('input[type="color"]')
    ).not.toBeInTheDocument();
  });

  it("applies white border color for white color value", () => {
    render(<ColorPicker value="#ffffff" onChange={mockOnChange} />);
    const swatchButton = screen.getByRole("button", { name: "Choose color" });
    expect(swatchButton).toHaveStyle({ borderColor: "#ccc" });
  });

  it("applies matching border color for non-white colors", () => {
    render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
    const swatchButton = screen.getByRole("button", { name: "Choose color" });
    expect(swatchButton).toHaveStyle({ borderColor: "#ff0000" });
  });

  it("has correct placeholder text", () => {
    render(<ColorPicker value="" onChange={mockOnChange} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "#000000");
  });

  it("has correct maxLength attribute", () => {
    render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("maxLength", "7");
  });

  it("does not close popover when clicking inside container", () => {
    const { container } = render(
      <ColorPicker value="#ff0000" onChange={mockOnChange} />
    );
    const swatchButton = screen.getByRole("button", { name: "Choose color" });
    fireEvent.click(swatchButton);
    const colorInput = container.querySelector(
      'input[type="color"]'
    ) as HTMLInputElement;
    fireEvent.mouseDown(colorInput);
    expect(container.querySelector('input[type="color"]')).toBeInTheDocument();
  });
});
