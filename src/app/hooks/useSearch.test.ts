import { renderHook, act, waitFor } from "@testing-library/react";
import { useSearch } from "./useSearch";

const mockReplace = jest.fn();
let mockPathname = "/mock-path";
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

const createSearchChangeEvent = (value: string) =>
  ({
    currentTarget: { value },
  }) as React.ChangeEvent<HTMLInputElement>;

const createEscapeEvent = (value: string) =>
  ({
    key: "Escape",
    currentTarget: { value },
    preventDefault: jest.fn(),
  }) as unknown as React.KeyboardEvent<HTMLInputElement>;

describe("useSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/mock-path";
    mockSearchParams = new URLSearchParams();
  });

  it("hydrates the search from ?q= and opens it", () => {
    mockSearchParams = new URLSearchParams("q=Alpha");

    const { result } = renderHook(() => useSearch());

    expect(result.current.searchValue).toBe("Alpha");
    expect(result.current.deferredSearchValue).toBe("Alpha");
    expect(result.current.hasSearchTerm).toBe(true);
    expect(result.current.isSearchOpen).toBe(true);
  });

  it("updates the input value immediately when typing", () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.handleSearchChange(createSearchChangeEvent("Alpha"));
    });

    expect(result.current.searchValue).toBe("Alpha");
    expect(result.current.hasSearchTerm).toBe(true);
  });

  it("eventually settles the deferred search value", async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.handleSearchChange(createSearchChangeEvent("Microsite"));
    });

    await waitFor(() => {
      expect(result.current.deferredSearchValue).toBe("Microsite");
      expect(result.current.isPending).toBe(false);
    });
  });

  it("updates the current URL with ?q= when typing", async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.handleSearchChange(createSearchChangeEvent("Microsite"));
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/mock-path?q=Microsite", {
        scroll: false,
      });
    });
  });

  it("removes q while preserving unrelated params when clearing search", async () => {
    mockSearchParams = new URLSearchParams("page=2&q=Beta");
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.clearSearch();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/mock-path?page=2", {
        scroll: false,
      });
    });
  });

  it("restores local state from external search param changes", async () => {
    const { result, rerender } = renderHook(() => useSearch());

    act(() => {
      result.current.handleSearchChange(createSearchChangeEvent("Alpha"));
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/mock-path?q=Alpha", {
        scroll: false,
      });
    });

    mockSearchParams = new URLSearchParams("q=Alpha");
    rerender();

    await waitFor(() => {
      expect(result.current.searchValue).toBe("Alpha");
    });

    mockSearchParams = new URLSearchParams("q=Beta");
    rerender();

    await waitFor(() => {
      expect(result.current.searchValue).toBe("Beta");
      expect(result.current.isSearchOpen).toBe(true);
    });
  });

  it("clears a non-empty search on Escape without closing it", async () => {
    mockSearchParams = new URLSearchParams("q=Gamma");
    const { result } = renderHook(() => useSearch());
    const event = createEscapeEvent("Gamma");

    act(() => {
      result.current.handleSearchKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.isSearchOpen).toBe(true);

    await waitFor(() => {
      expect(result.current.searchValue).toBe("");
      expect(mockReplace).toHaveBeenCalledWith("/mock-path", {
        scroll: false,
      });
    });
  });

  it("closes the search when Escape is pressed on an empty query", () => {
    const { result } = renderHook(() => useSearch());
    const event = createEscapeEvent("");

    act(() => {
      result.current.handleSearchToggle();
    });

    expect(result.current.isSearchOpen).toBe(true);

    act(() => {
      result.current.handleSearchKeyDown(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.isSearchOpen).toBe(false);
    expect(result.current.searchValue).toBe("");
  });

  it("closes the search and clears the value", async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.handleSearchToggle();
      result.current.handleSearchChange(createSearchChangeEvent("Gamma"));
    });

    await waitFor(() => {
      expect(result.current.deferredSearchValue).toBe("Gamma");
    });

    act(() => {
      result.current.closeSearch();
    });

    await waitFor(() => {
      expect(result.current.isSearchOpen).toBe(false);
      expect(result.current.searchValue).toBe("");
      expect(result.current.deferredSearchValue).toBe("");
    });
  });
});
