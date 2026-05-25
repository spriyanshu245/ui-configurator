import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "./SearchBar";

const userAgentDescriptor = Object.getOwnPropertyDescriptor(
  window.navigator,
  "userAgent",
);

const createProps = () => ({
  placeholder: "Search items",
  searchValue: "",
  isSearchOpen: false,
  isPending: false,
  hasSearchTerm: false,
  searchInputRef: { current: null },
  searchContainerRef: { current: null },
  onToggle: jest.fn(),
  onChange: jest.fn(),
  onKeyDown: jest.fn(),
  onClear: jest.fn(),
});

describe("SearchBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    });
  });

  afterAll(() => {
    if (userAgentDescriptor) {
      Object.defineProperty(window.navigator, "userAgent", userAgentDescriptor);
    }
  });

  it("renders the search toggle button", () => {
    render(<SearchBar {...createProps()} />);
    expect(screen.getByTestId("search-toggle")).toBeInTheDocument();
  });

  it("renders the search input with placeholder", () => {
    render(<SearchBar {...createProps()} />);
    expect(screen.getByPlaceholderText("Search items")).toBeInTheDocument();
  });

  it("calls onToggle when search toggle is clicked", () => {
    const props = createProps();
    render(<SearchBar {...props} />);
    fireEvent.click(screen.getByTestId("search-toggle"));
    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it("displays search value in input", () => {
    render(<SearchBar {...createProps()} searchValue="test query" />);
    expect(screen.getByDisplayValue("test query")).toBeInTheDocument();
  });

  it("calls onChange when input value changes", () => {
    const props = createProps();
    render(<SearchBar {...props} isSearchOpen />);
    fireEvent.change(screen.getByPlaceholderText("Search items"), {
      target: { value: "new value" },
    });
    expect(props.onChange).toHaveBeenCalledTimes(1);
  });

  it("calls onKeyDown when key is pressed in input", () => {
    const props = createProps();
    render(<SearchBar {...props} isSearchOpen />);
    fireEvent.keyDown(screen.getByPlaceholderText("Search items"), {
      key: "Escape",
    });
    expect(props.onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("shows clear button when hasSearchTerm is true", () => {
    render(<SearchBar {...createProps()} hasSearchTerm />);
    expect(screen.getByTestId("clear-search")).toBeInTheDocument();
  });

  it("does not show clear button when hasSearchTerm is false", () => {
    render(<SearchBar {...createProps()} hasSearchTerm={false} />);
    expect(screen.queryByTestId("clear-search")).not.toBeInTheDocument();
  });

  it("calls onClear when clear button is clicked", () => {
    const props = createProps();
    render(<SearchBar {...props} hasSearchTerm />);
    fireEvent.click(screen.getByTestId("clear-search"));
    expect(props.onClear).toHaveBeenCalledTimes(1);
  });

  it("shows 'Close search' label when search is open", () => {
    render(<SearchBar {...createProps()} isSearchOpen />);
    expect(screen.getByLabelText("Close search")).toBeInTheDocument();
  });

  it("shows 'Open search' label when search is closed", () => {
    render(<SearchBar {...createProps()} isSearchOpen={false} />);
    expect(screen.getByLabelText("Open search")).toBeInTheDocument();
  });

  it("applies isActive class when search is open", () => {
    render(<SearchBar {...createProps()} isSearchOpen />);
    const container = screen.getByTestId("search-container");
    expect(container.className).toContain("isActive");
  });

  it("applies hasValue class when hasSearchTerm is true", () => {
    render(<SearchBar {...createProps()} hasSearchTerm />);
    const container = screen.getByTestId("search-container");
    expect(container.className).toContain("hasValue");
  });

  it("applies isPending class when isPending is true", () => {
    render(<SearchBar {...createProps()} isPending />);
    const container = screen.getByTestId("search-container");
    expect(container.className).toContain("isPending");
  });

  it("shows the collapsed shortcut hint and aria-keyshortcuts", () => {
    render(<SearchBar {...createProps()} />);
    expect(screen.getByTestId("search-shortcut-hint")).toHaveTextContent(
      "Ctrl+E",
    );
    expect(screen.getByTestId("search-toggle")).toHaveAttribute(
      "aria-keyshortcuts",
      "Meta+E Control+E",
    );
  });

  it("shows the mac shortcut hint for macOS user agents", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
    });

    render(<SearchBar {...createProps()} />);

    expect(screen.getByTestId("search-shortcut-hint")).toHaveTextContent("⌘E");
  });

  it("hides the shortcut hint when the search is expanded", () => {
    render(<SearchBar {...createProps()} isSearchOpen />);
    expect(
      screen.queryByTestId("search-shortcut-hint"),
    ).not.toBeInTheDocument();
  });

  it("opens the collapsed search on Ctrl+E", () => {
    const props = createProps();
    render(<SearchBar {...props} />);

    fireEvent.keyDown(document, { key: "e", ctrlKey: true });

    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it("focuses and selects the open search input on Cmd+E", () => {
    const props = createProps();
    render(
      <SearchBar {...props} isSearchOpen hasSearchTerm searchValue="Alpha" />,
    );

    const input = screen.getByDisplayValue("Alpha") as HTMLInputElement;
    input.blur();
    expect(input).not.toHaveFocus();

    fireEvent.keyDown(document, { key: "e", metaKey: true });

    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
    expect(props.onToggle).not.toHaveBeenCalled();
  });

  it("ignores the shortcut while typing in another editable field", () => {
    const props = createProps();
    render(
      <>
        <input aria-label="External input" />
        <SearchBar {...props} />
      </>,
    );

    const externalInput = screen.getByLabelText("External input");
    externalInput.focus();
    fireEvent.keyDown(externalInput, { key: "e", ctrlKey: true });

    expect(props.onToggle).not.toHaveBeenCalled();
  });
});
