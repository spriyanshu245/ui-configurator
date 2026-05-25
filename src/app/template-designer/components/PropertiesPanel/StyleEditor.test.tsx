import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import StyleEditor from "./StyleEditor";

jest.mock("@/app/components/SVGIcons/Delete", () => ({
  __esModule: true,
  default: () => <svg data-testid="delete-icon" />,
}));

jest.mock(
  "@/app/components/InternalComponents/SelectDropdown/SelectDropdown",
  () => ({
    __esModule: true,
    default: ({
      id,
      options,
      value,
      onChange,
      placeholder,
    }: {
      id: string;
      options: { value: string; label: string }[];
      value: string;
      onChange: (val: string) => void;
      placeholder?: string;
      showSearch?: boolean;
    }) => (
      <select
        data-testid={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ),
  })
);

jest.mock("@/app/template-designer/data/availableCssProperties", () => ({
  CSS_PROPERTIES: [
    "color",
    "background-color",
    "font-size",
    "margin",
    "padding",
  ],
}));

describe("StyleEditor", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("rendering", () => {
    it("should render empty editor with add button", () => {
      render(<StyleEditor value="" onChange={mockOnChange} />);
      expect(
        screen.getByRole("button", { name: /add style/i })
      ).toBeInTheDocument();
    });

    it("should render with empty string value", () => {
      render(<StyleEditor value="   " onChange={mockOnChange} />);
      expect(
        screen.getByRole("button", { name: /add style/i })
      ).toBeInTheDocument();
    });

    it("should parse and display existing styles", () => {
      render(
        <StyleEditor
          value="color: red; font-size: 16px"
          onChange={mockOnChange}
        />
      );
      expect(screen.getAllByTestId(/style-property-/).length).toBe(2);
    });

    it("should parse styles with extra semicolons", () => {
      render(
        <StyleEditor
          value="color: red;; font-size: 16px;"
          onChange={mockOnChange}
        />
      );
      expect(screen.getAllByTestId(/style-property-/).length).toBe(2);
    });

    it("should handle style with empty property", () => {
      render(<StyleEditor value=": red" onChange={mockOnChange} />);
      expect(screen.queryByTestId(/style-property-/)).not.toBeInTheDocument();
    });

    it("should handle style without colon", () => {
      render(<StyleEditor value="color red" onChange={mockOnChange} />);
      expect(screen.queryByTestId(/style-property-/)).not.toBeInTheDocument();
    });
  });

  describe("adding entries", () => {
    it("should add a new style entry when clicking add button", async () => {
      render(<StyleEditor value="" onChange={mockOnChange} />);

      const addButton = screen.getByRole("button", { name: /add style/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId(/style-property-/)).toBeInTheDocument();
      });
    });

    it("should scroll to new entry and highlight it", async () => {
      const scrollToMock = jest.fn();
      HTMLDivElement.prototype.scrollTo = scrollToMock;

      render(<StyleEditor value="" onChange={mockOnChange} />);

      const addButton = screen.getByRole("button", { name: /add style/i });
      fireEvent.click(addButton);

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(scrollToMock).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: "smooth",
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });
    });

    it("should add multiple entries", async () => {
      render(<StyleEditor value="" onChange={mockOnChange} />);

      const addButton = screen.getByRole("button", { name: /add style/i });

      fireEvent.click(addButton);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByTestId(/style-property-/).length).toBe(2);
      });
    });
  });

  describe("removing entries", () => {
    it("should remove entry when clicking delete button", async () => {
      render(<StyleEditor value="color: red" onChange={mockOnChange} />);

      expect(screen.getByTestId(/style-property-/)).toBeInTheDocument();

      const deleteButton = screen.getByRole("button", {
        name: /remove style/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByTestId(/style-property-/)).not.toBeInTheDocument();
      });
      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("should remove correct entry when there are multiple", async () => {
      render(
        <StyleEditor
          value="color: red; font-size: 16px"
          onChange={mockOnChange}
        />
      );

      const deleteButtons = screen.getAllByRole("button", {
        name: /remove style/i,
      });
      expect(deleteButtons.length).toBe(2);

      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByTestId(/style-property-/).length).toBe(1);
      });
      expect(mockOnChange).toHaveBeenCalledWith("font-size: 16px");
    });
  });

  describe("changing property", () => {
    it("should update property when selecting from dropdown", async () => {
      render(<StyleEditor value="color: red" onChange={mockOnChange} />);

      const select = screen.getByTestId(/style-property-/);
      fireEvent.change(select, { target: { value: "background-color" } });

      expect(mockOnChange).toHaveBeenCalledWith("background-color: red");
    });

    it("should handle property change to empty", async () => {
      render(<StyleEditor value="color: red" onChange={mockOnChange} />);

      const select = screen.getByTestId(/style-property-/);
      fireEvent.change(select, { target: { value: "" } });

      expect(mockOnChange).toHaveBeenCalledWith("");
    });
  });

  describe("changing value", () => {
    it("should update value when typing in input", async () => {
      render(<StyleEditor value="color: red" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText("Enter value");
      fireEvent.change(input, { target: { value: "blue" } });

      expect(mockOnChange).toHaveBeenCalledWith("color: blue");
    });

    it("should handle empty value", async () => {
      render(<StyleEditor value="color: red" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText("Enter value");
      fireEvent.change(input, { target: { value: "" } });

      expect(mockOnChange).toHaveBeenCalledWith("color: ");
    });

    it("should only update the correct entry value when multiple exist", async () => {
      render(
        <StyleEditor
          value="color: red; font-size: 16px"
          onChange={mockOnChange}
        />
      );

      const inputs = screen.getAllByPlaceholderText("Enter value");
      fireEvent.change(inputs[1], { target: { value: "20px" } });

      expect(mockOnChange).toHaveBeenCalledWith("color: red; font-size: 20px");
    });
  });

  describe("sync with external value changes", () => {
    it("should update entries when value prop changes", async () => {
      const { rerender } = render(
        <StyleEditor value="color: red" onChange={mockOnChange} />
      );

      expect(screen.getAllByTestId(/style-property-/).length).toBe(1);

      rerender(
        <StyleEditor
          value="color: red; font-size: 16px"
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByTestId(/style-property-/).length).toBe(2);
      });
    });

    it("should not update if style string is equivalent", async () => {
      const { rerender } = render(
        <StyleEditor value="color: red" onChange={mockOnChange} />
      );

      const initialSelect = screen.getByTestId(/style-property-/);

      rerender(<StyleEditor value="color: red;" onChange={mockOnChange} />);

      expect(screen.getByTestId(/style-property-/)).toBe(initialSelect);
    });

    it("should handle value change from non-empty to empty", async () => {
      const { rerender } = render(
        <StyleEditor value="color: red" onChange={mockOnChange} />
      );

      expect(screen.getByTestId(/style-property-/)).toBeInTheDocument();

      rerender(<StyleEditor value="" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.queryByTestId(/style-property-/)).not.toBeInTheDocument();
      });
    });
  });

  describe("entry to string conversion", () => {
    it("should filter out entries with empty property", async () => {
      render(<StyleEditor value="" onChange={mockOnChange} />);

      const addButton = screen.getByRole("button", { name: /add style/i });
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("should join multiple entries with semicolon and space", async () => {
      render(
        <StyleEditor value="color: red; margin: 10px" onChange={mockOnChange} />
      );

      const selects = screen.getAllByTestId(/style-property-/);
      fireEvent.change(selects[0], { target: { value: "padding" } });

      expect(mockOnChange).toHaveBeenCalledWith("padding: red; margin: 10px");
    });
  });

  describe("StyleEntryRow component", () => {
    it("should render property label", () => {
      render(<StyleEditor value="color: red" onChange={mockOnChange} />);
      expect(screen.getByText("Property")).toBeInTheDocument();
    });

    it("should render value input with correct value", () => {
      render(<StyleEditor value="color: red" onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Enter value");
      expect(input).toHaveValue("red");
    });

    it("should apply highlighted class when entry is highlighted", async () => {
      render(<StyleEditor value="" onChange={mockOnChange} />);

      const addButton = screen.getByRole("button", { name: /add style/i });
      fireEvent.click(addButton);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      const entryRow = screen
        .getByTestId(/style-property-/)
        .closest("[class*='entryRow']");
      expect(entryRow?.className).toContain("highlighted");

      act(() => {
        jest.advanceTimersByTime(1000);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle style with colon in value", () => {
      render(
        <StyleEditor
          value="content: url(data:image/png)"
          onChange={mockOnChange}
        />
      );
      const input = screen.getByPlaceholderText("Enter value");
      expect(input).toHaveValue("url(data:image/png)");
    });

    it("should handle whitespace around properties and values", () => {
      render(<StyleEditor value="  color  :  red  " onChange={mockOnChange} />);
      expect(screen.getByTestId(/style-property-/)).toHaveValue("color");
      expect(screen.getByPlaceholderText("Enter value")).toHaveValue("red");
    });
  });
});
