import { render, screen, fireEvent } from "@testing-library/react";
import DataModelPanel from "./DataModelPanel";
import { useTemplateDesigner } from "../../context/TemplateDesignerContext";

jest.mock("../../context/TemplateDesignerContext", () => ({
  useTemplateDesigner: jest.fn(),
}));

describe("DataModelPanel", () => {
  const mockSetDataModelJson = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      dataModelJson: "",
      setDataModelJson: mockSetDataModelJson,
    });
  });

  it("should render the panel with header", () => {
    render(<DataModelPanel />);

    expect(screen.getByText("Data Model")).toBeInTheDocument();
  });

  it("should render collapsed by default", () => {
    render(<DataModelPanel />);

    expect(
      screen.queryByPlaceholderText("Enter JSON data model")
    ).not.toBeInTheDocument();
  });

  it("should expand when header is clicked", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);

    expect(
      screen.getByPlaceholderText("Enter JSON data model")
    ).toBeInTheDocument();
  });

  it("should collapse when header is clicked again", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);
    fireEvent.click(header);

    expect(
      screen.queryByPlaceholderText("Enter JSON data model")
    ).not.toBeInTheDocument();
  });

  it("should display existing dataModelJson value", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      dataModelJson: '{"name": "test"}',
      setDataModelJson: mockSetDataModelJson,
    });

    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);

    const textarea = screen.getByPlaceholderText("Enter JSON data model");
    expect(textarea).toHaveValue('{"name": "test"}');
  });

  it("should call setDataModelJson on change", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);

    const textarea = screen.getByPlaceholderText("Enter JSON data model");
    fireEvent.change(textarea, { target: { value: '{"key": "value"}' } });

    expect(mockSetDataModelJson).toHaveBeenCalledWith('{"key": "value"}');
  });

  it("should not show error for valid JSON", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);

    const textarea = screen.getByPlaceholderText("Enter JSON data model");
    fireEvent.change(textarea, { target: { value: '{"valid": true}' } });

    expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();
  });

  it("should show error for invalid JSON", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);

    const textarea = screen.getByPlaceholderText("Enter JSON data model");
    fireEvent.change(textarea, { target: { value: "invalid json" } });

    expect(screen.getByText("Invalid JSON")).toBeInTheDocument();
  });

  it("should clear error when JSON becomes valid", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);

    const textarea = screen.getByPlaceholderText("Enter JSON data model");
    fireEvent.change(textarea, { target: { value: "invalid" } });
    expect(screen.getByText("Invalid JSON")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: '{"valid": true}' } });
    expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();
  });

  it("should not show error for empty string", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);

    const textarea = screen.getByPlaceholderText("Enter JSON data model");
    fireEvent.change(textarea, { target: { value: "" } });

    expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();
  });

  it("should not show error for whitespace only", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);

    const textarea = screen.getByPlaceholderText("Enter JSON data model");
    fireEvent.change(textarea, { target: { value: "   " } });

    expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();
  });

  it("should have spellCheck disabled on textarea", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);

    const textarea = screen.getByPlaceholderText("Enter JSON data model");
    expect(textarea).toHaveAttribute("spellcheck", "false");
  });

  it("should apply error class to textarea when error exists", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    fireEvent.click(header);

    const textarea = screen.getByPlaceholderText("Enter JSON data model");
    fireEvent.change(textarea, { target: { value: "invalid" } });

    expect(textarea.className).toContain("hasError");
  });

  it("should render chevron icon", () => {
    render(<DataModelPanel />);

    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should toggle chevron expanded state", () => {
    render(<DataModelPanel />);

    const header = screen.getByRole("button", { name: /data model/i });
    const chevronWrapper = document.querySelector(".chevron");

    expect(chevronWrapper?.classList.contains("expanded")).toBe(false);

    fireEvent.click(header);

    expect(chevronWrapper?.classList.contains("expanded")).toBe(true);
  });
});
