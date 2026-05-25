import { fireEvent, render, screen, act } from "@testing-library/react";
import SearchableDropdown from "./SearchableDropdown";
import React from "react";

const mockOptions = [
  {
    id: "1",
    label: "Option 1",
    keys: { key1: "value1", key2: "value2" },
    tagName: "Tag1",
  },
  {
    id: "2",
    label: "Option 2",
    keys: { key1: "value3", key2: "value4" },
  },
];

describe("SearchableDropdown", () => {
  const mockOnItemSelect = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnItemSelect.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders search button initially", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
      />
    );
    expect(screen.getByLabelText("Open search")).toBeInTheDocument();
  });

  it("shows search input when search button is clicked", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
      />
    );

    fireEvent.click(screen.getByLabelText("Open search"));
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("filters options based on search query", async () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
      />
    );

    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "Option 1" } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.queryByText("Option 2")).not.toBeInTheDocument();
  });

  it("calls onItemSelect when option is clicked", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
      />
    );

    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "Option" } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    fireEvent.click(screen.getByText("Option 1"));

    expect(mockOnItemSelect).toHaveBeenCalledWith(mockOptions[0]);
  });

  it("shows loading state while debouncing", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
      />
    );

    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "Option" } });

    expect(screen.getByText("Loading results...")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.queryByText("Loading results...")).not.toBeInTheDocument();
  });

  it("handles click outside dropdown and input correctly", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
      />
    );

    // Open the dropdown
    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    // Enter some text to show dropdown
    fireEvent.change(input, { target: { value: "Option" } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Verify dropdown is open
    expect(screen.getByText("Option 1")).toBeInTheDocument();

    // Simulate click on dropdown (should stay open)
    const dropdown = screen.getByText("Option 1").closest("div");
    fireEvent.mouseDown(dropdown as HTMLElement);
    expect(screen.getByText("Option 1")).toBeInTheDocument();

    // Simulate click on input (should stay open)
    fireEvent.mouseDown(input);
    expect(screen.getByText("Option 1")).toBeInTheDocument();

    // Simulate click outside both dropdown and input
    fireEvent.mouseDown(document.body);

    // Verify dropdown is closed and input is cleared
    expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("selects option with Enter key", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
      />
    );

    // Open the dropdown
    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    // Enter some text to show dropdown
    fireEvent.change(input, { target: { value: "Option" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Select the first option
    fireEvent.keyDown(input, { key: "ArrowDown" });

    // Press Enter to select
    fireEvent.keyDown(input, { key: "Enter" });

    // Check if onItemSelect is called with the correct option
    expect(mockOnItemSelect).toHaveBeenCalledWith(mockOptions[0]);

    // Dropdown should be closed
    expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
  });

  it("closes dropdown with Escape key", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
      />
    );

    // Open the dropdown
    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    // Enter some text to show dropdown
    fireEvent.change(input, { target: { value: "Option" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Verify dropdown is open
    expect(screen.getByText("Option 1")).toBeInTheDocument();

    // Press Escape key
    fireEvent.keyDown(input, { key: "Escape" });

    // Dropdown should be closed
    expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("does nothing on keyboard events when no options are available", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
      />
    );

    // Open the dropdown
    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    // Enter text that won't match any options
    fireEvent.change(input, { target: { value: "NoMatch" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Verify no options are shown
    expect(screen.getByText("No matches found")).toBeInTheDocument();

    // Try pressing keys
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });

    // Verify onItemSelect was not called
    expect(mockOnItemSelect).not.toHaveBeenCalled();
  });

  it("displays option keys based on keysToDisplay prop", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
        displayKeys={["key1", "key2"]}
      />
    );

    // Open the dropdown
    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    // Enter text to show dropdown
    fireEvent.change(input, { target: { value: "Option" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Check that key values are displayed
    expect(screen.getByText("value1")).toBeInTheDocument();
    expect(screen.getByText("value2")).toBeInTheDocument();
    expect(screen.getByText("value3")).toBeInTheDocument();
    expect(screen.getByText("value4")).toBeInTheDocument();
  });

  it("only displays keys specified in keysToDisplay", () => {
    // Render with only one key to display
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
        displayKeys={["key1"]}
      />
    );

    // Open the dropdown
    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    // Enter text to show dropdown
    fireEvent.change(input, { target: { value: "Option" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Check that only key1 values are displayed
    expect(screen.getByText("value1")).toBeInTheDocument();
    expect(screen.getByText("value3")).toBeInTheDocument();
    expect(screen.queryByText("value2")).not.toBeInTheDocument();
    expect(screen.queryByText("value4")).not.toBeInTheDocument();
  });

  it("doesn't display keys that don't exist in option", () => {
    // Add an option with a missing key
    const optionsWithMissingKey = [
      ...mockOptions,
      {
        id: "3",
        label: "Option 3",
        keys: { key1: "value5" }, // missing key2
      },
    ];

    render(
      <SearchableDropdown
        options={optionsWithMissingKey}
        onItemSelect={mockOnItemSelect}
        displayKeys={["key1", "key2"]}
      />
    );

    // Open the dropdown
    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    // Enter text to show dropdown
    fireEvent.change(input, { target: { value: "Option" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Check that only existing keys are displayed
    expect(screen.getByText("value5")).toBeInTheDocument(); // key1 exists

    // Count the number of "value2" instances (should be 1 from first option)
    const value2Elements = screen.getAllByText("value2");
    expect(value2Elements.length).toBe(1);

    // Option 3 should not have key2 displayed
    const option3 = screen.getByText("Option 3").closest("div");
    expect(option3).toBeInTheDocument();
    expect(option3).not.toHaveTextContent("value2");
  });

  it("doesn't display additional fields when keysToDisplay is empty", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
        displayKeys={[]}
      />
    );

    // Open the dropdown
    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    // Enter text to show dropdown
    fireEvent.change(input, { target: { value: "Option" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Check that no key values are displayed
    expect(screen.queryByText("value1")).not.toBeInTheDocument();
    expect(screen.queryByText("value2")).not.toBeInTheDocument();
    expect(screen.queryByText("value3")).not.toBeInTheDocument();
    expect(screen.queryByText("value4")).not.toBeInTheDocument();
  });

  it("closes search and clears query when close button is clicked", () => {
    render(
      <SearchableDropdown
        options={mockOptions}
        onItemSelect={mockOnItemSelect}
      />
    );

    fireEvent.click(screen.getByLabelText("Open search"));
    const input = screen.getByPlaceholderText("Search...");

    fireEvent.change(input, { target: { value: "Option" } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByText("Option 1")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close search"));

    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
    expect(screen.queryByText("Option 1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Open search"));
    const newInput = screen.getByPlaceholderText("Search...");
    expect(newInput.value).toBe("");
  });
});
