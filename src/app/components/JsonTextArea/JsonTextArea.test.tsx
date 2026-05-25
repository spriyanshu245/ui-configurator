import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JsonTextArea from "./JsonTextArea";

describe("JsonTextArea Component", () => {
  const onChangeMock = jest.fn();
  const onValidJsonMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders initial value in the textarea", () => {
    render(<JsonTextArea value='{"a":1}' onChange={onChangeMock} />);
    const textarea = screen.getByPlaceholderText("{}") as HTMLTextAreaElement;
    const parsedJson = JSON.parse(textarea.value);
    expect(parsedJson).toEqual({ a: 1 });
  });

  test("sanitizes whitespace and calls onChange on text change", () => {
    render(<JsonTextArea value="" onChange={onChangeMock} />);
    const textarea = screen.getByPlaceholderText("{}") as HTMLTextAreaElement;
    // Input text contains non-breaking space (\u00A0) and zero-width space (\u200B)
    const inputText = "foo\u00A0bar\u200B";
    fireEvent.change(textarea, { target: { value: inputText } });
    // Expected sanitized value: "\u00A0" replaced with space and \u200B removed.
    expect(onChangeMock).toHaveBeenCalledWith("foo bar");
    expect(textarea.value).toBe("foo bar");
  });

  test("displays error for invalid JSON and clears error for valid JSON", async () => {
    render(<JsonTextArea value="" onChange={onChangeMock} />);
    const textarea = screen.getByPlaceholderText("{}") as HTMLTextAreaElement;
    // Type invalid JSON.
    fireEvent.change(textarea, { target: { value: "{" } });
    await waitFor(() => {
      expect(screen.getByText("Invalid JSON")).toBeInTheDocument();
    });
    // Now type valid JSON.
    fireEvent.change(textarea, { target: { value: '{"b":2}' } });
    await waitFor(() => {
      expect(screen.queryByText("Invalid JSON")).toBeNull();
    });
  });

  test("handles Tab key insertion", () => {
    render(<JsonTextArea value="test" onChange={onChangeMock} />);
    const textarea = screen.getByPlaceholderText("{}") as HTMLTextAreaElement;
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;
    fireEvent.keyDown(textarea, {
      key: "Tab",
      code: "Tab",
      charCode: 9,
      preventDefault: () => {},
    });
    expect(onChangeMock).toHaveBeenCalled();
    expect(textarea.value).toBe("\ttest");
  });

  test("handles Enter key insertion", () => {
    render(<JsonTextArea value="testarea\t" onChange={onChangeMock} />);
    const textarea = screen.getByPlaceholderText("{}") as HTMLTextAreaElement;
    textarea.selectionStart = 5;
    textarea.selectionEnd = 0;
    textarea.value = "testarea\t";
    fireEvent.keyDown(textarea, {
      key: "Tab",
      code: "Tab",
      charCode: 8,
      shiftKey: true,
      preventDefault: () => {},
    });
    expect(textarea.value).toBe("testarea");
  });

  test("beautifies valid JSON and calls onValidJson", async () => {
    const minifiedJson = '{"a":1,"b":2}';
    render(
      <JsonTextArea
        value={minifiedJson}
        onChange={onChangeMock}
        onValidJson={onValidJsonMock}
      />
    );
    const button = screen.getByRole("button", { name: /Format JSON/i });
    fireEvent.click(button);
    await waitFor(() => {
      const expected = JSON.stringify(JSON.parse(minifiedJson), null, "\t");
      expect(onChangeMock).toHaveBeenCalledWith(expected);
      expect(onValidJsonMock).toHaveBeenCalledWith(JSON.parse(minifiedJson));
      expect(screen.queryByText("Cannot beautify invalid JSON")).toBeNull();
    });
  });

  test("beautify button shows error if JSON is invalid", async () => {
    render(<JsonTextArea value="invalid json" onChange={onChangeMock} />);
    const button = screen.getByRole("button", { name: /Format JSON/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(
        screen.getByText("Cannot beautify invalid JSON")
      ).toBeInTheDocument();
    });
  });

  test("displays error based on validateKeys prop", async () => {
    const validateKeys = (parsed: any) => {
      if (parsed.invalid) return ["invalid"];
    };
    render(
      <JsonTextArea
        value='{"invalid": true}'
        onChange={onChangeMock}
        validateKeys={validateKeys}
      />
    );
    const textarea = screen.getByPlaceholderText("{}");
    fireEvent.change(textarea, { target: { value: '{"invalid":true}' } });
    await waitFor(() => {
      expect(screen.getByText("Invalid keys: invalid")).toBeInTheDocument();
    });
  });

  test("maximizes and minimizes the textarea", () => {
    render(<JsonTextArea value="{}" id="json-area" />);
    const container = screen.getByTestId("json-area").closest("div");
    expect(container).not.toHaveClass("expanded");

    // Test maximizing
    const maximizeButton = screen.getByTitle("Maximize");
    fireEvent.click(maximizeButton);
    expect(container).toHaveClass("expanded");

    // Test minimizing
    const minimizeButton = screen.getByTitle("Minimize");
    fireEvent.click(minimizeButton);
    expect(container).not.toHaveClass("expanded");
  });

  test("minimizes textarea with Escape key", () => {
    render(<JsonTextArea value="{}" id="json-area" />);
    const container = screen.getByTestId("json-area").closest("div");

    // First maximize
    const maximizeButton = screen.getByTitle("Maximize");
    fireEvent.click(maximizeButton);
    expect(container).toHaveClass("expanded");

    // Then press Escape
    fireEvent.keyDown(document, { key: "Escape" });
    expect(container).not.toHaveClass("expanded");
  });

  test("minimizes textarea on document event", () => {
    render(<JsonTextArea value="{}" id="json-area" />);
    const container = screen.getByTestId("json-area").closest("div");

    // First maximize
    const maximizeButton = screen.getByTitle("Maximize");
    fireEvent.click(maximizeButton);
    expect(container).toHaveClass("expanded");

    // Then dispatch minimizeTextArea event
    document.dispatchEvent(new Event("minimizeTextArea"));
    expect(container).not.toHaveClass("expanded");
  });

  test("formats JSON on initial render", () => {
    const onChangeMock = jest.fn();
    const onValidJsonMock = jest.fn();

    render(
      <JsonTextArea
        value='{"test":1}'
        onChange={onChangeMock}
        onValidJson={onValidJsonMock}
      />
    );

    expect(onChangeMock).toHaveBeenCalledWith(expect.stringContaining("test"));
    expect(onValidJsonMock).toHaveBeenCalledWith({ test: 1 });
  });
});
