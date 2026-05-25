import { renderHook, act } from "@testing-library/react";
import { useTemplateState } from "./useTemplateState";
import {
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_DATA_MODEL_JSON,
} from "@/app/template-designer/constants";

describe("useTemplateState", () => {
  test("initializes with default values when no props provided", () => {
    const { result } = renderHook(() => useTemplateState());

    expect(result.current.content).toBe("");
    expect(result.current.name).toBe("");
    expect(result.current.mimeType).toBe("application/json");
    expect(result.current.category).toBe("");
    expect(result.current.templateGlobalStyles).toEqual(DEFAULT_GLOBAL_STYLES);
    expect(result.current.modelJson).toBe(DEFAULT_DATA_MODEL_JSON);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isMarkdownGuideOpen).toBe(false);
  });

  test("initializes with provided initial values", () => {
    const { result } = renderHook(() =>
      useTemplateState({
        initialContent: "test content",
        initialLoading: true,
        initialError: "test error",
      }),
    );

    expect(result.current.content).toBe("test content");
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe("test error");
  });

  test("setContent updates content state", () => {
    const { result } = renderHook(() => useTemplateState());

    act(() => {
      result.current.setContent("new content");
    });

    expect(result.current.content).toBe("new content");
  });

  test("setName updates name state", () => {
    const { result } = renderHook(() => useTemplateState());

    act(() => {
      result.current.setName("Template Name");
    });

    expect(result.current.name).toBe("Template Name");
  });

  test("setMimeType updates mimeType state", () => {
    const { result } = renderHook(() => useTemplateState());

    act(() => {
      result.current.setMimeType("text/html");
    });

    expect(result.current.mimeType).toBe("text/html");
  });

  test("setCategory updates category state", () => {
    const { result } = renderHook(() => useTemplateState());

    act(() => {
      result.current.setCategory("Document");
    });

    expect(result.current.category).toBe("Document");
  });

  test("setGlobalStyles updates templateGlobalStyles partially", () => {
    const { result } = renderHook(() => useTemplateState());

    act(() => {
      result.current.setGlobalStyles({ htmlTitle: "New Title" });
    });

    expect(result.current.templateGlobalStyles.htmlTitle).toBe("New Title");
    expect(result.current.templateGlobalStyles.fontSize).toBe(
      DEFAULT_GLOBAL_STYLES.fontSize,
    );
  });

  test("setGlobalStyles updates multiple properties at once", () => {
    const { result } = renderHook(() => useTemplateState());

    act(() => {
      result.current.setGlobalStyles({
        htmlTitle: "Updated Title",
        bodyBackgroundColor: "#000000",
        fontSize: "16px",
      });
    });

    expect(result.current.templateGlobalStyles.htmlTitle).toBe("Updated Title");
    expect(result.current.templateGlobalStyles.bodyBackgroundColor).toBe(
      "#000000",
    );
    expect(result.current.templateGlobalStyles.fontSize).toBe("16px");
  });

  test("setTemplateGlobalStyles replaces entire templateGlobalStyles object", () => {
    const { result } = renderHook(() => useTemplateState());

    const newStyles = {
      ...DEFAULT_GLOBAL_STYLES,
      htmlTitle: "Complete Replacement",
    };

    act(() => {
      result.current.setTemplateGlobalStyles(newStyles);
    });

    expect(result.current.templateGlobalStyles).toEqual(newStyles);
  });

  test("setModelJson updates modelJson state", () => {
    const { result } = renderHook(() => useTemplateState());

    const newJson = '{"key": "value"}';

    act(() => {
      result.current.setModelJson(newJson);
    });

    expect(result.current.modelJson).toBe(newJson);
  });

  test("setLoadingState updates loading state without error", () => {
    const { result } = renderHook(() => useTemplateState());

    act(() => {
      result.current.setLoadingState(true);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  test("setLoadingState updates loading state with error", () => {
    const { result } = renderHook(() => useTemplateState());

    act(() => {
      result.current.setLoadingState(true, "loading error");
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe("loading error");
  });

  test("setLoadingState clears loading and error", () => {
    const { result } = renderHook(() =>
      useTemplateState({
        initialLoading: true,
        initialError: "initial error",
      }),
    );

    act(() => {
      result.current.setLoadingState(false, null);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  test("setError updates error state", () => {
    const { result } = renderHook(() => useTemplateState());

    act(() => {
      result.current.setError("standalone error");
    });

    expect(result.current.error).toBe("standalone error");
  });

  test("setError clears error state", () => {
    const { result } = renderHook(() =>
      useTemplateState({
        initialError: "initial error",
      }),
    );

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBe(null);
  });

  test("setIsMarkdownGuideOpen updates isMarkdownGuideOpen state", () => {
    const { result } = renderHook(() => useTemplateState());

    act(() => {
      result.current.setIsMarkdownGuideOpen(true);
    });

    expect(result.current.isMarkdownGuideOpen).toBe(true);

    act(() => {
      result.current.setIsMarkdownGuideOpen(false);
    });

    expect(result.current.isMarkdownGuideOpen).toBe(false);
  });

  test("all state updaters are memoized and stable across renders", () => {
    const { result, rerender } = renderHook(() => useTemplateState());

    const firstRenderSetters = {
      setContent: result.current.setContent,
      setName: result.current.setName,
      setMimeType: result.current.setMimeType,
      setCategory: result.current.setCategory,
      setGlobalStyles: result.current.setGlobalStyles,
      setModelJson: result.current.setModelJson,
      setLoadingState: result.current.setLoadingState,
      setError: result.current.setError,
      setIsMarkdownGuideOpen: result.current.setIsMarkdownGuideOpen,
    };

    rerender();

    expect(result.current.setContent).toBe(firstRenderSetters.setContent);
    expect(result.current.setName).toBe(firstRenderSetters.setName);
    expect(result.current.setMimeType).toBe(firstRenderSetters.setMimeType);
    expect(result.current.setCategory).toBe(firstRenderSetters.setCategory);
    expect(result.current.setGlobalStyles).toBe(
      firstRenderSetters.setGlobalStyles,
    );
    expect(result.current.setModelJson).toBe(firstRenderSetters.setModelJson);
    expect(result.current.setLoadingState).toBe(
      firstRenderSetters.setLoadingState,
    );
    expect(result.current.setError).toBe(firstRenderSetters.setError);
    expect(result.current.setIsMarkdownGuideOpen).toBe(
      firstRenderSetters.setIsMarkdownGuideOpen,
    );
  });
});
