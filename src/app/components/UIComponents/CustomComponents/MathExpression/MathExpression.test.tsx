import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MathExpressionInput from "./MathExpression";

// Helper to set the input's selection start.
const setSelectionStart = (input: HTMLInputElement, pos: number) => {
  Object.defineProperty(input, "selectionStart", {
    value: pos,
    configurable: true,
    writable: true,
  });
  input.setSelectionRange(pos, pos);
};

describe("MathExpressionInput Component", () => {
  const updateExpressionMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("handles Backspace to remove variable part", async () => {
    // Provide variables that include the variable "x" (the first part of "x+2").
    render(
      <MathExpressionInput
        variables={["x", "y", "z"]}
        expression="x+2"
        updateExpression={updateExpressionMock}
      />
    );
    // Get the input element.
    const input = screen.getByRole("textbox") as HTMLInputElement;
    // Focus the input and wait for its value to be set.
    input.focus();
    await waitFor(() => {
      expect(input.value).toBe("x+2");
    });
    // Position the cursor within the first part ("x")
    setSelectionStart(input, 1);
    // Fire a click to trigger the onClick handler (which calls updateCursorPosition)
    fireEvent.click(input);
    // Fire a Backspace keydown event.
    fireEvent.keyDown(input, { key: "Backspace" });
    // Since "x" is a variable (and variables includes "x"), the component should remove that part.
    // Therefore, the new expression should become "+2".
    await waitFor(() => {
      expect(updateExpressionMock).toHaveBeenCalledWith("+2");
    });
  });

  test("updateCursorPosition should do nothing when inputRef is null", () => {
    // Force the internal ref to be null by spying on useRef.
    const useRefSpy = jest
      .spyOn(React, "useRef")
      .mockReturnValueOnce({ current: null });
    render(
      <MathExpressionInput
        variables={[]}
        expression="test"
        updateExpression={updateExpressionMock}
      />
    );
    // Try to click the input.
    const input = screen.queryByTestId("expressionInput");
    if (input) {
      fireEvent.click(input);
    }
    // No error should be thrown. Restore the spy.
    useRefSpy.mockRestore();
  });

  test("should update expression when suggestion is clicked", async () => {
    render(
      <MathExpressionInput
        variables={["alpha", "beta"]}
        expression="al"
        updateExpression={updateExpressionMock}
      />
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.focus();
    // Set cursor position (which makes currentChangedValue "al")
    fireEvent.click(input);
    // Wait for suggestions to appear (only "alpha" matches "al")
    await waitFor(() => {
      expect(screen.getByText("alpha")).toBeInTheDocument();
    });
    // Click the suggestion
    fireEvent.click(screen.getByText("alpha"));
    await waitFor(() => {
      expect(updateExpressionMock).toHaveBeenCalledWith("alpha");
    });
  });

  test("should update cursor position on ArrowRight/ArrowLeft without changing expression", async () => {
    render(
      <MathExpressionInput
        variables={[]}
        expression="123"
        updateExpression={updateExpressionMock}
      />
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.focus();
    // Simulate ArrowRight and ArrowLeft key presses.
    fireEvent.keyDown(input, { key: "ArrowRight" });
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    // These key events only update the cursor; updateExpression should not be called.
    expect(updateExpressionMock).not.toHaveBeenCalled();
  });

  test("should not update expression on Backspace if input is empty", async () => {
    render(
      <MathExpressionInput
        variables={[]}
        expression=""
        updateExpression={updateExpressionMock}
      />
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.focus();
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(updateExpressionMock).not.toHaveBeenCalled();
  });

  test("should update highlighted index on ArrowDown and ArrowUp", async () => {
    // Provide variables so that more than one suggestion appears.
    render(
      <MathExpressionInput
        variables={["alpha", "albert", "alpine"]}
        expression="al"
        updateExpression={updateExpressionMock}
      />
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.focus();
    fireEvent.click(input);
    await waitFor(() => {
      // Only suggestions starting with "al" should appear.
      expect(screen.getByText("alpha")).toBeInTheDocument();
    });
    // Initially, highlightedIndex is -1.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    // The first suggestion should now be highlighted.
    const firstSuggestion = screen.getByText("alpha").closest("li");
    expect(firstSuggestion).toHaveClass("selectOptionDark");

    // Now simulate ArrowUp to highlight the last suggestion.
    fireEvent.keyDown(input, { key: "ArrowUp" });
    const lastSuggestion = screen.getByText("alpine").closest("li");
    expect(lastSuggestion).toHaveClass("selectOptionDark");
  });

  test("should trigger suggestion click on Enter key", async () => {
    render(
      <MathExpressionInput
        variables={["alpha", "alphabet"]}
        expression="al"
        updateExpression={updateExpressionMock}
      />
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.focus();
    fireEvent.click(input);
    await waitFor(() => {
      expect(screen.getByText("alpha")).toBeInTheDocument();
    });
    // Highlight the first suggestion.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    // Press Enter to select it.
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(updateExpressionMock).toHaveBeenCalledWith("alpha");
    });
  });

  test("should show error for expression starting with operator", async () => {
    render(
      <MathExpressionInput
        variables={[]}
        expression="+"
        updateExpression={updateExpressionMock}
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText("Invalid expression: Cannot start with operator.")
      ).toBeInTheDocument();
    });
  });

  test("should show error for mismatched parentheses", async () => {
    render(
      <MathExpressionInput
        variables={[]}
        expression="2)"
        updateExpression={updateExpressionMock}
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText("Invalid expression: mismatched parentheses.")
      ).toBeInTheDocument();
    });
  });

  test("should show error for consecutive variables", async () => {
    // Here, a space causes the regex to split the two variables.
    render(
      <MathExpressionInput
        variables={["a", "b"]}
        expression="a b"
        updateExpression={updateExpressionMock}
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText("Invalid expression: consecutive variables.")
      ).toBeInTheDocument();
    });
  });

  test("should show error for unbalanced parentheses", async () => {
    render(
      <MathExpressionInput
        variables={[]}
        expression="((2+3)"
        updateExpression={updateExpressionMock}
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText("Invalid expression: unbalanced parentheses.")
      ).toBeInTheDocument();
    });
  });

  test("should show error for expression ending with an operator", async () => {
    render(
      <MathExpressionInput
        variables={[]}
        expression="2+"
        updateExpression={updateExpressionMock}
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText("Invalid expression: cannot end with an operator.")
      ).toBeInTheDocument();
    });
  });

  test("should render suggestion list items", async () => {
    // Use variables so that two suggestions appear.
    render(
      <MathExpressionInput
        variables={["alpha", "albert", "beta"]}
        expression="al"
        updateExpression={updateExpressionMock}
      />
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.focus();
    fireEvent.click(input);
    await waitFor(() => {
      // Only suggestions starting with "al" should be shown.
      expect(screen.getByText("alpha")).toBeInTheDocument();
      expect(screen.getByText("albert")).toBeInTheDocument();
    });
  });
});
