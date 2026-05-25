import { render, screen, waitFor, act } from "@testing-library/react";
import PortalTaskFormPane from "./PortalTaskFormPane";
import * as services from "../../../services/portalTaskServices";

jest.mock("../../../components/BaseConfigFormPane/BaseConfigFormPane", () => ({
  __esModule: true,
  default: jest.fn((props: any) =>
    props.isOpen ? (
      <div data-testid="base-form-pane">
        <span data-testid="title">{props.title}</span>
        <span data-testid="input-label">{props.inputLabel}</span>
        <span data-testid="placeholder">{props.placeholder}</span>
        <span data-testid="duplicate-label">{props.duplicateLabel}</span>
        {(props.sourceConfig || props.sourcePortalTaskConfig) && (
          <span data-testid="source-code">
            {props.getSourceCode(
              props.sourceConfig || props.sourcePortalTaskConfig,
            )}
          </span>
        )}
        <button
          data-testid="submit"
          onClick={async () => {
            await props.onSubmitHandler({
              code: "TEST_CODE",
              microsite: {
                code: "ms1",
                name: "Microsite 1",
                version: 1,
                pages: [],
                firstPageCode: "p1",
              },
              sourceConfig: props.sourceConfig || props.sourcePortalTaskConfig,
              isDuplicate: props.mode === "duplicate",
            });
            props.onCreated?.("TEST_CODE");
            props.onClose();
          }}
        >
          {props.mode === "duplicate" ? "Duplicate" : "Create"}
        </button>
        <button data-testid="close" onClick={props.onClose}>
          Close
        </button>
      </div>
    ) : null,
  ),
}));

jest.mock("../../../hooks/useWorkspaceMicrosite", () => ({
  useWorkspaceMicrosite: jest.fn(),
}));

jest.mock("../../../services/portalTaskServices", () => ({
  createPortalTaskConfig: jest.fn(),
  duplicatePortalTaskConfig: jest.fn(),
}));

import { useWorkspaceMicrosite } from "../../../hooks/useWorkspaceMicrosite";

const mockUseWorkspaceMicrosite = useWorkspaceMicrosite as jest.MockedFunction<
  typeof useWorkspaceMicrosite
>;

const mockCreatePortalTaskConfig =
  services.createPortalTaskConfig as jest.MockedFunction<
    typeof services.createPortalTaskConfig
  >;

const mockDuplicatePortalTaskConfig =
  services.duplicatePortalTaskConfig as jest.MockedFunction<
    typeof services.duplicatePortalTaskConfig
  >;

const mockWorkspaceHook = {
  workspaces: [{ code: "ws1", name: "Workspace 1" }],
  selectedWorkspace: null,
  setSelectedWorkspace: jest.fn(),
  micrositeVersions: [],
  selectedMicrosite: null,
  setSelectedMicrosite: jest.fn(),
  loadingWorkspaces: false,
  loadingMicrosites: false,
};

describe("PortalTaskFormPane", () => {
  const mockOnClose = jest.fn();
  const mockOnCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkspaceMicrosite.mockReturnValue(mockWorkspaceHook);
    mockCreatePortalTaskConfig.mockResolvedValue({
      portalTaskConfigCode: "NEW_CODE",
      micrositeSlug: "slug",
      version: 1,
    });
    mockDuplicatePortalTaskConfig.mockResolvedValue({
      portalTaskConfigCode: "DUPLICATE_CODE",
      micrositeSlug: "slug",
      version: 1,
    });
  });

  describe("Rendering", () => {
    it("should render with correct props passed to BaseConfigFormPane", () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByTestId("title")).toHaveTextContent(
        "Portal Task Config",
      );
      expect(screen.getByTestId("input-label")).toHaveTextContent(
        "Portal Task Code",
      );
      expect(screen.getByTestId("placeholder")).toHaveTextContent(
        "Enter Portal Task code",
      );
      expect(screen.getByTestId("duplicate-label")).toHaveTextContent(
        "Duplicating from:",
      );
    });

    it("should pass isOpen to BaseConfigFormPane", () => {
      const { rerender } = render(
        <PortalTaskFormPane
          isOpen={false}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.queryByTestId("base-form-pane")).not.toBeInTheDocument();

      rerender(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByTestId("base-form-pane")).toBeInTheDocument();
    });

    it("should use useWorkspaceMicrosite hook", () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(mockUseWorkspaceMicrosite).toHaveBeenCalledWith({
        isOpen: true,
        isDuplicateMode: false,
        sourceConfig: undefined,
        getMicrositeSlug: expect.any(Function),
        getVersion: expect.any(Function),
      });
    });
  });

  describe("Form submission - create mode", () => {
    it("should call createPortalTaskConfig on submit in create mode", async () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      const submitBtn = screen.getByTestId("submit");
      await act(async () => {
        submitBtn.click();
      });

      await waitFor(() => {
        expect(mockCreatePortalTaskConfig).toHaveBeenCalledWith({
          portalTaskConfigCode: "TEST_CODE",
          micrositeSlug: "ms1",
          version: 1,
        });
      });
    });

    it("should call onCreated with code on success", async () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      const submitBtn = screen.getByTestId("submit");
      await act(async () => {
        submitBtn.click();
      });

      await waitFor(() => {
        expect(mockOnCreated).toHaveBeenCalledWith("TEST_CODE");
      });
    });

    it("should call onClose on success", async () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      const submitBtn = screen.getByTestId("submit");
      await act(async () => {
        submitBtn.click();
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Duplicate mode", () => {
    const sourcePortalTaskConfig = {
      portalTaskConfigCode: "SOURCE_CODE",
      micrositeSlug: "ms1",
      version: 1,
    } as any;

    it("should pass sourceConfig to BaseConfigFormPane", () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          mode="duplicate"
          sourcePortalTaskConfig={sourcePortalTaskConfig}
        />,
      );

      expect(screen.getByTestId("source-code")).toHaveTextContent(
        "SOURCE_CODE",
      );
    });

    it("should call useWorkspaceMicrosite with isDuplicateMode true", () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          mode="duplicate"
          sourcePortalTaskConfig={sourcePortalTaskConfig}
        />,
      );

      expect(mockUseWorkspaceMicrosite).toHaveBeenCalledWith({
        isOpen: true,
        isDuplicateMode: true,
        sourceConfig: sourcePortalTaskConfig,
        getMicrositeSlug: expect.any(Function),
        getVersion: expect.any(Function),
      });
    });

    it("should call duplicatePortalTaskConfig on submit in duplicate mode", async () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          mode="duplicate"
          sourcePortalTaskConfig={sourcePortalTaskConfig}
        />,
      );

      const submitBtn = screen.getByTestId("submit");
      await act(async () => {
        submitBtn.click();
      });

      await waitFor(() => {
        expect(mockDuplicatePortalTaskConfig).toHaveBeenCalledWith(
          sourcePortalTaskConfig,
          "TEST_CODE",
        );
      });
    });

    it("should not call createPortalTaskConfig in duplicate mode", async () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          mode="duplicate"
          sourcePortalTaskConfig={sourcePortalTaskConfig}
        />,
      );

      const submitBtn = screen.getByTestId("submit");
      await act(async () => {
        submitBtn.click();
      });

      await waitFor(() => {
        expect(mockDuplicatePortalTaskConfig).toHaveBeenCalled();
      });

      expect(mockCreatePortalTaskConfig).not.toHaveBeenCalled();
    });
  });

  describe("Props passthrough", () => {
    it("should pass onClose to BaseConfigFormPane", () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      const closeBtn = screen.getByTestId("close");
      closeBtn.click();

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should pass onCreated callback", () => {
      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(mockUseWorkspaceMicrosite).toHaveBeenCalled();
    });
  });

  describe("getSourceCode", () => {
    it("should correctly extract portalTaskConfigCode from source", () => {
      const source = {
        portalTaskConfigCode: "TEST_SOURCE",
        micrositeSlug: "ms1",
        version: 1,
      } as any;

      render(
        <PortalTaskFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          mode="duplicate"
          sourcePortalTaskConfig={source}
        />,
      );

      expect(screen.getByTestId("source-code")).toHaveTextContent(
        "TEST_SOURCE",
      );
    });
  });

  describe("hook callbacks", () => {
    it("should invoke getMicrositeSlug callback to extract micrositeSlug", () => {
      render(<PortalTaskFormPane isOpen={true} onClose={mockOnClose} />);

      const callArgs = mockUseWorkspaceMicrosite.mock.calls[0][0];
      const source = {
        portalTaskConfigCode: "CODE",
        micrositeSlug: "task-slug",
        version: 3,
      } as any;
      expect(callArgs.getMicrositeSlug(source)).toBe("task-slug");
    });

    it("should invoke getVersion callback to extract version", () => {
      render(<PortalTaskFormPane isOpen={true} onClose={mockOnClose} />);

      const callArgs = mockUseWorkspaceMicrosite.mock.calls[0][0];
      const source = {
        portalTaskConfigCode: "CODE",
        micrositeSlug: "ms1",
        version: 7,
      } as any;
      expect(callArgs.getVersion(source)).toBe(7);
    });
  });
});
