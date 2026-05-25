import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import PageSelector from "./PageSelector";
import { useMicrosite } from "@/app/context/MicrositeContext";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { useUserTask } from "@/app/context/UserTaskContext";
import { useControlPanel } from "@/app/context/ControlPanelContext";
import { useNavigationGuard } from "@/app/hooks/useNavigationGuard";
import useMicrositePageSave from "@/app/hooks/useMicrositePageSave";
import useDurableMicrositePageCreation from "@/app/hooks/useDurableMicrositePageCreation";
import { scrollToTop } from "@/app/utils/utils";

jest.mock("@/app/context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("@/app/context/ControlPanelContext", () => ({
  useControlPanel: jest.fn(),
}));

jest.mock("@/app/utils/utils", () => ({
  scrollToTop: jest.fn(),
}));

jest.mock("@/app/hooks/useNavigationGuard", () => ({
  useNavigationGuard: jest.fn(),
}));

jest.mock("@/app/hooks/useMicrositePageSave", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/app/hooks/useDurableMicrositePageCreation", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../InternalComponents/Pane/FormPane/FormPane", () => ({
  __esModule: true,
  default: ({ onClose, onCreated, micrositeCode }: any) => (
    <div data-testid="form-pane">
      <span>Microsite: {micrositeCode}</span>
      <button data-testid="form-close" onClick={onClose}>
        Close
      </button>
      <button
        data-testid="form-create"
        onClick={async () => {
          try {
            await onCreated("new-page-code");
          } catch {}
        }}
      >
        Create
      </button>
    </div>
  ),
}));

jest.mock(
  "../../InternalComponents/UnsavedChangesPopupp/UnsavedChangesPopup",
  () => ({
    UnsavedChangesModal: ({ open, onConfirm, onCancel, backDrop }: any) =>
      open ? (
        <div data-testid="unsaved-modal">
          <button data-testid="modal-confirm" onClick={onConfirm}>
            Confirm
          </button>
          <button data-testid="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button data-testid="modal-backdrop" onClick={backDrop}>
            Backdrop
          </button>
        </div>
      ) : null,
  }),
);

jest.mock("../../InternalComponents/SelectDropdown/SelectDropdown", () => ({
  __esModule: true,
  default: ({ value, onChange, options }: any) => {
    capturedDropdownValue = value;

    return (
      <select
        data-testid="page-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
}));

jest.mock("../../Tooltip/Tooltip", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("../../SVGIcons/Settings", () => () => (
  <div data-testid="settings-icon" />
));
jest.mock("../../SVGIcons/New", () => () => <div data-testid="new-icon" />);

const mockSetActivePage = jest.fn();
const mockPersistCreatedPage = jest.fn();
const mockSetActivePropertyPage = jest.fn();
const mockResetActivePage = jest.fn();
const mockHandlePageSave = jest.fn();
const mockAllow = jest.fn();
const mockBlock = jest.fn();
const mockGuardedNavigate = jest.fn();
const mockPushPageHistory = jest.fn();
let capturedDropdownValue = "";

const defaultPages = [
  { pageCode: "p1", name: "Page 1" },
  { pageCode: "p2", name: "Page 2" },
];

const setup = (overrides: any = {}) => {
  jest.clearAllMocks();
  capturedDropdownValue = "";

  (useMicrosite as jest.Mock).mockReturnValue({
    microsite:
      overrides.microsite !== undefined
        ? overrides.microsite
        : {
            code: "site-1",
            pages:
              overrides.pages !== undefined ? overrides.pages : defaultPages,
          },
    activePageCode:
      overrides.activePageCode !== undefined ? overrides.activePageCode : "p1",
    setActivePage: mockSetActivePage,
  });

  (usePropertyPane as jest.Mock).mockReturnValue({
    setActivePage: mockSetActivePropertyPage,
    resetActivePage: mockResetActivePage,
  });

  (useUserTask as jest.Mock).mockReturnValue({
    hasPageChanges: overrides.hasPageChanges ?? false,
  });

  (useControlPanel as jest.Mock).mockReturnValue({
    isAutoSave: overrides.isAutoSave ?? false,
    isSaveSuccessful: overrides.isSaveSuccessful ?? false,
    pushPageHistory: mockPushPageHistory,
  });

  (useNavigationGuard as jest.Mock).mockReturnValue({
    showModal: overrides.showModal ?? false,
    allow: mockAllow,
    block: mockBlock,
    guardedNavigate: mockGuardedNavigate.mockImplementation((cb) => {
      if (!overrides.manualNavigation) cb();
    }),
  });

  (useMicrositePageSave as jest.Mock).mockReturnValue({
    handlePageSave: mockHandlePageSave,
  });

  (useDurableMicrositePageCreation as jest.Mock).mockReturnValue({
    persistCreatedPage: mockPersistCreatedPage.mockResolvedValue(undefined),
  });

  return render(<PageSelector />);
};

describe("PageSelector", () => {
  it("renders dropdown and settings when pages exist", () => {
    setup();
    expect(screen.getByTestId("page-selector")).toBeInTheDocument();
    expect(screen.getByTestId("pageSettings")).toBeInTheDocument();
    expect(screen.getByTestId("addNewPage")).toBeInTheDocument();
  });

  it("automatically opens FormPane when pages are empty (useEffect coverage)", () => {
    setup({ pages: [] });
    expect(screen.getByTestId("form-pane")).toBeInTheDocument();
    expect(screen.queryByTestId("page-selector")).not.toBeInTheDocument();
  });

  it("handles page change via dropdown with no changes", () => {
    setup();
    const select = screen.getByTestId("page-selector");
    fireEvent.change(select, { target: { value: "p2" } });

    expect(mockGuardedNavigate).toHaveBeenCalled();
    expect(mockPushPageHistory).toHaveBeenCalledWith("p1", "p2");
    expect(mockSetActivePage).toHaveBeenCalledWith("p2");
    expect(mockResetActivePage).toHaveBeenCalled();
  });

  it("does not push history when the selected page is already active", () => {
    setup({ activePageCode: "p1" });

    fireEvent.change(screen.getByTestId("page-selector"), {
      target: { value: "p1" },
    });

    expect(mockGuardedNavigate).not.toHaveBeenCalled();
    expect(mockPushPageHistory).not.toHaveBeenCalled();
  });

  it("pushes an empty previous page code when there is no active page", () => {
    setup({ activePageCode: null });

    fireEvent.change(screen.getByTestId("page-selector"), {
      target: { value: "p2" },
    });

    expect(mockPushPageHistory).toHaveBeenCalledWith("", "p2");
    expect(mockSetActivePage).toHaveBeenCalledWith("p2");
  });

  it("calls handlePageSave when confirming navigation with unsaved changes", async () => {
    setup({ hasPageChanges: true });
    const select = screen.getByTestId("page-selector");

    fireEvent.change(select, { target: { value: "p2" } });

    await waitFor(() => {
      expect(mockHandlePageSave).toHaveBeenCalled();
      expect(mockSetActivePage).toHaveBeenCalledWith("p2");
    });
  });

  it("opens page settings if activePageCode exists", () => {
    setup({ activePageCode: "p1" });
    fireEvent.click(screen.getByTestId("pageSettings"));
    expect(mockSetActivePropertyPage).toHaveBeenCalledWith("p1");
  });

  it("does not open page settings if activePageCode is missing", () => {
    setup({ activePageCode: "" });
    fireEvent.click(screen.getByTestId("pageSettings"));
    expect(mockSetActivePropertyPage).not.toHaveBeenCalled();
  });

  it("toggles FormPane using Add New Page button", () => {
    setup();
    fireEvent.click(screen.getByTestId("addNewPage"));
    expect(screen.getByTestId("form-pane")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("form-close"));
    expect(screen.queryByTestId("form-pane")).not.toBeInTheDocument();
  });

  it("handles successful page creation", async () => {
    setup();
    fireEvent.click(screen.getByTestId("addNewPage"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("form-create"));
    });

    await waitFor(() => {
      expect(mockPersistCreatedPage).toHaveBeenCalledWith("new-page-code");
      expect(screen.queryByTestId("form-pane")).not.toBeInTheDocument();
    });

    expect(scrollToTop).toHaveBeenCalled();
  });

  it("keeps the create pane open when durable page persistence fails", async () => {
    mockPersistCreatedPage.mockRejectedValueOnce(
      new Error("Failed to save microsite"),
    );
    setup();

    fireEvent.click(screen.getByTestId("addNewPage"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("form-create"));
    });

    await waitFor(() => {
      expect(mockPersistCreatedPage).toHaveBeenCalledWith("new-page-code");
    });

    expect(screen.getByTestId("form-pane")).toBeInTheDocument();
  });

  it("handles Modal Confirm (Save and Leave)", async () => {
    setup({ showModal: true, hasPageChanges: true, manualNavigation: true });

    fireEvent.change(screen.getByTestId("page-selector"), {
      target: { value: "p2" },
    });

    const confirmBtn = screen.getByTestId("modal-confirm");
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(mockHandlePageSave).toHaveBeenCalled();
    expect(mockSetActivePage).toHaveBeenCalledWith("p2");
  });

  it("handles Modal Cancel (Leave without Saving)", () => {
    setup({ showModal: true, manualNavigation: true });

    fireEvent.change(screen.getByTestId("page-selector"), {
      target: { value: "p2" },
    });

    const cancelBtn = screen.getByTestId("modal-cancel");
    fireEvent.click(cancelBtn);

    expect(mockHandlePageSave).not.toHaveBeenCalled();
    expect(mockSetActivePage).toHaveBeenCalledWith("p2");
    expect(mockAllow).toHaveBeenCalled();
  });

  it("handles Modal Backdrop (Stay on current page)", () => {
    setup({ showModal: true, manualNavigation: true });

    fireEvent.change(screen.getByTestId("page-selector"), {
      target: { value: "p2" },
    });

    const backdropBtn = screen.getByTestId("modal-backdrop");
    fireEvent.click(backdropBtn);

    expect(mockBlock).toHaveBeenCalled();
    expect(mockSetActivePage).not.toHaveBeenCalled();
  });

  it("allows closing the unsaved modal when no page is pending", async () => {
    setup({ showModal: true, hasPageChanges: false, manualNavigation: true });

    await act(async () => {
      fireEvent.click(screen.getByTestId("modal-confirm"));
    });

    expect(mockAllow).toHaveBeenCalled();
    expect(mockSetActivePage).not.toHaveBeenCalled();
    expect(mockPushPageHistory).not.toHaveBeenCalled();
  });

  it("uses a blank selected value when the active page is no longer valid and trims underscore labels", () => {
    setup({
      pages: [{ pageCode: "microsite_home", name: "Home" }],
      activePageCode: "missing-page",
    });

    expect(capturedDropdownValue).toBe("");
    expect(screen.getByRole("option", { name: "home" })).toBeInTheDocument();
  });

  it("calculates shouldOpenModal correctly based on memoized dependencies", () => {
    setup({ isAutoSave: true, hasPageChanges: true });

    expect(useNavigationGuard).toHaveBeenCalledWith(false);

    setup({ isAutoSave: false, hasPageChanges: false });
    expect(useNavigationGuard).toHaveBeenCalledWith(false);

    setup({ isAutoSave: false, hasPageChanges: true, isSaveSuccessful: false });
    expect(useNavigationGuard).toHaveBeenCalledWith(true);
  });
});
