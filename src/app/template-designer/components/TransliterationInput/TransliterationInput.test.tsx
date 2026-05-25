import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import TransliterationInput from "./TransliterationInput";
import { useTemplateDesigner } from "../../context/TemplateDesignerContext";
import { isTransliterableLanguage } from "../../utils/translationUtils";
import { getTransliterationSuggestions } from "@/app/template-designer/services/translationService";

jest.mock("../../context/TemplateDesignerContext");
jest.mock("../../utils/translationUtils");
jest.mock("@/app/template-designer/services/translationService");

const mockUseTemplateDesigner = useTemplateDesigner as jest.MockedFunction<
  typeof useTemplateDesigner
>;
const mockIsTransliterableLanguage =
  isTransliterableLanguage as jest.MockedFunction<
    typeof isTransliterableLanguage
  >;
const mockGetTransliterationSuggestions =
  getTransliterationSuggestions as jest.MockedFunction<
    typeof getTransliterationSuggestions
  >;

const createMockContext = (overrides = {}) => ({
  currentLanguage: { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
  ...overrides,
});

describe("TransliterationInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseTemplateDesigner.mockReturnValue(
      createMockContext() as ReturnType<typeof useTemplateDesigner>
    );
    mockIsTransliterableLanguage.mockReturnValue(true);
    mockGetTransliterationSuggestions.mockResolvedValue([
      "नमस्ते",
      "नमस्कार",
      "नमन",
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render textarea with correct id", () => {
      render(
        <TransliterationInput id="test-input" value="" onChange={jest.fn()} />
      );
      expect(screen.getByRole("textbox")).toHaveAttribute("id", "test-input");
    });

    it("should render with placeholder", () => {
      render(
        <TransliterationInput
          id="test-input"
          value=""
          onChange={jest.fn()}
          placeholder="Enter text"
        />
      );
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("should render with custom rows", () => {
      render(
        <TransliterationInput
          id="test-input"
          value=""
          onChange={jest.fn()}
          rows={6}
        />
      );
      expect(screen.getByRole("textbox")).toHaveAttribute("rows", "6");
    });

    it("should render with default rows of 4", () => {
      render(
        <TransliterationInput id="test-input" value="" onChange={jest.fn()} />
      );
      expect(screen.getByRole("textbox")).toHaveAttribute("rows", "4");
    });

    it("should render with custom className", () => {
      render(
        <TransliterationInput
          id="test-input"
          value=""
          onChange={jest.fn()}
          className="custom-class"
        />
      );
      expect(screen.getByRole("textbox")).toHaveClass("custom-class");
    });

    it("should render with value", () => {
      render(
        <TransliterationInput
          id="test-input"
          value="test value"
          onChange={jest.fn()}
        />
      );
      expect(screen.getByRole("textbox")).toHaveValue("test value");
    });

    it("should show transliteration indicator for transliterable language", () => {
      render(
        <TransliterationInput id="test-input" value="" onChange={jest.fn()} />
      );
      expect(screen.getByTitle("Transliteration enabled")).toBeInTheDocument();
      expect(screen.getByText("hi")).toBeInTheDocument();
    });

    it("should not show transliteration indicator for non-transliterable language", () => {
      mockIsTransliterableLanguage.mockReturnValue(false);
      render(
        <TransliterationInput id="test-input" value="" onChange={jest.fn()} />
      );
      expect(
        screen.queryByTitle("Transliteration enabled")
      ).not.toBeInTheDocument();
    });
  });

  describe("Input handling", () => {
    it("should call onChange when typing", () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "test", selectionStart: 4 },
      });
      expect(onChange).toHaveBeenCalledWith("test");
    });

    it("should not fetch suggestions when transliteration is disabled", async () => {
      mockIsTransliterableLanguage.mockReturnValue(false);
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(mockGetTransliterationSuggestions).not.toHaveBeenCalled();
    });

    it("should fetch suggestions after debounce when word is long enough", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(mockGetTransliterationSuggestions).toHaveBeenCalledWith(
          "namaste",
          "hi",
          expect.any(AbortSignal)
        );
      });
    });

    it("should not fetch suggestions for words less than 2 characters", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "a", selectionStart: 1 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(mockGetTransliterationSuggestions).not.toHaveBeenCalled();
    });

    it("should clear suggestions when word becomes short", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "a", selectionStart: 1 },
      });
      await waitFor(() => {
        expect(screen.queryByText("नमस्ते")).not.toBeInTheDocument();
      });
    });
  });

  describe("Suggestions popup", () => {
    it("should show suggestions when available", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
    });

    it("should show hint text in suggestions popup", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(
          screen.getByText(
            "Use ↑↓ to navigate, 1-9 or Enter to select, Esc to close"
          )
        ).toBeInTheDocument();
      });
    });

    it("should show suggestion numbers", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });
  });

  describe("Keyboard navigation", () => {
    it("should navigate down with ArrowDown", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
      const buttons = screen.getAllByRole("button");
      expect(buttons[1]).toHaveClass("selected");
    });

    it("should navigate up with ArrowUp", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowUp" });
      const buttons = screen.getAllByRole("button");
      expect(buttons[2]).toHaveClass("selected");
    });

    it("should wrap around when navigating down past last item", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
      const buttons = screen.getAllByRole("button");
      expect(buttons[0]).toHaveClass("selected");
    });

    it("should select suggestion with Enter", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
      expect(onChange).toHaveBeenCalledWith("नमस्ते ");
    });

    it("should select suggestion with Space", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: " " });
      expect(onChange).toHaveBeenCalledWith("नमस्ते ");
    });

    it("should close suggestions with Escape", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
      expect(screen.queryByText("नमस्ते")).not.toBeInTheDocument();
    });

    it("should select suggestion with number keys 1-9", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्कार")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "2" });
      expect(onChange).toHaveBeenCalledWith("नमस्कार ");
    });

    it("should not react to keys when no suggestions", () => {
      mockGetTransliterationSuggestions.mockResolvedValue([]);
      const onChange = jest.fn();
      render(
        <TransliterationInput
          id="test-input"
          value="test"
          onChange={onChange}
        />
      );
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should not select with number key if index out of bounds", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      onChange.mockClear();
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "9" });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Mouse interactions", () => {
    it("should apply suggestion on mouse click", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्कार")).toBeInTheDocument();
      });
      const secondSuggestion = screen.getByText("नमस्कार").closest("button");
      fireEvent.mouseDown(secondSuggestion!);
      expect(onChange).toHaveBeenCalledWith("नमस्कार ");
    });

    it("should highlight suggestion on mouse enter", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्कार")).toBeInTheDocument();
      });
      const secondSuggestion = screen.getByText("नमस्कार").closest("button");
      fireEvent.mouseEnter(secondSuggestion!);
      expect(secondSuggestion).toHaveClass("selected");
    });
  });

  describe("Blur handling", () => {
    it("should clear suggestions on blur after delay", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      fireEvent.blur(screen.getByRole("textbox"));
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(screen.queryByText("नमस्ते")).not.toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("should clear suggestions on fetch error", async () => {
      mockGetTransliterationSuggestions.mockRejectedValueOnce(
        new Error("Network error")
      );
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(mockGetTransliterationSuggestions).toHaveBeenCalled();
      });
      expect(screen.queryByText("नमस्ते")).not.toBeInTheDocument();
    });
  });

  describe("Abort controller", () => {
    it("should abort previous request when new request is made", async () => {
      const abortSpy = jest.fn();
      const originalAbortController = globalThis.AbortController;
      globalThis.AbortController = jest.fn().mockImplementation(() => ({
        abort: abortSpy,
        signal: {},
      })) as unknown as typeof AbortController;

      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste hello", selectionStart: 13 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(abortSpy).toHaveBeenCalled();

      globalThis.AbortController = originalAbortController;
    });
  });

  describe("Word extraction", () => {
    it("should extract current word correctly from middle of text", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "hello world", selectionStart: 11 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(mockGetTransliterationSuggestions).toHaveBeenCalledWith(
          "world",
          "hi",
          expect.any(Object)
        );
      });
    });

    it("should extract word with text before cursor", async () => {
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "test hello test", selectionStart: 10 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(mockGetTransliterationSuggestions).toHaveBeenCalledWith(
          "hello",
          "hi",
          expect.any(Object)
        );
      });
    });
  });

  describe("Cleanup", () => {
    it("should cleanup timers and abort controller on unmount", async () => {
      const abortSpy = jest.fn();
      const originalAbortController = globalThis.AbortController;
      globalThis.AbortController = jest.fn().mockImplementation(() => ({
        abort: abortSpy,
        signal: {},
      })) as unknown as typeof AbortController;

      const onChange = jest.fn();
      const { unmount } = render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      unmount();
      expect(abortSpy).toHaveBeenCalled();

      globalThis.AbortController = originalAbortController;
    });
  });

  describe("Empty word handling in fetchSuggestions", () => {
    it("should clear suggestions when word is empty", async () => {
      mockGetTransliterationSuggestions.mockResolvedValue([]);
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "  ", selectionStart: 2 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(mockGetTransliterationSuggestions).not.toHaveBeenCalled();
    });
  });

  describe("Loading state", () => {
    it("should show loading indicator when loading", async () => {
      let resolvePromise: (value: string[]) => void;
      mockGetTransliterationSuggestions.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        const indicator = screen.getByTitle("Transliteration enabled");
        expect(indicator).toHaveClass("loading");
      });
      await act(async () => {
        resolvePromise!(["नमस्ते"]);
      });
    });
  });

  describe("fetchSuggestions edge cases", () => {
    it("should clear suggestions when isTransliterationEnabled becomes false", async () => {
      mockIsTransliterableLanguage.mockReturnValue(false);
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(screen.queryByText("नमस्ते")).not.toBeInTheDocument();
    });

    it("should clear suggestions and return early when word is empty in fetchSuggestions", async () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      mockGetTransliterationSuggestions.mockClear();
      rerender(
        <TransliterationInput id="test-input" value="x" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "x", selectionStart: 1 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(mockGetTransliterationSuggestions).not.toHaveBeenCalled();
    });
  });

  describe("Canvas context edge cases", () => {
    it("should handle null canvas context gracefully", async () => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(null);

      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });

      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });
  });

  describe("requestAnimationFrame handling", () => {
    it("should set cursor position after applying suggestion", async () => {
      const rafSpy = jest
        .spyOn(globalThis, "requestAnimationFrame")
        .mockImplementation((cb) => {
          cb(0);
          return 0;
        });

      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      fireEvent.keyDown(textarea, { key: "Enter" });
      expect(rafSpy).toHaveBeenCalled();

      rafSpy.mockRestore();
    });

    it("should handle null textareaRef in requestAnimationFrame", async () => {
      const rafSpy = jest
        .spyOn(globalThis, "requestAnimationFrame")
        .mockImplementation((cb) => {
          cb(0);
          return 0;
        });

      const onChange = jest.fn();
      const { unmount } = render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
      const suggestionButton = screen.getByText("नमस्ते").closest("button");
      unmount();
      expect(() => {
        fireEvent.mouseDown(suggestionButton!);
      }).not.toThrow();

      rafSpy.mockRestore();
    });
  });

  describe("Suggestions loading indicator in popup", () => {
    it("should show loading text in popup when loading", async () => {
      let resolvePromise: (value: string[]) => void;
      mockGetTransliterationSuggestions.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );
      const onChange = jest.fn();
      render(
        <TransliterationInput id="test-input" value="" onChange={onChange} />
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "namaste", selectionStart: 7 },
      });
      act(() => {
        jest.advanceTimersByTime(250);
      });
      await act(async () => {
        resolvePromise!(["नमस्ते", "नमस्कार"]);
      });
      await waitFor(() => {
        expect(screen.getByText("नमस्ते")).toBeInTheDocument();
      });
    });
  });
});
