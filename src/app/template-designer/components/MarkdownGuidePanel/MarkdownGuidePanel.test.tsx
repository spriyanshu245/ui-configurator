import { render, screen, fireEvent } from "@testing-library/react";
import MarkdownGuidePanel from "./MarkdownGuidePanel";
import { useTemplateDesigner } from "../../context/TemplateDesignerContext";

jest.mock("../../context/TemplateDesignerContext", () => ({
  useTemplateDesigner: jest.fn(),
}));

describe("MarkdownGuidePanel", () => {
  const mockSetIsMarkdownGuideOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      isMarkdownGuideOpen: true,
      setIsMarkdownGuideOpen: mockSetIsMarkdownGuideOpen,
    });
  });

  it("renders with correct header", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("Markdown & HTML Guide")).toBeInTheDocument();
  });

  it("renders Tips section", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("Tips")).toBeInTheDocument();
    expect(
      screen.getByText("Preview updates in real-time as you type")
    ).toBeInTheDocument();
    expect(
      screen.getByText("FTL expressions are automatically preserved")
    ).toBeInTheDocument();
  });

  it("renders Headings section", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("Headings")).toBeInTheDocument();
    expect(
      screen.getByText("A space is required after the hash symbols.")
    ).toBeInTheDocument();
  });

  it("renders Text Formatting section", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("Text Formatting")).toBeInTheDocument();
    expect(
      screen.getByText("Wrap text with symbols for emphasis:")
    ).toBeInTheDocument();
  });

  it("renders Links section", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("Links")).toBeInTheDocument();
    expect(
      screen.getByText("Create clickable links with text and URL:")
    ).toBeInTheDocument();
  });

  it("renders Lists section", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("Lists")).toBeInTheDocument();
    expect(
      screen.getByText("Create bullet or numbered lists:")
    ).toBeInTheDocument();
  });

  it("renders FTL Variables section", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("FTL Variables")).toBeInTheDocument();
    expect(
      screen.getByText("Access data model fields with dot notation:")
    ).toBeInTheDocument();
  });

  it("renders Math Expressions section", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("Math Expressions")).toBeInTheDocument();
    expect(
      screen.getByText("Arithmetic operations with variables:")
    ).toBeInTheDocument();
  });

  it("renders Date & Time Formatting section", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("Date & Time Formatting")).toBeInTheDocument();
    expect(
      screen.getByText("Use custom patterns for date/time formatting:")
    ).toBeInTheDocument();
  });

  it("renders FTL Directives section", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("FTL Directives")).toBeInTheDocument();
    expect(
      screen.getByText("Control flow for loops and conditions:")
    ).toBeInTheDocument();
  });

  it("renders Inline Styles section", () => {
    render(<MarkdownGuidePanel />);
    expect(screen.getByText("Inline Styles")).toBeInTheDocument();
    expect(
      screen.getByText("Use the Style field for CSS properties:")
    ).toBeInTheDocument();
  });

  it("closes panel when close button is clicked", () => {
    render(<MarkdownGuidePanel />);

    const closeButton = screen.getByRole("button", { name: "Close guide" });
    fireEvent.click(closeButton);

    expect(mockSetIsMarkdownGuideOpen).toHaveBeenCalledWith(false);
  });

  it("closes panel when Escape key is pressed", () => {
    render(<MarkdownGuidePanel />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockSetIsMarkdownGuideOpen).toHaveBeenCalledWith(false);
  });

  it("does not close panel when other keys are pressed", () => {
    render(<MarkdownGuidePanel />);

    fireEvent.keyDown(document, { key: "Enter" });

    expect(mockSetIsMarkdownGuideOpen).not.toHaveBeenCalled();
  });

  it("does not close panel when Escape is pressed but panel is closed", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      isMarkdownGuideOpen: false,
      setIsMarkdownGuideOpen: mockSetIsMarkdownGuideOpen,
    });

    render(<MarkdownGuidePanel />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockSetIsMarkdownGuideOpen).not.toHaveBeenCalled();
  });

  it("applies open class when panel is open", () => {
    render(<MarkdownGuidePanel />);

    const panel = screen.getByText("Markdown & HTML Guide").closest("div");
    expect(panel?.parentElement).toHaveClass("open");
  });

  it("does not apply open class when panel is closed", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      isMarkdownGuideOpen: false,
      setIsMarkdownGuideOpen: mockSetIsMarkdownGuideOpen,
    });

    render(<MarkdownGuidePanel />);

    const panel = screen.getByText("Markdown & HTML Guide").closest("div");
    expect(panel?.parentElement).not.toHaveClass("open");
  });

  it("sets aria-hidden to false when open", () => {
    render(<MarkdownGuidePanel />);

    const panel = screen.getByText("Markdown & HTML Guide").closest("div");
    expect(panel?.parentElement).toHaveAttribute("aria-hidden", "false");
  });

  it("sets aria-hidden to true when closed", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      isMarkdownGuideOpen: false,
      setIsMarkdownGuideOpen: mockSetIsMarkdownGuideOpen,
    });

    render(<MarkdownGuidePanel />);

    const panel = screen.getByText("Markdown & HTML Guide").closest("div");
    expect(panel?.parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("sets tabIndex to -1 on panel", () => {
    render(<MarkdownGuidePanel />);

    const panel = screen.getByText("Markdown & HTML Guide").closest("div");
    expect(panel?.parentElement).toHaveAttribute("tabIndex", "-1");
  });

  it("focuses panel when opened", () => {
    const { rerender } = render(<MarkdownGuidePanel />);

    const panel = screen
      .getByText("Markdown & HTML Guide")
      .closest("div")?.parentElement;

    expect(document.activeElement).toBe(panel);

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      isMarkdownGuideOpen: false,
      setIsMarkdownGuideOpen: mockSetIsMarkdownGuideOpen,
    });

    rerender(<MarkdownGuidePanel />);

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      isMarkdownGuideOpen: true,
      setIsMarkdownGuideOpen: mockSetIsMarkdownGuideOpen,
    });

    rerender(<MarkdownGuidePanel />);

    expect(document.activeElement).toBe(panel);
  });

  it("cleans up event listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");

    const { unmount } = render(<MarkdownGuidePanel />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
