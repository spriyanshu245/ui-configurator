import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchInput from "./SearchInput";

// Mock the InternalIcons module so that it simply returns the icon name.
jest.mock("@/app/utils/InternalIcons", () => ({
  __esModule: true,
  default: (icon: string) => <span>{icon}</span>,
}));

describe("SearchInput Component", () => {
  const setIsSearchInputMock = jest.fn();
  const setQueryMock = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders open search button when isSearchInput is false", () => {
    render(
      <SearchInput
        isSearchInput={false}
        setIsSearchInput={setIsSearchInputMock}
        query=""
        setQuery={setQueryMock}
      />
    );

    // Verify that the "Open search" button is rendered.
    const openButton = screen.getByRole("button", { name: /open search/i });
    expect(openButton).toBeInTheDocument();

    // The search input should not be rendered.
    expect(
      screen.queryByPlaceholderText(/Search pages/i)
    ).not.toBeInTheDocument();

    // Clicking the button toggles the search input.
    fireEvent.click(openButton);
    expect(setIsSearchInputMock).toHaveBeenCalledWith(true);
  });

  test("renders search input and close button when isSearchInput is true", () => {
    const queryValue = "hello";
    render(
      <SearchInput
        isSearchInput={true}
        setIsSearchInput={setIsSearchInputMock}
        query={queryValue}
        setQuery={setQueryMock}
      />
    );

    // Verify that the input field is rendered with the provided value.
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(queryValue);

    // The input should be auto-focused.
    expect(input).toHaveFocus();

    // Verify that the "Close search" button is rendered.
    const closeButton = screen.getByRole("button", { name: /close search/i });
    expect(closeButton).toBeInTheDocument();

    // Simulate a change event on the input.
    fireEvent.change(input, { target: { value: "world" } });
    expect(setQueryMock).toHaveBeenCalledWith("world");

    // Clicking the close button should hide the search input and reset the query.
    fireEvent.click(closeButton);
    expect(setIsSearchInputMock).toHaveBeenCalledWith(false);
    expect(setQueryMock).toHaveBeenCalledWith("");
  });
});
