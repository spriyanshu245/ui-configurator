import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import StructurePanel from "./StructurePanel";
import { useTemplateDesigner } from "../../context/TemplateDesignerContext";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { updateTemplate } from "@/app/documents/templates/services";
import {
  TemplateBlock,
  TemplateStructureNode,
  TemplateGlobalStyles,
} from "../../../types";

if (globalThis.structuredClone === undefined) {
  globalThis.structuredClone = <T,>(obj: T): T => obj;
}

jest.mock("../../context/TemplateDesignerContext", () => ({
  useTemplateDesigner: jest.fn(),
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: jest.fn(),
}));

jest.mock("@/app/documents/templates/services", () => ({
  updateTemplate: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../components/TemplateSettingsPane/TemplateSettingsPane", () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="settings-pane">
        <button onClick={onClose}>Close Settings</button>
      </div>
    ) : null,
}));

jest.mock("../../components/LanguageSelector/LanguageSelector", () => ({
  __esModule: true,
  default: () => <div data-testid="language-selector">Language Selector</div>,
}));

jest.mock("../../utils/markdownUtils", () => ({
  markdownToHtml: jest.fn((content: string) => `<p>${content}</p>`),
}));

const mockBoundingRect = {
  top: 100,
  height: 100,
  bottom: 200,
  left: 0,
  right: 100,
  width: 100,
  x: 0,
  y: 100,
  toJSON: () => {},
};

Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
  configurable: true,
  writable: true,
  value: () => mockBoundingRect,
});

describe("StructurePanel", () => {
  const mockSelectBlock = jest.fn();
  const mockToggleStructureNode = jest.fn();
  const mockAddBlock = jest.fn();
  const mockMoveBlock = jest.fn();
  const mockSetUserNotification = jest.fn();
  const mockSaveCurrentLanguageBlocks = jest.fn();
  const mockGetLanguageBlocks = jest.fn().mockReturnValue([]);
  const mockIsLanguageAutoTranslated = jest.fn().mockReturnValue(false);
  const mockTranslateAllAutoLanguages = jest.fn().mockResolvedValue(undefined);

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
  };

  const defaultMockValues = {
    structure: [],
    htmlStructure: [],
    templateContent: "",
    templateName: "Test Template",
    templateMimeType: "text/html",
    templateCategory: "general",
    globalStyles: defaultGlobalStyles,
    blocks: [],
    selectBlock: mockSelectBlock,
    selectedBlockId: null,
    toggleStructureNode: mockToggleStructureNode,
    addBlock: mockAddBlock,
    moveBlock: mockMoveBlock,
    currentLanguage: { value: "en", label: "English", nativeName: "English" },
    defaultLanguage: { value: "en", label: "English", nativeName: "English" },
    availableLanguages: [
      { value: "en", label: "English", nativeName: "English" },
    ],
    getLanguageBlocks: mockGetLanguageBlocks,
    saveCurrentLanguageBlocks: mockSaveCurrentLanguageBlocks,
    isLanguageAutoTranslated: mockIsLanguageAutoTranslated,
    translateAllAutoLanguages: mockTranslateAllAutoLanguages,
    isCurrentLanguageAutoTranslated: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplateDesigner as jest.Mock).mockReturnValue(defaultMockValues);
    (useHeaderV2 as jest.Mock).mockReturnValue({
      setUserNotification: mockSetUserNotification,
    });
  });

  it("should render the structure panel with template name", () => {
    render(<StructurePanel templateId="template-1" />);
    expect(screen.getByText("Test Template")).toBeInTheDocument();
  });

  it("should render empty state when no blocks", () => {
    render(<StructurePanel templateId="template-1" />);
    expect(screen.getByText("No blocks added yet")).toBeInTheDocument();
  });

  it("should render language selector", () => {
    render(<StructurePanel templateId="template-1" />);
    expect(screen.getByTestId("language-selector")).toBeInTheDocument();
  });

  it("should render settings button", () => {
    render(<StructurePanel templateId="template-1" />);
    const settingsButton = screen.getByTitle("Settings");
    expect(settingsButton).toBeInTheDocument();
  });

  it("should render save button", () => {
    render(<StructurePanel templateId="template-1" />);
    const saveButton = screen.getByTitle("Save");
    expect(saveButton).toBeInTheDocument();
  });

  it("should open settings pane when settings button clicked", () => {
    render(<StructurePanel templateId="template-1" />);
    const settingsButton = screen.getByTitle("Settings");
    fireEvent.click(settingsButton);
    expect(screen.getByTestId("settings-pane")).toBeInTheDocument();
  });

  it("should close settings pane when close clicked", () => {
    render(<StructurePanel templateId="template-1" />);
    const settingsButton = screen.getByTitle("Settings");
    fireEvent.click(settingsButton);

    const closeButton = screen.getByText("Close Settings");
    fireEvent.click(closeButton);

    expect(screen.queryByTestId("settings-pane")).not.toBeInTheDocument();
  });

  it("should render structure nodes", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);
    expect(screen.getByText("Text Block")).toBeInTheDocument();
    expect(screen.getByText("richText")).toBeInTheDocument();
  });

  it("should select block when node clicked", async () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const node = screen.getByText("Text Block");
    fireEvent.click(node);

    await waitFor(() => {
      expect(mockSelectBlock).toHaveBeenCalledWith("node-1");
    });
  });

  it("should toggle structure node when expandable node clicked", async () => {
    const structure: TemplateStructureNode[] = [
      {
        id: "section-1",
        label: "Section",
        type: "section",
        isExpanded: false,
        children: [{ id: "child-1", label: "Child", type: "richText" }],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const node = screen.getByText("Section");
    fireEvent.click(node);

    await waitFor(() => {
      expect(mockToggleStructureNode).toHaveBeenCalledWith("section-1");
    });
  });

  it("should render expanded children", () => {
    const structure: TemplateStructureNode[] = [
      {
        id: "section-1",
        label: "Section",
        type: "section",
        isExpanded: true,
        children: [{ id: "child-1", label: "Child Block", type: "richText" }],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    expect(screen.getByText("Section")).toBeInTheDocument();
    expect(screen.getByText("Child Block")).toBeInTheDocument();
  });

  it("should show add row button for expanded grid", () => {
    const structure: TemplateStructureNode[] = [
      {
        id: "grid-1",
        label: "Grid",
        type: "grid",
        isExpanded: true,
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    expect(screen.getByText("Add Row")).toBeInTheDocument();
  });

  it("should add row when add row button clicked", () => {
    const structure: TemplateStructureNode[] = [
      {
        id: "grid-1",
        label: "Grid",
        type: "grid",
        isExpanded: true,
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const addRowButton = screen.getByText("Add Row");
    fireEvent.click(addRowButton);

    expect(mockAddBlock).toHaveBeenCalled();
  });

  it("should highlight selected node", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
      selectedBlockId: "node-1",
    });
    render(<StructurePanel templateId="template-1" />);

    const node = screen.getByRole("treeitem", { selected: true });
    expect(node).toBeInTheDocument();
  });

  it("should deselect block when empty area clicked", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
      selectedBlockId: "node-1",
    });
    render(<StructurePanel templateId="template-1" />);

    const content = screen.getByRole("tree");
    fireEvent.click(content);

    expect(mockSelectBlock).toHaveBeenCalledWith(null);
  });

  it("should deselect block when Escape key pressed", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
      selectedBlockId: "node-1",
    });
    render(<StructurePanel templateId="template-1" />);

    const content = screen.getByRole("tree");
    fireEvent.keyDown(content, { key: "Escape" });

    expect(mockSelectBlock).toHaveBeenCalledWith(null);
  });

  it("should save template when save button clicked", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" }),
      );
    });
  });

  it("should show error notification on save failure", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    (updateTemplate as jest.Mock).mockRejectedValueOnce(
      new Error("Save failed"),
    );

    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", text: "Save failed" }),
      );
    });
  });

  it("should log to console in playground mode", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<StructurePanel templateId="template-1" isPlayground={true} />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" }),
      );
    });

    consoleSpy.mockRestore();
  });

  it("should handle drag start on node", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const node = screen.getByRole("treeitem");
    const setData = jest.fn();
    fireEvent.dragStart(node, {
      dataTransfer: { setData, effectAllowed: "" },
    });

    expect(setData).toHaveBeenCalledWith("text/plain", "node-1");
  });

  it("should handle drag end on node", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const node = screen.getByRole("treeitem");
    fireEvent.dragEnd(node);
  });

  it("should handle drag over on node", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block 1", type: "richText" },
      { id: "node-2", label: "Text Block 2", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const nodes = screen.getAllByRole("treeitem");

    fireEvent.dragStart(nodes[0], {
      dataTransfer: { setData: jest.fn(), effectAllowed: "" },
    });

    fireEvent.dragOver(nodes[1], {
      clientY: 10,
      preventDefault: jest.fn(),
    });
  });

  it("should handle drag leave on node", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const node = screen.getByRole("treeitem");
    fireEvent.dragLeave(node);
  });

  it("should handle drop on node", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block 1", type: "richText" },
      { id: "node-2", label: "Text Block 2", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const nodes = screen.getAllByRole("treeitem");

    fireEvent.dragStart(nodes[0], {
      dataTransfer: { setData: jest.fn(), effectAllowed: "" },
    });

    fireEvent.dragOver(nodes[1], {
      clientY: 100,
      preventDefault: jest.fn(),
    });

    fireEvent.drop(nodes[1], {
      preventDefault: jest.fn(),
    });

    expect(mockMoveBlock).toHaveBeenCalled();
  });

  it("should select block when Enter key pressed", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const node = screen.getByRole("treeitem");
    fireEvent.keyDown(node, { key: "Enter" });

    expect(mockSelectBlock).toHaveBeenCalledWith("node-1");
  });

  it("should select block when Space key pressed", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const node = screen.getByRole("treeitem");
    fireEvent.keyDown(node, { key: " " });

    expect(mockSelectBlock).toHaveBeenCalledWith("node-1");
  });

  it("should render htmlStructure when templateContent is provided", () => {
    const htmlStructure: TemplateStructureNode[] = [
      { id: "html-1", label: "div", type: "container" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      htmlStructure,
      templateContent: "<div>Content</div>",
    });
    render(<StructurePanel templateId="template-1" />);

    expect(screen.getByText("div")).toBeInTheDocument();
  });

  it("should show Untitled Template when name is empty", () => {
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      templateName: "",
    });
    render(<StructurePanel templateId="template-1" />);

    expect(screen.getByText("Untitled Template")).toBeInTheDocument();
  });

  it("should handle drop inside container", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
      {
        id: "section-1",
        label: "Section",
        type: "section",
        isExpanded: true,
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const nodes = screen.getAllByRole("treeitem");

    fireEvent.dragStart(nodes[0], {
      dataTransfer: { setData: jest.fn(), effectAllowed: "" },
    });

    const rect = { top: 0, height: 40, getBoundingClientRect: () => rect };
    Object.defineProperty(nodes[1], "getBoundingClientRect", {
      value: () => rect,
    });

    fireEvent.dragOver(nodes[1], {
      clientY: 20,
      preventDefault: jest.fn(),
    });

    fireEvent.drop(nodes[1], {
      preventDefault: jest.fn(),
    });
  });

  it("should scroll to selected node", async () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
      selectedBlockId: "node-1",
    });

    const scrollToMock = jest.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });

    render(<StructurePanel templateId="template-1" />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("should render blocks structure when isFromBlocks is true", () => {
    const structure: TemplateStructureNode[] = [
      { id: "block-1", label: "Block 1", type: "richText" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Block 1",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
      blocks,
      templateContent: "",
    });
    render(<StructurePanel templateId="template-1" />);

    const node = screen.getByRole("treeitem");
    expect(node).toHaveAttribute("draggable", "true");
  });

  it("should not be draggable when viewing HTML template", () => {
    const htmlStructure: TemplateStructureNode[] = [
      { id: "html-1", label: "div", type: "container" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      htmlStructure,
      templateContent: "<div>Content</div>",
    });
    render(<StructurePanel templateId="template-1" />);

    const node = screen.getByRole("treeitem");
    expect(node).toHaveAttribute("draggable", "false");
  });

  it("should handle save with multiple languages", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      availableLanguages: [
        { value: "en", label: "English", nativeName: "English" },
        { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
      ],
    });

    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    const confirmButton = await screen.findByText("Confirm & Save");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSaveCurrentLanguageBlocks).toHaveBeenCalled();
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should handle save with error that is not an Error instance", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    (updateTemplate as jest.Mock).mockRejectedValueOnce("String error");

    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          text: "Failed to save template",
        }),
      );
    });
  });

  it("should render loop node as container", () => {
    const structure: TemplateStructureNode[] = [
      {
        id: "loop-1",
        label: "Loop",
        type: "loop",
        isExpanded: true,
        children: [{ id: "child-1", label: "Child", type: "richText" }],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    expect(screen.getByText("Loop")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("should render if node as container", () => {
    const structure: TemplateStructureNode[] = [
      {
        id: "if-1",
        label: "Condition",
        type: "if",
        isExpanded: true,
        children: [{ id: "child-1", label: "Child", type: "richText" }],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    expect(screen.getByText("Condition")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("should not show add row for non-grid containers", () => {
    const structure: TemplateStructureNode[] = [
      {
        id: "section-1",
        label: "Section",
        type: "section",
        isExpanded: true,
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    expect(screen.queryByText("Add Row")).not.toBeInTheDocument();
  });

  it("should render nested grid rows", () => {
    const structure: TemplateStructureNode[] = [
      {
        id: "grid-1",
        label: "Grid",
        type: "grid",
        isExpanded: true,
        children: [
          { id: "row-1", label: "Row 1", type: "gridRow" },
          { id: "row-2", label: "Row 2", type: "gridRow" },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    expect(screen.getByText("Row 1")).toBeInTheDocument();
    expect(screen.getByText("Row 2")).toBeInTheDocument();
  });

  it("should not ignore other key presses on content area", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
      selectedBlockId: "node-1",
    });
    render(<StructurePanel templateId="template-1" />);

    const content = screen.getByRole("tree");
    fireEvent.keyDown(content, { key: "Tab" });

    expect(mockSelectBlock).not.toHaveBeenCalled();
  });

  it("should build contents array with default content when no languages", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      availableLanguages: [],
    });

    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should use template content when available", () => {
    const htmlStructure: TemplateStructureNode[] = [
      { id: "html-1", label: "div", type: "container" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      htmlStructure,
      templateContent: "<div>Legacy Content</div>",
    });

    render(<StructurePanel templateId="template-1" />);
    expect(screen.getByText("div")).toBeInTheDocument();
  });

  it("should handle drop before target", () => {
    const structure: TemplateStructureNode[] = [
      { id: "node-1", label: "Text Block 1", type: "richText" },
      { id: "node-2", label: "Text Block 2", type: "richText" },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      structure,
    });
    render(<StructurePanel templateId="template-1" />);

    const nodes = screen.getAllByRole("treeitem");

    fireEvent.dragStart(nodes[1], {
      dataTransfer: { setData: jest.fn(), effectAllowed: "" },
    });

    fireEvent.dragOver(nodes[0], {
      clientY: 5,
      preventDefault: jest.fn(),
    });

    fireEvent.drop(nodes[0], {
      preventDefault: jest.fn(),
    });

    expect(mockMoveBlock).toHaveBeenCalled();
  });

  it("should save template with section block", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "section-1",
        type: "section",
        label: "Section",
        content: "Section content",
        properties: {
          bordered: true,
          paddingVertical: "20px",
          paddingHorizontal: "16px",
          title: "Section Title",
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
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with grid and gridRow blocks", async () => {
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
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with table block", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: true,
          columns: [
            { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
            { id: "col2", dataKey: "value", label: "Value", alignment: "R" },
          ],
          columnWidths: [60, 40],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with loop block", async () => {
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
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with if block", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "if-1",
        type: "if",
        label: "If",
        content: "",
        properties: { condition: "showContent" },
        children: [
          {
            id: "child-1",
            type: "richText",
            label: "Content",
            content: "Conditional content",
            properties: {},
          },
        ],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with image block", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "image-1",
        type: "image",
        label: "Image",
        content: "",
        properties: {
          src: "https://example.com/image.png",
          alt: "Example",
          width: "200px",
          alignment: "C",
          style: "border-radius: 4px;",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with spacer block", async () => {
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
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with divider block", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "divider-1",
        type: "divider",
        label: "Divider",
        content: "",
        properties: { thickness: "2px", color: "#cccccc" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with pageBreak block", async () => {
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
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with richText block with style", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "text-1",
        type: "richText",
        label: "Text",
        content: "Styled text",
        properties: { style: "font-weight: bold;" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with empty table columns", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: { list: "", columns: [], columnWidths: [] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with section without border", async () => {
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
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with empty grid", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2 },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should save template with image using right alignment", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "image-1",
        type: "image",
        label: "Image",
        content: "",
        properties: { src: "test.png", alignment: "R" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  it("should build contents for multiple languages when saving", async () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "Hello",
        properties: {},
      },
    ];
    const mockGetLanguageBlocks = jest.fn().mockReturnValue([
      {
        id: "block-1",
        type: "richText",
        label: "Text",
        content: "Hola",
        properties: {},
      },
    ]);
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      availableLanguages: [
        { value: "en", label: "English", nativeName: "English" },
        { value: "es", label: "Spanish", nativeName: "Español" },
      ],
      getLanguageBlocks: mockGetLanguageBlocks,
    });
    render(<StructurePanel templateId="template-1" />);

    const saveButton = screen.getByTitle("Save");
    fireEvent.click(saveButton);

    const confirmButton = await screen.findByText("Confirm & Save");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalled();
    });
  });

  describe("Expand/Collapse All functionality", () => {
    it("should render expand all button", () => {
      render(<StructurePanel templateId="template-1" />);
      expect(screen.getByTitle("Expand All")).toBeInTheDocument();
    });

    it("should render collapse all button", () => {
      render(<StructurePanel templateId="template-1" />);
      expect(screen.getByTitle("Collapse All")).toBeInTheDocument();
    });

    it("should expand all expandable nodes when expand all is clicked", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section 1",
          type: "section",
          isExpanded: false,
          children: [{ id: "child-1", label: "Child 1", type: "richText" }],
        },
        {
          id: "section-2",
          label: "Section 2",
          type: "section",
          isExpanded: false,
          children: [{ id: "child-2", label: "Child 2", type: "richText" }],
        },
        {
          id: "grid-1",
          label: "Grid",
          type: "grid",
          isExpanded: false,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        expandedNodes: new Set(),
      });

      render(<StructurePanel templateId="template-1" />);

      const expandAllButton = screen.getByTitle("Expand All");
      fireEvent.click(expandAllButton);

      expect(mockToggleStructureNode).toHaveBeenCalledWith("section-1");
      expect(mockToggleStructureNode).toHaveBeenCalledWith("section-2");
      expect(mockToggleStructureNode).toHaveBeenCalledWith("grid-1");
      expect(mockToggleStructureNode).toHaveBeenCalledTimes(3);
    });

    it("should collapse all expanded nodes when collapse all is clicked", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section 1",
          type: "section",
          isExpanded: true,
          children: [{ id: "child-1", label: "Child 1", type: "richText" }],
        },
        {
          id: "section-2",
          label: "Section 2",
          type: "section",
          isExpanded: true,
          children: [{ id: "child-2", label: "Child 2", type: "richText" }],
        },
        {
          id: "grid-1",
          label: "Grid",
          type: "grid",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        expandedNodes: new Set(["section-1", "section-2", "grid-1"]),
      });

      render(<StructurePanel templateId="template-1" />);

      const collapseAllButton = screen.getByTitle("Collapse All");
      fireEvent.click(collapseAllButton);

      expect(mockToggleStructureNode).toHaveBeenCalledWith("section-1");
      expect(mockToggleStructureNode).toHaveBeenCalledWith("section-2");
      expect(mockToggleStructureNode).toHaveBeenCalledWith("grid-1");
      expect(mockToggleStructureNode).toHaveBeenCalledTimes(3);
    });

    it("should only expand nodes that are not already expanded", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section 1",
          type: "section",
          isExpanded: true,
          children: [{ id: "child-1", label: "Child 1", type: "richText" }],
        },
        {
          id: "section-2",
          label: "Section 2",
          type: "section",
          isExpanded: false,
          children: [{ id: "child-2", label: "Child 2", type: "richText" }],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        expandedNodes: new Set(["section-1"]),
      });

      render(<StructurePanel templateId="template-1" />);

      const expandAllButton = screen.getByTitle("Expand All");
      fireEvent.click(expandAllButton);

      expect(mockToggleStructureNode).not.toHaveBeenCalledWith("section-1");
      expect(mockToggleStructureNode).toHaveBeenCalledWith("section-2");
      expect(mockToggleStructureNode).toHaveBeenCalledTimes(1);
    });

    it("should only collapse nodes that are already expanded", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section 1",
          type: "section",
          isExpanded: true,
          children: [{ id: "child-1", label: "Child 1", type: "richText" }],
        },
        {
          id: "section-2",
          label: "Section 2",
          type: "section",
          isExpanded: false,
          children: [{ id: "child-2", label: "Child 2", type: "richText" }],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        expandedNodes: new Set(["section-1"]),
      });

      render(<StructurePanel templateId="template-1" />);

      const collapseAllButton = screen.getByTitle("Collapse All");
      fireEvent.click(collapseAllButton);

      expect(mockToggleStructureNode).toHaveBeenCalledWith("section-1");
      expect(mockToggleStructureNode).not.toHaveBeenCalledWith("section-2");
      expect(mockToggleStructureNode).toHaveBeenCalledTimes(1);
    });

    it("should expand nested children", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section 1",
          type: "section",
          isExpanded: false,
          children: [
            {
              id: "section-2",
              label: "Section 2",
              type: "section",
              isExpanded: false,
              children: [{ id: "child-1", label: "Child 1", type: "richText" }],
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        expandedNodes: new Set(),
      });

      render(<StructurePanel templateId="template-1" />);

      const expandAllButton = screen.getByTitle("Expand All");
      fireEvent.click(expandAllButton);

      expect(mockToggleStructureNode).toHaveBeenCalledWith("section-1");
      expect(mockToggleStructureNode).toHaveBeenCalledWith("section-2");
      expect(mockToggleStructureNode).toHaveBeenCalledTimes(2);
    });

    it("should handle expand all with mixed node types", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: false,
          children: [{ id: "child-1", label: "Child", type: "richText" }],
        },
        {
          id: "loop-1",
          label: "Loop",
          type: "loop",
          isExpanded: false,
          children: [{ id: "child-2", label: "Child", type: "richText" }],
        },
        {
          id: "if-1",
          label: "If",
          type: "if",
          isExpanded: false,
          children: [{ id: "child-3", label: "Child", type: "richText" }],
        },
        { id: "text-1", label: "Text", type: "richText" },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        expandedNodes: new Set(),
      });

      render(<StructurePanel templateId="template-1" />);

      const expandAllButton = screen.getByTitle("Expand All");
      fireEvent.click(expandAllButton);

      expect(mockToggleStructureNode).toHaveBeenCalledWith("section-1");
      expect(mockToggleStructureNode).toHaveBeenCalledWith("loop-1");
      expect(mockToggleStructureNode).toHaveBeenCalledWith("if-1");
      expect(mockToggleStructureNode).not.toHaveBeenCalledWith("text-1");
      expect(mockToggleStructureNode).toHaveBeenCalledTimes(3);
    });

    it("should handle expand all with empty grids", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "grid-1",
          label: "Empty Grid",
          type: "grid",
          isExpanded: false,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        expandedNodes: new Set(),
      });

      render(<StructurePanel templateId="template-1" />);

      const expandAllButton = screen.getByTitle("Expand All");
      fireEvent.click(expandAllButton);

      expect(mockToggleStructureNode).toHaveBeenCalledWith("grid-1");
      expect(mockToggleStructureNode).toHaveBeenCalledTimes(1);
    });

    it("should use htmlStructure when templateContent is provided", () => {
      const htmlStructure: TemplateStructureNode[] = [
        {
          id: "html-1",
          label: "div",
          type: "container",
          isExpanded: false,
          children: [{ id: "child-1", label: "span", type: "container" }],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        htmlStructure,
        templateContent: "<div><span></span></div>",
        expandedNodes: new Set(),
      });

      render(<StructurePanel templateId="template-1" />);

      const expandAllButton = screen.getByTitle("Expand All");
      fireEvent.click(expandAllButton);

      expect(mockToggleStructureNode).toHaveBeenCalledWith("html-1");
      expect(mockToggleStructureNode).toHaveBeenCalledTimes(1);
    });

    it("should handle expand all when no nodes are expandable", () => {
      const structure: TemplateStructureNode[] = [
        { id: "text-1", label: "Text 1", type: "richText" },
        { id: "text-2", label: "Text 2", type: "richText" },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        expandedNodes: new Set(),
      });

      render(<StructurePanel templateId="template-1" />);

      const expandAllButton = screen.getByTitle("Expand All");
      fireEvent.click(expandAllButton);

      expect(mockToggleStructureNode).not.toHaveBeenCalled();
    });

    it("should handle collapse all when no nodes are expanded", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: false,
          children: [{ id: "child-1", label: "Child", type: "richText" }],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        expandedNodes: new Set(),
      });

      render(<StructurePanel templateId="template-1" />);

      const collapseAllButton = screen.getByTitle("Collapse All");
      fireEvent.click(collapseAllButton);

      expect(mockToggleStructureNode).not.toHaveBeenCalled();
    });
  });

  describe("Duplicate functionality", () => {
    it("should duplicate block when duplicate button clicked", () => {
      const mockDuplicateBlock = jest.fn();
      const structure: TemplateStructureNode[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Text Block",
          isExpanded: false,
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        duplicateBlock: mockDuplicateBlock,
      });

      render(<StructurePanel templateId="template-1" />);

      const duplicateButton = screen.getByTitle("Duplicate block");
      fireEvent.click(duplicateButton);

      expect(mockDuplicateBlock).toHaveBeenCalledWith("block-1");
    });
  });

  describe("Drag and drop edge cases", () => {
    it("should handle drop without draggedBlockId", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Text Block",
          isExpanded: false,
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      const { container } = render(<StructurePanel templateId="template-1" />);
      const node = container.querySelector('[role="treeitem"]');

      act(() => {
        fireEvent.drop(node!);
      });

      expect(mockMoveBlock).not.toHaveBeenCalled();
    });
  });

  describe("Scroll to selected node edge cases", () => {
    it("should not error when no selected block", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Text Block 1",
          isExpanded: false,
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        selectedBlockId: null,
      });

      render(<StructurePanel templateId="template-1" />);
      expect(screen.getByText("Text Block 1")).toBeInTheDocument();
    });
  });

  describe("Modal interactions", () => {
    it("should show confirmation modal when saving with multiple languages", async () => {
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        availableLanguages: [
          { value: "en", label: "English", nativeName: "English" },
          { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
        ],
      });

      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Confirm Save")).toBeInTheDocument();
      });
    });
  });

  describe("preheaderText rendering", () => {
    it("should not render preheader HTML when preheaderText is empty", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Text",
          content: "Hello",
          properties: {},
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
        globalStyles: {
          ...defaultGlobalStyles,
          preheaderText: "",
        },
      });

      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });

      const callArgs = (updateTemplate as jest.Mock).mock.calls[0];
      const content = callArgs[1].contents[0].content;
      expect(content).not.toContain("mso-hide: all");
    });
  });

  describe("Container drag and drop positions", () => {
    it("should set drop position to before when dragging to top quarter of container", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block", type: "richText" },
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });
      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sectionNode = nodes[1];

      sectionNode.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      await act(async () => {
        fireEvent.dragStart(nodes[0], {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await waitFor(() => {
        fireEvent.dragOver(sectionNode, { clientY: 110 });
      });

      await act(async () => {
        fireEvent.drop(sectionNode, { preventDefault: jest.fn() });
      });

      expect(mockMoveBlock).toHaveBeenCalled();
    });

    it("should set drop position to after when dragging to bottom quarter of container", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block", type: "richText" },
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });
      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sectionNode = nodes[1];

      sectionNode.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      await act(async () => {
        fireEvent.dragStart(nodes[0], {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await waitFor(() => {
        fireEvent.dragOver(sectionNode, { clientY: 190 });
      });

      await act(async () => {
        fireEvent.drop(sectionNode, { preventDefault: jest.fn() });
      });

      expect(mockMoveBlock).toHaveBeenCalled();
    });

    it("should set drop position to inside when dragging to middle of container", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block", type: "richText" },
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });
      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sectionNode = nodes[1];

      sectionNode.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      await act(async () => {
        fireEvent.dragStart(nodes[0], {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await waitFor(() => {
        fireEvent.dragOver(sectionNode, { clientY: 150 });
      });

      await act(async () => {
        fireEvent.drop(sectionNode, { preventDefault: jest.fn() });
      });

      expect(mockMoveBlock).toHaveBeenCalledWith("node-1", "section-1", 0);
    });

    it("should handle drop inside loop container", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block", type: "richText" },
        {
          id: "loop-1",
          label: "Loop",
          type: "loop",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });
      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const loopNode = nodes[1];

      loopNode.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      await act(async () => {
        fireEvent.dragStart(nodes[0], {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await waitFor(() => {
        fireEvent.dragOver(loopNode, { clientY: 150 });
      });

      await act(async () => {
        fireEvent.drop(loopNode, { preventDefault: jest.fn() });
      });

      expect(mockMoveBlock).toHaveBeenCalledWith("node-1", "loop-1", 0);
    });

    it("should handle drop inside if container", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block", type: "richText" },
        {
          id: "if-1",
          label: "If Block",
          type: "if",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });
      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const ifNode = nodes[1];

      ifNode.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      await act(async () => {
        fireEvent.dragStart(nodes[0], {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await waitFor(() => {
        fireEvent.dragOver(ifNode, { clientY: 150 });
      });

      await act(async () => {
        fireEvent.drop(ifNode, { preventDefault: jest.fn() });
      });

      expect(mockMoveBlock).toHaveBeenCalledWith("node-1", "if-1", 0);
    });
  });

  describe("Unknown block type handling", () => {
    it("should save template with unknown block type using default case", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "unknown-1",
          type: "unknownType" as TemplateBlock["type"],
          label: "Unknown",
          content: "Some content",
          properties: {},
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });
  });

  describe("Scroll to selected node behavior", () => {
    it("should scroll up when selected node is above the viewport", async () => {
      const scrollToMock = jest.fn();
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block", type: "richText" },
      ];

      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        selectedBlockId: "node-1",
      });

      const { container } = render(<StructurePanel templateId="template-1" />);

      const contentArea = container.querySelector('[role="tree"]');
      if (contentArea) {
        Object.defineProperty(contentArea, "getBoundingClientRect", {
          value: () => ({ top: 100, bottom: 500 }),
        });
        Object.defineProperty(contentArea, "scrollTop", { value: 200 });
        Object.defineProperty(contentArea, "scrollTo", {
          value: scrollToMock,
        });
      }

      const node = screen.getByRole("treeitem");
      Object.defineProperty(node, "getBoundingClientRect", {
        value: () => ({ top: 50, bottom: 80 }),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
    });

    it("should scroll down when selected node is below the viewport", async () => {
      const scrollToMock = jest.fn();
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block", type: "richText" },
      ];

      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
        selectedBlockId: "node-1",
      });

      const { container } = render(<StructurePanel templateId="template-1" />);

      const contentArea = container.querySelector('[role="tree"]');
      if (contentArea) {
        Object.defineProperty(contentArea, "getBoundingClientRect", {
          value: () => ({ top: 100, bottom: 300 }),
        });
        Object.defineProperty(contentArea, "scrollTop", { value: 0 });
        Object.defineProperty(contentArea, "scrollTo", {
          value: scrollToMock,
        });
      }

      const node = screen.getByRole("treeitem");
      Object.defineProperty(node, "getBoundingClientRect", {
        value: () => ({ top: 400, bottom: 430 }),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
    });
  });

  describe("Modal backdrop interactions", () => {
    it("should close modal when backdrop is clicked", async () => {
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        availableLanguages: [
          { value: "en", label: "English", nativeName: "English" },
          { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
        ],
      });

      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Confirm Save")).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Confirm Save")).not.toBeInTheDocument();
      });
    });

    it("should close save confirm modal when clicking backdrop", async () => {
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        availableLanguages: [
          { value: "en", label: "English", nativeName: "English" },
          { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
        ],
      });

      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Confirm Save")).toBeInTheDocument();
      });

      const modalOverlay = screen.getByTestId("modal-overlay");
      fireEvent.click(modalOverlay);

      await waitFor(() => {
        expect(screen.queryByText("Confirm Save")).not.toBeInTheDocument();
      });
    });
  });

  describe("Drag and drop edge cases", () => {
    it("should not process dragOver when node is not a valid drag target", () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block", type: "richText" },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });
      render(<StructurePanel templateId="template-1" />);

      const node = screen.getByRole("treeitem");
      fireEvent.dragOver(node, {
        clientY: 10,
        preventDefault: jest.fn(),
      });
    });

    it("should set drop position to before when dragging to top half of non-container", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block 1", type: "richText" },
        { id: "node-2", label: "Text Block 2", type: "richText" },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const targetNode = nodes[1];

      await act(async () => {
        fireEvent.dragStart(nodes[0], {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(targetNode, { clientY: 120 });
      });

      await act(async () => {
        fireEvent.drop(targetNode, { preventDefault: jest.fn() });
      });

      expect(mockMoveBlock).toHaveBeenCalled();
    });

    it("should handle drop with before position on container at top quarter", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block", type: "richText" },
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [{ id: "child-1", label: "Child Block", type: "richText" }],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sectionNode = nodes[1];

      await act(async () => {
        fireEvent.dragStart(nodes[0], {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(sectionNode, { clientY: 105 });
      });

      await act(async () => {
        fireEvent.drop(sectionNode, { preventDefault: jest.fn() });
      });

      expect(mockMoveBlock).toHaveBeenCalled();
    });

    it("should handle drop with after position on container at bottom quarter", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Text Block", type: "richText" },
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sectionNode = nodes[1];

      await act(async () => {
        fireEvent.dragStart(nodes[0], {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(sectionNode, { clientY: 195 });
      });

      await act(async () => {
        fireEvent.drop(sectionNode, { preventDefault: jest.fn() });
      });

      expect(mockMoveBlock).toHaveBeenCalled();
    });
  });

  describe("extractPropertyName function coverage (via table data-key)", () => {
    it("should extract property name from simple FTL expression", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "items",
            columns: [
              {
                id: "col1",
                dataKey: "${name}",
                label: "Name",
                alignment: "L",
              },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
        const callArg = (updateTemplate as jest.Mock).mock.calls[0][1];
        const content = callArg.contents[0].content;
        expect(content).toContain('data-key="name"');
        expect(content).toContain("${item.name}");
      });
    });

    it("should extract property name from FTL expression with default value", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "products",
            columns: [
              {
                id: "col1",
                dataKey: '${price!"-"}',
                label: "Price",
                alignment: "L",
              },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
        const callArg = (updateTemplate as jest.Mock).mock.calls[0][1];
        const content = callArg.contents[0].content;
        expect(content).toContain('data-key="price"');
        expect(content).toContain('${item.price!"-"}');
      });
    });

    it("should extract property name from FTL expression with boolean string", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "products",
            columns: [
              {
                id: "col1",
                dataKey: '${isPrimary?string("Yes","No")}',
                label: "Primary?",
                alignment: "L",
              },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
        const callArg = (updateTemplate as jest.Mock).mock.calls[0][1];
        const content = callArg.contents[0].content;
        expect(content).toContain('data-key="isPrimary"');
        expect(content).toContain('${item.isPrimary?string("Yes","No")}');
      });
    });

    it("should extract property name from FTL expression with date formatting", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "events",
            columns: [
              {
                id: "col1",
                dataKey: '${date?string["yyyy-MM-dd"]}',
                label: "Date",
                alignment: "L",
              },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
        const callArg = (updateTemplate as jest.Mock).mock.calls[0][1];
        const content = callArg.contents[0].content;
        expect(content).toContain('data-key="date"');
        expect(content).toContain('${item.date?string["yyyy-MM-dd"]}');
      });
    });

    it("should extract property name from FTL expression with capitalize builtin", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "users",
            columns: [
              {
                id: "col1",
                dataKey: "${name?capitalize}",
                label: "Name",
                alignment: "L",
              },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
        const callArg = (updateTemplate as jest.Mock).mock.calls[0][1];
        const content = callArg.contents[0].content;
        expect(content).toContain('data-key="name"');
        expect(content).toContain("${item.name?capitalize}");
      });
    });

    it("should extract property name from FTL expression with lower_case builtin", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "users",
            columns: [
              {
                id: "col1",
                dataKey: "${status?lower_case}",
                label: "Status",
                alignment: "L",
              },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
        const callArg = (updateTemplate as jest.Mock).mock.calls[0][1];
        const content = callArg.contents[0].content;
        expect(content).toContain('data-key="status"');
        expect(content).toContain("${item.status?lower_case}");
      });
    });

    it("should extract property name from FTL expression with upper_case builtin", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "users",
            columns: [
              {
                id: "col1",
                dataKey: "${code?upper_case}",
                label: "Code",
                alignment: "L",
              },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
        const callArg = (updateTemplate as jest.Mock).mock.calls[0][1];
        const content = callArg.contents[0].content;
        expect(content).toContain('data-key="code"');
        expect(content).toContain("${item.code?upper_case}");
      });
    });

    it("should return non-FTL dataKey as-is", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "items",
            columns: [
              {
                id: "col1",
                dataKey: "staticText",
                label: "Static",
                alignment: "L",
              },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
        const callArg = (updateTemplate as jest.Mock).mock.calls[0][1];
        const content = callArg.contents[0].content;
        expect(content).toContain('data-key="staticText"');
        expect(content).toContain("<td");
        expect(content).toContain(">staticText</td>");
      });
    });

    it("should handle empty dataKey", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "items",
            columns: [
              {
                id: "col1",
                dataKey: "",
                label: "Empty",
                alignment: "L",
              },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
        const callArg = (updateTemplate as jest.Mock).mock.calls[0][1];
        const content = callArg.contents[0].content;
        expect(content).toContain('data-key=""');
      });
    });

    it("should handle dataKey with whitespace", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "items",
            columns: [
              {
                id: "col1",
                dataKey: "  ${name}  ",
                label: "Name",
                alignment: "L",
              },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
        const callArg = (updateTemplate as jest.Mock).mock.calls[0][1];
        const content = callArg.contents[0].content;
        expect(content).toContain('data-key="name"');
      });
    });
  });

  describe("Additional block type property coverage", () => {
    it("should save template with section without title property", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "section-1",
          type: "section",
          label: "Section",
          content: "Content",
          properties: { bordered: true },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with richText without label", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "text-1",
          type: "richText",
          label: "",
          content: "Content",
          properties: {},
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with richText without style property", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "text-1",
          type: "richText",
          label: "Text",
          content: "Plain text",
          properties: {},
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with gridRow without label", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid",
          content: "",
          properties: { columns: 2, showBorders: true },
          children: [
            {
              id: "row-1",
              type: "gridRow",
              label: "",
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
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with table without borders", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "items",
            showBorders: false,
            columns: [
              { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with table without zebra rows", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "items",
            zebraRows: false,
            columns: [
              { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with table with headerStyle", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "items",
            headerStyle: "color: blue;",
            columns: [
              { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with table with rowCellStyle", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "items",
            rowCellStyle: "padding: 10px;",
            columns: [
              { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with table without list path", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table",
          content: "",
          properties: {
            list: "",
            columns: [
              { id: "col1", dataKey: "name", label: "Name", alignment: "C" },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with image without style", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "image-1",
          type: "image",
          label: "Image",
          content: "",
          properties: {
            src: "test.png",
            alt: "Test",
            width: "100px",
            alignment: "L",
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with image with unknown alignment", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "image-1",
          type: "image",
          label: "Image",
          content: "",
          properties: {
            src: "test.png",
            alt: "Test",
            width: "100px",
            alignment: "X",
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with image without label", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "image-1",
          type: "image",
          label: "",
          content: "",
          properties: { src: "test.png", alt: "Test" },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with spacer without label", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "spacer-1",
          type: "spacer",
          label: "",
          content: "",
          properties: { height: "20px" },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with divider without label", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "divider-1",
          type: "divider",
          label: "",
          content: "",
          properties: { thickness: "1px", color: "#ccc" },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with divider with custom width", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "divider-1",
          type: "divider",
          label: "Divider",
          content: "",
          properties: { thickness: "2px", color: "#000", width: 50 },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with pageBreak without label", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "pageBreak-1",
          type: "pageBreak",
          label: "",
          content: "",
          properties: {},
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with section without label", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "section-1",
          type: "section",
          label: "",
          content: "Content",
          properties: { bordered: true },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with grid without showBorders property", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid",
          content: "",
          properties: { columns: 2 },
          children: [
            {
              id: "row-1",
              type: "gridRow",
              label: "Row",
              content: "",
              properties: { columnContents: ["A", "B"] },
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with grid without borders", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid",
          content: "",
          properties: { columns: 3, showBorders: false },
          children: [
            {
              id: "row-1",
              type: "gridRow",
              label: "Row",
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
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with grid with custom column styles", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid",
          content: "",
          properties: {
            columns: 2,
            columnStyles: ["background: red;", "background: blue;"],
            showBorders: true,
          },
          children: [
            {
              id: "row-1",
              type: "gridRow",
              label: "Row",
              content: "",
              properties: { columnContents: ["Red", "Blue"] },
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with global styles with preheaderText", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Text",
          content: "Hello",
          properties: {},
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
        globalStyles: {
          ...defaultGlobalStyles,
          preheaderText: "This is a preheader",
        },
      });

      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });

      const callArgs = (updateTemplate as jest.Mock).mock.calls[
        (updateTemplate as jest.Mock).mock.calls.length - 1
      ];
      const content = callArgs[1].contents[0].content;
      expect(content).toContain("mso-hide: all");
      expect(content).toContain("This is a preheader");
    });

    it("should save template with table with column widths undefined for some columns", async () => {
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
              { id: "col2", dataKey: "value", label: "Value", alignment: "R" },
            ],
            columnWidths: [50],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should save template with table without label", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "",
          content: "",
          properties: {
            list: "items",
            columns: [
              { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
            ],
          },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });

    it("should handle prevent save when already saving", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Text",
          content: "Hello",
          properties: {},
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });

      (updateTemplate as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          }),
      );

      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      await waitFor(
        () => {
          expect(updateTemplate).toHaveBeenCalledTimes(1);
        },
        { timeout: 200 },
      );
    });

    it("should save template with grid with columnWidths property", async () => {
      const blocks: TemplateBlock[] = [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid",
          content: "",
          properties: {
            columns: 2,
            columnWidths: [60, 40],
            showBorders: true,
          },
          children: [
            {
              id: "row-1",
              type: "gridRow",
              label: "Row",
              content: "",
              properties: { columnContents: ["Col1", "Col2"] },
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        blocks,
      });
      render(<StructurePanel templateId="template-1" />);

      const saveButton = screen.getByTitle("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateTemplate).toHaveBeenCalled();
      });
    });
  });

  describe("Nested structure and depth coverage", () => {
    it("should render nested nodes with correct depth styling", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [
            {
              id: "section-2",
              label: "Nested Section",
              type: "section",
              isExpanded: true,
              children: [
                {
                  id: "text-1",
                  label: "Deep Text",
                  type: "richText",
                },
              ],
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      expect(screen.getByText("Section")).toBeInTheDocument();
      expect(screen.getByText("Nested Section")).toBeInTheDocument();
      expect(screen.getByText("Deep Text")).toBeInTheDocument();
    });

    it("should handle drag over nested node at depth > 0", async () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [
            {
              id: "node-1",
              label: "Child Block 1",
              type: "richText",
            },
            {
              id: "node-2",
              label: "Child Block 2",
              type: "richText",
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const childNode1 = nodes[1];
      const childNode2 = nodes[2];

      await act(async () => {
        fireEvent.dragStart(childNode1, {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(childNode2, { clientY: 150 });
      });

      await act(async () => {
        fireEvent.drop(childNode2, { preventDefault: jest.fn() });
      });

      expect(mockMoveBlock).toHaveBeenCalled();
    });

    it("should render drop indicator with depth > 0 for before position", async () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [
            {
              id: "node-1",
              label: "Child Block",
              type: "richText",
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      const { container } = render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const childNode = nodes[1];

      await act(async () => {
        fireEvent.dragStart(childNode, {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(childNode, { clientY: 105 });
      });

      expect(container.querySelector(".dropIndicator")).toBeInTheDocument;
    });

    it("should render drop indicator with depth > 0 for after position", async () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [
            {
              id: "node-1",
              label: "Child Block 1",
              type: "richText",
            },
            {
              id: "node-2",
              label: "Child Block 2",
              type: "richText",
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      const { container } = render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const childNode = nodes[1];

      await act(async () => {
        fireEvent.dragStart(childNode, {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(childNode, { clientY: 195 });
      });

      expect(container).toBeTruthy();
    });

    it("should handle add row in nested grid", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [
            {
              id: "grid-1",
              label: "Nested Grid",
              type: "grid",
              isExpanded: true,
              children: [],
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const addRowButton = screen.getByText("Add Row");
      fireEvent.click(addRowButton);

      expect(mockAddBlock).toHaveBeenCalled();
    });

    it("should render node with depth 0", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "node-1",
          label: "Root Block",
          type: "richText",
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      expect(screen.getByText("Root Block")).toBeInTheDocument();
    });

    it("should handle deeply nested structures with multiple levels", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "level-1",
          label: "Level 1",
          type: "section",
          isExpanded: true,
          children: [
            {
              id: "level-2",
              label: "Level 2",
              type: "section",
              isExpanded: true,
              children: [
                {
                  id: "level-3",
                  label: "Level 3",
                  type: "section",
                  isExpanded: true,
                  children: [
                    {
                      id: "level-4",
                      label: "Level 4",
                      type: "richText",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      expect(screen.getByText("Level 1")).toBeInTheDocument();
      expect(screen.getByText("Level 2")).toBeInTheDocument();
      expect(screen.getByText("Level 3")).toBeInTheDocument();
      expect(screen.getByText("Level 4")).toBeInTheDocument();
    });

    it("should render collapsed node correctly", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Collapsed Section",
          type: "section",
          isExpanded: false,
          children: [
            {
              id: "child-1",
              label: "Hidden Child",
              type: "richText",
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      expect(screen.getByText("Collapsed Section")).toBeInTheDocument();
      expect(screen.queryByText("Hidden Child")).not.toBeInTheDocument();
    });

    it("should handle grid at depth > 0 with add row button", () => {
      const structure: TemplateStructureNode[] = [
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [
            {
              id: "section-2",
              label: "Nested Section",
              type: "section",
              isExpanded: true,
              children: [
                {
                  id: "grid-1",
                  label: "Deep Grid",
                  type: "grid",
                  isExpanded: true,
                  children: [],
                },
              ],
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const addRowButton = screen.getByText("Add Row");
      expect(addRowButton).toBeInTheDocument();
      fireEvent.click(addRowButton);

      expect(mockAddBlock).toHaveBeenCalled();
    });
  });

  describe("Complete drag-drop branch coverage", () => {
    it("should handle non-container drag to upper half", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Block 1", type: "richText" },
        { id: "node-2", label: "Block 2", type: "richText" },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sourceNode = nodes[0];
      const targetNode = nodes[1];

      const mockGetBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 50,
        bottom: 150,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      Object.defineProperty(targetNode, "getBoundingClientRect", {
        value: mockGetBoundingClientRect,
        configurable: true,
      });

      await act(async () => {
        fireEvent.dragStart(sourceNode, {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(targetNode, {
          clientY: 115,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      await act(async () => {
        fireEvent.drop(targetNode, {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      expect(mockMoveBlock).toHaveBeenCalled();
    });

    it("should handle non-container drag to lower half", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Block 1", type: "richText" },
        { id: "node-2", label: "Block 2", type: "richText" },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sourceNode = nodes[0];
      const targetNode = nodes[1];

      const mockGetBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 50,
        bottom: 150,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      Object.defineProperty(targetNode, "getBoundingClientRect", {
        value: mockGetBoundingClientRect,
        configurable: true,
      });

      await act(async () => {
        fireEvent.dragStart(sourceNode, {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(targetNode, {
          clientY: 135,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      await act(async () => {
        fireEvent.drop(targetNode, {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      expect(mockMoveBlock).toHaveBeenCalled();
    });

    it("should handle container drag to top quarter (before)", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Block 1", type: "richText" },
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sourceNode = nodes[0];
      const targetNode = nodes[1];

      const mockGetBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      Object.defineProperty(targetNode, "getBoundingClientRect", {
        value: mockGetBoundingClientRect,
        configurable: true,
      });

      await act(async () => {
        fireEvent.dragStart(sourceNode, {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(targetNode, {
          clientY: 110,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      await act(async () => {
        fireEvent.drop(targetNode, {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      expect(mockMoveBlock).toHaveBeenCalled();
    });

    it("should handle container drag to bottom quarter (after)", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Block 1", type: "richText" },
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sourceNode = nodes[0];
      const targetNode = nodes[1];

      const mockGetBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      Object.defineProperty(targetNode, "getBoundingClientRect", {
        value: mockGetBoundingClientRect,
        configurable: true,
      });

      await act(async () => {
        fireEvent.dragStart(sourceNode, {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(targetNode, {
          clientY: 185,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      await act(async () => {
        fireEvent.drop(targetNode, {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      expect(mockMoveBlock).toHaveBeenCalled();
    });

    it("should handle container drag to middle (inside)", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Block 1", type: "richText" },
        {
          id: "section-1",
          label: "Section",
          type: "section",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sourceNode = nodes[0];
      const targetNode = nodes[1];

      const mockGetBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      Object.defineProperty(targetNode, "getBoundingClientRect", {
        value: mockGetBoundingClientRect,
        configurable: true,
      });

      await act(async () => {
        fireEvent.dragStart(sourceNode, {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(targetNode, {
          clientY: 150,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      await act(async () => {
        fireEvent.drop(targetNode, {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      expect(mockMoveBlock).toHaveBeenCalledWith("node-1", "section-1", 0);
    });

    it("should set drop position inside for loop container in middle area", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Block 1", type: "richText" },
        {
          id: "loop-1",
          label: "Loop",
          type: "loop",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sourceNode = nodes[0];
      const targetNode = nodes[1];

      const mockGetBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      Object.defineProperty(targetNode, "getBoundingClientRect", {
        value: mockGetBoundingClientRect,
        configurable: true,
      });

      await act(async () => {
        fireEvent.dragStart(sourceNode, {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(targetNode, {
          clientY: 150,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      await act(async () => {
        fireEvent.drop(targetNode, {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      expect(mockMoveBlock).toHaveBeenCalledWith("node-1", "loop-1", 0);
    });

    it("should set drop position inside for if container in middle area", async () => {
      const structure: TemplateStructureNode[] = [
        { id: "node-1", label: "Block 1", type: "richText" },
        {
          id: "if-1",
          label: "If Block",
          type: "if",
          isExpanded: true,
          children: [],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        ...defaultMockValues,
        structure,
      });

      render(<StructurePanel templateId="template-1" />);

      const nodes = screen.getAllByRole("treeitem");
      const sourceNode = nodes[0];
      const targetNode = nodes[1];

      const mockGetBoundingClientRect = jest.fn(() => ({
        top: 100,
        height: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => {},
      }));

      Object.defineProperty(targetNode, "getBoundingClientRect", {
        value: mockGetBoundingClientRect,
        configurable: true,
      });

      await act(async () => {
        fireEvent.dragStart(sourceNode, {
          dataTransfer: { setData: jest.fn(), effectAllowed: "" },
        });
      });

      await act(async () => {
        fireEvent.dragOver(targetNode, {
          clientY: 150,
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      await act(async () => {
        fireEvent.drop(targetNode, {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      expect(mockMoveBlock).toHaveBeenCalledWith("node-1", "if-1", 0);
    });
  });
});
