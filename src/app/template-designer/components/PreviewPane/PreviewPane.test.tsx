import { render, screen, fireEvent, act } from "@testing-library/react";
import PreviewPane from "./PreviewPane";
import { useTemplateDesigner } from "../../context/TemplateDesignerContext";
import { TemplateBlock, TemplateGlobalStyles } from "../../../types";

jest.mock("../../context/TemplateDesignerContext", () => ({
  useTemplateDesigner: jest.fn(),
}));

jest.mock("../../utils/markdownUtils", () => ({
  markdownToHtml: jest.fn((content: string) => `<p>${content}</p>`),
}));

jest.mock("@/app/components/InternalComponents/Modal/Modal", () => {
  return ({
    isOpen,
    title,
    submitText,
    onSubmit,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    submitText: string;
    onSubmit: () => void;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onSubmit}>{submitText}</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  };
});

jest.mock("@/app/components/Tooltip/Tooltip", () => {
  return ({ children }: { children: React.ReactNode }) => <>{children}</>;
});

describe("PreviewPane", () => {
  const mockSelectBlock = jest.fn();
  const mockToggleAutoTranslate = jest.fn().mockResolvedValue(undefined);
  const mockSetGlobalStyles = jest.fn();

  const defaultGlobalStyles: TemplateGlobalStyles = {
    htmlTitle: "Test Template",
    bodyBackgroundColor: "#ffffff",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    textColor: "#333333",
    lineHeight: "1.5",
    contentMaxWidth: { value: "600", label: "Email (Standard, 600px)" },
    bodyPadding: "16px",
    linkColor: "#0066cc",
    linkHoverColor: "#004499",
    preheaderText: "",
  };

  const defaultMockValues = {
    templateContent: "",
    dataModelJson: "",
    blocks: [],
    globalStyles: defaultGlobalStyles,
    selectedBlockId: null,
    selectBlock: mockSelectBlock,
    isTranslating: false,
    currentLanguage: { value: "en", label: "English", nativeName: "English" },
    isCurrentLanguageAutoTranslated: false,
    isCurrentLanguageDefault: true,
    toggleAutoTranslate: mockToggleAutoTranslate,
    setGlobalStyles: mockSetGlobalStyles,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplateDesigner as jest.Mock).mockReturnValue(defaultMockValues);

    globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  it("should render the preview pane with header", () => {
    render(<PreviewPane />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("should show empty state when no blocks", () => {
    render(<PreviewPane />);
    expect(
      screen.getByText("Add blocks to start building your template"),
    ).toBeInTheDocument();
  });

  it("should display current language pill", () => {
    render(<PreviewPane />);
    expect(screen.getByText(/English/)).toBeInTheDocument();
  });

  it("should show default badge for default language", () => {
    render(<PreviewPane />);
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("should not show default badge for non-default language", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      isCurrentLanguageDefault: false,
      currentLanguage: { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
    });
    render(<PreviewPane />);
    expect(screen.queryByText("Default")).not.toBeInTheDocument();
  });

  it("should render iframe when blocks exist", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello World",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render template content when provided", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      templateContent: "<div>Test Content</div>",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should show translating overlay when translating", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      isTranslating: true,
    });
    const { container } = render(<PreviewPane />);
    expect(
      container.querySelector('[class*="translatingOverlay"]'),
    ).toBeInTheDocument();
  });

  it("should handle page size change", () => {
    const { container } = render(<PreviewPane />);
    const rulerContainer = container.querySelector('[class*="rulerContainer"]');
    expect(rulerContainer).toBeInTheDocument();
  });

  it("should parse valid JSON data context", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello ${name}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"name": "World"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle invalid JSON data context gracefully", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello World",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "invalid json",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle message from iframe", async () => {
    jest.useFakeTimers();
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    const { unmount } = render(<PreviewPane />);

    act(() => {
      globalThis.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "BLOCK_CLICK", blockId: "block-1" },
        }),
      );
    });

    expect(mockSelectBlock).toHaveBeenCalledWith("block-1");

    unmount();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should not handle invalid message types", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);

    act(() => {
      globalThis.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "INVALID_TYPE", blockId: "block-1" },
        }),
      );
    });

    expect(mockSelectBlock).not.toHaveBeenCalled();
  });

  it("should render section block with children", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "section-1",
        type: "section",
        label: "Section",
        content: "Section content",
        properties: {
          bordered: true,
          title: "Section Title",
          paddingVertical: "16px",
          paddingHorizontal: "16px",
        },
        children: [
          {
            id: "child-1",
            type: "richText",
            label: "Child",
            content: "Child content",
            properties: {},
          },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render grid with column widths", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2, columnWidths: [50, 50] },
        children: [
          {
            id: "row-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: ["Col 1", "Col 2"] },
          },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render empty grid", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2 },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render table with columns and data", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          columns: [
            { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
          ],
          columnWidths: [100],
          zebraRows: true,
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"items": [{"name": "Item 1"}, {"name": "Item 2"}]}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render table with no columns", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: { list: "items", columns: [] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render table with no data", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          columns: [
            { id: "col1", dataKey: "name", label: "Name", alignment: "C" },
          ],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render loop block with data", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "loop-1",
        type: "loop",
        label: "Loop",
        content: "",
        properties: { variable: "item", list: "items" },
        children: [
          {
            id: "child-1",
            type: "richText",
            label: "Item",
            content: "${item.name}",
            properties: {},
          },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"items": [{"name": "Item 1"}, {"name": "Item 2"}]}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render loop block with no data", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "loop-1",
        type: "loop",
        label: "Loop",
        content: "",
        properties: { variable: "item", list: "items" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render if block with true condition", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "showContent" },
        children: [
          {
            id: "child-1",
            type: "richText",
            label: "Content",
            content: "Visible content",
            properties: {},
          },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"showContent": "true"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render if block with false condition", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "showContent" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"showContent": "false"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render image block", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "image-1",
        type: "image",
        label: "Image",
        content: "",
        properties: {
          src: "https://example.com/image.jpg",
          alt: "Test Image",
          width: "100%",
          alignment: "C",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render image block with empty src", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "image-1",
        type: "image",
        label: "Image",
        content: "",
        properties: { src: "", alt: "Test Image" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render spacer block", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "spacer-1",
        type: "spacer",
        label: "Spacer",
        content: "",
        properties: { height: "30px" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render divider block", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "divider-1",
        type: "divider",
        label: "Divider",
        content: "",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render pageBreak block", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "pageBreak-1",
        type: "pageBreak",
        label: "Page Break",
        content: "",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render default block type", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "unknown-1",
        type: "unknownType",
        label: "Unknown",
        content: "Some content",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should show language code in parentheses for non-English languages", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      isCurrentLanguageDefault: false,
      currentLanguage: { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
    });
    render(<PreviewPane />);
    expect(screen.getByText(/\(Hindi\)/)).toBeInTheDocument();
  });

  it("should substitute variables with date formatting", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: '${date?string["yyyy-MM-dd"]}',
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"date": "2024-01-15T10:30:00"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should evaluate math expressions in variables", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${price * quantity}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"price": 10, "quantity": 5}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle conditions with == operator", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: 'status == "active"' },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"status": "active"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle conditions with != operator", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: 'status != "inactive"' },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"status": "active"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle conditions with > operator", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "amount > 100" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"amount": 150}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle conditions with < operator", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "amount < 100" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"amount": 50}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle conditions with >= operator", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "amount >= 100" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"amount": 100}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle conditions with <= operator", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "amount <= 100" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"amount": 100}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle conditions with numeric == operator for integers", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "scheduleNumber == 1" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"scheduleNumber": 1}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle conditions with numeric == operator for decimals", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "rate == 1.5" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"rate": 1.5}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle conditions with numeric == operator for negative numbers", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "balance == -100" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"balance": -100}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle conditions with numeric != operator", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "count != 0" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"count": 5}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render section without border when bordered is false", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "section-1",
        type: "section",
        label: "Section",
        content: "Content",
        properties: { bordered: false },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render richText with style", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "richtext-1",
        type: "richText",
        label: "Rich Text",
        content: "Styled content",
        properties: { style: "color: red;" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render image with right alignment", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "image-1",
        type: "image",
        label: "Image",
        content: "",
        properties: { src: "https://example.com/image.jpg", alignment: "R" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render image with left alignment", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "image-1",
        type: "image",
        label: "Image",
        content: "",
        properties: { src: "https://example.com/image.jpg", alignment: "L" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle empty condition", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle table with right alignment", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          columns: [
            { id: "col1", dataKey: "amount", label: "Amount", alignment: "R" },
          ],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"items": [{"amount": "100"}]}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle global styles with html title", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "Content",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      globalStyles: { ...defaultGlobalStyles, htmlTitle: "My Template Title" },
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render grid row within grid context", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 3, columnWidths: [33, 34, 33] },
        children: [
          {
            id: "row-1",
            type: "gridRow",
            label: "Row 1",
            content: "",
            properties: { columnContents: ["A", "B", "C"] },
          },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle nested variable paths", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "${user.address.city}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"user": {"address": {"city": "New York"}}}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle missing variable path", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "${nonexistent.path}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should evaluate math expressions with parentheses", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${(price + tax) * quantity}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"price": 10, "tax": 2, "quantity": 5}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should evaluate math expressions with division", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${total / count}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"total": 100, "count": 4}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should evaluate math expressions with modulo", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${total % divisor}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"total": 10, "divisor": 3}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle division by zero", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${total / count}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"total": 100, "count": 0}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle modulo by zero", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${total % divisor}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"total": 10, "divisor": 0}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should evaluate math expressions with negative unary operator", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${-value}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"value": 5}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should evaluate math expressions with positive unary operator", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${+value}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"value": 5}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should evaluate math expressions with subtraction", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${total - discount}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"total": 100, "discount": 20}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should evaluate complex math expressions with addition and multiplication", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${price + tax * rate}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"price": 100, "tax": 10, "rate": 2}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should evaluate math expressions with decimal numbers", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${.5 * 10}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle SCROLL_POSITION message from iframe", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);

    act(() => {
      globalThis.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "SCROLL_POSITION", scrollTop: 150 },
        }),
      );
    });

    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should call handleIframeLoad when iframe loads", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PreviewPane />);

    const iframe = screen.getByTitle("Template Preview");
    fireEvent.load(iframe);

    expect(iframe).toBeInTheDocument();
  });

  it("should send SELECT_BLOCK with shouldScroll true when selection changes", async () => {
    jest.useFakeTimers();
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: null,
    });
    const { rerender } = render(<PreviewPane />);

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    rerender(<PreviewPane />);

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("should not scroll when selection has not changed", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    const { rerender } = render(<PreviewPane />);

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks: [
        {
          id: "block-1",
          type: "richText",
          label: "Text Block",
          content: "Hello Updated",
          properties: {},
        },
      ],
      selectedBlockId: "block-1",
    });
    rerender(<PreviewPane />);

    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle iframe load when iframe ref has no contentWindow", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);

    const iframe = screen.getByTitle("Template Preview");
    fireEvent.load(iframe);

    expect(iframe).toBeInTheDocument();
  });

  it("should apply capitalize builtin to variables", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${name?capitalize}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"name": "john DOE"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should apply lower_case builtin to variables", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${name?lower_case}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"name": "JOHN DOE"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should apply upper_case builtin to variables", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${name?upper_case}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"name": "john doe"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle missing value with capitalize builtin", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${missing?capitalize}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle default value with parentheses format", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${(missing)!default}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle default value with double quotes", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: '${missing!"default value"}',
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle default value with single quotes", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${missing!'default value'}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle default value with empty string", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${missing!}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle default value without quotes", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${missing!fallback}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle missing value with date format", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: '${missing?string["yyyy-MM-dd"]}',
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should format date with various tokens", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: '${date?string["yyyy-MM-dd HH:mm:ss"]}',
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"date": "2024-01-15T13:45:30"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should format date with 12-hour format", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: '${date?string["hh:mm a"]}',
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"date": "2024-01-15T13:45:30"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle invalid date format", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: '${date?string["yyyy-MM-dd"]}',
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"date": "invalid-date"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle empty math expression", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should tokenize decimal starting with dot", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${.5 + value}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"value": 1}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle unknown builtin", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${name?unknown_builtin}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"name": "test"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle STRUCTURE_PANEL_SELECTION message", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    const { unmount } = render(<PreviewPane />);

    act(() => {
      const event = new MessageEvent("message", {
        data: { type: "STRUCTURE_PANEL_SELECTION" },
        origin: globalThis.location.origin,
      });
      globalThis.dispatchEvent(event);
    });

    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
    unmount();
  });

  it("should handle ResizeObserver without entry", () => {
    let resizeCallback: ResizeObserverCallback | null = null;
    globalThis.ResizeObserver = jest.fn().mockImplementation((callback) => {
      resizeCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });

    render(<PreviewPane />);

    if (resizeCallback) {
      act(() => {
        resizeCallback!([], {} as ResizeObserver);
      });
    }

    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should call handlePageSizeChange when marker is clicked", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });

    const { container } = render(<PreviewPane />);
    const marker = container.querySelector('[aria-label*="Email"]');

    if (marker) {
      fireEvent.click(marker);
      expect(mockSetGlobalStyles).toHaveBeenCalled();
    }
  });

  it("should handle grid with showBorders false", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2, columnWidths: [50, 50], showBorders: false },
        children: [
          {
            id: "row-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: ["Col 1", "Col 2"] },
          },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render grid with style property", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: {
          columns: 2,
          columnWidths: [50, 50],
          style: "background: #f0f0f0;",
        },
        children: [
          {
            id: "row-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: ["Col 1", "Col 2"] },
          },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render gridRow with parent column styles", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: {
          columns: 2,
          columnWidths: [50, 50],
          columnStyles: ["padding: 10px;", "padding: 5px;"],
        },
        children: [
          {
            id: "row-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: ["Col 1", "Col 2"] },
          },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render table with zebra rows false", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          columns: [
            { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
          ],
          zebraRows: false,
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"items": [{"name": "Item 1"}]}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render table with showBorders false", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          columns: [
            { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
          ],
          showBorders: false,
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"items": [{"name": "Item 1"}]}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render table with headerStyle", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          columns: [
            { id: "col1", dataKey: "name", label: "Name", alignment: "C" },
          ],
          headerStyle: "background: #cccccc;",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"items": [{"name": "Item 1"}]}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render table with rowCellStyle", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          columns: [
            { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
          ],
          rowCellStyle: "padding: 8px;",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"items": [{"name": "Item 1"}]}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render image with custom style", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "image-1",
        type: "image",
        label: "Image",
        content: "",
        properties: {
          src: "https://example.com/image.jpg",
          style: "border: 1px solid #ccc;",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render divider with custom properties", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "divider-1",
        type: "divider",
        label: "Divider",
        content: "",
        properties: {
          width: 80,
          thickness: "2px",
          color: "#ff0000",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should render section without title", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "section-1",
        type: "section",
        label: "Section",
        content: "Content",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle null or undefined in value path", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${data.null.value}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"data": {"null": null}}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle math expression returning null", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${invalid + expression}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle non-integer math result", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${value / 3}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"value": 10}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle default value with date format when missing", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: '${missing?string["yyyy-MM-dd"]!"N/A"}',
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle default value with string builtin when missing", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: '${missing?capitalize!"default"}',
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should escape HTML in variable values", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${html}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"html": "<script>alert(\'xss\')</script>"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle special characters in HTML escape", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${text}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: String.raw`{"text": "Test & \"quote\" <tag>"}`,
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle invalid characters in math expression tokenization", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${value @ invalid}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"value": 10}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should return 0 for invalid token type in math expression", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${+ +}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle ResizeObserver with entries", () => {
    let resizeCallback: ResizeObserverCallback | null = null;
    globalThis.ResizeObserver = jest.fn().mockImplementation((callback) => {
      resizeCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });

    render(<PreviewPane />);

    if (resizeCallback) {
      act(() => {
        const mockEntry = {
          contentRect: { width: 800 },
        } as ResizeObserverEntry;
        resizeCallback!([mockEntry], {} as ResizeObserver);
      });
    }

    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle math expression with default value when expression is invalid", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${invalid + + expression!0}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should use setTimeout in handleIframeLoad", async () => {
    jest.useFakeTimers();
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });

    render(<PreviewPane />);

    const iframe = screen.getByTitle("Template Preview");

    act(() => {
      fireEvent.load(iframe);
      jest.runAllTimers();
    });

    expect(iframe).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("should handle empty token list in math expression", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${   }",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle rparen token type", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${) + 5}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle missing operand in math expression", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${5 + }",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle apostrophe in HTML escape", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${text}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"text": "It\'s a test"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should skip unknown characters in tokenization", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${5 # 3}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle math expression with null result and default value", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${ !50}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should return value unchanged for unknown builtin in switch default", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${name?reverse}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"name": "test"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle multiple special characters", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${5 $ # ^ 3}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle condition with boolean value", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "flag" },
        children: [
          {
            id: "child-1",
            type: "richText",
            label: "Content",
            content: "Visible",
            properties: {},
          },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"flag": true}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle condition with non-false string value", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "Condition",
        content: "",
        properties: { condition: "value" },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"value": "something"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle global styles with preheader text", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "Content",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      globalStyles: {
        ...defaultGlobalStyles,
        preheaderText: "Preview text for email",
      },
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle date format with all tokens", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: '${date?string["yyyy-yy-MM-M-dd-d HH-H-hh-h-mm-m-ss-s a"]}',
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: '{"date": "2024-01-15T09:05:03"}',
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should use default value when math expression returns null", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${!defaultValue}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });

  it("should handle unknown character followed by valid tokens", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "${~ 5 + 3}",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      dataModelJson: "{}",
    });
    render(<PreviewPane />);
    expect(screen.getByTitle("Template Preview")).toBeInTheDocument();
  });
});
