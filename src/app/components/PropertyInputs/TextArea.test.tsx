import { render, screen, fireEvent } from "@testing-library/react";
import TextArea from "./TextArea";
import "@testing-library/jest-dom";

describe("TextArea", () => {
  const mockHandleChange = jest.fn();

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it("renders textarea correctly", () => {
    render(
      <TextArea
        id="test-textarea"
        value="test value"
        placeholder="Enter text here"
        handleChange={mockHandleChange}
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("test value");
    expect(textarea).toHaveAttribute("placeholder", "Enter text here");
  });

  it("renders with default rows", () => {
    render(
      <TextArea
        id="test-textarea"
        value=""
        handleChange={mockHandleChange}
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "5");
  });

  it("renders with custom rows", () => {
    render(
      <TextArea
        id="test-textarea"
        value=""
        handleChange={mockHandleChange}
        rows={10}
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "10");
  });

  it("renders with placeholder when provided", () => {
    render(
      <TextArea
        id="test-textarea"
        value=""
        placeholder="Custom placeholder"
        handleChange={mockHandleChange}
      />
    );

    expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
  });

  it("renders with empty placeholder when not provided (covers ?? operator)", () => {
    render(
      <TextArea
        id="test-textarea"
        value=""
        handleChange={mockHandleChange}
      />
    );

    expect(screen.getByPlaceholderText("")).toBeInTheDocument();
  });

  it("renders with value when provided", () => {
    render(
      <TextArea
        id="test-textarea"
        value="Some text"
        handleChange={mockHandleChange}
      />
    );

    expect(screen.getByDisplayValue("Some text")).toBeInTheDocument();
  });

  it("renders with empty string when value is undefined (covers ?? operator)", () => {
    render(
      <TextArea
        id="test-textarea"
        value={undefined}
        handleChange={mockHandleChange}
      />
    );

    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("renders with empty string when value is null", () => {
    render(
      <TextArea
        id="test-textarea"
        value={null as any}
        handleChange={mockHandleChange}
      />
    );

    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("calls handleChange on input change", () => {
    render(
      <TextArea
        id="test-textarea"
        value=""
        handleChange={mockHandleChange}
      />
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "new text" },
    });

    expect(mockHandleChange).toHaveBeenCalled();
  });

  it("renders with correct id", () => {
    render(
      <TextArea
        id="my-textarea-id"
        value=""
        handleChange={mockHandleChange}
      />
    );

    expect(screen.getByRole("textbox")).toHaveAttribute("id", "my-textarea-id");
  });
});
