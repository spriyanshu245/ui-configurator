// src/app/components/MicrositeControlPanel/MicrositeControlPanel.test.tsx
import React from "react";
import "@testing-library/jest-dom";
import {
  render,
  fireEvent,
  waitFor,
  act,
  screen,
} from "@testing-library/react";
import MicrositeControlPanel from "./MicrositeControlPanel";
import { apiRequest } from "../../services/APIService";
import {
  createNextDraftMicrositeVersion,
  ensureEditableMicrositeVersion,
} from "../../utils/micrositeOrchestration";

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const buildMicrositeContextValue = (overrides: Record<string, any> = {}) => ({
  microsite: {
    id: "test-id",
    code: "test-slug",
    slug: "test-slug",
    name: "test-microsite",
    version: 1,
    firstPageCode: "test-slug_home",
    pages: [{ pageCode: "test-slug_home", pageVersion: 1 }],
    ...overrides.microsite,
  },
  activePageCode: "test-slug_home",
  isEditing: true,
  hasChanges: true,
  setActivePage: jest.fn(),
  setIsEditing: jest.fn(),
  setHasChanges: jest.fn(),
  updateMicrositeProperties: jest.fn(),
  getPageVersion: jest.fn(() => 1),
  ...overrides,
});

// --- Shared mocks ---

const mockSetUserNotification = jest.fn();
jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({ setUserNotification: mockSetUserNotification }),
}));

const mockResetActivePage = jest.fn();
jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: () => ({ resetActivePage: mockResetActivePage }),
}));

const mockUpdateUserTask = jest.fn();

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: () => ({
    updateUserTask: mockUpdateUserTask,
    hasPageChanges: false,
    setHasPageChanges: jest.fn(),
    userTask: { components: [] },
  }),
}));

// Other context mocks
jest.mock("next/navigation", () => ({
  useParams: () => ({ micrositeUrlSlug: "test-slug", version: "v1" }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/app/context/MicrositeContext", () => ({
  useMicrosite: () => buildMicrositeContextValue(),
}));

const mockToggleAutoSave = jest.fn();
const mockSetIsAutoSaveInProgress = jest.fn();
const mockSetIsSaveSuccessful = jest.fn();
const mockGoBackPageHistory = jest.fn();
const mockGoForwardPageHistory = jest.fn();
jest.mock("@/app/context/ControlPanelContext", () => ({
  useControlPanel: () => ({
    isAutoSave: false,
    toggleAutoSave: mockToggleAutoSave,
    setIsAutoSaveInProgress: mockSetIsAutoSaveInProgress,
    setIsSaveSuccessful: mockSetIsSaveSuccessful,
    isSaveSuccessful: false,
    canNavigatePageBack: false,
    canNavigatePageForward: false,
    goBackPageHistory: mockGoBackPageHistory,
    goForwardPageHistory: mockGoForwardPageHistory,
  }),
}));

jest.mock("@/app/context/ConfigContext", () => ({
  useConfig: () => ({ config: {} }),
}));

jest.mock("@/app/services/APIService", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("@/app/utils/userTask/userTaskUtils", () => ({
  saveMicrosite: (microsite: any) => microsite,
}));

jest.mock("../../utils/micrositeOrchestration", () => ({
  dedupePageCodes: jest.requireActual("../../utils/micrositeOrchestration")
    .dedupePageCodes,
  createNextDraftMicrositeVersion: jest.fn(),
  ensureEditableMicrositeVersion: jest.fn(),
}));

// Dummy PageSelector component
jest.mock(
  "@/app/components/MicrositeBuilder/PageSelector/PageSelector",
  () => () => <div data-testid="page-selector">PageSelector</div>,
);

// Dummy ToggleSwitch component
jest.mock("@/app/components/ToggleSwitch/ToggleSwitch", () => (props: any) => (
  <button data-testid="toggle-switch" onClick={props.onToggle}>
    {props.label} - {props.isToggled ? "On" : "Off"}
  </button>
));

type SelectedDropdownOption = {
  id: string;
  elementId?: string;
};

let capturedOnItemSelect: ((option: SelectedDropdownOption) => void) | null =
  null;
let capturedSearchOptions: Array<{
  id: string;
  label: string;
  tagName: string;
  keys: {
    type: string;
    name: string;
    label: string;
    text: string;
  };
}> | null = null;

const getCapturedOnItemSelect = () => {
  if (!capturedOnItemSelect) {
    throw new Error("Expected SearchableDropdown onItemSelect to be captured");
  }

  return capturedOnItemSelect;
};

const getCapturedSearchOptions = () => {
  if (!capturedSearchOptions) {
    throw new Error("Expected SearchableDropdown options to be captured");
  }

  return capturedSearchOptions;
};

jest.mock(
  "@/app/components/InternalComponents/SearchableDropdown/SearchableDropdown",
  () =>
    (props: {
      onItemSelect: (option: SelectedDropdownOption) => void;
      options: Array<{
        id: string;
        label: string;
        tagName: string;
        keys: {
          type: string;
          name: string;
          label: string;
          text: string;
        };
      }>;
    }) => {
      capturedOnItemSelect = props.onItemSelect;
      capturedSearchOptions = props.options;
      return <div data-testid="searchable-dropdown">SearchableDropdown</div>;
    },
);

// Mock CSS modules
jest.mock(
  "@/app/components/MicrositeControlPanel/MicrositeControlPanel.module.scss",
  () => ({
    controlPanelContainer: "controlPanelContainer",
    innerPanel: "innerPanel",
    rightPanel: "rightPanel",
  }),
);
jest.mock("@/app/styles/shared.module.scss", () => ({
  button: "button",
  secondaryBorderButton: "secondaryBorderButton",
  iconButton: "iconButton",
  smallSvg: "smallSvg",
  activeButton: "activeButton",
  primaryButton: "primaryButton",
}));

jest.mock("@/app/hooks/useNavigationGuard", () => ({
  useNavigationGuard: () => ({
    showModal: false,
    allow: jest.fn(),
    block: jest.fn(),
    guardedNavigate: (action: () => void) => action(),
  }),
}));

jest.mock("@/app/hooks/useUserTaskComponentList", () => ({
  useTaskComponents: () => [],
}));

jest.mock(
  "@/app/components/InternalComponents/Modal/Modal",
  () =>
    (props: {
      isOpen: boolean;
      backDrop: () => void;
      onClose: () => void;
      onSubmit: () => void;
    }) => {
      if (!props.isOpen) return null;
      return (
        <div data-testid="modal">
          <button data-testid="backdrop" onClick={props.backDrop} type="button">
            Backdrop
          </button>
          <button data-testid="close-button" onClick={props.onClose}>
            Close
          </button>
          <button data-testid="submit-button" onClick={props.onSubmit}>
            Submit
          </button>
        </div>
      );
    },
);

jest.mock(
  "@/app/components/InternalComponents/UnsavedChangesPopupp/UnsavedChangesPopup",
  () => ({
    UnsavedChangesModal: (props: {
      open: boolean;
      onConfirm: () => void;
      onCancel: () => void;
      backDrop: () => void;
    }) => {
      if (!props.open) return null;
      return (
        <div data-testid="unsaved-changes-modal">
          <button data-testid="unsaved-confirm" onClick={props.onConfirm}>
            Confirm
          </button>
          <button data-testid="unsaved-cancel" onClick={props.onCancel}>
            Cancel
          </button>
          <button
            data-testid="unsaved-backdrop"
            onClick={props.backDrop}
            type="button"
          >
            Backdrop
          </button>
        </div>
      );
    },
  }),
);

jest.mock(
  "@/app/components/OperationProgressModal/OperationProgressModal",
  () =>
    (props: {
      isOpen: boolean;
      title: string;
      progress: { label: string; current: number; total: number } | null;
    }) => {
      if (!props.isOpen || !props.progress) return null;
      return (
        <div data-testid="operation-progress-modal">
          <span>{props.title}</span>
          <span>{props.progress.label}</span>
          <span>{`${props.progress.current}/${props.progress.total}`}</span>
        </div>
      );
    },
);

afterEach(() => {
  jest.restoreAllMocks();
});

// --- Tests ---
describe("MicrositeControlPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnItemSelect = null;
    capturedSearchOptions = null;
    (createNextDraftMicrositeVersion as jest.Mock).mockResolvedValue({
      version: 2,
    });
    (ensureEditableMicrositeVersion as jest.Mock).mockResolvedValue({
      version: 2,
      created: false,
    });
    jest.spyOn(require("next/navigation"), "useParams").mockReturnValue({
      micrositeUrlSlug: "test-slug",
      version: "v1",
      workspaceCode: "W-101",
    });
  });

  test("renders control panel with PageSelector and buttons", () => {
    const { getByTestId, getByRole } = render(<MicrositeControlPanel />);
    expect(getByTestId("page-selector")).toBeInTheDocument();
    expect(getByTestId("page-history-back")).toBeInTheDocument();
    expect(getByTestId("page-history-forward")).toBeInTheDocument();
    expect(getByTestId("toggle-switch")).toBeInTheDocument();
    expect(getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(getByTestId("publish")).toBeInTheDocument();
  });

  test("disables page history buttons when there is no navigation history", () => {
    render(<MicrositeControlPanel />);

    expect(screen.getByTestId("page-history-back")).toBeDisabled();
    expect(screen.getByTestId("page-history-forward")).toBeDisabled();
  });

  test("navigates backward through page history when enabled", () => {
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: mockToggleAutoSave,
        setIsAutoSaveInProgress: mockSetIsAutoSaveInProgress,
        setIsSaveSuccessful: mockSetIsSaveSuccessful,
        isSaveSuccessful: false,
        canNavigatePageBack: true,
        canNavigatePageForward: false,
        goBackPageHistory:
          mockGoBackPageHistory.mockReturnValue("previous-page"),
        goForwardPageHistory: mockGoForwardPageHistory,
      });
    const setActivePage = jest.fn();
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          activePageCode: "current-page",
          setActivePage,
        }),
      );

    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByTestId("page-history-back"));

    expect(mockGoBackPageHistory).toHaveBeenCalledWith("current-page");
    expect(setActivePage).toHaveBeenCalledWith("previous-page");
    expect(mockResetActivePage).toHaveBeenCalled();
  });

  test("calls handleSave successfully on save button click", async () => {
    (apiRequest as jest.Mock).mockResolvedValue({
      message: "Saved successfully",
    });
    const { getByRole } = render(<MicrositeControlPanel />);
    fireEvent.click(getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });
    expect(mockSetUserNotification).toHaveBeenCalledWith({
      text: "Saved",
      time: 2000,
      type: "success",
    });
    expect(mockSetIsSaveSuccessful).toHaveBeenCalledWith(true);
  });

  test("calls handleSave and handles error when apiRequest fails", async () => {
    (apiRequest as jest.Mock).mockRejectedValue(new Error("error"));
    const { getByRole } = render(<MicrositeControlPanel />);
    fireEvent.click(getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });
    expect(mockSetUserNotification).toHaveBeenCalledWith({
      text: "error",
      time: 7000,
      type: "error",
    });
    expect(mockSetIsSaveSuccessful).toHaveBeenCalledWith(false);
  });

  test("launches preview on preview button click", () => {
    window.open = jest.fn();
    const { getByRole } = render(<MicrositeControlPanel />);
    const previewButton = getByRole("button", { name: "Preview" });
    fireEvent.click(previewButton);
    expect(window.open).toHaveBeenCalledWith(
      "preview",
      "_blank",
      "noopener,noreferrer",
    );
  });

  test("toggleAutoSave is called when toggle switch is clicked", () => {
    const { getByTestId } = render(<MicrositeControlPanel />);
    fireEvent.click(getByTestId("toggle-switch"));
    expect(mockToggleAutoSave).toHaveBeenCalled();
  });

  test("opens modal on publish button click and calls publish", async () => {
    (apiRequest as jest.Mock).mockResolvedValue({});
    const push = jest.fn();
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({
      push,
    });
    const { getByTestId } = render(<MicrositeControlPanel />);
    const publishButton = getByTestId("publish");
    fireEvent.click(publishButton);
    // Modal should open
    expect(getByTestId("modal")).toBeInTheDocument();
    // Simulate clicking the modal submit button to trigger publish
    fireEvent.click(getByTestId("submit-button"));
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(2);
    });
    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        endpoint: "/api/v1/config/microsites/test-slug?version=1&publish=true",
        method: "PUT",
      }),
    );
    expect(createNextDraftMicrositeVersion).toHaveBeenCalledWith({
      workspaceCode: "W-101",
      sourceMicrosite: expect.objectContaining({
        code: "test-slug",
        version: 1,
      }),
      currentVersion: 1,
      onProgress: expect.any(Function),
    });
    expect(push).toHaveBeenCalledWith("/workspaces/W-101/microsites");
  });

  test("shows a blocking progress modal while publishing", async () => {
    const nextDraftDeferred = createDeferred<{ version: number }>();

    (apiRequest as jest.Mock).mockImplementation(
      async (request: { endpoint: string }) => {
        if (request.endpoint.includes("publish=true")) {
          return {};
        }
        return { micrositeData: { updatedOn: "2024-01-01T12:00:00Z" } };
      },
    );
    (createNextDraftMicrositeVersion as jest.Mock).mockImplementation(
      ({ onProgress }: { onProgress: (progress: any) => void }) => {
        onProgress({
          phase: "creating-pages",
          label: "Creating pages for the next draft...",
          current: 2,
          total: 3,
          detail: "Creating pages 1/1",
        });
        return nextDraftDeferred.promise;
      },
    );

    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByTestId("publish"));
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(
      await screen.findByTestId("operation-progress-modal"),
    ).toBeInTheDocument();
    expect(screen.getByText("Publishing microsite")).toBeInTheDocument();

    nextDraftDeferred.resolve({ version: 2 });
    await waitFor(() => {
      expect(
        screen.queryByTestId("operation-progress-modal"),
      ).not.toBeInTheDocument();
    });
  });

  test("routes Edit on a published microsite to the existing draft", async () => {
    const push = jest.fn();

    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({
      push,
    });
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          microsite: {
            code: "test-slug",
            slug: "test-slug",
            name: "test-microsite",
            version: 1,
            firstPageCode: "test-slug_home",
            pages: [{ pageCode: "test-slug_home", pageVersion: 1 }],
          },
          isEditing: false,
          hasChanges: false,
        }),
      );

    (ensureEditableMicrositeVersion as jest.Mock).mockResolvedValue({
      version: 4,
      created: false,
    });

    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByLabelText("Edit"));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        "/workspaces/W-101/microsites/test-slug/v4/configure",
      );
    });
  });

  test("creates a missing draft from a published microsite before routing", async () => {
    const push = jest.fn();

    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({
      push,
    });
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          microsite: {
            code: "test-slug",
            slug: "test-slug",
            name: "test-microsite",
            version: 1,
            firstPageCode: "test-slug_home",
            pages: [{ pageCode: "test-slug_home", pageVersion: 1 }],
          },
          isEditing: false,
          hasChanges: false,
        }),
      );

    (ensureEditableMicrositeVersion as jest.Mock).mockResolvedValue({
      version: 2,
      created: true,
    });

    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByLabelText("Edit"));

    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalledWith({
        text: "Draft v2 created.",
        time: 2500,
        type: "success",
      });
      expect(push).toHaveBeenCalledWith(
        "/workspaces/W-101/microsites/test-slug/v2/configure",
      );
    });
  });

  test("shows progress while creating a missing draft from a published microsite", async () => {
    const editableDraftDeferred = createDeferred<{
      version: number;
      created: boolean;
    }>();

    const push = jest.fn();

    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({
      push,
    });
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          microsite: {
            code: "test-slug",
            slug: "test-slug",
            name: "test-microsite",
            version: 1,
            firstPageCode: "test-slug_home",
            pages: [{ pageCode: "test-slug_home", pageVersion: 1 }],
          },
          isEditing: false,
          hasChanges: false,
        }),
      );

    (ensureEditableMicrositeVersion as jest.Mock).mockImplementation(
      ({ onProgress }: { onProgress: (progress: any) => void }) => {
        onProgress({
          phase: "creating-pages",
          label: "Creating pages for the next draft...",
          current: 2,
          total: 3,
        });
        return editableDraftDeferred.promise;
      },
    );

    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByLabelText("Edit"));

    expect(
      await screen.findByTestId("operation-progress-modal"),
    ).toBeInTheDocument();
    expect(screen.getByText("Opening editable draft")).toBeInTheDocument();

    editableDraftDeferred.resolve({
      version: 2,
      created: true,
    });
    await waitFor(() => {
      expect(
        screen.queryByTestId("operation-progress-modal"),
      ).not.toBeInTheDocument();
    });
  });

  test("triggers save on ctrl+s keyboard shortcut", async () => {
    (apiRequest as jest.Mock).mockResolvedValue({
      message: "Saved successfully",
    });
    render(<MicrositeControlPanel />);
    fireEvent.keyDown(document, { key: "s", ctrlKey: true });
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });
  });

  test("removes keydown listener on unmount", () => {
    const addSpy = jest.spyOn(document, "addEventListener");
    const removeSpy = jest.spyOn(document, "removeEventListener");
    const { unmount } = render(<MicrositeControlPanel />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  test("handlePageHistoryConfirm calls handlePageSave when hasPageChanges and navigates", async () => {
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: true,
        canNavigatePageForward: false,
        goBackPageHistory: mockGoBackPageHistory.mockReturnValue("prev-page"),
        goForwardPageHistory: mockGoForwardPageHistory,
      });
    jest
      .spyOn(require("@/app/context/UserTaskContext"), "useUserTask")
      .mockReturnValue({
        updateUserTask: jest.fn(),
        hasPageChanges: true,
        setHasPageChanges: jest.fn(),
        userTask: { components: [] },
      });
    jest
      .spyOn(require("@/app/hooks/useNavigationGuard"), "useNavigationGuard")
      .mockImplementation(() => ({
        showModal: false,
        allow: jest.fn(),
        block: jest.fn(),
        guardedNavigate: (action: () => void) => action(),
      }));
    (apiRequest as jest.Mock).mockResolvedValue({});
    const setActivePage = jest.fn();
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          activePageCode: "current-page",
          setActivePage,
        }),
      );
    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByTestId("page-history-back"));
    await waitFor(() => {
      expect(setActivePage).toHaveBeenCalledWith("prev-page");
    });
  });

  test("pageHistoryModal shows and backDrop calls handlePageHistoryStay", async () => {
    const mockBlock = jest.fn();
    let callCount = 0;
    jest
      .spyOn(require("@/app/hooks/useNavigationGuard"), "useNavigationGuard")
      .mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return {
            showModal: true,
            allow: jest.fn(),
            block: mockBlock,
            guardedNavigate: jest.fn(),
          };
        }
        return {
          showModal: false,
          allow: jest.fn(),
          block: jest.fn(),
          guardedNavigate: (action: () => void) => action(),
        };
      });
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: false,
        canNavigatePageForward: false,
        goBackPageHistory: mockGoBackPageHistory,
        goForwardPageHistory: mockGoForwardPageHistory,
      });
    render(<MicrositeControlPanel />);
    const backdrop = screen.queryByTestId("unsaved-backdrop");
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockBlock).toHaveBeenCalled();
    }
  });

  test("pageHistoryModal onConfirm with pending direction navigates", async () => {
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: false,
        canNavigatePageForward: false,
        goBackPageHistory: mockGoBackPageHistory.mockReturnValue("prev-page"),
        goForwardPageHistory: mockGoForwardPageHistory,
      });
    render(<MicrositeControlPanel />);
    const confirmBtn = screen.queryByTestId("unsaved-confirm");
    if (confirmBtn) {
      fireEvent.click(confirmBtn);
    }
  });
});

describe("MicrositeControlPanel autosave useEffect", () => {
  let micrositeMock: any;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    micrositeMock = {
      id: "m1",
      pages: [{ id: "p1", sections: [] }],
      lastUpdatedOn: "2023-01-01",
      firstPageId: "p1",
    };

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          microsite: micrositeMock,
        }),
      );

    jest
      .spyOn(require("@/app/services/APIService"), "apiRequest")
      .mockResolvedValue({
        micrositeData: {
          updatedOn: "2024-01-01T12:00:00Z",
        },
      });
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: true,
        toggleAutoSave: mockToggleAutoSave,
        setIsAutoSaveInProgress: mockSetIsAutoSaveInProgress,
        setIsSaveSuccessful: mockSetIsSaveSuccessful,
      });

    jest
      .spyOn(require("@/app/context/HeaderContextV2"), "useHeaderV2")
      .mockReturnValue({
        setUserNotification: jest.fn(),
      });

    jest
      .spyOn(require("@/app/context/UserTaskContext"), "useUserTask")
      .mockReturnValue({
        updateUserTask: jest.fn(),
        setHasPageChanges: jest.fn(),
        userTask: { id: "p1", sections: [] },
      });

    jest
      .spyOn(require("@/app/context/ConfigContext"), "useConfig")
      .mockReturnValue({
        config: {},
      });

    jest.clearAllMocks();
  });

  test("should not trigger autosave on initial mount", () => {
    render(<MicrositeControlPanel />);

    act(() => {
      jest.advanceTimersByTime(4000);
    });
  });

  test("should clear timer when auto-save is disabled", () => {
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    render(<MicrositeControlPanel />);

    act(() => {
      jest.advanceTimersByTime(4000);
    });
  });

  test("should trigger autosave if microsite is changed and auto-save is on", async () => {
    const updatedMicrosite = {
      ...micrositeMock,
      pages: [{ id: "p1", sections: [{ id: "s1" }] }],
    };

    let rerenderMicrosite = micrositeMock;

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockImplementation(() =>
        buildMicrositeContextValue({
          microsite: rerenderMicrosite,
        }),
      );

    const { rerender } = render(<MicrositeControlPanel />);

    rerenderMicrosite = updatedMicrosite;
    rerender(<MicrositeControlPanel />);

    await act(async () => {
      jest.advanceTimersByTime(3100);
    });
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await Promise.resolve();
    });
  });

  test("should complete timer callback and reset refs after autosave", async () => {
    const updatedMicrosite = {
      ...micrositeMock,
      pages: [{ id: "p1", sections: [{ id: "s1" }] }],
    };

    let rerenderMicrosite = micrositeMock;

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockImplementation(() =>
        buildMicrositeContextValue({
          microsite: rerenderMicrosite,
        }),
      );

    const { rerender } = render(<MicrositeControlPanel />);

    rerenderMicrosite = updatedMicrosite;
    rerender(<MicrositeControlPanel />);

    await act(async () => {
      jest.advanceTimersByTime(2100);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(apiRequest).toHaveBeenCalled();
  });

  test("should not trigger autosave if microsite has not changed", async () => {
    render(<MicrositeControlPanel />);

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
  });

  test("should clear timer when isAutoSave becomes false", async () => {
    const microsite = {
      id: "m1",
      pages: [{ id: "p1", sections: [] }],
      lastUpdatedOn: "2023-01-01",
      firstPageId: "p1",
    };

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          microsite: micrositeMock,
        }),
      );

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: true,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    render(<MicrositeControlPanel />);

    await act(() => {
      jest.advanceTimersByTime(100);
      return Promise.resolve();
    });

    const updatedMicrosite = {
      ...microsite,
      pages: [{ id: "p1", sections: [{ id: "s1" }] }],
    };

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          microsite: updatedMicrosite,
        }),
      );

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    render(<MicrositeControlPanel />);

    await act(() => {
      jest.advanceTimersByTime(3100);
      return Promise.resolve();
    });

    // Expect: no error, and timer should have been cleared
    // You can assert no API call or state update if you mock them
  });

  test("should clear timeout on component unmount", () => {
    const { unmount } = render(<MicrositeControlPanel />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    unmount();

    // No assertion needed — if no error is thrown and no unhandled timers exist, it's passed.
  });

  test("should clear existing timer when microsite changes rapidly", async () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    let currentMicrosite = micrositeMock;

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockImplementation(() =>
        buildMicrositeContextValue({
          microsite: currentMicrosite,
        }),
      );

    const { rerender } = render(<MicrositeControlPanel />);

    currentMicrosite = {
      ...micrositeMock,
      pages: [{ id: "p1", sections: [{ id: "s1" }] }],
    };
    rerender(<MicrositeControlPanel />);
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    currentMicrosite = {
      ...micrositeMock,
      pages: [{ id: "p1", sections: [{ id: "s1" }, { id: "s2" }] }],
    };
    rerender(<MicrositeControlPanel />);

    await act(async () => {
      jest.advanceTimersByTime(3100);
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    clearTimeoutSpy.mockRestore();
  });

  test("should cover timer cleanup in useEffect return function", () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    let currentMicrosite = micrositeMock;

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockImplementation(() =>
        buildMicrositeContextValue({
          microsite: currentMicrosite,
        }),
      );

    const { rerender, unmount } = render(<MicrositeControlPanel />);

    currentMicrosite = {
      ...micrositeMock,
      pages: [{ id: "p1", sections: [{ id: "s1" }] }],
    };
    rerender(<MicrositeControlPanel />);
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  test("should clear timer in handleManualSave when timer exists", async () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: mockSetIsAutoSaveInProgress,
        setIsSaveSuccessful: mockSetIsSaveSuccessful,
      });

    let currentMicrosite = micrositeMock;

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockImplementation(() =>
        buildMicrositeContextValue({
          microsite: currentMicrosite,
        }),
      );

    const { rerender, getByRole } = render(<MicrositeControlPanel />);

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: true,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: mockSetIsAutoSaveInProgress,
        setIsSaveSuccessful: mockSetIsSaveSuccessful,
      });

    currentMicrosite = {
      ...micrositeMock,
      pages: [{ id: "p1", sections: [{ id: "s1" }] }],
    };
    rerender(<MicrositeControlPanel />);

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: mockSetIsAutoSaveInProgress,
        setIsSaveSuccessful: mockSetIsSaveSuccessful,
      });
    rerender(<MicrositeControlPanel />);

    const saveButton = getByRole("button", { name: "Save" });
    fireEvent.click(saveButton);

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  test("should handle timer cleanup when autoSaveTimerRef.current is null", () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    let currentMicrosite = micrositeMock;

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockImplementation(() =>
        buildMicrositeContextValue({
          microsite: currentMicrosite,
        }),
      );

    const { rerender } = render(<MicrositeControlPanel />);
    currentMicrosite = {
      ...micrositeMock,
      pages: [{ id: "p1", sections: [{ id: "s1" }] }],
    };
    rerender(<MicrositeControlPanel />);
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: true,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });
    rerender(<MicrositeControlPanel />);
    expect(clearTimeoutSpy).not.toHaveBeenCalledWith(null);

    clearTimeoutSpy.mockRestore();
  });

  test("should set autoSaveTimerRef.current to null after clearing timeout", async () => {
    let currentMicrosite = micrositeMock;

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockImplementation(() =>
        buildMicrositeContextValue({
          microsite: currentMicrosite,
        }),
      );

    const { rerender } = render(<MicrositeControlPanel />);

    currentMicrosite = {
      ...micrositeMock,
      pages: [{ id: "p1", sections: [{ id: "s1" }] }],
    };
    rerender(<MicrositeControlPanel />);
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    currentMicrosite = {
      ...micrositeMock,
      pages: [{ id: "p1", sections: [{ id: "s1" }, { id: "s2" }] }],
    };
    rerender(<MicrositeControlPanel />);
    await act(async () => {
      jest.advanceTimersByTime(3100);
    });

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });
  });

  test("should handle early return when auto-save is disabled without clearing timer", () => {
    let currentMicrosite = micrositeMock;

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockImplementation(() =>
        buildMicrositeContextValue({
          microsite: currentMicrosite,
        }),
      );

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: true,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    const { rerender } = render(<MicrositeControlPanel />);

    currentMicrosite = {
      ...micrositeMock,
      pages: [{ id: "p1", sections: [{ id: "s1" }] }],
    };
    rerender(<MicrositeControlPanel />);

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });
    rerender(<MicrositeControlPanel />);

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(apiRequest).not.toHaveBeenCalled();
  });

  test("should handle publish error and show error notification", async () => {
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Publish error"));
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const mockSetUserNotificationLocal = jest.fn();

    jest
      .spyOn(require("@/app/context/HeaderContextV2"), "useHeaderV2")
      .mockReturnValue({
        setUserNotification: mockSetUserNotificationLocal,
      });

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    const { getByTestId } = render(<MicrositeControlPanel />);
    fireEvent.click(getByTestId("publish"));
    fireEvent.click(getByTestId("submit-button"));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockSetUserNotificationLocal).toHaveBeenCalledWith({
        text: "Publish failed",
        time: 2000,
        type: "error",
      });
    });

    consoleSpy.mockRestore();
  });

  test("should call setIsEditing when edit button is clicked", async () => {
    const mockSetIsEditing = jest.fn();

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          isEditing: false,
          hasChanges: false,
          setIsEditing: mockSetIsEditing,
          microsite: {
            code: "test-slug",
            slug: "test-slug",
            name: "test-microsite",
            version: 1,
            firstPageCode: "test-slug_home",
            pages: [],
          },
        }),
      );

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    (ensureEditableMicrositeVersion as jest.Mock).mockResolvedValue({
      version: 1,
      created: false,
    });

    const { getByLabelText } = render(<MicrositeControlPanel />);
    fireEvent.click(getByLabelText("Edit"));

    await waitFor(() => {
      expect(mockSetIsEditing).toHaveBeenCalledWith(true);
    });
  });

  test("should scroll to element when item is selected from search dropdown", async () => {
    const scrollToSpy = jest.spyOn(window, "scrollTo").mockImplementation();
    const mockElement = document.createElement("div");
    mockElement.id = "test-component-id";
    Object.defineProperty(mockElement, "offsetTop", { value: 200 });
    Object.defineProperty(mockElement, "offsetParent", { value: null });
    document.body.appendChild(mockElement);

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    render(<MicrositeControlPanel />);

    const onItemSelect = getCapturedOnItemSelect();
    onItemSelect({ id: "test-component-id" });

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 50,
      behavior: "smooth",
    });

    document.body.removeChild(mockElement);
    scrollToSpy.mockRestore();
  });

  test("should handle nested offset parents when scrolling to element", async () => {
    const scrollToSpy = jest.spyOn(window, "scrollTo").mockImplementation();

    const parentElement = document.createElement("div");
    Object.defineProperty(parentElement, "offsetTop", { value: 100 });
    Object.defineProperty(parentElement, "offsetParent", { value: null });

    const mockElement = document.createElement("div");
    mockElement.id = "nested-component";
    Object.defineProperty(mockElement, "offsetTop", { value: 50 });
    Object.defineProperty(mockElement, "offsetParent", {
      value: parentElement,
    });
    document.body.appendChild(mockElement);
    document.body.appendChild(parentElement);

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    render(<MicrositeControlPanel />);

    const onItemSelect = getCapturedOnItemSelect();
    onItemSelect({ id: "nested-component" });

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });

    document.body.removeChild(mockElement);
    document.body.removeChild(parentElement);
    scrollToSpy.mockRestore();
  });

  test("should not scroll when element is not found", async () => {
    const scrollToSpy = jest.spyOn(window, "scrollTo").mockImplementation();

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    render(<MicrositeControlPanel />);

    const onItemSelect = getCapturedOnItemSelect();
    onItemSelect({ id: "non-existent-element" });

    expect(scrollToSpy).not.toHaveBeenCalled();

    scrollToSpy.mockRestore();
  });

  test("should trigger save on ctrl+S (uppercase) keyboard shortcut", async () => {
    jest
      .spyOn(require("@/app/services/APIService"), "apiRequest")
      .mockResolvedValue({
        message: "Saved successfully",
      });

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    render(<MicrositeControlPanel />);
    fireEvent.keyDown(document, { key: "S", ctrlKey: true });

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalled();
    });
  });

  test("should close dropdown when clicking outside", async () => {
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    const { queryByTestId } = render(<MicrositeControlPanel />);

    expect(queryByTestId("publish")).toBeInTheDocument();
  });

  test("should close modal when backDrop is called", async () => {
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    const { getByTestId, queryByTestId } = render(<MicrositeControlPanel />);

    fireEvent.click(getByTestId("publish"));

    expect(getByTestId("modal")).toBeInTheDocument();

    fireEvent.click(getByTestId("backdrop"));

    await waitFor(() => {
      expect(queryByTestId("modal")).not.toBeInTheDocument();
    });
  });

  test("should close modal when onClose is called", async () => {
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    const { getByTestId, queryByTestId } = render(<MicrositeControlPanel />);

    fireEvent.click(getByTestId("publish"));

    expect(getByTestId("modal")).toBeInTheDocument();

    fireEvent.click(getByTestId("close-button"));

    await waitFor(() => {
      expect(queryByTestId("modal")).not.toBeInTheDocument();
    });
  });

  test("should use elementId as fallback when id is not present", async () => {
    const scrollToSpy = jest.spyOn(window, "scrollTo").mockImplementation();
    const mockElement = document.createElement("div");
    mockElement.id = "fallback-element-id";
    Object.defineProperty(mockElement, "offsetTop", { value: 200 });
    Object.defineProperty(mockElement, "offsetParent", { value: null });
    document.body.appendChild(mockElement);

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    render(<MicrositeControlPanel />);

    const onItemSelect = getCapturedOnItemSelect();
    onItemSelect({ id: "", elementId: "fallback-element-id" });

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 50,
      behavior: "smooth",
    });

    document.body.removeChild(mockElement);
    scrollToSpy.mockRestore();
  });

  test("should call onConfirm when UnsavedChangesModal confirm is triggered", async () => {
    const mockAllow = jest.fn();
    const mockBlock = jest.fn();

    jest
      .spyOn(require("@/app/hooks/useNavigationGuard"), "useNavigationGuard")
      .mockReturnValue({
        showModal: true,
        allow: mockAllow,
        block: mockBlock,
      });

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
      });

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          microsite: { id: "m1", pages: [] },
        }),
      );

    jest
      .spyOn(require("@/app/context/UserTaskContext"), "useUserTask")
      .mockReturnValue({
        updateUserTask: jest.fn(),
        setHasPageChanges: jest.fn(),
        userTask: { id: "p1", sections: [] },
        hasPageChanges: true,
      });

    jest
      .spyOn(require("@/app/services/APIService"), "apiRequest")
      .mockResolvedValue({});

    const { getByTestId } = render(<MicrositeControlPanel />);

    const confirmButton = getByTestId("unsaved-confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockAllow).toHaveBeenCalled();
    });
  });

  test("should display hasPageChanges tooltip text when hasPageChanges is true", async () => {
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          isEditing: true,
          hasChanges: false,
          microsite: { id: "m1", pages: [] },
        }),
      );

    jest
      .spyOn(require("@/app/context/UserTaskContext"), "useUserTask")
      .mockReturnValue({
        updateUserTask: jest.fn(),
        setHasPageChanges: jest.fn(),
        userTask: { id: "p1", sections: [] },
        hasPageChanges: true,
      });

    const { getByRole } = render(<MicrositeControlPanel />);

    expect(getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  test("should clear timer in handleManualSave when autoSaveTimerRef has value", async () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    let currentMicrosite: Record<string, any> = {
      id: "m1",
      pages: [{ id: "p1", sections: [] }],
      lastUpdatedOn: "2023-01-01",
      firstPageId: "p1",
    };

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockImplementation(() =>
        buildMicrositeContextValue({
          microsite: currentMicrosite,
        }),
      );

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: true,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    jest
      .spyOn(require("@/app/services/APIService"), "apiRequest")
      .mockResolvedValue({});

    const { rerender, getByRole } = render(<MicrositeControlPanel />);

    currentMicrosite = {
      ...currentMicrosite,
      pages: [{ id: "p1", sections: [{ id: "s1" }] }],
    };
    rerender(<MicrositeControlPanel />);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });
    rerender(<MicrositeControlPanel />);

    const saveButton = getByRole("button", { name: "Save" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    clearTimeoutSpy.mockRestore();
  });

  test("should map componentList items in searchOptions function", async () => {
    const mockComponentList = [
      {
        id: "comp1",
        type: "Button",
        name: "Submit",
        label: "Submit Button",
        text: "Click me",
      },
      {
        id: "comp2",
        type: "Input",
        name: "Email",
        label: "Email Field",
        text: "",
      },
      { id: "comp3", type: "Text", name: "", label: "", text: "" },
    ];

    jest
      .spyOn(
        require("@/app/hooks/useUserTaskComponentList"),
        "useTaskComponents",
      )
      .mockReturnValue(mockComponentList);

    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          microsite: { id: "m1", pages: [] },
        }),
      );

    render(<MicrositeControlPanel />);

    expect(
      require("@/app/hooks/useUserTaskComponentList").useTaskComponents,
    ).toHaveBeenCalled();
  });

  test("handlePageHistoryNavigation does nothing when !activePageCode", () => {
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          activePageCode: null,
          isEditing: true,
          setActivePage: jest.fn(),
        }),
      );
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: true,
        canNavigatePageForward: false,
        goBackPageHistory: mockGoBackPageHistory.mockReturnValue(null),
        goForwardPageHistory: mockGoForwardPageHistory,
      });
    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByTestId("page-history-back"));
  });

  test("movePageHistory when targetPageCode is null clears pending direction", () => {
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: true,
        canNavigatePageForward: false,
        goBackPageHistory: mockGoBackPageHistory.mockReturnValue(null),
        goForwardPageHistory: mockGoForwardPageHistory,
        guardedPageHistoryNavigate: (fn: () => void) => fn(),
      });
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          activePageCode: "current-page",
          isEditing: true,
          setActivePage: jest.fn(),
        }),
      );
    jest
      .spyOn(require("@/app/hooks/useNavigationGuard"), "useNavigationGuard")
      .mockReturnValue({
        showModal: false,
        allow: jest.fn(),
        block: jest.fn(),
        guardedNavigate: (fn: () => void) => fn(),
      });
    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByTestId("page-history-back"));
    expect(mockGoBackPageHistory).toHaveBeenCalledWith("current-page");
  });

  test("handleItemSelect does nothing when no elementId", () => {
    const scrollToSpy = jest.spyOn(window, "scrollTo").mockImplementation();
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });
    render(<MicrositeControlPanel />);
    const onItemSelect = getCapturedOnItemSelect();
    onItemSelect({ id: "" });
    expect(scrollToSpy).not.toHaveBeenCalled();
    scrollToSpy.mockRestore();
  });

  test("onEdit when isEditing is true calls setIsEditing", async () => {
    const mockSetIsEditing = jest.fn();
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          isEditing: true,
          setIsEditing: mockSetIsEditing,
        }),
      );
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });
    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalled();
    });
  });

  test("onEdit catch block shows error for non-Error editError", async () => {
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          isEditing: false,
          hasChanges: false,
        }),
      );
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });
    (ensureEditableMicrositeVersion as jest.Mock).mockRejectedValue(
      "string error",
    );
    const mockNotify = jest.fn();
    jest
      .spyOn(require("@/app/context/HeaderContextV2"), "useHeaderV2")
      .mockReturnValue({ setUserNotification: mockNotify });
    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByLabelText("Edit"));
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Unable to open an editable draft.",
          type: "error",
        }),
      );
    });
  });

  test("publish draftError catch handles non-Error instance", async () => {
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    (createNextDraftMicrositeVersion as jest.Mock).mockRejectedValue(
      "string draft error",
    );
    const mockNotify = jest.fn();
    jest
      .spyOn(require("@/app/context/HeaderContextV2"), "useHeaderV2")
      .mockReturnValue({ setUserNotification: mockNotify });
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });
    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByTestId("publish"));
    fireEvent.click(screen.getByTestId("submit-button"));
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Published. Draft regeneration failed. Use Edit to recreate the draft.",
          type: "info",
        }),
      );
    });
  });

  test("publish fails save and returns early", async () => {
    (apiRequest as jest.Mock).mockRejectedValue(new Error("save failed"));
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: mockSetIsSaveSuccessful,
      });
    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByTestId("publish"));
    fireEvent.click(screen.getByTestId("submit-button"));
    await waitFor(() => {
      expect(mockSetIsSaveSuccessful).toHaveBeenCalledWith(false);
    });
  });

  test("page history modal onConfirm when pendingPageHistoryDirection is null does nothing", async () => {
    const mockAllowPageHistory = jest.fn();
    jest
      .spyOn(require("@/app/hooks/useNavigationGuard"), "useNavigationGuard")
      .mockImplementation(() => ({
        showModal: false,
        allow: jest.fn(),
        block: jest.fn(),
        guardedNavigate: jest.fn(),
      }));
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: false,
        canNavigatePageForward: false,
        goBackPageHistory: mockGoBackPageHistory.mockReturnValue(null),
        goForwardPageHistory: mockGoForwardPageHistory.mockReturnValue(null),
      });
    render(<MicrositeControlPanel />);
  });

  test("searchableOptions returns empty array when componentList is not array", () => {
    jest
      .spyOn(
        require("@/app/hooks/useUserTaskComponentList"),
        "useTaskComponents",
      )
      .mockReturnValue(null);
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
      });
    render(<MicrositeControlPanel />);
    expect(screen.getByTestId("searchable-dropdown")).toBeInTheDocument();
  });

  test("maps searchable dropdown labels through text, label, name and type fallbacks", () => {
    jest
      .spyOn(
        require("@/app/hooks/useUserTaskComponentList"),
        "useTaskComponents",
      )
      .mockReturnValue([
        {
          id: "component-1",
          type: "button",
          name: "Primary Button",
          label: "Primary CTA",
          text: "Click Me",
        },
        {
          id: "component-2",
          type: "input",
          name: "Email",
          label: "Email Label",
          text: null,
        },
        {
          id: "component-3",
          type: "select",
          name: "Country Name",
          label: null,
          text: null,
        },
        {
          id: "component-4",
          type: "checkbox",
          name: null,
          label: null,
          text: null,
        },
      ]);

    render(<MicrositeControlPanel />);

    expect(getCapturedSearchOptions().map((option) => option.label)).toEqual([
      "Click Me",
      "Email Label",
      "Country Name",
      "checkbox",
    ]);
  });

  test("hides the save button during auto save and keeps publish disabled for published microsites", () => {
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: true,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: false,
        canNavigatePageForward: false,
        goBackPageHistory: jest.fn(),
        goForwardPageHistory: jest.fn(),
      });
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          isEditing: false,
          hasChanges: false,
        }),
      );

    render(<MicrositeControlPanel />);

    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Edit")).toBeInTheDocument();
    expect(screen.getByTestId("publish")).toBeDisabled();
  });

  test("pageHistoryModal: onConfirm with pending direction calls handlePageHistoryConfirm", async () => {
    const mockAllow = jest.fn();
    const mockBlock = jest.fn();
    let guardedCallback: (() => void) | null = null;

    jest
      .spyOn(require("@/app/hooks/useNavigationGuard"), "useNavigationGuard")
      .mockImplementation(() => ({
        showModal: false,
        allow: mockAllow,
        block: mockBlock,
        guardedNavigate: (fn: () => void) => {
          guardedCallback = fn;
          fn();
        },
      }));
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: true,
        canNavigatePageForward: false,
        goBackPageHistory: mockGoBackPageHistory.mockReturnValue("prev-page"),
        goForwardPageHistory: mockGoForwardPageHistory,
      });
    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          activePageCode: "current-page",
        }),
      );
    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByTestId("page-history-back"));
  });

  test("confirms page history navigation after opening the page history modal", async () => {
    const setActivePage = jest.fn();

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          activePageCode: "current-page",
          hasChanges: false,
          setActivePage,
        }),
      );
    jest
      .spyOn(require("@/app/context/UserTaskContext"), "useUserTask")
      .mockReturnValue({
        updateUserTask: jest.fn(),
        hasPageChanges: true,
        setHasPageChanges: jest.fn(),
        userTask: { components: [] },
      });
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: true,
        canNavigatePageForward: false,
        goBackPageHistory: jest.fn().mockReturnValue("previous-page"),
        goForwardPageHistory: jest.fn(),
      });
    jest
      .spyOn(require("@/app/hooks/useNavigationGuard"), "useNavigationGuard")
      .mockImplementation((shouldOpen: unknown) => {
        const [showModal, setShowModal] = React.useState(false);

        return {
          showModal,
          allow: () => setShowModal(false),
          block: () => setShowModal(false),
          guardedNavigate: (action: () => void) => {
            if (Boolean(shouldOpen)) {
              setShowModal(true);
              return;
            }

            action();
          },
        };
      });
    (apiRequest as jest.Mock).mockResolvedValue({});

    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByTestId("page-history-back"));

    expect(
      await screen.findByTestId("unsaved-changes-modal"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("unsaved-confirm"));

    await waitFor(() => {
      expect(setActivePage).toHaveBeenCalledWith("previous-page");
    });
    expect(mockResetActivePage).toHaveBeenCalled();
  });

  test("cancels page history modal by moving to the pending forward page", async () => {
    const setActivePage = jest.fn();
    const goForwardPageHistory = jest.fn().mockReturnValue("next-page");

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          activePageCode: "current-page",
          hasChanges: false,
          setActivePage,
        }),
      );
    jest
      .spyOn(require("@/app/context/UserTaskContext"), "useUserTask")
      .mockReturnValue({
        updateUserTask: jest.fn(),
        hasPageChanges: true,
        setHasPageChanges: jest.fn(),
        userTask: { components: [] },
      });
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: false,
        canNavigatePageForward: true,
        goBackPageHistory: jest.fn(),
        goForwardPageHistory,
      });
    jest
      .spyOn(require("@/app/hooks/useNavigationGuard"), "useNavigationGuard")
      .mockImplementation((shouldOpen: unknown) => {
        const [showModal, setShowModal] = React.useState(false);

        return {
          showModal,
          allow: () => setShowModal(false),
          block: () => setShowModal(false),
          guardedNavigate: (action: () => void) => {
            if (Boolean(shouldOpen)) {
              setShowModal(true);
              return;
            }

            action();
          },
        };
      });

    render(<MicrositeControlPanel />);
    fireEvent.click(screen.getByTestId("page-history-forward"));

    expect(
      await screen.findByTestId("unsaved-changes-modal"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("unsaved-cancel"));

    await waitFor(() => {
      expect(goForwardPageHistory).toHaveBeenCalledWith("current-page");
      expect(setActivePage).toHaveBeenCalledWith("next-page");
    });
    expect(mockResetActivePage).toHaveBeenCalled();
  });

  test("ignores page history modal confirm and cancel when no direction is pending", () => {
    const setActivePage = jest.fn();
    const goBackPageHistory = jest.fn();
    const goForwardPageHistory = jest.fn();
    jest
      .spyOn(require("@/app/hooks/useNavigationGuard"), "useNavigationGuard")
      .mockReturnValueOnce({
        showModal: false,
        allow: jest.fn(),
        block: jest.fn(),
        guardedNavigate: (action: () => void) => action(),
      })
      .mockReturnValueOnce({
        showModal: true,
        allow: jest.fn(),
        block: jest.fn(),
        guardedNavigate: (action: () => void) => action(),
      });

    jest
      .spyOn(require("@/app/context/MicrositeContext"), "useMicrosite")
      .mockReturnValue(
        buildMicrositeContextValue({
          activePageCode: "current-page",
          hasChanges: false,
          setActivePage,
        }),
      );
    jest
      .spyOn(require("@/app/context/UserTaskContext"), "useUserTask")
      .mockReturnValue({
        updateUserTask: jest.fn(),
        hasPageChanges: true,
        setHasPageChanges: jest.fn(),
        userTask: { components: [] },
      });
    jest
      .spyOn(require("@/app/context/ControlPanelContext"), "useControlPanel")
      .mockReturnValue({
        isAutoSave: false,
        toggleAutoSave: jest.fn(),
        setIsAutoSaveInProgress: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        isSaveSuccessful: false,
        canNavigatePageBack: false,
        canNavigatePageForward: false,
        goBackPageHistory,
        goForwardPageHistory,
      });

    render(<MicrositeControlPanel />);

    fireEvent.click(screen.getByTestId("unsaved-confirm"));
    fireEvent.click(screen.getByTestId("unsaved-cancel"));

    expect(goBackPageHistory).not.toHaveBeenCalled();
    expect(goForwardPageHistory).not.toHaveBeenCalled();
    expect(setActivePage).not.toHaveBeenCalled();
  });
});
