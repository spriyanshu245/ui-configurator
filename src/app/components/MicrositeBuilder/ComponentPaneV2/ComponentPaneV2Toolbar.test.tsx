import React, { createRef } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ComponentPaneV2Toolbar from "./ComponentPaneV2Toolbar";

jest.mock("@/app/components/SVGIcons/Search", () => ({
  __esModule: true,
  default: () => <svg data-testid="search-icon" />,
}));

jest.mock("@/app/components/SVGIcons/GridView", () => ({
  __esModule: true,
  default: () => <svg data-testid="grid-view-icon" />,
}));

jest.mock("@/app/components/SVGIcons/ListView", () => ({
  __esModule: true,
  default: () => <svg data-testid="list-view-icon" />,
}));

jest.mock("@/app/components/SVGIcons/ExpandAll", () => ({
  __esModule: true,
  default: () => <svg data-testid="expand-all-icon" />,
}));

jest.mock("@/app/components/SVGIcons/CollapseAll", () => ({
  __esModule: true,
  default: () => <svg data-testid="collapse-all-icon" />,
}));

jest.mock("./ComponentPaneV2.module.scss", () => ({}));

const defaultProps = {
  searchValue: "",
  viewMode: "list" as const,
  areAllCategoriesExpanded: false,
  searchInputRef: createRef<HTMLInputElement | null>(),
  onSearchChange: jest.fn(),
  onViewModeChange: jest.fn(),
  onExpandAll: jest.fn(),
  onCollapseAll: jest.fn(),
};

describe("ComponentPaneV2Toolbar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders search input with default shortcut hint", () => {
    render(<ComponentPaneV2Toolbar {...defaultProps} />);
    expect(screen.getByLabelText("Search components here")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search here/)).toBeInTheDocument();
  });

  it("renders grid view and list view buttons", () => {
    render(<ComponentPaneV2Toolbar {...defaultProps} />);
    expect(screen.getByLabelText("Switch to grid view")).toBeInTheDocument();
    expect(screen.getByLabelText("Switch to list view")).toBeInTheDocument();
  });

  it("calls onSearchChange when search input changes", () => {
    const onSearchChange = jest.fn();
    render(
      <ComponentPaneV2Toolbar
        {...defaultProps}
        onSearchChange={onSearchChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Search components here"), {
      target: { value: "test" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("test");
  });

  it("calls onViewModeChange with grid when grid button is clicked", () => {
    const onViewModeChange = jest.fn();
    render(
      <ComponentPaneV2Toolbar
        {...defaultProps}
        onViewModeChange={onViewModeChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Switch to grid view"));
    expect(onViewModeChange).toHaveBeenCalledWith("grid");
  });

  it("calls onViewModeChange with list when list button is clicked", () => {
    const onViewModeChange = jest.fn();
    render(
      <ComponentPaneV2Toolbar
        {...defaultProps}
        viewMode="grid"
        onViewModeChange={onViewModeChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Switch to list view"));
    expect(onViewModeChange).toHaveBeenCalledWith("list");
  });

  it("shows expand all button when areAllCategoriesExpanded is false", () => {
    render(
      <ComponentPaneV2Toolbar
        {...defaultProps}
        areAllCategoriesExpanded={false}
      />,
    );
    expect(screen.getByLabelText("Expand all categories")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Collapse all categories"),
    ).not.toBeInTheDocument();
  });

  it("calls onExpandAll when expand all button is clicked", () => {
    const onExpandAll = jest.fn();
    render(
      <ComponentPaneV2Toolbar
        {...defaultProps}
        areAllCategoriesExpanded={false}
        onExpandAll={onExpandAll}
      />,
    );
    fireEvent.click(screen.getByLabelText("Expand all categories"));
    expect(onExpandAll).toHaveBeenCalled();
  });

  it("shows collapse all button when areAllCategoriesExpanded is true", () => {
    render(
      <ComponentPaneV2Toolbar
        {...defaultProps}
        areAllCategoriesExpanded={true}
      />,
    );
    expect(
      screen.getByLabelText("Collapse all categories"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Expand all categories"),
    ).not.toBeInTheDocument();
  });

  it("calls onCollapseAll when collapse all button is clicked", () => {
    const onCollapseAll = jest.fn();
    render(
      <ComponentPaneV2Toolbar
        {...defaultProps}
        areAllCategoriesExpanded={true}
        onCollapseAll={onCollapseAll}
      />,
    );
    fireEvent.click(screen.getByLabelText("Collapse all categories"));
    expect(onCollapseAll).toHaveBeenCalled();
  });

  it("shows Mac shortcut hint when navigator userAgent is Mac", async () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      configurable: true,
    });

    await act(async () => {
      render(<ComponentPaneV2Toolbar {...defaultProps} />);
    });

    expect(screen.getByPlaceholderText(/⌘E/)).toBeInTheDocument();

    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it("shows default shortcut hint when navigator userAgent is not Mac", async () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0",
      configurable: true,
    });

    await act(async () => {
      render(<ComponentPaneV2Toolbar {...defaultProps} />);
    });

    expect(screen.getByPlaceholderText(/Ctrl\+E/)).toBeInTheDocument();

    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it("returns DEFAULT_SHORTCUT_HINT when navigator is undefined", () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      configurable: true,
    });

    render(<ComponentPaneV2Toolbar {...defaultProps} />);

    const input = screen.getByLabelText("Search components here");
    expect(input.getAttribute("placeholder")).toContain("Ctrl+E");

    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
  });

  describe("keyboard shortcut handling", () => {
    it("focuses and selects the search input on Ctrl+E", () => {
      const ref = createRef<HTMLInputElement | null>();
      render(<ComponentPaneV2Toolbar {...defaultProps} searchInputRef={ref} />);

      const input = screen.getByLabelText("Search components here");
      const focusSpy = jest.spyOn(input, "focus");
      const selectSpy = jest.spyOn(input, "select");

      act(() => {
        fireEvent.keyDown(document, { key: "e", ctrlKey: true });
      });

      expect(focusSpy).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalled();
    });

    it("focuses and selects the search input on Meta+E (Mac)", () => {
      const ref = createRef<HTMLInputElement | null>();
      render(<ComponentPaneV2Toolbar {...defaultProps} searchInputRef={ref} />);

      const input = screen.getByLabelText("Search components here");
      const focusSpy = jest.spyOn(input, "focus");
      const selectSpy = jest.spyOn(input, "select");

      act(() => {
        fireEvent.keyDown(document, { key: "e", metaKey: true });
      });

      expect(focusSpy).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalled();
    });

    it("does not focus when key pressed is not e", () => {
      const ref = createRef<HTMLInputElement | null>();
      render(<ComponentPaneV2Toolbar {...defaultProps} searchInputRef={ref} />);

      const input = screen.getByLabelText("Search components here");
      const focusSpy = jest.spyOn(input, "focus");

      act(() => {
        fireEvent.keyDown(document, { key: "k", ctrlKey: true });
      });

      expect(focusSpy).not.toHaveBeenCalled();
    });

    it("does not focus when Ctrl+E is pressed with Alt modifier", () => {
      const ref = createRef<HTMLInputElement | null>();
      render(<ComponentPaneV2Toolbar {...defaultProps} searchInputRef={ref} />);

      const input = screen.getByLabelText("Search components here");
      const focusSpy = jest.spyOn(input, "focus");

      act(() => {
        fireEvent.keyDown(document, { key: "e", ctrlKey: true, altKey: true });
      });

      expect(focusSpy).not.toHaveBeenCalled();
    });

    it("does not focus when Ctrl+E is pressed with Shift modifier", () => {
      const ref = createRef<HTMLInputElement | null>();
      render(<ComponentPaneV2Toolbar {...defaultProps} searchInputRef={ref} />);

      const input = screen.getByLabelText("Search components here");
      const focusSpy = jest.spyOn(input, "focus");

      act(() => {
        fireEvent.keyDown(document, {
          key: "e",
          ctrlKey: true,
          shiftKey: true,
        });
      });

      expect(focusSpy).not.toHaveBeenCalled();
    });

    it("does not focus when event.defaultPrevented is true", () => {
      const ref = createRef<HTMLInputElement | null>();
      render(<ComponentPaneV2Toolbar {...defaultProps} searchInputRef={ref} />);

      const input = screen.getByLabelText("Search components here");
      const focusSpy = jest.spyOn(input, "focus");

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "e",
          ctrlKey: true,
          cancelable: true,
        });
        event.preventDefault();
        document.dispatchEvent(event);
      });

      expect(focusSpy).not.toHaveBeenCalled();
    });

    it("removes event listener on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        "removeEventListener",
      );
      const { unmount } = render(<ComponentPaneV2Toolbar {...defaultProps} />);
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
    });
  });
});
