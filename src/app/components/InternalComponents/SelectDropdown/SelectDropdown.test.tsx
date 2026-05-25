import {
  render,
  screen,
  fireEvent,
  act,
  createEvent,
} from "@testing-library/react";
import SelectDropdown, { DropdownOption } from "./SelectDropdown";

const mockOptions: DropdownOption[] = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
];

describe("SelectDropdown", () => {
  let mockOnChange: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnChange = jest.fn();

    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders placeholder if no value selected", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        placeholder="Select one"
      />,
    );
    expect(screen.getByText("Select one")).toBeInTheDocument();
  });

  it("renders selected option label", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value="option2"
        onChange={mockOnChange}
      />,
    );
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("opens and closes dropdown on button click", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("filters options with search input", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "2" } });
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
  });

  it("matches space-separated queries against hyphenated option labels", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={[
          { value: "test-page-new", label: "test-page-new" },
          { value: "other-option", label: "other-option" },
        ]}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByPlaceholderText("Search...");
    const spaceEvent = createEvent.keyDown(input, { key: " " });
    spaceEvent.preventDefault = jest.fn();

    fireEvent(input, spaceEvent);

    fireEvent.change(input, { target: { value: "test page" } });

    expect(spaceEvent.preventDefault).not.toHaveBeenCalled();
    expect(screen.getByText("test-page-new")).toBeInTheDocument();
    expect(screen.queryByText("other-option")).not.toBeInTheDocument();
  });

  it("shows 'No options found' when search yields nothing", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "xyz" } });
    expect(screen.getByText("No options found")).toBeInTheDocument();
  });

  it("calls onChange when selecting an option", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Option 3"));
    expect(mockOnChange).toHaveBeenCalledWith("option3");
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("calls updateMenuPosition when usePortal is true", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        usePortal={true}
      />,
    );

    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(
      document.body.querySelector("#dropdown-listbox"),
    ).toBeInTheDocument();
  });

  it("disables button if disabled prop is true", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        disabled
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("selects the first highlighted option when Enter is pressed", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: "Enter" });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const input = screen.getByPlaceholderText("Search...");

    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnChange).toHaveBeenCalledWith("option1");
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("displays loading text if loading is true", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        loading
        loadingText="Loading..."
      />,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("closes dropdown with Escape key", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <SelectDropdown
          id="dropdown"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      </div>,
    );
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByTestId("outside"));

    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("closes dropdown when window is scrolled outside menu", () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <SelectDropdown
          id="test-dropdown"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
          usePortal={true}
        />
      </div>,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();

    const outside = screen.getByTestId("outside");

    fireEvent.scroll(outside);

    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("does not open dropdown when disabled", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        disabled={true}
      />,
    );

    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens dropdown with Enter key when closed", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: "Enter" });

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("opens dropdown with Space key when closed", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: " " });

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("does not close dropdown when menu itself is scrolled", () => {
    render(
      <SelectDropdown
        id="test-dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        usePortal={true}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    const menu = document.body.querySelector("#test-dropdown-listbox")!;

    fireEvent.scroll(menu);

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders portal menu correctly", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        usePortal
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(
      document.body.querySelector("#dropdown-listbox"),
    ).toBeInTheDocument();
  });

  it("focuses search input when dropdown opens", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.getByPlaceholderText("Search...")).toHaveFocus();
  });

  it("supports minWidth prop", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        minWidth={200}
      />,
    );

    const container = screen.getByRole("button").parentElement;
    expect(container).toHaveStyle({ minWidth: "200px" });
  });

  it("handles empty options array", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={[]}
        value=""
        onChange={mockOnChange}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("No options found")).toBeInTheDocument();
  });

  it("cleans up all event listeners on unmount", () => {
    const removeDocumentSpy = jest.spyOn(document, "removeEventListener");
    const removeWindowSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        usePortal
      />,
    );

    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });

    unmount();

    expect(removeDocumentSpy).toHaveBeenCalledWith(
      "pointerdown",
      expect.any(Function),
    );
    expect(removeWindowSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      true,
    );
    expect(removeWindowSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );
  });

  it("does not open dropdown when loading", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        loading={true}
      />,
    );

    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("scrolls highlighted option into view", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const input = screen.getByPlaceholderText("Search...");

    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
    });
  });

  it("does not call scrollIntoView when there are no options to highlight", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={[]}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does not prevent pointerdown on toggle, container, or menu", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();

    fireEvent.pointerDown(button);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();

    const menu = screen.getByRole("listbox");
    fireEvent.pointerDown(menu);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("applies placeholder class when no option is selected", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        placeholder="Choose"
      />,
    );

    const button = screen.getByRole("button");
    const span = button.querySelector("span");

    expect(span).toHaveClass("placeholder");
    expect(span).toHaveTextContent("Choose");
  });

  it("does not apply placeholder class when option is selected", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value="option1"
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");
    const span = button.querySelector("span");

    expect(span).not.toHaveClass("placeholder");
  });

  it("handles keys other than navigation keys when closed", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");

    fireEvent.keyDown(button, { key: "a" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("handles keys other than navigation keys when open", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const input = screen.getByPlaceholderText("Search...");

    fireEvent.keyDown(input, { key: "a" });

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("updates menu position on resize when usePortal is true", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        usePortal={true}
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    act(() => {
      jest.advanceTimersByTime(100);
    });

    fireEvent(window, new Event("resize"));

    expect(
      document.body.querySelector("#dropdown-listbox"),
    ).toBeInTheDocument();
  });

  it("filters with whitespace in search term", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "   " } });

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("sets aria-activedescendant when option is highlighted", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const input = screen.getByPlaceholderText("Search...");
    const listbox = screen.getByRole("listbox");

    expect(listbox.getAttribute("aria-activedescendant")).toBe(
      "dropdown-option-0",
    );

    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(listbox.getAttribute("aria-activedescendant")).toBe(
      "dropdown-option-1",
    );
  });

  it("sets aria-controls when dropdown is open", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");

    expect(button.getAttribute("aria-controls")).toBeNull();

    fireEvent.click(button);

    expect(button.getAttribute("aria-controls")).toBe("dropdown-listbox");
  });

  it("applies open class to toggle button when dropdown is open", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    const button = screen.getByRole("button");

    expect(button).not.toHaveClass("open");

    fireEvent.click(button);

    expect(button).toHaveClass("open");
  });

  it("does not render search input when showSearch is false", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        showSearch={false}
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("wraps around selection when navigating with ArrowUp", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByPlaceholderText("Search...");

    const listbox = screen.getByRole("listbox");
    expect(listbox.getAttribute("aria-activedescendant")).toBeNull();

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(listbox.getAttribute("aria-activedescendant")).toBe(
      "dropdown-option-2",
    );

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(listbox.getAttribute("aria-activedescendant")).toBe(
      "dropdown-option-1",
    );
  });

  it("wraps around selection when navigating with ArrowDown from last item", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    const listbox = screen.getByRole("listbox");
    expect(listbox.getAttribute("aria-activedescendant")).toBe(
      "dropdown-option-2",
    );

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(listbox.getAttribute("aria-activedescendant")).toBe(
      "dropdown-option-0",
    );
  });

  it("resets highlighted index on mouse move", () => {
    render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    const input = screen.getByPlaceholderText("Search...");
    const listbox = screen.getByRole("listbox");

    expect(listbox.getAttribute("aria-activedescendant")).toBe(
      "dropdown-option-0",
    );

    fireEvent.mouseEnter(listbox);

    expect(listbox.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("handles updateMenuPosition efficiently if containerRef is missing (safety check)", () => {
    const { unmount } = render(
      <SelectDropdown
        id="dropdown"
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        usePortal
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    unmount();
  });
});
