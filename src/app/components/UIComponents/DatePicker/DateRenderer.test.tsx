import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import DateRenderer from "./DateRenderer";

// --- Mock imported functions and constants ---

jest.mock("@/app/utils/date", () => ({
  formatDateInput: jest.fn(({ input }) => `formatted-${input}`),
  formatDateInputWithPlaceHolder: jest.fn((value, format) => {
    // For testing, if value exists, return value concatenated with "___"
    return value ? value + "___" : "___";
  }),
  validateDateInput: jest.fn(({ input }) => {
    // For any input except "invalid", assume valid
    if (input === "invalid") return "Invalid date";
    return "";
  }),
  compareMinMaxDates: jest.fn(({ input }) => {
    // For testing, if input is "2020-01-01", return an error
    if (input === "2020-01-01") return "Date comparison error";
    return "";
  }),
}));

jest.mock("@/app/utils/constants", () => ({
  DATE_ERROR_MESSAGE: "Invalid date format",
  DEFAULT_DATE_FORMAT: "MM/DD/YYYY",
  DEFAULT_DATE_SEPARATOR: "/",
}));

jest.mock("@/app/data/componentProperties", () => ({
  ComponentProperty: {
    MinDate: "minDate",
    MaxDate: "maxDate",
  },
}));

// --- Mock CSS module for predictable class names ---
jest.mock("@/app/styles/properties-pane.module.scss", () => ({
  dateInputContainer: "dateInputContainer",
  textInput: "textInput",
  placeHolderText: "placeHolderText",
  errorMessages: "errorMessages",
  hideCharacter: "hideCharacter",
}));

describe("DateRenderer Component", () => {
  const setPropertyMock = jest.fn();

  const defaultProps = {
    properties: {
      // For a minDate field
      minDate: "12/3",
    },
    setProperty: setPropertyMock,
    field: "minDate",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders input with value and dynamic placeholder", () => {
    render(<DateRenderer {...defaultProps} />);
    const inputEl = screen.getByRole("textbox") as HTMLInputElement;
    expect(inputEl).toBeInTheDocument();
    // The value comes from properties[minDate]
    expect(inputEl.value).toBe("12/3");

    // Check that the placeholder span is rendered with two parts.
    // Our mocked formatDateInputWithPlaceHolder returns "12/3___" when value is "12/3".
    // The first span should show the first 4 characters ("12/3"), the second span the remainder ("___").
    const placeholderContainer = screen.getByText("___");
    expect(placeholderContainer).toBeInTheDocument();
    // We also check that the hidden span with the first part is rendered.
    const hiddenSpan = screen.getByText("12/3");
    expect(hiddenSpan).toBeInTheDocument();
  });

  test("calls setProperty with formatted value on input change", () => {
    render(<DateRenderer {...defaultProps} />);
    const inputEl = screen.getByRole("textbox") as HTMLInputElement;

    // Simulate change: user types "12/3/2"
    fireEvent.change(inputEl, { target: { value: "12/3/2" } });
    // Our mock formatDateInput returns "formatted-12/3/2"
    expect(setPropertyMock).toHaveBeenCalledWith("minDate", "formatted-12/3/2");
  });

  test("on Backspace keydown, if input ends with separator, calls setProperty with truncated value", () => {
    // Provide a properties object where the current value ends with the separator.
    const propsWithSeparator = {
      ...defaultProps,
      properties: {
        minDate: "12/3/",
      },
    };
    render(<DateRenderer {...propsWithSeparator} />);
    const inputEl = screen.getByRole("textbox") as HTMLInputElement;
    // Fire Backspace keydown event.
    fireEvent.keyDown(inputEl, { key: "Backspace" });
    // Expect setProperty to be called with "12/3" (i.e. value without the trailing separator).
    expect(setPropertyMock).toHaveBeenCalledWith("minDate", "12/3");
  });

  test("on blur, if input length is >0 but less than 10, sets error message", () => {
    // Provide a properties object with a value of length 3.
    const shortValueProps = {
      ...defaultProps,
      properties: {
        minDate: "123",
      },
    };
    render(<DateRenderer {...shortValueProps} />);
    const inputEl = screen.getByRole("textbox") as HTMLInputElement;
    // Fire blur event.
    fireEvent.blur(inputEl);
    // Since length (3) is less than 10, error should be set to DATE_ERROR_MESSAGE ("Invalid date format").
    const errorMsg = screen.getByText("Invalid date format");
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveClass("errorMessages");
  });
});
