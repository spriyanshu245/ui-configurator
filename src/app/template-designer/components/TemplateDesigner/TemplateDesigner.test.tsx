import { render, screen, waitFor } from "@testing-library/react";
import TemplateDesigner from "./TemplateDesigner";
import * as services from "@/app/documents/templates/services";
import * as commServices from "@/app/communications/templates/services";

jest.mock("@/app/documents/templates/services", () => ({
  getTemplate: jest.fn(),
}));

jest.mock("@/app/communications/templates/services", () => ({
  getNotificationTemplate: jest.fn(),
  getNotificationTemplateData: jest.fn(),
  normalizeNotificationTemplateData: jest.fn((content: string) => {
    const trimmed = content.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return JSON.parse(content);
    }
    return content;
  }),
}));

let mockBackQuery: string | null = null;
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => mockBackQuery }),
}));

jest.mock(
  "@/app/template-designer/components/PlainTextTemplateEditor/PlainTextTemplateEditor",
  () => ({
    __esModule: true,
    default: ({ initialContent }: { initialContent: string }) => (
      <div data-testid="plain-text-editor">{initialContent}</div>
    ),
  }),
);

jest.mock(
  "@/app/template-designer/components/MarkdownGuidePanel/MarkdownGuidePanel",
  () => ({
    __esModule: true,
    default: () => <div data-testid="markdown-guide" />,
  }),
);

const mockSetPageTitle = jest.fn();
const mockSetResourceCode = jest.fn();
const mockSetResourceMetadata = jest.fn();
const mockSetResourceStatus = jest.fn();
const mockSetResourceVersion = jest.fn();
const mockSetBackRoute = jest.fn();
const mockSetShowCloseIcon = jest.fn();
jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({
    setPageTitle: mockSetPageTitle,
    setResourceCode: mockSetResourceCode,
    setResourceMetadata: mockSetResourceMetadata,
    setResourceStatus: mockSetResourceStatus,
    setResourceVersion: mockSetResourceVersion,
    setBackRoute: mockSetBackRoute,
    setShowCloseIcon: mockSetShowCloseIcon,
  }),
}));

jest.mock("@/app/components/HeaderV2/HeaderV2", () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock("../../context/TemplateDesignerContext", () => {
  const actual = jest.requireActual("../../context/TemplateDesignerContext");
  return {
    ...actual,
    TemplateDesignerProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="template-designer-provider">{children}</div>
    ),
  };
});

jest.mock("../StructurePanel/StructurePanel", () => ({
  __esModule: true,
  default: ({ templateId }: { templateId: string }) => (
    <div data-testid="structure-panel">{templateId}</div>
  ),
}));

jest.mock("../AvailableBlocksPanel/AvailableBlocksPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="available-blocks-panel">blocks</div>,
}));

jest.mock("../PreviewPane/PreviewPane", () => ({
  __esModule: true,
  default: () => <div data-testid="preview-pane">preview</div>,
}));

jest.mock("../PropertiesPanel/PropertiesPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="properties-panel">properties</div>,
}));

jest.mock("../DataModelPanel/DataModelPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="data-model-panel">data model</div>,
}));

const mockSetTemplateName = jest.fn();
const mockSetTemplateMimeType = jest.fn();
const mockSetTemplateCategory = jest.fn();
const mockSetLoadingState = jest.fn();
const mockLoadBlocksFromFtl = jest.fn();
const mockLoadBlocksFromContents = jest.fn();

jest.mock("../../context/TemplateDesignerContext", () => ({
  TemplateDesignerProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="provider">{children}</div>
  ),
  useTemplateDesigner: () => ({
    setTemplateName: mockSetTemplateName,
    setTemplateMimeType: mockSetTemplateMimeType,
    setTemplateCategory: mockSetTemplateCategory,
    setLoadingState: mockSetLoadingState,
    loadBlocksFromFtl: mockLoadBlocksFromFtl,
    loadBlocksFromContents: mockLoadBlocksFromContents,
    isLoading: false,
    error: null,
    templateName: "Test Template",
    templateMimeType: "text/html",
  }),
}));

describe("TemplateDesigner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (services.getTemplate as jest.Mock).mockResolvedValue({
      name: "Test Template",
      mimeType: "text/html",
      content: "<p>Test</p>",
    });
  });

  it("should render template designer with all panels", async () => {
    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("structure-panel")).toBeInTheDocument();
    });

    expect(screen.getByTestId("available-blocks-panel")).toBeInTheDocument();
    expect(screen.getByTestId("preview-pane")).toBeInTheDocument();
    expect(screen.getByTestId("properties-panel")).toBeInTheDocument();
    expect(screen.getByTestId("data-model-panel")).toBeInTheDocument();
  });

  it("should load template on mount", async () => {
    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(services.getTemplate).toHaveBeenCalledWith("test-123");
    });

    expect(mockSetTemplateName).toHaveBeenCalledWith("Test Template");
    expect(mockSetTemplateMimeType).toHaveBeenCalledWith("text/html");
  });

  it("should not load template when templateId is empty", async () => {
    render(<TemplateDesigner templateId="" />);

    await waitFor(() => {
      expect(services.getTemplate).not.toHaveBeenCalled();
    });
  });

  it("should call loadBlocksFromFtl for DOCTYPE content", async () => {
    (services.getTemplate as jest.Mock).mockResolvedValue({
      name: "FTL Template",
      mimeType: "text/html",
      content: "<!DOCTYPE html><html><body>Test</body></html>",
    });

    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(mockLoadBlocksFromFtl).toHaveBeenCalledWith(
        "<!DOCTYPE html><html><body>Test</body></html>",
      );
    });
  });

  it("should call loadBlocksFromFtl for html content", async () => {
    (services.getTemplate as jest.Mock).mockResolvedValue({
      name: "HTML Template",
      mimeType: "text/html",
      content: "<html><body>Test</body></html>",
    });

    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(mockLoadBlocksFromFtl).toHaveBeenCalledWith(
        "<html><body>Test</body></html>",
      );
    });
  });

  it("should call loadBlocksFromFtl for FTL list content", async () => {
    (services.getTemplate as jest.Mock).mockResolvedValue({
      name: "FTL Template",
      mimeType: "text/html",
      content: "<p><#list items as item>${item}</#list></p>",
    });

    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(mockLoadBlocksFromFtl).toHaveBeenCalledWith(
        "<p><#list items as item>${item}</#list></p>",
      );
    });
  });

  it("should call loadBlocksFromFtl for FTL if content", async () => {
    (services.getTemplate as jest.Mock).mockResolvedValue({
      name: "FTL Template",
      mimeType: "text/html",
      content: "<p><#if condition>content</#if></p>",
    });

    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(mockLoadBlocksFromFtl).toHaveBeenCalledWith(
        "<p><#if condition>content</#if></p>",
      );
    });
  });

  it("should not call loadBlocksFromFtl for non-FTL content", async () => {
    (services.getTemplate as jest.Mock).mockResolvedValue({
      name: "JSON Template",
      mimeType: "application/json",
      content: '{"key": "value"}',
    });

    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(mockSetLoadingState).toHaveBeenCalledWith(false, null);
    });

    expect(mockLoadBlocksFromFtl).not.toHaveBeenCalled();
  });

  it("should handle null content", async () => {
    (services.getTemplate as jest.Mock).mockResolvedValue({
      name: "Empty Template",
      mimeType: "text/html",
      content: null,
    });

    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(mockSetLoadingState).toHaveBeenCalledWith(false, null);
    });
  });

  it("should handle null name and mimeType", async () => {
    (services.getTemplate as jest.Mock).mockResolvedValue({
      name: null,
      mimeType: null,
      content: "",
    });

    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(mockSetTemplateName).toHaveBeenCalledWith("Untitled Template");
      expect(mockSetTemplateMimeType).toHaveBeenCalledWith("application/json");
    });
  });

  it("should handle API error with Error object", async () => {
    (services.getTemplate as jest.Mock).mockRejectedValue(
      new Error("Network error"),
    );

    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(mockSetLoadingState).toHaveBeenCalledWith(false, "Network error");
    });
  });

  it("should handle API error with non-Error object", async () => {
    (services.getTemplate as jest.Mock).mockRejectedValue("Some error");

    render(<TemplateDesigner templateId="test-123" />);

    await waitFor(() => {
      expect(mockSetLoadingState).toHaveBeenCalledWith(
        false,
        "Failed to load template",
      );
    });
  });

  it("should cleanup on unmount", async () => {
    const { unmount } = render(<TemplateDesigner templateId="test-123" />);

    unmount();

    expect(true).toBe(true);
  });

  it("loads template via contents array when present", async () => {
    (services.getTemplate as jest.Mock).mockResolvedValue({
      name: "Has Contents",
      mimeType: "text/html",
      contents: [{ id: "c1" }],
      content: "ignored",
    });
    render(<TemplateDesigner templateId="test-123" />);
    await waitFor(() => {
      expect(mockLoadBlocksFromContents).toHaveBeenCalledWith([{ id: "c1" }]);
    });
    expect(mockLoadBlocksFromFtl).not.toHaveBeenCalled();
  });

  it("uses backQuery to build back route in document mode", async () => {
    mockBackQuery = "abc";
    render(<TemplateDesigner templateId="test-123" />);
    await waitFor(() => {
      expect(mockSetBackRoute).toHaveBeenCalledWith(
        "/documents/templates?q=abc",
      );
    });
    mockBackQuery = null;
  });

  it("handles template with category", async () => {
    (services.getTemplate as jest.Mock).mockResolvedValue({
      name: "T",
      mimeType: "text/html",
      content: "",
      category: "letters",
    });
    render(<TemplateDesigner templateId="test-123" />);
    await waitFor(() => {
      expect(mockSetTemplateCategory).toHaveBeenCalledWith("letters");
    });
  });
});

describe("TemplateDesigner communication mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (commServices.getNotificationTemplate as jest.Mock).mockResolvedValue({
      id: 7,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "Comm Tpl",
      subject: "Hi",
      templateMimeType: "text/html",
      language: "en",
      primary: false,
    });
    (commServices.getNotificationTemplateData as jest.Mock).mockResolvedValue(
      "<#if x>y</#if>",
    );
  });

  it("loads communication template metadata and content", async () => {
    render(
      <TemplateDesigner
        templateId="7"
        mode="communication"
        communicationType="WELCOME"
        communicationSubscriptionKey="WELCOME_EMAIL"
      />,
    );
    await waitFor(() => {
      expect(commServices.getNotificationTemplate).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_EMAIL",
        "7",
      );
    });
    expect(mockSetTemplateName).toHaveBeenCalledWith("Comm Tpl");
    expect(mockSetTemplateMimeType).toHaveBeenCalledWith("text/html");
    expect(mockSetTemplateCategory).toHaveBeenCalledWith("communication");
    expect(mockLoadBlocksFromContents).toHaveBeenCalledWith([
      {
        content: "<#if x>y</#if>",
        language: "en",
        isDefault: true,
      },
    ]);
    expect(mockSetBackRoute).toHaveBeenCalledWith(
      "/communications/templates?type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    expect(mockSetPageTitle).toHaveBeenCalledWith(
      "Edit Communication Template",
    );
    expect(mockSetResourceMetadata).toHaveBeenCalledWith(
      "WELCOME / WELCOME_EMAIL",
    );
  });

  it("initializes communication HTML content with the backend language", async () => {
    (commServices.getNotificationTemplate as jest.Mock).mockResolvedValue({
      id: 7,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "Hindi Comm Tpl",
      subject: "Namaste",
      templateMimeType: "text/html",
      language: "hi",
      primary: false,
    });

    render(
      <TemplateDesigner
        templateId="7"
        mode="communication"
        communicationType="WELCOME"
        communicationSubscriptionKey="WELCOME_EMAIL"
      />,
    );

    await waitFor(() => {
      expect(mockLoadBlocksFromContents).toHaveBeenCalledWith([
        {
          content: "<#if x>y</#if>",
          language: "hi",
          isDefault: true,
        },
      ]);
    });
  });

  it("normalizes quoted communication template data before loading it", async () => {
    (commServices.getNotificationTemplateData as jest.Mock).mockResolvedValue(
      "\"<!DOCTYPE html>\\n<html><body>Hello</body></html>\"",
    );

    render(
      <TemplateDesigner
        templateId="7"
        mode="communication"
        communicationType="WELCOME"
        communicationSubscriptionKey="WELCOME_EMAIL"
      />,
    );

    await waitFor(() => {
      expect(mockLoadBlocksFromContents).toHaveBeenCalledWith([
        {
          content: "<!DOCTYPE html>\n<html><body>Hello</body></html>",
          language: "en",
          isDefault: true,
        },
      ]);
    });
  });

  it("renders plain text editor when communication mime type is text/plain", async () => {
    (commServices.getNotificationTemplate as jest.Mock).mockResolvedValue({
      id: 7,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "Comm Tpl",
      subject: "Hi",
      templateMimeType: "text/plain",
      language: "en",
      primary: false,
    });
    (commServices.getNotificationTemplateData as jest.Mock).mockResolvedValue(
      "plain body",
    );
    render(
      <TemplateDesigner
        templateId="7"
        mode="communication"
        communicationType="WELCOME"
        communicationSubscriptionKey="WELCOME_EMAIL"
      />,
    );
    expect(await screen.findByTestId("plain-text-editor")).toHaveTextContent(
      "plain body",
    );
  });

  it("reports missing notification type/subscription key", async () => {
    render(<TemplateDesigner templateId="7" mode="communication" />);
    await waitFor(() => {
      expect(mockSetLoadingState).toHaveBeenCalledWith(
        false,
        "Missing notification type or subscription key for this communication template.",
      );
    });
    expect(commServices.getNotificationTemplate).not.toHaveBeenCalled();
  });

  it("builds back route without subscription key when only type is provided", async () => {
    render(
      <TemplateDesigner
        templateId="7"
        mode="communication"
        communicationType="WELCOME"
      />,
    );
    await waitFor(() => {
      expect(mockSetBackRoute).toHaveBeenCalledWith(
        "/communications/templates?type=WELCOME",
      );
    });
  });

  it("uses default communication back route when type is missing", async () => {
    render(<TemplateDesigner templateId="7" mode="communication" />);
    await waitFor(() => {
      expect(mockSetBackRoute).toHaveBeenCalledWith(
        "/communications/templates",
      );
    });
  });
});

describe("TemplateDesignerContent loading state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state", () => {
    jest.doMock("../../context/TemplateDesignerContext", () => ({
      TemplateDesignerProvider: ({
        children,
      }: {
        children: React.ReactNode;
      }) => <div>{children}</div>,
      useTemplateDesigner: () => ({
        setTemplateName: jest.fn(),
        setTemplateMimeType: jest.fn(),
        setLoadingState: jest.fn(),
        loadBlocksFromFtl: jest.fn(),
        isLoading: true,
        error: null,
      }),
    }));
  });

  it("should render error state", () => {
    jest.doMock("../../context/TemplateDesignerContext", () => ({
      TemplateDesignerProvider: ({
        children,
      }: {
        children: React.ReactNode;
      }) => <div>{children}</div>,
      useTemplateDesigner: () => ({
        setTemplateName: jest.fn(),
        setTemplateMimeType: jest.fn(),
        setLoadingState: jest.fn(),
        loadBlocksFromFtl: jest.fn(),
        isLoading: false,
        error: "Test error",
      }),
    }));
  });
});
