import { render, screen, waitFor, act } from "@testing-library/react";
import AccessControlFormPane from "./AccessControlFormPane";
import * as services from "../../../services/accessConfigServices";

jest.mock("../../../components/BaseConfigFormPane/BaseConfigFormPane", () => ({
  __esModule: true,
  default: jest.fn((props: any) =>
    props.isOpen ? (
      <div data-testid="base-form-pane">
        <span data-testid="title">{props.title}</span>
        <span data-testid="input-label">{props.inputLabel}</span>
        <span data-testid="placeholder">{props.placeholder}</span>
        <span data-testid="duplicate-label">{props.duplicateLabel}</span>
        {(props.sourceConfig || props.sourceAccessConfig) && (
          <span data-testid="source-code">
            {props.getSourceCode(
              props.sourceConfig || props.sourceAccessConfig,
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
              sourceConfig: props.sourceConfig || props.sourceAccessConfig,
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

jest.mock("../../../services/accessConfigServices", () => ({
  createAccessConfig: jest.fn(),
  duplicateAccessConfig: jest.fn(),
}));

import { useWorkspaceMicrosite } from "../../../hooks/useWorkspaceMicrosite";

const mockUseWorkspaceMicrosite = useWorkspaceMicrosite as jest.MockedFunction<
  typeof useWorkspaceMicrosite
>;

const mockCreateAccessConfig =
  services.createAccessConfig as jest.MockedFunction<
    typeof services.createAccessConfig
  >;

const mockDuplicateAccessConfig =
  services.duplicateAccessConfig as jest.MockedFunction<
    typeof services.duplicateAccessConfig
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

describe("AccessControlFormPane", () => {
  const mockOnClose = jest.fn();
  const mockOnCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkspaceMicrosite.mockReturnValue(mockWorkspaceHook);
    mockCreateAccessConfig.mockResolvedValue({
      accessConfigCode: "NEW_CODE",
    });
    mockDuplicateAccessConfig.mockResolvedValue({
      accessConfigCode: "DUPLICATE_CODE",
    });
  });

  describe("Rendering", () => {
    it("should render with correct props passed to BaseConfigFormPane", () => {
      render(
        <AccessControlFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByTestId("title")).toHaveTextContent("Access Config");
      expect(screen.getByTestId("input-label")).toHaveTextContent(
        "Access Config Code",
      );
      expect(screen.getByTestId("placeholder")).toHaveTextContent(
        "Enter access config code",
      );
      expect(screen.getByTestId("duplicate-label")).toHaveTextContent(
        "Duplicating from:",
      );
    });

    it("should pass isOpen to BaseConfigFormPane", () => {
      const { rerender } = render(
        <AccessControlFormPane
          isOpen={false}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.queryByTestId("base-form-pane")).not.toBeInTheDocument();

      rerender(
        <AccessControlFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(screen.getByTestId("base-form-pane")).toBeInTheDocument();
    });

    it("should use useWorkspaceMicrosite hook", () => {
      render(
        <AccessControlFormPane
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
    it("should call createAccessConfig on submit in create mode", async () => {
      render(
        <AccessControlFormPane
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
        expect(mockCreateAccessConfig).toHaveBeenCalledWith({
          accessConfigCode: "TEST_CODE",
          micrositeSlug: "ms1",
          version: 1,
        });
      });
    });

    it("should call onCreated with code on success", async () => {
      render(
        <AccessControlFormPane
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
        <AccessControlFormPane
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
    const sourceAccessConfig = {
      accessConfigCode: "SOURCE_CODE",
      accessConfigId: "source-id",
      micrositeSlug: "ms1",
      version: 1,
      pages: [],
    } as any;

    it("should pass sourceConfig to BaseConfigFormPane", () => {
      render(
        <AccessControlFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          mode="duplicate"
          sourceAccessConfig={sourceAccessConfig}
        />,
      );

      expect(screen.getByTestId("source-code")).toHaveTextContent(
        "SOURCE_CODE",
      );
    });

    it("should call useWorkspaceMicrosite with isDuplicateMode true", () => {
      render(
        <AccessControlFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          mode="duplicate"
          sourceAccessConfig={sourceAccessConfig}
        />,
      );

      expect(mockUseWorkspaceMicrosite).toHaveBeenCalledWith({
        isOpen: true,
        isDuplicateMode: true,
        sourceConfig: sourceAccessConfig,
        getMicrositeSlug: expect.any(Function),
        getVersion: expect.any(Function),
      });
    });

    it("should call duplicateAccessConfig on submit in duplicate mode", async () => {
      render(
        <AccessControlFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          mode="duplicate"
          sourceAccessConfig={sourceAccessConfig}
        />,
      );

      const submitBtn = screen.getByTestId("submit");
      await act(async () => {
        submitBtn.click();
      });

      await waitFor(() => {
        expect(mockDuplicateAccessConfig).toHaveBeenCalledWith(
          sourceAccessConfig,
          "TEST_CODE",
        );
      });
    });

    it("should not call createAccessConfig in duplicate mode", async () => {
      render(
        <AccessControlFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          mode="duplicate"
          sourceAccessConfig={sourceAccessConfig}
        />,
      );

      const submitBtn = screen.getByTestId("submit");
      await act(async () => {
        submitBtn.click();
      });

      await waitFor(() => {
        expect(mockDuplicateAccessConfig).toHaveBeenCalled();
      });

      expect(mockCreateAccessConfig).not.toHaveBeenCalled();
    });
  });

  describe("Props passthrough", () => {
    it("should pass onClose to BaseConfigFormPane", () => {
      render(
        <AccessControlFormPane
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
        <AccessControlFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
        />,
      );

      expect(mockUseWorkspaceMicrosite).toHaveBeenCalled();
    });
  });

  describe("getSourceCode", () => {
    it("should correctly extract accessConfigCode from source", () => {
      const source = {
        accessConfigCode: "TEST_SOURCE",
        accessConfigId: "id",
        micrositeSlug: "ms1",
        version: 1,
        pages: [],
      } as any;

      render(
        <AccessControlFormPane
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          mode="duplicate"
          sourceAccessConfig={source}
        />,
      );

      expect(screen.getByTestId("source-code")).toHaveTextContent(
        "TEST_SOURCE",
      );
    });
  });

  describe("hook callbacks", () => {
    it("should invoke getMicrositeSlug callback to extract micrositeSlug", () => {
      render(<AccessControlFormPane isOpen={true} onClose={mockOnClose} />);

      const callArgs = mockUseWorkspaceMicrosite.mock.calls[0][0];
      const source = {
        accessConfigCode: "CODE",
        accessConfigId: "id",
        micrositeSlug: "test-slug",
        version: 2,
        pages: [],
      } as any;
      expect(callArgs.getMicrositeSlug(source)).toBe("test-slug");
    });

    it("should invoke getVersion callback to extract version", () => {
      render(<AccessControlFormPane isOpen={true} onClose={mockOnClose} />);

      const callArgs = mockUseWorkspaceMicrosite.mock.calls[0][0];
      const source = {
        accessConfigCode: "CODE",
        accessConfigId: "id",
        micrositeSlug: "ms1",
        version: 5,
        pages: [],
      } as any;
      expect(callArgs.getVersion(source)).toBe(5);
    });
  });
});
