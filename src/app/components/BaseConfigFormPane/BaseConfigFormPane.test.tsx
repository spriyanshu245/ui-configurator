import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import BaseConfigFormPane from "./BaseConfigFormPane";

jest.mock("@/app/hooks/useWorkspaceMicrosite", () => ({
  useWorkspaceMicrosite: jest.fn(),
}));

jest.mock("@/app/components/InternalComponents/Pane/Pane", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onClose,
    title,
    children,
    paneFooter,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    paneFooter: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="pane">
        <div data-testid="pane-title">{title}</div>
        <button data-testid="pane-close" onClick={onClose}>
          Close
        </button>
        <div data-testid="pane-content">{children}</div>
        <div data-testid="pane-footer">{paneFooter}</div>
      </div>
    ) : null,
}));

jest.mock(
  "@/app/components/InternalComponents/SelectDropdown/SelectDropdown",
  () => ({
    __esModule: true,
    default: ({
      id,
      options,
      value,
      onChange,
      loading,
      placeholder,
      disabled,
      loadingText,
    }: {
      id: string;
      options: { value: string; label: string }[];
      value: string;
      onChange: (val: string) => void;
      loading?: boolean;
      placeholder?: string;
      disabled?: boolean;
      loadingText?: string;
    }) => (
      <select
        id={id}
        data-testid={`select-${id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {loading ? (
          <option>{loadingText || "Loading..."}</option>
        ) : (
          <>
            <option value="">{placeholder || "Select..."}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </>
        )}
      </select>
    ),
  }),
);

jest.mock(
  "@/app/components/InternalComponents/FormPaneFooter/FormPaneFooter",
  () => ({
    __esModule: true,
    default: ({
      onCancel,
      onSubmit,
      isSubmitting,
      isValid,
      submitLabel,
    }: {
      onCancel: () => void;
      onSubmit: () => void;
      isSubmitting: boolean;
      isValid: boolean;
      submitLabel?: string;
    }) => (
      <div data-testid="footer">
        <button
          data-testid="cancel-btn"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          data-testid="submit-btn"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : submitLabel || "Create"}
        </button>
      </div>
    ),
  }),
);

const mockWorkspaces = [
  { code: "ws1", name: "Workspace 1" },
  { code: "ws2", name: "Workspace 2" },
];

const mockMicrosites = [
  {
    code: "ms1",
    name: "Microsite 1",
    version: 1,
    published: true,
    pages: [],
    firstPageCode: "p1",
  },
  {
    code: "ms2",
    name: "Microsite 2",
    version: 2,
    published: false,
    pages: [],
    firstPageCode: "p1",
  },
];

const createMockWorkspaceHook = (overrides = {}) => ({
  workspaces: mockWorkspaces,
  selectedWorkspace: null,
  setSelectedWorkspace: jest.fn(),
  micrositeVersions: [],
  selectedMicrosite: null,
  setSelectedMicrosite: jest.fn(),
  loadingWorkspaces: false,
  loadingMicrosites: false,
  ...overrides,
});

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onCreated: jest.fn(),
  title: "Test Config",
  duplicateLabel: "Duplicating from:",
  inputLabel: "Test Code",
  placeholder: "Enter test code",
  getSourceCode: (s: { code: string }) => s.code,
  onSubmitHandler: jest.fn().mockResolvedValue(undefined),
};

describe("BaseConfigFormPane", () => {
  const mockOnClose = jest.fn();
  const mockOnCreated = jest.fn();
  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
  const mockSetSelectedWorkspace = jest.fn();
  const mockSetSelectedMicrosite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderComponent = (props: any = {}) => {
    return render(
      <BaseConfigFormPane
        {...defaultProps}
        {...props}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
        onSubmitHandler={props.onSubmitHandler || mockOnSubmit}
        workspaceHook={createMockWorkspaceHook({
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
          ...(props.workspaceHook || {}),
        })}
      />,
    );
  };

  describe("Rendering", () => {
    it("should not render when closed", () => {
      renderComponent({ isOpen: false });
      expect(screen.queryByTestId("pane")).not.toBeInTheDocument();
    });

    it("should render when open", () => {
      renderComponent();
      expect(screen.getByTestId("pane")).toBeInTheDocument();
    });

    it("should render with correct title", () => {
      renderComponent({ title: "Custom Title" });
      expect(screen.getByTestId("pane-title")).toHaveTextContent(
        "Custom Title",
      );
    });

    it("should render form fields", () => {
      renderComponent();
      expect(screen.getByLabelText("Test Code Code*")).toBeInTheDocument();
      expect(screen.getByLabelText("Workspace*")).toBeInTheDocument();
      expect(screen.getByLabelText("Microsite*")).toBeInTheDocument();
    });

    it("should render cancel and submit buttons", () => {
      renderComponent();
      expect(screen.getByTestId("cancel-btn")).toBeInTheDocument();
      expect(screen.getByTestId("submit-btn")).toBeInTheDocument();
    });
  });

  describe("Input handling", () => {
    it("should update code on input change", async () => {
      renderComponent();
      const input = screen.getByLabelText("Test Code Code*");

      await act(async () => {
        fireEvent.change(input, { target: { value: "TEST_CODE" } });
      });

      expect(input).toHaveValue("TEST_CODE");
    });

    it("should remove spaces from input", async () => {
      renderComponent();
      const input = screen.getByLabelText(
        "Test Code Code*",
      ) as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { value: "TEST CODE" } });
      });

      expect(input.value).toBe("TESTCODE");
    });

    it("should reset code when pane closes", async () => {
      const { rerender } = renderComponent({ isOpen: true });

      const input = screen.getByLabelText("Test Code Code*");
      await act(async () => {
        fireEvent.change(input, { target: { value: "TEST_CODE" } });
      });

      rerender(
        <BaseConfigFormPane
          {...defaultProps}
          isOpen={false}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          onSubmitHandler={mockOnSubmit}
          workspaceHook={createMockWorkspaceHook({
            setSelectedWorkspace: mockSetSelectedWorkspace,
            setSelectedMicrosite: mockSetSelectedMicrosite,
          })}
        />,
      );

      rerender(
        <BaseConfigFormPane
          {...defaultProps}
          isOpen={true}
          onClose={mockOnClose}
          onCreated={mockOnCreated}
          onSubmitHandler={mockOnSubmit}
          workspaceHook={createMockWorkspaceHook({
            setSelectedWorkspace: mockSetSelectedWorkspace,
            setSelectedMicrosite: mockSetSelectedMicrosite,
          })}
        />,
      );

      const newInput = screen.getByLabelText("Test Code Code*");
      expect(newInput).toHaveValue("");
    });
  });

  describe("Form validation", () => {
    it("should disable submit when code is empty", () => {
      renderComponent();
      expect(screen.getByTestId("submit-btn")).toBeDisabled();
    });

    it("should enable submit when form is valid", async () => {
      renderComponent({
        workspaceHook: createMockWorkspaceHook({
          selectedWorkspace: mockWorkspaces[0],
          selectedMicrosite: mockMicrosites[0],
          micrositeVersions: mockMicrosites,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      const input = screen.getByLabelText("Test Code Code*");
      await act(async () => {
        fireEvent.change(input, { target: { value: "TEST_CODE" } });
      });

      expect(screen.getByTestId("submit-btn")).not.toBeDisabled();
    });
  });

  describe("Form submission", () => {
    it("should call onSubmitHandler with correct data", async () => {
      const handleSubmit = jest.fn().mockResolvedValue(undefined);
      renderComponent({
        onSubmitHandler: handleSubmit,
        workspaceHook: createMockWorkspaceHook({
          selectedWorkspace: mockWorkspaces[0],
          selectedMicrosite: mockMicrosites[0],
          micrositeVersions: mockMicrosites,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      const input = screen.getByLabelText("Test Code Code*");
      await act(async () => {
        fireEvent.change(input, { target: { value: "TEST_CODE" } });
      });

      const submitBtn = screen.getByTestId("submit-btn");
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          code: "TEST_CODE",
          microsite: mockMicrosites[0],
          sourceConfig: undefined,
          isDuplicate: false,
        });
      });
    });

    it("should call onCreated with code after successful submission", async () => {
      const handleSubmit = jest.fn().mockResolvedValue(undefined);
      renderComponent({
        onSubmitHandler: handleSubmit,
        workspaceHook: createMockWorkspaceHook({
          selectedWorkspace: mockWorkspaces[0],
          selectedMicrosite: mockMicrosites[0],
          micrositeVersions: mockMicrosites,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      const input = screen.getByLabelText("Test Code Code*");
      await act(async () => {
        fireEvent.change(input, { target: { value: "TEST_CODE" } });
      });

      const submitBtn = screen.getByTestId("submit-btn");
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(mockOnCreated).toHaveBeenCalledWith("TEST_CODE");
      });
    });

    it("should call onClose after successful submission", async () => {
      const handleSubmit = jest.fn().mockResolvedValue(undefined);
      renderComponent({
        onSubmitHandler: handleSubmit,
        workspaceHook: createMockWorkspaceHook({
          selectedWorkspace: mockWorkspaces[0],
          selectedMicrosite: mockMicrosites[0],
          micrositeVersions: mockMicrosites,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      const input = screen.getByLabelText("Test Code Code*");
      await act(async () => {
        fireEvent.change(input, { target: { value: "TEST_CODE" } });
      });

      const submitBtn = screen.getByTestId("submit-btn");
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should not submit when clicking disabled submit button", async () => {
      const handleSubmit = jest.fn();
      renderComponent({ onSubmitHandler: handleSubmit });

      const submitBtn = screen.getByTestId("submit-btn");

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Cancel button", () => {
    it("should call onClose when cancel is clicked", () => {
      renderComponent();
      const cancelBtn = screen.getByTestId("cancel-btn");
      fireEvent.click(cancelBtn);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Duplicate mode", () => {
    const sourceConfig = { code: "SOURCE_CONFIG" };

    it("should display duplicate info when in duplicate mode with source", () => {
      renderComponent({
        mode: "duplicate",
        sourceConfig,
      });

      expect(screen.getByText(/Duplicating from:/)).toBeInTheDocument();
      expect(screen.getByText("SOURCE_CONFIG")).toBeInTheDocument();
    });

    it("should call onSubmitHandler with isDuplicate true", async () => {
      const handleSubmit = jest.fn().mockResolvedValue(undefined);
      renderComponent({
        mode: "duplicate",
        sourceConfig,
        onSubmitHandler: handleSubmit,
        workspaceHook: createMockWorkspaceHook({
          selectedWorkspace: mockWorkspaces[0],
          selectedMicrosite: mockMicrosites[0],
          micrositeVersions: mockMicrosites,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      const input = screen.getByLabelText("Test Code Code*");
      await act(async () => {
        fireEvent.change(input, { target: { value: "NEW_CODE" } });
      });

      const submitBtn = screen.getByTestId("submit-btn");
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          code: "NEW_CODE",
          microsite: mockMicrosites[0],
          sourceConfig,
          isDuplicate: true,
        });
      });
    });

    it("should show Duplicate button label", () => {
      renderComponent({
        mode: "duplicate",
        sourceConfig,
      });

      expect(screen.getByTestId("submit-btn")).toHaveTextContent("Duplicate");
    });
  });

  describe("Workspace dropdown", () => {
    it("should call setSelectedWorkspace when workspace changes", async () => {
      renderComponent({
        workspaceHook: createMockWorkspaceHook({
          workspaces: mockWorkspaces,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      const select = screen.getByTestId("select-workspace-select");
      await act(async () => {
        fireEvent.change(select, { target: { value: "ws1" } });
      });

      expect(mockSetSelectedWorkspace).toHaveBeenCalledWith(mockWorkspaces[0]);
    });

    it("should fall back to null when the selected workspace value is missing", async () => {
      renderComponent({
        workspaceHook: createMockWorkspaceHook({
          workspaces: mockWorkspaces,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      const select = screen.getByTestId("select-workspace-select");
      await act(async () => {
        fireEvent.change(select, { target: { value: "missing-workspace" } });
      });

      expect(mockSetSelectedWorkspace).toHaveBeenCalledWith(null);
    });
  });

  describe("Microsite dropdown", () => {
    it("should call setSelectedMicrosite when microsite changes", async () => {
      renderComponent({
        workspaceHook: createMockWorkspaceHook({
          selectedWorkspace: mockWorkspaces[0],
          micrositeVersions: mockMicrosites,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      const select = screen.getByTestId("select-microsite-select");
      await act(async () => {
        fireEvent.change(select, { target: { value: "ms1|1" } });
      });

      expect(mockSetSelectedMicrosite).toHaveBeenCalledWith(mockMicrosites[0]);
    });

    it("should show placeholder when no workspace selected", () => {
      renderComponent({
        workspaceHook: createMockWorkspaceHook({
          selectedWorkspace: null,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      expect(screen.getByText("Select a workspace first")).toBeInTheDocument();
    });

    it("should show loading microsites placeholder when microsites are loading", () => {
      renderComponent({
        workspaceHook: createMockWorkspaceHook({
          selectedWorkspace: mockWorkspaces[0],
          loadingMicrosites: true,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      expect(screen.getByText("Loading microsites...")).toBeInTheDocument();
    });
  });

  describe("Loading states", () => {
    it("should show workspace loading text when loading workspaces", () => {
      renderComponent({
        workspaceHook: createMockWorkspaceHook({
          loadingWorkspaces: true,
          setSelectedWorkspace: mockSetSelectedWorkspace,
          setSelectedMicrosite: mockSetSelectedMicrosite,
        }),
      });

      expect(screen.getByText("Loading workspaces...")).toBeInTheDocument();
    });
  });
});
