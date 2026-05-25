import {
  render,
  screen,
  fireEvent,
  waitFor,
  createEvent,
} from "@testing-library/react";
import TextEditor from "./TextEditor";

describe("TextEditor - Happy Flow", () => {
  let mockOnChange: jest.Mock;
  let mockExecCommand: jest.Mock;
  let mockGetSelection: jest.Mock;

  beforeEach(() => {
    mockOnChange = jest.fn();

    mockExecCommand = jest.fn(() => true);
    document.execCommand = mockExecCommand;

    const mockRange = {
      cloneRange: jest.fn().mockReturnThis(),
      deleteContents: jest.fn(),
      insertNode: jest.fn(),
      setStartAfter: jest.fn(),
      setEndAfter: jest.fn(),
      getBoundingClientRect: jest.fn(() => ({
        top: 100,
        left: 50,
        bottom: 120,
        right: 150,
        width: 100,
        height: 20,
      })),
    };

    const mockSelection = {
      rangeCount: 1,
      anchorNode: document.createElement("div"),
      toString: jest.fn(() => "selected text"),
      getRangeAt: jest.fn(() => mockRange),
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    };

    mockGetSelection = jest.fn(() => mockSelection);
    window.getSelection = mockGetSelection;

    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 0,
      left: 0,
      bottom: 500,
      right: 800,
      width: 800,
      height: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle complete editing workflow: maximize, format text, add link, paste content, and minimize", async () => {
    const { container } = render(
      <TextEditor
        id="test-editor"
        value="<p>Initial content</p>"
        onChange={mockOnChange}
      />
    );

    const editor = screen.getByTestId("test-editor");
    const maximizeButton = container.querySelector('button[title="Maximize"]');

    expect(maximizeButton).toBeInTheDocument();
    fireEvent.click(maximizeButton!);

    await waitFor(() => {
      expect(screen.getByTitle("Bold (Ctrl+B)")).toBeInTheDocument();
    });

    fireEvent.focus(editor);
    editor.innerHTML = "<p>Test content for formatting</p>";
    fireEvent.input(editor);

    expect(mockOnChange).toHaveBeenCalled();

    const boldButton = screen.getByTitle("Bold (Ctrl+B)");
    fireEvent.click(boldButton);
    expect(mockExecCommand).toHaveBeenCalledWith("bold", false, undefined);

    const italicButton = screen.getByTitle("Italic (Ctrl+I)");
    fireEvent.click(italicButton);
    expect(mockExecCommand).toHaveBeenCalledWith("italic", false, undefined);

    const underlineButton = screen.getByTitle("Underline (Ctrl+U)");
    fireEvent.click(underlineButton);
    expect(mockExecCommand).toHaveBeenCalledWith("underline", false, undefined);

    const strikethroughButton = screen.getByTitle("Strikethrough");
    fireEvent.click(strikethroughButton);
    expect(mockExecCommand).toHaveBeenCalledWith(
      "strikeThrough",
      false,
      undefined
    );

    const h1Button = screen.getByTitle("Heading 1");
    fireEvent.click(h1Button);
    expect(mockExecCommand).toHaveBeenCalledWith("formatBlock", false, "<h1>");

    const h2Button = screen.getByTitle("Heading 2");
    fireEvent.click(h2Button);
    expect(mockExecCommand).toHaveBeenCalledWith("formatBlock", false, "<h2>");

    const h3Button = screen.getByTitle("Heading 3");
    fireEvent.click(h3Button);
    expect(mockExecCommand).toHaveBeenCalledWith("formatBlock", false, "<h3>");

    const pButton = screen.getByTitle("Paragraph");
    fireEvent.click(pButton);
    expect(mockExecCommand).toHaveBeenCalledWith("formatBlock", false, "<p>");

    const ulButton = screen.getByTitle("Bullet List");
    fireEvent.click(ulButton);
    expect(mockExecCommand).toHaveBeenCalledWith(
      "insertUnorderedList",
      false,
      undefined
    );

    const olButton = screen.getByTitle("Numbered List");
    fireEvent.click(olButton);
    expect(mockExecCommand).toHaveBeenCalledWith(
      "insertOrderedList",
      false,
      undefined
    );

    const hrButton = screen.getByTitle("Horizontal Line");
    fireEvent.click(hrButton);
    expect(mockExecCommand).toHaveBeenCalledWith(
      "insertHorizontalRule",
      false,
      undefined
    );

    fireEvent.mouseUp(editor);
    fireEvent.keyUp(editor, { key: "ArrowRight" });

    const linkButton = screen.getByTitle("Insert Link");
    fireEvent.click(linkButton);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("https://example.com")
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Link text")).toBeInTheDocument();
    });

    const linkUrlInput = screen.getByPlaceholderText(
      "https://example.com"
    ) as HTMLInputElement;
    const linkTextInput = screen.getByPlaceholderText(
      "Link text"
    ) as HTMLInputElement;

    fireEvent.change(linkTextInput, { target: { value: "Test Link" } });
    fireEvent.change(linkUrlInput, {
      target: { value: "https://example.com" },
    });

    expect(linkTextInput.value).toBe("Test Link");
    expect(linkUrlInput.value).toBe("https://example.com");

    fireEvent.keyDown(linkUrlInput, { key: "Enter" });

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("https://example.com")
      ).not.toBeInTheDocument();
    });

    const pasteEventWithHtml = createEvent.paste(editor, {
      clipboardData: {
        getData: jest.fn((type: string) => {
          if (type === "text/html") {
            return '<p style="color: red;">Pasted <span>HTML</span> content</p>';
          }
          return "Pasted text content";
        }),
      },
    });

    fireEvent(editor, pasteEventWithHtml);

    await waitFor(() => {
      expect(mockExecCommand).toHaveBeenCalledWith(
        "insertHTML",
        false,
        expect.any(String)
      );
    });

    const pasteEventPlainText = createEvent.paste(editor, {
      clipboardData: {
        getData: jest.fn((type: string) => {
          if (type === "text/html") return "";
          return "Plain pasted text";
        }),
      },
    });

    fireEvent(editor, pasteEventPlainText);

    await waitFor(() => {
      expect(mockExecCommand).toHaveBeenCalledWith(
        "insertText",
        false,
        "Plain pasted text"
      );
    });

    fireEvent.keyUp(editor, { key: "a" });
    expect(mockOnChange).toHaveBeenCalled();

    const minimizeButton = container.querySelector('button[title="Minimize"]');
    fireEvent.click(minimizeButton!);

    await waitFor(() => {
      expect(screen.queryByTitle("Bold (Ctrl+B)")).not.toBeInTheDocument();
    });

    expect(mockOnChange).toHaveBeenCalled();
    expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
  });
});

describe("TextEditor - Minimum Tests for Maximum Coverage", () => {
  let mockOnChange: jest.Mock;
  let mockExecCommand: jest.Mock;

  beforeEach(() => {
    mockOnChange = jest.fn();
    mockExecCommand = jest.fn(() => true);
    document.execCommand = mockExecCommand;

    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 0,
      left: 0,
      bottom: 500,
      right: 800,
      width: 800,
      height: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render editor with initial value and handle basic interactions", () => {
    const { container } = render(
      <TextEditor
        id="test-editor"
        value="<p>Initial content</p>"
        onChange={mockOnChange}
      />
    );

    const editor = screen.getByTestId("test-editor");
    expect(editor).toBeInTheDocument();
    expect(editor.innerHTML).toContain("Initial content");

    expect(editor).toHaveAttribute("contentEditable", "true");

    const { container: container2 } = render(<TextEditor />);
    expect(
      container2.querySelector('[contenteditable="true"]')
    ).toBeInTheDocument();
  });

  it("should handle maximize/minimize and all formatting commands", async () => {
    const { container } = render(
      <TextEditor id="test-editor" onChange={mockOnChange} />
    );

    const editor = screen.getByTestId("test-editor");
    const maximizeButton = container.querySelector('button[title="Maximize"]');

    fireEvent.click(maximizeButton!);
    await waitFor(() => {
      expect(screen.getByTitle("Bold (Ctrl+B)")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Bold (Ctrl+B)"));
    expect(mockExecCommand).toHaveBeenCalledWith("bold", false, undefined);

    fireEvent.click(screen.getByTitle("Italic (Ctrl+I)"));
    expect(mockExecCommand).toHaveBeenCalledWith("italic", false, undefined);

    fireEvent.click(screen.getByTitle("Underline (Ctrl+U)"));
    expect(mockExecCommand).toHaveBeenCalledWith("underline", false, undefined);

    fireEvent.click(screen.getByTitle("Strikethrough"));
    expect(mockExecCommand).toHaveBeenCalledWith(
      "strikeThrough",
      false,
      undefined
    );

    fireEvent.click(screen.getByTitle("Heading 1"));
    expect(mockExecCommand).toHaveBeenCalledWith("formatBlock", false, "<h1>");

    fireEvent.click(screen.getByTitle("Heading 2"));
    expect(mockExecCommand).toHaveBeenCalledWith("formatBlock", false, "<h2>");

    fireEvent.click(screen.getByTitle("Heading 3"));
    expect(mockExecCommand).toHaveBeenCalledWith("formatBlock", false, "<h3>");

    fireEvent.click(screen.getByTitle("Paragraph"));
    expect(mockExecCommand).toHaveBeenCalledWith("formatBlock", false, "<p>");

    fireEvent.click(screen.getByTitle("Bullet List"));
    expect(mockExecCommand).toHaveBeenCalledWith(
      "insertUnorderedList",
      false,
      undefined
    );

    fireEvent.click(screen.getByTitle("Numbered List"));
    expect(mockExecCommand).toHaveBeenCalledWith(
      "insertOrderedList",
      false,
      undefined
    );

    fireEvent.click(screen.getByTitle("Horizontal Line"));
    expect(mockExecCommand).toHaveBeenCalledWith(
      "insertHorizontalRule",
      false,
      undefined
    );

    const minimizeButton = container.querySelector('button[title="Minimize"]');
    fireEvent.click(minimizeButton!);
    await waitFor(() => {
      expect(screen.queryByTitle("Bold (Ctrl+B)")).not.toBeInTheDocument();
    });
  });

  it("should detect active formats correctly", async () => {
    const createSelectionMock = (anchorNode: Node) => {
      const mockRange = {
        cloneRange: jest.fn().mockReturnThis(),
        getBoundingClientRect: jest.fn(() => ({
          top: 100,
          left: 50,
          bottom: 120,
          right: 150,
        })),
      };

      return {
        rangeCount: 1,
        anchorNode,
        toString: jest.fn(() => "selected text"),
        getRangeAt: jest.fn(() => mockRange),
        removeAllRanges: jest.fn(),
        addRange: jest.fn(),
      };
    };

    const { container } = render(
      <TextEditor id="test-editor" onChange={mockOnChange} />
    );

    const editor = screen.getByTestId("test-editor");
    const maximizeButton = container.querySelector('button[title="Maximize"]');
    fireEvent.click(maximizeButton!);

    await waitFor(() => {
      expect(screen.getByTitle("Bold (Ctrl+B)")).toBeInTheDocument();
    });

    const boldElement = document.createElement("strong");
    boldElement.textContent = "bold text";
    boldElement.style.fontWeight = "700";
    editor.appendChild(boldElement);

    window.getSelection = jest.fn(
      () => createSelectionMock(boldElement) as any
    );
    fireEvent.mouseUp(editor);

    const boldButton = screen.getByTitle("Bold (Ctrl+B)");
    expect(boldButton).toHaveClass("active");

    const italicElement = document.createElement("em");
    italicElement.style.fontStyle = "italic";
    window.getSelection = jest.fn(
      () => createSelectionMock(italicElement) as any
    );
    fireEvent.keyUp(editor, { key: "ArrowRight" });

    const underlineElement = document.createElement("u");
    underlineElement.style.textDecoration = "underline";
    window.getSelection = jest.fn(
      () => createSelectionMock(underlineElement) as any
    );
    fireEvent.mouseUp(editor);

    const strikeElement = document.createElement("s");
    strikeElement.style.textDecoration = "line-through";
    window.getSelection = jest.fn(
      () => createSelectionMock(strikeElement) as any
    );
    fireEvent.mouseUp(editor);

    const h1Element = document.createElement("h1");
    window.getSelection = jest.fn(() => createSelectionMock(h1Element) as any);
    fireEvent.mouseUp(editor);

    window.getSelection = jest.fn(() => ({ rangeCount: 0 } as any));
    fireEvent.mouseUp(editor);
  });

  it("should handle link operations: insert, edit, remove, and edge cases", async () => {
    const createSelectionWithText = (
      text: string,
      linkElement?: HTMLAnchorElement
    ) => {
      const mockRange = {
        cloneRange: jest.fn().mockReturnThis(),
        deleteContents: jest.fn(),
        insertNode: jest.fn(),
        setStartAfter: jest.fn(),
        setEndAfter: jest.fn(),
        getBoundingClientRect: jest.fn(() => ({
          top: 100,
          left: 50,
          bottom: 120,
          right: 150,
        })),
      };

      return {
        rangeCount: 1,
        anchorNode: linkElement || document.createElement("div"),
        toString: jest.fn(() => text),
        getRangeAt: jest.fn(() => mockRange),
        removeAllRanges: jest.fn(),
        addRange: jest.fn(),
      };
    };

    const { container } = render(
      <TextEditor id="test-editor" onChange={mockOnChange} />
    );

    const editor = screen.getByTestId("test-editor");
    const maximizeButton = container.querySelector('button[title="Maximize"]');
    fireEvent.click(maximizeButton!);

    await waitFor(() => {
      expect(screen.getByTitle("Insert Link")).toBeInTheDocument();
    });

    window.getSelection = jest.fn(() => createSelectionWithText("") as any);
    fireEvent.click(screen.getByTitle("Insert Link"));

    await waitFor(() => {
      expect(
        screen.getByText("Please select some text to create a link")
      ).toBeInTheDocument();
    });

    window.getSelection = jest.fn(
      () => createSelectionWithText("test link") as any
    );
    fireEvent.click(screen.getByTitle("Insert Link"));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("https://example.com")
      ).toBeInTheDocument();
    });

    const linkUrlInput = screen.getByPlaceholderText(
      "https://example.com"
    ) as HTMLInputElement;
    const linkTextInput = screen.getByPlaceholderText(
      "Link text"
    ) as HTMLInputElement;

    const addButton = container.querySelector('button[title="Add link"]');
    fireEvent.click(addButton!);
    await waitFor(() => {
      expect(screen.getByText("Please enter a URL")).toBeInTheDocument();
    });

    fireEvent.change(linkUrlInput, {
      target: { value: "https://example.com" },
    });
    fireEvent.change(linkTextInput, { target: { value: "" } });
    fireEvent.click(addButton!);
    await waitFor(() => {
      expect(screen.getByText("Please enter link text")).toBeInTheDocument();
    });

    fireEvent.change(linkTextInput, { target: { value: "Test Link" } });
    fireEvent.keyDown(linkUrlInput, { key: "Enter" });

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("https://example.com")
      ).not.toBeInTheDocument();
    });

    const existingLink = document.createElement("a");
    existingLink.href = "https://old-link.com";
    existingLink.textContent = "Old Link";
    editor.appendChild(existingLink);

    const mouseOverEvent = new MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(mouseOverEvent, "target", {
      value: existingLink,
      enumerable: true,
    });

    window.getSelection = jest.fn(
      () => createSelectionWithText("Old Link", existingLink) as any
    );

    editor.dispatchEvent(mouseOverEvent);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("https://example.com")
      ).toBeInTheDocument();
    });

    const updatedUrlInput = screen.getByPlaceholderText(
      "https://example.com"
    ) as HTMLInputElement;
    fireEvent.change(updatedUrlInput, {
      target: { value: "https://new-link.com" },
    });

    const updateButton = container.querySelector('button[title="Update link"]');
    fireEvent.click(updateButton!);

    expect(existingLink.href).toBe("https://new-link.com/");

    editor.dispatchEvent(mouseOverEvent);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("https://example.com")
      ).toBeInTheDocument();
    });

    const removeButton = container.querySelector('button[title="Remove link"]');
    fireEvent.click(removeButton!);
    expect(mockExecCommand).toHaveBeenCalledWith("unlink", false, undefined);

    window.getSelection = jest.fn(() => createSelectionWithText("test") as any);
    fireEvent.click(screen.getByTitle("Insert Link"));
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("https://example.com")
      ).toBeInTheDocument();
    });

    const escapeLinkInput = screen.getByPlaceholderText("https://example.com");
    fireEvent.keyDown(escapeLinkInput, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("https://example.com")
      ).not.toBeInTheDocument();
    });

    window.getSelection = jest.fn(() => createSelectionWithText("test") as any);
    fireEvent.click(screen.getByTitle("Insert Link"));
    await waitFor(() => {
      const tooltip = container.querySelector('[class*="linkTooltip"]');
      if (tooltip) {
        fireEvent.mouseLeave(tooltip);
      }
    });
  });

  it("should handle paste with HTML sanitization and plain text", async () => {
    const { container } = render(
      <TextEditor id="test-editor" onChange={mockOnChange} />
    );

    const editor = screen.getByTestId("test-editor");
    const maximizeButton = container.querySelector('button[title="Maximize"]');
    fireEvent.click(maximizeButton!);

    const complexHtml = `
      <!-- Comment -->
      <p style="color: red;" class="test">Styled paragraph with <span style="background: yellow;">span</span></p>
      <ul>
        <li><p>Paragraph in list item</p></li>
      </ul>
      <div data-attr="value">Div content</div>
      <a href="https://example.com" style="color: blue;">Link</a>
    `;

    const pasteEventHtml = createEvent.paste(editor, {
      clipboardData: {
        getData: jest.fn((type: string) => {
          if (type === "text/html") return complexHtml;
          return "Fallback text";
        }),
      },
    });

    fireEvent(editor, pasteEventHtml);

    await waitFor(() => {
      expect(mockExecCommand).toHaveBeenCalledWith(
        "insertHTML",
        false,
        expect.any(String)
      );
    });

    const pasteEventText = createEvent.paste(editor, {
      clipboardData: {
        getData: jest.fn((type: string) => {
          if (type === "text/html") return "";
          return "Plain text content";
        }),
      },
    });

    fireEvent(editor, pasteEventText);

    await waitFor(() => {
      expect(mockExecCommand).toHaveBeenCalledWith(
        "insertText",
        false,
        "Plain text content"
      );
    });
  });

  it("should handle content changes, keyboard events, and edge cases", async () => {
    const { container } = render(
      <TextEditor
        id="test-editor"
        value="<p>Initial</p>"
        onChange={mockOnChange}
      />
    );

    const editor = screen.getByTestId("test-editor");

    editor.innerHTML = "<p>New content</p>";
    fireEvent.input(editor);
    expect(mockOnChange).toHaveBeenCalled();

    fireEvent.keyUp(editor, { key: "a" });
    expect(mockOnChange).toHaveBeenCalled();

    const maximizeButton = container.querySelector('button[title="Maximize"]');
    fireEvent.click(maximizeButton!);

    await waitFor(() => {
      expect(screen.getByTitle("Bold (Ctrl+B)")).toBeInTheDocument();
    });

    const escapeEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });
    document.dispatchEvent(escapeEvent);

    await waitFor(() => {
      expect(screen.queryByTitle("Bold (Ctrl+B)")).not.toBeInTheDocument();
    });

    const { rerender } = render(
      <TextEditor
        id="test-editor"
        value="<p>Updated value</p>"
        onChange={mockOnChange}
      />
    );

    expect(editor.innerHTML).toContain("<p>New content</p>");
  });

  it("should toggle heading formats correctly", async () => {
    const mockRange = {
      cloneRange: jest.fn().mockReturnThis(),
      getBoundingClientRect: jest.fn(() => ({
        top: 100,
        left: 50,
        bottom: 120,
        right: 150,
      })),
    };

    const h1Element = document.createElement("h1");
    const mockSelection = {
      rangeCount: 1,
      anchorNode: h1Element,
      toString: jest.fn(() => "heading"),
      getRangeAt: jest.fn(() => mockRange),
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    };

    window.getSelection = jest.fn(() => mockSelection as any);

    const { container } = render(
      <TextEditor id="test-editor" onChange={mockOnChange} />
    );

    const maximizeButton = container.querySelector('button[title="Maximize"]');
    fireEvent.click(maximizeButton!);

    await waitFor(() => {
      expect(screen.getByTitle("Heading 1")).toBeInTheDocument();
    });

    const editor = screen.getByTestId("test-editor");
    editor.appendChild(h1Element);
    fireEvent.mouseUp(editor);

    const h1Button = screen.getByTitle("Heading 1");
    fireEvent.click(h1Button);
    expect(mockExecCommand).toHaveBeenCalledWith("formatBlock", false, "<p>");
  });

  it("should handle Enter and Escape keys in link tooltip inputs", async () => {
    const createSelectionWithText = (text: string) => {
      const mockRange = {
        cloneRange: jest.fn().mockReturnThis(),
        deleteContents: jest.fn(),
        insertNode: jest.fn(),
        setStartAfter: jest.fn(),
        setEndAfter: jest.fn(),
        getBoundingClientRect: jest.fn(() => ({
          top: 100,
          left: 50,
          bottom: 120,
          right: 150,
        })),
      };

      return {
        rangeCount: 1,
        anchorNode: document.createElement("div"),
        toString: jest.fn(() => text),
        getRangeAt: jest.fn(() => mockRange),
        removeAllRanges: jest.fn(),
        addRange: jest.fn(),
      };
    };

    const { container } = render(
      <TextEditor id="test-editor" onChange={mockOnChange} />
    );

    const editor = screen.getByTestId("test-editor");

    // Helper function to maximize editor
    const maximizeEditor = async () => {
      const maximizeButton = screen.queryByTitle("Maximize");
      if (maximizeButton) {
        fireEvent.click(maximizeButton);
        await waitFor(() => {
          expect(screen.getByTitle("Insert Link")).toBeInTheDocument();
        });
      }
    };

    // Initial maximize
    await maximizeEditor();

    // Test 1: Escape key on linkUrlInput
    window.getSelection = jest.fn(
      () => createSelectionWithText("selected text") as any
    );

    fireEvent.click(screen.getByTitle("Insert Link"));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("https://example.com")
      ).toBeInTheDocument();
    });

    const linkUrlInput = screen.getByPlaceholderText(
      "https://example.com"
    ) as HTMLInputElement;

    const escapeEvent = createEvent.keyDown(linkUrlInput, { key: "Escape" });
    fireEvent(linkUrlInput, escapeEvent);

    expect(escapeEvent.defaultPrevented).toBe(true);
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("https://example.com")
      ).not.toBeInTheDocument();
    });

    // Test 2: Enter key on linkUrlInput (successful submission)
    // Re-maximize if needed
    await maximizeEditor();

    window.getSelection = jest.fn(
      () => createSelectionWithText("new text") as any
    );
    fireEvent.click(screen.getByTitle("Insert Link"));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("https://example.com")
      ).toBeInTheDocument();
    });

    const newLinkUrlInput = screen.getByPlaceholderText(
      "https://example.com"
    ) as HTMLInputElement;
    const newLinkTextInput = screen.getByPlaceholderText(
      "Link text"
    ) as HTMLInputElement;

    // Fill both inputs
    fireEvent.change(newLinkUrlInput, {
      target: { value: "https://test.com" },
    });
    fireEvent.change(newLinkTextInput, { target: { value: "Test Link" } });

    const enterEvent = createEvent.keyDown(newLinkUrlInput, { key: "Enter" });
    fireEvent(newLinkUrlInput, enterEvent);

    expect(enterEvent.defaultPrevented).toBe(true);
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("https://example.com")
      ).not.toBeInTheDocument();
    });

    // Test 3: Escape key on linkTextInput
    await maximizeEditor();

    window.getSelection = jest.fn(
      () => createSelectionWithText("another text") as any
    );
    fireEvent.click(screen.getByTitle("Insert Link"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Link text")).toBeInTheDocument();
    });

    const anotherLinkTextInput = screen.getByPlaceholderText(
      "Link text"
    ) as HTMLInputElement;

    const escapeTextEvent = createEvent.keyDown(anotherLinkTextInput, {
      key: "Escape",
    });
    fireEvent(anotherLinkTextInput, escapeTextEvent);

    expect(escapeTextEvent.defaultPrevented).toBe(true);
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Link text")
      ).not.toBeInTheDocument();
    });

    // Test 4: Enter key on linkTextInput (successful submission)
    await maximizeEditor();

    window.getSelection = jest.fn(
      () => createSelectionWithText("final text") as any
    );
    fireEvent.click(screen.getByTitle("Insert Link"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Link text")).toBeInTheDocument();
    });

    const finalLinkUrlInput = screen.getByPlaceholderText(
      "https://example.com"
    ) as HTMLInputElement;
    const finalLinkTextInput = screen.getByPlaceholderText(
      "Link text"
    ) as HTMLInputElement;

    fireEvent.change(finalLinkUrlInput, {
      target: { value: "https://final.com" },
    });
    fireEvent.change(finalLinkTextInput, { target: { value: "Final Link" } });

    const enterTextEvent = createEvent.keyDown(finalLinkTextInput, {
      key: "Enter",
    });
    fireEvent(finalLinkTextInput, enterTextEvent);

    expect(enterTextEvent.defaultPrevented).toBe(true);
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Link text")
      ).not.toBeInTheDocument();
    });
  });
});
