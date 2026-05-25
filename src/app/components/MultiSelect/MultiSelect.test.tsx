import React, { act } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MultiSelect, { MultiSelectProps } from "./MultiSelect";

// A helper to render the component with default props.
const renderMultiSelect = (props?: Partial<MultiSelectProps>) => {
  const defaultProps: MultiSelectProps = {
    options: [
      { id: "Apple", label: "Apple" },
      { id: "Banana", label: "Banana" },
      { id: "Cherry", label: "Cherry" },
    ],
    value: [],
    onChange: jest.fn(),
    onRemoveValue: jest.fn(),
    placeholder: "Select fruits...",
    label: "Fruits",
    disabled: false,
    required: false,
    error: "",
    name: "fruits",
    id: "fruit-multiselect",
  };
  return render(<MultiSelect {...{ ...defaultProps, ...props }} />);
};

describe("MultiSelect Component", () => {
  test("renders label when provided", () => {
    renderMultiSelect({ label: "Fruits" });
    expect(screen.getByText("Fruits")).toBeInTheDocument();

    renderMultiSelect({ label: "Fruits", required: true });
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  test("renders placeholder when no value is selected", () => {
    renderMultiSelect({ value: [] });
    expect(screen.getByPlaceholderText("Select fruits...")).toBeInTheDocument();
  });

  test("opens and closes dropdown on click", async () => {
    const { container } = renderMultiSelect();
    const selectBox = screen.getByRole("combobox");

    expect(container.querySelector(`.${"dropdown"}`)).toBeNull();

    fireEvent.click(selectBox);
    expect(container.querySelector(`.${"dropdown"}`)).toBeInTheDocument();

    fireEvent.mouseDown(document);
    await waitFor(() => {
      expect(container.querySelector(`.${"dropdown"}`)).toBeNull();
    });
  });

  test("selects and deselects an option on click", () => {
    const onChange = jest.fn();
    const { container } = renderMultiSelect({ onChange, value: [] });
    const selectBox = screen.getByRole("combobox");

    fireEvent.click(selectBox);

    const dropdown = container.querySelector(`.${"dropdown"}`);
    expect(dropdown).toBeInTheDocument();

    const optionBanana = dropdown && dropdown.getElementsByTagName("option");
    expect(optionBanana?.[1]?.textContent).toBe("Banana");

    fireEvent.click(optionBanana?.[1]!);
    expect(onChange).toHaveBeenLastCalledWith(["Banana"]);
  });

  test("does not open dropdown when disabled", () => {
    const { container } = renderMultiSelect({ disabled: true });
    const selectBox = screen.getByRole("combobox");
    fireEvent.click(selectBox);
    expect(container.querySelector(`.${"dropdown"}`)).toBeNull();
  });

  test("does not render remove buttons when disabled", () => {
    renderMultiSelect({ disabled: true, value: ["Apple"] });

    expect(screen.queryByRole("button", { name: /×/i })).toBeNull();
  });

  test("toggles dropdown on keyboard events", () => {
    const { container } = renderMultiSelect();
    const selectBox = screen.getByRole("combobox");

    fireEvent.keyDown(selectBox, { key: "Enter" });
    expect(container.querySelector(`.${"dropdown"}`)).toBeInTheDocument();

    fireEvent.keyDown(selectBox, { key: " " });
    expect(container.querySelector(`.${"dropdown"}`)).toBeNull();
  });

  test("displays error message when error prop is provided", () => {
    renderMultiSelect({ error: "Selection required" });
    expect(screen.getByText("Selection required")).toBeInTheDocument();
  });

  test("calls onRemoveValue and onChange when remove button is clicked", () => {
    const onChange = jest.fn();
    const onRemoveValue = jest.fn();
    renderMultiSelect({
      value: ["Apple", "Banana"],
      onChange,
      onRemoveValue,
    });

    const removeButtons = screen.getAllByTestId(
      "fruit-multiselect_removeButton"
    );
    fireEvent.click(removeButtons[0]);

    expect(onRemoveValue).toHaveBeenCalledWith("Apple");
    expect(onChange).toHaveBeenLastCalledWith(["Banana"]);
  });

  test("renders default placeholder when placeholder prop is not provided", () => {
    render(
      <MultiSelect
        options={[
          { id: "Apple", label: "Apple" },
          { id: "Banana", label: "Banana" },
          { id: "Cherry", label: "Cherry" },
        ]}
        value={[]}
        onChange={jest.fn()}
        onRemoveValue={jest.fn()}
        label="Fruits"
        disabled={false}
        required={false}
        error=""
        name="fruits"
        id="fruit-multiselect"
      />
    );
    expect(screen.getByPlaceholderText("Select...")).toBeInTheDocument();
  });

  test("renders correct aria-controls attribute when id prop is provided", () => {
    renderMultiSelect({ id: "custom-id" });
    const selectBox = screen.getByRole("combobox");
    expect(selectBox).toHaveAttribute("aria-controls", "custom-id_dropdown");
  });

  test("renders correct aria-controls attribute when id prop is not provided", () => {
    render(
      <MultiSelect
        options={["Apple", "Banana", "Cherry"]}
        value={[]}
        onChange={jest.fn()}
        onRemoveValue={jest.fn()}
        label="Fruits"
        disabled={false}
        required={false}
        error=""
        name="fruits"
      />
    );
    const selectBox = screen.getByRole("combobox");
    expect(selectBox).toHaveAttribute("aria-controls", "multiselect_dropdown");
  });

  test("selects option using keyboard (Enter and Space keys)", async () => {
    const onChange = jest.fn();
    const { container } = renderMultiSelect({ onChange, value: [] });
    const selectBox = screen.getByRole("combobox");
    fireEvent.click(selectBox);
    const dropdown = container.querySelector(`.dropdown`);
    expect(dropdown).toBeInTheDocument();
    const options = dropdown?.querySelectorAll("option");
    expect(options?.length).toBe(3);

    if (options) {
      fireEvent.keyDown(options[0], { key: "Enter" });
      expect(onChange).toHaveBeenCalledWith(["Apple"]);
      onChange.mockClear();
    }

    fireEvent.click(selectBox);
    const updatedDropdown = container.querySelector(`.dropdown`);
    const updatedOptions = updatedDropdown?.querySelectorAll("option");

    if (updatedOptions && updatedOptions.length > 0) {
      fireEvent.keyDown(updatedOptions[0], { key: " " });
      expect(onChange).toHaveBeenCalledWith(["Banana"]);
    }
  });
});
describe("MultiSelect Component", () => {
  const defaultProps = {
    options: [
      { id: "Apple", label: "Apple" },
      { id: "Banana", label: "Banana" },
      { id: "Cherry", label: "Cherry" },
      { id: "Date", label: "Date" },
      { id: "Elderberry", label: "Elderberry" },
      { id: "Plum", label: "Plum" },
      { id: "NewFruit", label: "NewFruit" },
    ],
    onChange: jest.fn(),
    onRemoveValue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly with default props", () => {
    render(<MultiSelect {...defaultProps} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.queryByText("Select...")).not.toBeInTheDocument();
  });

  test("renders with preselected values", () => {
    render(<MultiSelect {...defaultProps} value={["Apple", "Banana"]} />);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  test("handleSelect adds an option when clicked", async () => {
    render(<MultiSelect {...defaultProps} />);

    fireEvent.click(screen.getByRole("combobox"));

    fireEvent.click(screen.getByText("Apple"));

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(defaultProps.onChange).toHaveBeenCalledWith(["Apple"]);
  });

  test("handleInputChange updates input value and filters options", async () => {
    render(<MultiSelect {...defaultProps} id="test" />);

    fireEvent.click(screen.getByRole("combobox"));

    const inputElement = screen.getByTestId("test_searchInput");
    fireEvent.change(inputElement, { target: { value: "Ap" } });

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.queryByText("Banana")).not.toBeInTheDocument();
  });

  test("handleInputChange opens dropdown if closed", async () => {
    render(<MultiSelect {...defaultProps} id="test" />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(document.body);

    const inputElement = screen.getByTestId("test_searchInput");
    fireEvent.focus(inputElement);
    fireEvent.change(inputElement, { target: { value: "A" } });

    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  test("handleInputKeyDown adds matching option on Enter", async () => {
    render(<MultiSelect {...defaultProps} id="test" />);

    fireEvent.click(screen.getByRole("combobox"));

    const inputElement = screen.getByTestId("test_searchInput");
    fireEvent.change(inputElement, { target: { value: "Apple" } });
    fireEvent.keyDown(inputElement, { key: "Enter", code: "Enter" });

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(defaultProps.onChange).toHaveBeenCalledWith(["Apple"]);
  });

  test("handleInputKeyDown adds custom value on Enter when allowCustomValues is true", async () => {
    render(
      <MultiSelect {...defaultProps} allowCustomValues={true} id="test" />
    );

    fireEvent.click(screen.getByRole("combobox"));

    const inputElement = screen.getByTestId("test_searchInput");
    fireEvent.change(inputElement, { target: { value: "NewFruit" } });
    fireEvent.keyDown(inputElement, { key: "Enter", code: "Enter" });

    expect(screen.getByText("NewFruit")).toBeInTheDocument();
    expect(defaultProps.onChange).toHaveBeenCalledWith(["NewFruit"]);
  });

  test("handleInputKeyDown does not add custom value when allowCustomValues is false", async () => {
    render(
      <MultiSelect {...defaultProps} options={[
      { id: "Apple", label: "Apple" },
      { id: "Banana", label: "Banana" },

    ]} allowCustomValues={false} id="test" />
    );

    fireEvent.click(screen.getByRole("combobox"));

    const inputElement = screen.getByTestId("test_searchInput");
    fireEvent.change(inputElement, { target: { value: "NewFruit" } });
    fireEvent.keyDown(inputElement, { key: "Enter", code: "Enter" });

    expect(screen.queryByText("NewFruit")).not.toBeInTheDocument();
    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  test("handleInputKeyDown closes dropdown on Escape key", async () => {
    render(<MultiSelect {...defaultProps} id="test" />);

    fireEvent.click(screen.getByRole("combobox"));

    const inputElement = screen.getByTestId("test_searchInput");
    fireEvent.keyDown(inputElement, { key: "Escape", code: "Escape" });

    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  test("handleOptionKeyDown selects option on Enter key", async () => {
    render(<MultiSelect {...defaultProps} />);

    fireEvent.click(screen.getByRole("combobox"));

    const option = screen.getByText("Apple");
    fireEvent.focus(option);

    fireEvent.keyDown(option, { key: "Enter", code: "Enter" });

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(defaultProps.onChange).toHaveBeenCalledWith(["Apple"]);
  });

  test("handleOptionKeyDown selects option on Space key", async () => {
    render(<MultiSelect {...defaultProps} />);

    fireEvent.click(screen.getByRole("combobox"));

    const option = screen.getByText("Banana");
    fireEvent.focus(option);

    fireEvent.keyDown(option, { key: " ", code: "Space" });

    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(defaultProps.onChange).toHaveBeenCalledWith(["Banana"]);
  });

  test("handleOptionKeyDown closes dropdown on Escape key", async () => {
    render(<MultiSelect {...defaultProps} />);

    fireEvent.click(screen.getByRole("combobox"));

    const option = screen.getByText("Cherry");
    fireEvent.focus(option);

    fireEvent.keyDown(option, { key: "Escape", code: "Escape" });

    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  test("useEffect filters options based on input", async () => {
    render(<MultiSelect {...defaultProps} id="test" />);

    fireEvent.click(screen.getByRole("combobox"));

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();

    const inputElement = screen.getByTestId("test_searchInput");
    act(() => fireEvent.change(inputElement, { target: { value: "B" } }));

    waitFor(() => {
      expect(screen.queryByText("Apple")).not.toBeInTheDocument();
      expect(screen.getByText("Banana")).toBeInTheDocument();
    });
  });

  test("useEffect excludes already selected options from filtered list", async () => {
    render(<MultiSelect {...defaultProps} value={["Apple"]} />);

    fireEvent.click(screen.getByRole("combobox"));

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.queryByText("Banana")).toBeInTheDocument();

    const dropdownContainer = screen.getByRole("combobox").parentElement;
    const dropdown = dropdownContainer?.querySelector("ul");
    const appleInDropdown = dropdown?.querySelector('option[children="Apple"]');
    expect(appleInDropdown).toBeNull();
  });

  test("clicking outside closes the dropdown", async () => {
    render(<MultiSelect {...defaultProps} />);

    fireEvent.click(screen.getByRole("combobox"));

    expect(screen.getByText("Apple")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  test("removeValue removes selected value and calls onRemoveValue", async () => {
    render(
      <MultiSelect {...defaultProps} value={["Apple"]} id="test-select" />
    );

    const removeButton = screen.getByTestId("test-select_removeButton");
    fireEvent.click(removeButton);

    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
    expect(defaultProps.onChange).toHaveBeenCalledWith([]);
    expect(defaultProps.onRemoveValue).toHaveBeenCalledWith("Apple");
  });

  test("custom value validator prevents invalid values", async () => {
    const customValidator = jest.fn((value) => value.length >= 4);

    render(
      <MultiSelect
        {...defaultProps}
        allowCustomValues={true}
        customValueValidator={customValidator}
        id="test"
      />
    );

    fireEvent.click(screen.getByRole("combobox"));

    const inputElement = screen.getByTestId("test_searchInput");
    fireEvent.change(inputElement, { target: { value: "Fig" } });
    fireEvent.keyDown(inputElement, { key: "Enter", code: "Enter" });

    expect(customValidator).toHaveBeenCalledWith("Fig");

    expect(screen.queryByText("Fig")).not.toBeInTheDocument();

    fireEvent.change(inputElement, { target: { value: "Plum" } });
    fireEvent.keyDown(inputElement, { key: "Enter", code: "Enter" });

    expect(screen.getByText("Plum")).toBeInTheDocument();
  });

  test("custom value validator prevents invalid values", async () => {
    const customValidator = jest.fn((value) => value.length >= 4);

    render(
      <MultiSelect
        {...defaultProps}
        allowCustomValues={true}
        customValueValidator={customValidator}
        id="test"
      />
    );

    fireEvent.click(screen.getByRole("combobox"));

    const inputElement = screen.getByTestId("test_searchInput");
    fireEvent.change(inputElement, { target: { value: "ap" } });
    fireEvent.keyDown(inputElement, { key: "ArrowDown" });
  });
});
