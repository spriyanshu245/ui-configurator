import { render, screen, fireEvent } from "@testing-library/react";
import AvailableBlocksPanel from "./AvailableBlocksPanel";
import { useTemplateDesigner } from "../../context/TemplateDesignerContext";
import { availableBlocks } from "@/app/template-designer/data/availableBlocks";

jest.mock("../../context/TemplateDesignerContext", () => ({
  useTemplateDesigner: jest.fn(),
}));

describe("AvailableBlocksPanel", () => {
  const mockAddBlock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      addBlock: mockAddBlock,
      selectedBlockId: null,
      blocks: [],
    });
  });

  it("should render the panel with header", () => {
    render(<AvailableBlocksPanel />);

    expect(screen.getByText("Available Blocks")).toBeInTheDocument();
  });

  it("should render all available blocks", () => {
    render(<AvailableBlocksPanel />);

    availableBlocks.forEach((block) => {
      expect(screen.getByText(block.label)).toBeInTheDocument();
      expect(screen.getByText(block.description)).toBeInTheDocument();
    });
  });

  it("should add block when clicked", () => {
    render(<AvailableBlocksPanel />);

    const firstBlock = screen.getByText("Section").closest('[role="button"]');
    fireEvent.click(firstBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "section",
        label: "Section",
      }),
      undefined,
      undefined
    );
  });

  it("should add block when Enter key is pressed", () => {
    render(<AvailableBlocksPanel />);

    const firstBlock = screen.getByText("Section").closest('[role="button"]');
    fireEvent.keyDown(firstBlock!, { key: "Enter" });

    expect(mockAddBlock).toHaveBeenCalled();
  });

  it("should add block when Space key is pressed", () => {
    render(<AvailableBlocksPanel />);

    const firstBlock = screen.getByText("Section").closest('[role="button"]');
    fireEvent.keyDown(firstBlock!, { key: " " });

    expect(mockAddBlock).toHaveBeenCalled();
  });

  it("should not add block when other key is pressed", () => {
    render(<AvailableBlocksPanel />);

    const firstBlock = screen.getByText("Section").closest('[role="button"]');
    fireEvent.keyDown(firstBlock!, { key: "Tab" });

    expect(mockAddBlock).not.toHaveBeenCalled();
  });

  it("should set drag data on drag start", () => {
    render(<AvailableBlocksPanel />);

    const firstBlock = screen.getByText("Section").closest('[role="button"]');
    const setData = jest.fn();
    fireEvent.dragStart(firstBlock!, {
      dataTransfer: {
        setData,
        effectAllowed: "",
      },
    });

    expect(setData).toHaveBeenCalledWith(
      "application/json",
      expect.any(String)
    );
  });

  it("should add block with parentId when container block is selected", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      addBlock: mockAddBlock,
      selectedBlockId: "section-1",
      blocks: [
        {
          id: "section-1",
          type: "section",
          label: "Section",
          children: [],
        },
      ],
    });

    render(<AvailableBlocksPanel />);

    const richTextBlock = screen
      .getByText("Rich Text")
      .closest('[role="button"]');
    fireEvent.click(richTextBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "richText",
      }),
      "section-1",
      undefined
    );
  });

  it("should add block with afterBlockId when non-container block is selected", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      addBlock: mockAddBlock,
      selectedBlockId: "richText-1",
      blocks: [
        {
          id: "richText-1",
          type: "richText",
          label: "Rich Text",
        },
      ],
    });

    render(<AvailableBlocksPanel />);

    const gridBlock = screen.getByText("Grid").closest('[role="button"]');
    fireEvent.click(gridBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "grid",
      }),
      undefined,
      "richText-1"
    );
  });

  it("should find nested selected block", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      addBlock: mockAddBlock,
      selectedBlockId: "nested-richText",
      blocks: [
        {
          id: "section-1",
          type: "section",
          label: "Section",
          children: [
            {
              id: "nested-richText",
              type: "richText",
              label: "Rich Text",
            },
          ],
        },
      ],
    });

    render(<AvailableBlocksPanel />);

    const tableBlock = screen.getByText("Table").closest('[role="button"]');
    fireEvent.click(tableBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "table",
      }),
      undefined,
      "nested-richText"
    );
  });

  it("should handle deeply nested blocks", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      addBlock: mockAddBlock,
      selectedBlockId: "deep-block",
      blocks: [
        {
          id: "section-1",
          type: "section",
          label: "Section",
          children: [
            {
              id: "loop-1",
              type: "loop",
              label: "Loop",
              children: [
                {
                  id: "deep-block",
                  type: "richText",
                  label: "Deep Text",
                },
              ],
            },
          ],
        },
      ],
    });

    render(<AvailableBlocksPanel />);

    const gridBlock = screen.getByText("Grid").closest('[role="button"]');
    fireEvent.click(gridBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "grid",
      }),
      undefined,
      "deep-block"
    );
  });

  it("should handle loop container type", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      addBlock: mockAddBlock,
      selectedBlockId: "loop-1",
      blocks: [
        {
          id: "loop-1",
          type: "loop",
          label: "Loop",
          children: [],
        },
      ],
    });

    render(<AvailableBlocksPanel />);

    const richTextBlock = screen
      .getByText("Rich Text")
      .closest('[role="button"]');
    fireEvent.click(richTextBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "richText",
      }),
      "loop-1",
      undefined
    );
  });

  it("should handle if container type", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      addBlock: mockAddBlock,
      selectedBlockId: "if-1",
      blocks: [
        {
          id: "if-1",
          type: "if",
          label: "If",
          children: [],
        },
      ],
    });

    render(<AvailableBlocksPanel />);

    const richTextBlock = screen
      .getByText("Rich Text")
      .closest('[role="button"]');
    fireEvent.click(richTextBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "richText",
      }),
      "if-1",
      undefined
    );
  });

  it("should handle non-existent selectedBlockId", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      addBlock: mockAddBlock,
      selectedBlockId: "non-existent",
      blocks: [
        {
          id: "section-1",
          type: "section",
          label: "Section",
        },
      ],
    });

    render(<AvailableBlocksPanel />);

    const richTextBlock = screen
      .getByText("Rich Text")
      .closest('[role="button"]');
    fireEvent.click(richTextBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "richText",
      }),
      undefined,
      undefined
    );
  });

  it("should add container block with empty children", () => {
    render(<AvailableBlocksPanel />);

    const loopBlock = screen.getByText("Loop").closest('[role="button"]');
    fireEvent.click(loopBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "loop",
        children: [],
      }),
      undefined,
      undefined
    );
  });

  it("should add non-container block without children property", () => {
    render(<AvailableBlocksPanel />);

    const richTextBlock = screen
      .getByText("Rich Text")
      .closest('[role="button"]');
    fireEvent.click(richTextBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "richText",
        children: undefined,
      }),
      undefined,
      undefined
    );
  });

  it("should copy default properties for new blocks", () => {
    render(<AvailableBlocksPanel />);

    const sectionBlock = screen.getByText("Section").closest('[role="button"]');
    fireEvent.click(sectionBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          title: "",
          bordered: true,
        }),
      }),
      undefined,
      undefined
    );
  });

  it("should render block items as draggable", () => {
    render(<AvailableBlocksPanel />);

    const blockItems = screen
      .getAllByRole("button")
      .filter((el) => el.classList.contains("blockItem"));
    blockItems.forEach((item) => {
      expect(item).toHaveAttribute("draggable", "true");
    });
  });

  it("should render block items with tabIndex", () => {
    render(<AvailableBlocksPanel />);

    const blockItems = screen
      .getAllByRole("button")
      .filter((el) => el.classList.contains("blockItem"));
    blockItems.forEach((item) => {
      expect(item).toHaveAttribute("tabIndex", "0");
    });
  });

  it("should add block with afterBlockId when grid block is selected", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      addBlock: mockAddBlock,
      selectedBlockId: "grid-1",
      blocks: [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid",
          children: [],
        },
      ],
    });

    render(<AvailableBlocksPanel />);

    const richTextBlock = screen
      .getByText("Rich Text")
      .closest('[role="button"]');
    fireEvent.click(richTextBlock!);

    expect(mockAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "richText",
      }),
      undefined,
      "grid-1"
    );
  });

  it("should toggle panel expansion when header is clicked", () => {
    render(<AvailableBlocksPanel />);

    const header = screen.getByText("Available Blocks").closest("button");

    expect(screen.getByText("Section")).toBeInTheDocument();

    fireEvent.click(header!);

    expect(screen.queryByText("Section")).not.toBeInTheDocument();

    fireEvent.click(header!);

    expect(screen.getByText("Section")).toBeInTheDocument();
  });
});
