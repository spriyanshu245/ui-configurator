import { render, screen, act } from "@testing-library/react";
import PlaygroundTemplateDesigner from "./PlaygroundTemplateDesigner";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";

jest.mock("@/app/template-designer/context/TemplateDesignerContext", () => ({
  __esModule: true,
  TemplateDesignerProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="provider">{children}</div>
  ),
  useTemplateDesigner: jest.fn(),
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  __esModule: true,
  useHeaderV2: jest.fn(),
}));

jest.mock("@/app/components/HeaderV2/HeaderV2", () => ({
  __esModule: true,
  default: () => <header data-testid="header-v2">Header</header>,
}));

jest.mock(
  "@/app/template-designer/components/StructurePanel/StructurePanel",
  () => ({
    __esModule: true,
    default: ({
      templateId,
      isPlayground,
    }: {
      templateId: string;
      isPlayground: boolean;
    }) => (
      <div
        data-testid="structure-panel"
        data-template-id={templateId}
        data-is-playground={isPlayground}
      >
        StructurePanel
      </div>
    ),
  })
);

jest.mock(
  "@/app/template-designer/components/AvailableBlocksPanel/AvailableBlocksPanel",
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="available-blocks-panel">AvailableBlocksPanel</div>
    ),
  })
);

jest.mock("@/app/template-designer/components/PreviewPane/PreviewPane", () => ({
  __esModule: true,
  default: () => <div data-testid="preview-pane">PreviewPane</div>,
}));

jest.mock(
  "@/app/template-designer/components/PropertiesPanel/PropertiesPanel",
  () => ({
    __esModule: true,
    default: () => <div data-testid="properties-panel">PropertiesPanel</div>,
  })
);

jest.mock(
  "@/app/template-designer/components/DataModelPanel/DataModelPanel",
  () => ({
    __esModule: true,
    default: () => <div data-testid="data-model-panel">DataModelPanel</div>,
  })
);

jest.mock(
  "@/app/template-designer/components/MarkdownGuidePanel/MarkdownGuidePanel",
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="markdown-guide-panel">MarkdownGuidePanel</div>
    ),
  })
);

const mockUseTemplateDesigner = useTemplateDesigner as jest.MockedFunction<
  typeof useTemplateDesigner
>;
const mockUseHeaderV2 = useHeaderV2 as jest.MockedFunction<typeof useHeaderV2>;

const createMockTemplateDesignerContext = (overrides = {}) => ({
  setTemplateName: jest.fn(),
  setTemplateMimeType: jest.fn(),
  setTemplateCategory: jest.fn(),
  setLoadingState: jest.fn(),
  loadBlocksFromContents: jest.fn(),
  isLoading: false,
  error: null,
  templateName: "Test Template",
  templateMimeType: "text/html",
  ...overrides,
});

const createMockHeaderContext = () => ({
  userNotification: null,
  setUserNotification: jest.fn(),
  pageTitle: "",
  setPageTitle: jest.fn(),
  pageSubTitle: "",
  setPageSubTitle: jest.fn(),
  resourceCode: "",
  setResourceCode: jest.fn(),
  resourceMetadata: "",
  setResourceMetadata: jest.fn(),
  resourceStatus: "",
  setResourceStatus: jest.fn(),
  resourceVersion: "",
  setResourceVersion: jest.fn(),
  backRoute: "/",
  setBackRoute: jest.fn(),
  showCloseIcon: false,
  setShowCloseIcon: jest.fn(),
  resetResourceData: jest.fn(),
});

describe("PlaygroundTemplateDesigner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseHeaderV2.mockReturnValue(
      createMockHeaderContext() as ReturnType<typeof useHeaderV2>
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Loading state", () => {
    it("should show loading state when isLoading is true", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext({ isLoading: true }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<PlaygroundTemplateDesigner />);
      expect(screen.getByText("Loading playground...")).toBeInTheDocument();
    });

    it("should show spinner during loading", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext({ isLoading: true }) as ReturnType<
          typeof useTemplateDesigner
        >
      );
      const { container } = render(<PlaygroundTemplateDesigner />);
      expect(container.querySelector('[class*="spinner"]')).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("should show error state when error is present", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext({
          isLoading: false,
          error: "Failed to load template",
        }) as ReturnType<typeof useTemplateDesigner>
      );
      render(<PlaygroundTemplateDesigner />);
      expect(screen.getByText("Failed to load template")).toBeInTheDocument();
    });

    it("should show error icon in error state", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext({
          isLoading: false,
          error: "Error occurred",
        }) as ReturnType<typeof useTemplateDesigner>
      );
      render(<PlaygroundTemplateDesigner />);
      expect(screen.getByText("⚠️")).toBeInTheDocument();
    });
  });

  describe("Normal state", () => {
    it("should render all panels when not loading and no error", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext() as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<PlaygroundTemplateDesigner />);
      expect(screen.getByTestId("structure-panel")).toBeInTheDocument();
      expect(screen.getByTestId("available-blocks-panel")).toBeInTheDocument();
      expect(screen.getByTestId("preview-pane")).toBeInTheDocument();
      expect(screen.getByTestId("properties-panel")).toBeInTheDocument();
      expect(screen.getByTestId("data-model-panel")).toBeInTheDocument();
      expect(screen.getByTestId("markdown-guide-panel")).toBeInTheDocument();
    });

    it("should render header", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext() as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<PlaygroundTemplateDesigner />);
      expect(screen.getByTestId("header-v2")).toBeInTheDocument();
    });

    it("should pass correct props to StructurePanel", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext() as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<PlaygroundTemplateDesigner />);
      const structurePanel = screen.getByTestId("structure-panel");
      expect(structurePanel).toHaveAttribute("data-template-id", "playground");
      expect(structurePanel).toHaveAttribute("data-is-playground", "true");
    });
  });

  describe("Initialization", () => {
    it("should call setLoadingState on mount", () => {
      const setLoadingState = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext({
          setLoadingState,
          isLoading: true,
        }) as ReturnType<typeof useTemplateDesigner>
      );
      render(<PlaygroundTemplateDesigner />);
      expect(setLoadingState).toHaveBeenCalledWith(true, null);
    });

    it("should initialize template data after timeout", async () => {
      const setTemplateName = jest.fn();
      const setTemplateMimeType = jest.fn();
      const setTemplateCategory = jest.fn();
      const loadBlocksFromContents = jest.fn();
      const setLoadingState = jest.fn();

      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext({
          setTemplateName,
          setTemplateMimeType,
          setTemplateCategory,
          loadBlocksFromContents,
          setLoadingState,
          isLoading: true,
        }) as ReturnType<typeof useTemplateDesigner>
      );

      render(<PlaygroundTemplateDesigner />);

      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(setTemplateName).toHaveBeenCalledWith(
        "HTML Multi-lingual Playground Template"
      );
      expect(setTemplateMimeType).toHaveBeenCalledWith("text/html");
      expect(setTemplateCategory).toHaveBeenCalledWith("email");
      expect(loadBlocksFromContents).toHaveBeenCalled();
      expect(setLoadingState).toHaveBeenCalledWith(false, null);
    });

    it("should load mock content with correct structure", async () => {
      const loadBlocksFromContents = jest.fn();

      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext({
          loadBlocksFromContents,
          isLoading: true,
        }) as ReturnType<typeof useTemplateDesigner>
      );

      render(<PlaygroundTemplateDesigner />);

      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(loadBlocksFromContents).toHaveBeenCalledWith([
        expect.objectContaining({
          language: "en",
          isDefault: true,
        }),
      ]);
    });

    it("should cleanup timeout on unmount", () => {
      const setLoadingState = jest.fn();
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext({
          setLoadingState,
          isLoading: true,
        }) as ReturnType<typeof useTemplateDesigner>
      );

      const { unmount } = render(<PlaygroundTemplateDesigner />);
      unmount();

      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(setLoadingState).toHaveBeenCalledTimes(1);
    });
  });

  describe("Header configuration", () => {
    it("should set page title", () => {
      const setPageTitle = jest.fn();
      mockUseHeaderV2.mockReturnValue({
        ...createMockHeaderContext(),
        setPageTitle,
      } as ReturnType<typeof useHeaderV2>);
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext() as ReturnType<
          typeof useTemplateDesigner
        >
      );

      render(<PlaygroundTemplateDesigner />);

      expect(setPageTitle).toHaveBeenCalledWith("Template Playground");
    });

    it("should set resource code from template name", () => {
      const setResourceCode = jest.fn();
      mockUseHeaderV2.mockReturnValue({
        ...createMockHeaderContext(),
        setResourceCode,
      } as ReturnType<typeof useHeaderV2>);
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext({
          templateName: "My Template",
        }) as ReturnType<typeof useTemplateDesigner>
      );

      render(<PlaygroundTemplateDesigner />);

      expect(setResourceCode).toHaveBeenCalledWith("My Template");
    });

    it("should set resource metadata from template mime type", () => {
      const setResourceMetadata = jest.fn();
      mockUseHeaderV2.mockReturnValue({
        ...createMockHeaderContext(),
        setResourceMetadata,
      } as ReturnType<typeof useHeaderV2>);
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext({
          templateMimeType: "text/plain",
        }) as ReturnType<typeof useTemplateDesigner>
      );

      render(<PlaygroundTemplateDesigner />);

      expect(setResourceMetadata).toHaveBeenCalledWith("text/plain");
    });

    it("should show close icon", () => {
      const setShowCloseIcon = jest.fn();
      mockUseHeaderV2.mockReturnValue({
        ...createMockHeaderContext(),
        setShowCloseIcon,
      } as ReturnType<typeof useHeaderV2>);
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext() as ReturnType<
          typeof useTemplateDesigner
        >
      );

      render(<PlaygroundTemplateDesigner />);

      expect(setShowCloseIcon).toHaveBeenCalledWith(true);
    });

    it("should set back route to templates", () => {
      const setBackRoute = jest.fn();
      mockUseHeaderV2.mockReturnValue({
        ...createMockHeaderContext(),
        setBackRoute,
      } as ReturnType<typeof useHeaderV2>);
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext() as ReturnType<
          typeof useTemplateDesigner
        >
      );

      render(<PlaygroundTemplateDesigner />);

      expect(setBackRoute).toHaveBeenCalledWith("/documents/templates");
    });
  });

  describe("Provider wrapper", () => {
    it("should wrap content in TemplateDesignerProvider", () => {
      mockUseTemplateDesigner.mockReturnValue(
        createMockTemplateDesignerContext() as ReturnType<
          typeof useTemplateDesigner
        >
      );
      render(<PlaygroundTemplateDesigner />);
      expect(screen.getByTestId("provider")).toBeInTheDocument();
    });
  });
});
