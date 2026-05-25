import { render, screen, fireEvent } from "@testing-library/react";
import PropertyInput from "./PropertyInput";
import "@testing-library/jest-dom";

describe("PropertyInput", () => {
  const mockHandleChange = jest.fn();

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it("renders text input correctly", () => {
    render(
      <PropertyInput
        type="text"
        id="test-input"
        value=""
        label="Test Label"
        placeholder="Enter text"
        handleChange={mockHandleChange}
      />
    );

    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders number input correctly", () => {
    render(
      <PropertyInput
        type="number"
        id="test-number"
        value={0}
        label="Number Label"
        placeholder="Enter number"
        handleChange={mockHandleChange}
      />
    );

    expect(screen.getByPlaceholderText("Enter number")).toBeInTheDocument();
  });

  it("renders select dropdown correctly", () => {
    const options = [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
    ];

    render(
      <PropertyInput
        type="select"
        id="test-select"
        value="1"
        label="Select Label"
        handleChange={mockHandleChange}
        options={options}
      />
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders checkbox correctly", () => {
    render(
      <PropertyInput
        type="checkbox"
        id="test-checkbox"
        value={false}
        label="Checkbox Label"
        handleChange={mockHandleChange}
      />
    );

    const checkbox = screen.getByTestId("test-checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("renders textarea correctly", () => {
    render(
      <PropertyInput
        type="textarea"
        id="test-textarea"
        value=""
        label="Textarea Label"
        placeholder="Enter text here"
        handleChange={mockHandleChange}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter text here");
    expect(textarea).toBeInTheDocument();
  });

  it("calls handleChange when text input changes", () => {
    render(
      <PropertyInput
        type="text"
        id="test-input"
        value=""
        label="Test Label"
        handleChange={mockHandleChange}
      />
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "new value" },
    });

    expect(mockHandleChange).toHaveBeenCalled();
  });

  it("calls handleChange when textarea changes", () => {
    render(
      <PropertyInput
        type="textarea"
        id="test-textarea"
        value=""
        label="Textarea Label"
        handleChange={mockHandleChange}
      />
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "textarea content" },
    });

    expect(mockHandleChange).toHaveBeenCalled();
  });

  it("calls handleChange when checkbox is toggled", () => {
    render(
      <PropertyInput
        type="checkbox"
        id="test-checkbox"
        value={false}
        label="Checkbox Label"
        handleChange={mockHandleChange}
      />
    );

    fireEvent.click(screen.getByTestId("test-checkbox"));

    expect(mockHandleChange).toHaveBeenCalled();
  });

  it("renders label correctly for non-checkbox types", () => {
    render(
      <PropertyInput
        type="text"
        id="test-input"
        value=""
        label="My Label"
        handleChange={mockHandleChange}
      />
    );

    expect(screen.getByText("My Label")).toBeInTheDocument();
  });

  it("renders label inside checkbox for checkbox type", () => {
    render(
      <PropertyInput
        type="checkbox"
        id="test-checkbox"
        value={false}
        label="Checkbox Label"
        handleChange={mockHandleChange}
      />
    );

    expect(screen.getByText("Checkbox Label")).toBeInTheDocument();
  });
});
