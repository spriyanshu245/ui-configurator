import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import BaseConfigDetailPage, {
  BaseConfigDetailPageProps,
} from "./BaseConfigDetailPage";
import {
  AccessConfigPage,
  AccessConfigComponent,
} from "@/app/types/accessControlConfig";
import { BaseComponent, Microsite } from "@/app/types/types";

const mockSetUserNotification = jest.fn();
const mockSetBackRoute = jest.fn();
const mockSetShowCloseIcon = jest.fn();

jest.mock("@/app/components/HeaderV2/HeaderV2", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="header-v2">Header</div>),
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: jest.fn(() => ({
    setUserNotification: mockSetUserNotification,
    setBackRoute: mockSetBackRoute,
    setShowCloseIcon: mockSetShowCloseIcon,
  })),
}));

jest.mock(
  "@/app/components/AccessControlTreeNode/AccessControlTreeNode",
  () => ({
    __esModule: true,
    default: jest.fn(({ node, nodeType, label, onUpdate }: any) => (
      <div data-testid="tree-node" data-label={label} data-node-type={nodeType}>
        <span data-testid="node-label">{label}</span>
        <button
          data-testid="update-node"
          onClick={() => onUpdate?.({ ...node, isVisible: !node.isVisible })}
        >
          Update
        </button>
      </div>
    )),
  }),
);

jest.mock(
  "@/app/components/InternalComponents/InlineLoader/InlineLoader",
  () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="inline-loader">Loading...</div>),
  }),
);

jest.mock("@/app/components/SVGIcons/Save", () => ({
  __esModule: true,
  default: jest.fn(() => <svg data-testid="save-icon" />),
}));

jest.mock("@/app/components/SVGIcons/ChevronRight", () => ({
  __esModule: true,
  default: jest.fn(() => <svg data-testid="chevron-right-icon" />),
}));

jest.mock("@/app/components/SVGIcons/ExpandAll", () => ({
  __esModule: true,
  default: jest.fn(() => <svg data-testid="expand-all-icon" />),
}));

jest.mock("@/app/components/SVGIcons/CollapseAll", () => ({
  __esModule: true,
  default: jest.fn(() => <svg data-testid="collapse-all-icon" />),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className} data-testid="link">
      {children}
    </a>
  ),
}));

const createMockConfig = (pages: AccessConfigPage[] = []): any => ({
  micrositeSlug: "test-microsite",
  version: 1,
  pages,
});

const createMockPage = (pageCode: string): AccessConfigPage => ({
  pageCode,
  isVisible: true,
  isEditable: true,
  isDisabled: false,
  components: [],
});

const createMockComponent = (componentId: string): AccessConfigComponent => ({
  componentId,
  isVisible: true,
  isEditable: true,
  isDisabled: false,
  components: [],
});

const createMockBaseComponent = (id: string): BaseComponent => ({
  id,
  name: `Component ${id}`,
  type: "button",
  category: "component",
});

const createMockMicrosite = (): Microsite => ({
  code: "test-microsite",
  name: "Test Microsite",
  version: 1,
  pages: [{ pageCode: "page1" }, { pageCode: "page2" }],
  firstPageCode: "page1",
});

const defaultProps: Omit<
  BaseConfigDetailPageProps<any>,
  "config" | "setConfig"
> & {
  config: any;
  setConfig: jest.Mock;
} = {
  title: "Access Config",
  code: "TEST_CODE",
  listRoute: "/access-controls",
  config: null,
  setConfig: jest.fn(),
  loading: false,
  error: null,
  dslData: null,
  pageComponentsMap: new Map(),
  newComponentIds: [],
  removedCount: 0,
  onSave: jest.fn().mockResolvedValue({}),
};

describe("BaseConfigDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading state", () => {
    it("should render loading state when loading is true", () => {
      render(
        <BaseConfigDetailPage {...defaultProps} loading={true} config={null} />,
      );

      expect(screen.getByTestId("inline-loader")).toBeInTheDocument();
      expect(
        screen.getByText("Loading Portal Task configuration..."),
      ).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("should render error state when error is present", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          error="Failed to load configuration"
          config={null}
        />,
      );

      expect(screen.getByText("Failed to Load")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load configuration"),
      ).toBeInTheDocument();
      expect(screen.getByText("Back to List")).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("should render empty state when config is null and not loading", () => {
      render(<BaseConfigDetailPage {...defaultProps} config={null} />);

      expect(screen.getByText("No Configuration Found")).toBeInTheDocument();
    });
  });

  describe("Render with config", () => {
    const mockConfig = createMockConfig([
      createMockPage("page1"),
      createMockPage("page2"),
    ]);
    const mockMicrosite = createMockMicrosite();
    const mockPageComponentsMap = new Map<string, BaseComponent[]>([
      ["page1", [createMockBaseComponent("comp1")]],
      ["page2", [createMockBaseComponent("comp2")]],
    ]);

    it("should render header with title and code", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      expect(screen.getByText("Access Config")).toBeInTheDocument();
      expect(screen.getByText("TEST_CODE")).toBeInTheDocument();
    });

    it("should render stats with page and component counts", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      expect(screen.getByText("Pages")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Components")).toBeInTheDocument();
    });

    it("should render tree nodes for each page", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      const treeNodes = screen.getAllByTestId("tree-node");
      expect(treeNodes).toHaveLength(2);
      expect(screen.getAllByTestId("node-label")[0]).toHaveTextContent("page1");
      expect(screen.getAllByTestId("node-label")[1]).toHaveTextContent("page2");
    });

    it("should render expand/collapse buttons", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      expect(screen.getByTestId("expand-all-icon")).toBeInTheDocument();
      expect(screen.getByTestId("collapse-all-icon")).toBeInTheDocument();
    });

    it("should render save button", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      expect(screen.getByTestId("save-icon")).toBeInTheDocument();
    });
  });

  describe("Expand/Collapse All", () => {
    const mockConfig = createMockConfig([createMockPage("page1")]);
    const mockMicrosite = createMockMicrosite();
    const mockPageComponentsMap = new Map<string, BaseComponent[]>();

    it("should render expand and collapse buttons and they should be clickable", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      const expandButton = screen.getByTitle("Expand All");
      const collapseButton = screen.getByTitle("Collapse All");

      expect(expandButton).toBeInTheDocument();
      expect(collapseButton).toBeInTheDocument();

      expect(() => fireEvent.click(expandButton)).not.toThrow();
      expect(() => fireEvent.click(collapseButton)).not.toThrow();
    });
  });

  describe("Save functionality", () => {
    const mockConfig = createMockConfig([createMockPage("page1")]);
    const mockMicrosite = createMockMicrosite();
    const mockPageComponentsMap = new Map<string, BaseComponent[]>();

    it("should call onSave when save button is clicked", async () => {
      const onSave = jest.fn().mockResolvedValue({});
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          onSave={onSave}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      const saveButton = screen.getByTitle("Save Configuration");
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(mockConfig);
      });
    });

    it("should show an error notification when save fails", async () => {
      const onSave = jest.fn().mockRejectedValue(new Error("Save failed"));

      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          onSave={onSave}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      const saveButton = screen.getByTitle("Save Configuration");

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockSetUserNotification).toHaveBeenCalledWith({
          text: "Save failed",
          type: "error",
          time: 3000,
        });
      });
    });

    it("should use the Portal Task success message for non access-control routes", async () => {
      const onSave = jest.fn().mockResolvedValue({});

      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          onSave={onSave}
          listRoute="/portal-tasks"
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByTitle("Save Configuration"));
      });

      await waitFor(() => {
        expect(mockSetUserNotification).toHaveBeenCalledWith({
          text: "Portal Task configuration saved successfully!",
          type: "success",
          time: 2000,
        });
      });
    });

    it("should use the fallback error message when save fails with a non-Error value", async () => {
      const onSave = jest.fn().mockRejectedValue("unexpected");

      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          onSave={onSave}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByTitle("Save Configuration"));
      });

      await waitFor(() => {
        expect(mockSetUserNotification).toHaveBeenCalledWith({
          text: "Failed to save configuration",
          type: "error",
          time: 3000,
        });
      });
    });

    it("should disable save button when there are unvisited new components", () => {
      const onSave = jest.fn();
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          onSave={onSave}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
          newComponentIds={["comp1", "comp2"]}
        />,
      );

      const saveButton = screen.getByTitle(
        "Review all new components before saving",
      );
      expect(saveButton).toBeDisabled();
      expect(
        screen.getByText("Review new components to enable save"),
      ).toBeInTheDocument();
    });
  });

  describe("New component navigation", () => {
    const mockConfig = createMockConfig([createMockPage("page1")]);
    const mockMicrosite = createMockMicrosite();
    const mockPageComponentsMap = new Map<string, BaseComponent[]>();

    it("should show new component navigation when newComponentIds has items", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
          newComponentIds={["comp1", "comp2"]}
        />,
      );

      expect(screen.getByText("New Components")).toBeInTheDocument();
      expect(screen.getByText("0/2")).toBeInTheDocument();
    });

    it("should show removed count when removedCount > 0", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
          removedCount={3}
        />,
      );

      expect(screen.getByText("Removed")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should navigate to next new component", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
          newComponentIds={["comp1", "comp2"]}
        />,
      );

      const nextButton = screen.getByLabelText("Next new component");
      fireEvent.click(nextButton);

      expect(screen.getByText("1/2")).toBeInTheDocument();
    });

    it("should navigate to previous new component", () => {
      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
          newComponentIds={["comp1", "comp2"]}
        />,
      );

      const prevButton = screen.getByLabelText("Previous new component");
      fireEvent.click(prevButton);

      expect(screen.getByText("2/2")).toBeInTheDocument();
    });

    it("should wrap back to the first new component after reaching the end", () => {
      const requestAnimationFrameSpy = jest
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((callback: FrameRequestCallback) => {
          callback(0);
          return 1;
        });

      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
          newComponentIds={["comp1", "comp2"]}
        />,
      );

      const nextButton = screen.getByLabelText("Next new component");

      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(screen.getByText("1/2")).toBeInTheDocument();

      requestAnimationFrameSpy.mockRestore();
    });

    it("should mark all new components reviewed after visiting them", async () => {
      const requestAnimationFrameSpy = jest
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((callback: FrameRequestCallback) => {
          callback(0);
          return 1;
        });

      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          dslData={mockMicrosite}
          pageComponentsMap={mockPageComponentsMap}
          newComponentIds={["comp1"]}
        />,
      );

      expect(
        screen.getByText("Review new components to enable save"),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText("Next new component"));

      await waitFor(() => {
        expect(
          screen.queryByText("Review new components to enable save"),
        ).not.toBeInTheDocument();
      });

      expect(screen.getByTitle("Save Configuration")).toBeEnabled();

      requestAnimationFrameSpy.mockRestore();
    });
  });

  describe("Stats calculation", () => {
    it("should count nested components recursively", () => {
      const nestedComponent = createMockComponent("child-1");
      const parentComponent = {
        ...createMockComponent("parent-1"),
        components: [nestedComponent],
      };
      const mockConfig = createMockConfig([
        {
          ...createMockPage("page1"),
          components: [parentComponent],
        },
      ]);

      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          pageComponentsMap={new Map()}
        />,
      );

      expect(screen.getByText("Components")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  describe("Tree node update", () => {
    it("should call setConfig when tree node is updated", async () => {
      const setConfig = jest.fn();
      const mockConfig = createMockConfig([createMockPage("page1")]);
      const mockPageComponentsMap = new Map<string, BaseComponent[]>();

      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          setConfig={setConfig}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      const updateButton = screen.getByTestId("update-node");
      await act(async () => {
        fireEvent.click(updateButton);
      });

      await waitFor(() => {
        expect(setConfig).toHaveBeenCalled();
      });
    });
  });

  describe("Breadcrumb navigation", () => {
    it("should render breadcrumb with link to list", () => {
      const mockConfig = createMockConfig([createMockPage("page1")]);
      const mockPageComponentsMap = new Map<string, BaseComponent[]>();

      render(
        <BaseConfigDetailPage
          {...defaultProps}
          config={mockConfig}
          pageComponentsMap={mockPageComponentsMap}
        />,
      );

      const link = screen.getByTestId("link");
      expect(link).toHaveAttribute("href", "/access-controls");
      expect(link).toHaveTextContent("Access Config");
    });
  });
});
