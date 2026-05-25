import { render, screen, fireEvent, act } from "@testing-library/react";
import Tabs from "./Tabs";
import { useMicrosite } from "../../../context/MicrositeContext";
import { useControlPanel } from "../../../context/ControlPanelContext";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { useUserTask } from "../../../context/UserTaskContext";
import { useNavigationGuard } from "../../../hooks/useNavigationGuard";
import useMicrositePageSave from "../../../hooks/useMicrositePageSave";

jest.mock("../../../utils/utils", () => ({
  scrollToTop: jest.fn(),
}));

jest.mock("../../../context/MicrositeContext");
jest.mock("../../../context/ControlPanelContext");
jest.mock("../../../context/PropertiesContext");
jest.mock("../../../context/UserTaskContext");
jest.mock("../../../hooks/useNavigationGuard");
jest.mock("../../../hooks/useMicrositePageSave");

jest.mock(
  "../../InternalComponents/UnsavedChangesPopupp/UnsavedChangesPopup",
  () => ({
    UnsavedChangesModal: ({ open, onConfirm, onCancel, backDrop }: any) => {
      if (!open) return null;
      return (
        <div data-testid="unsaved-modal">
          <button onClick={onConfirm}>Modal Confirm</button>
          <button onClick={onCancel}>Modal Leave</button>
          <button onClick={backDrop}>Modal Backdrop</button>
        </div>
      );
    },
  }),
);

describe("Tabs Component", () => {
  const mockSetActivePage = jest.fn();
  const mockResetActivePage = jest.fn();
  const mockHandlePageSave = jest.fn();
  const mockGuardedNavigate = jest.fn();
  const mockAllow = jest.fn();
  const mockBlock = jest.fn();
  const mockPushPageHistory = jest.fn();
  const mockSetPageComponentLocation = jest.fn();
  const mockGetPendingPageLocationSnapshot: jest.Mock = jest.fn(() => null);

  const mockComponentData = {
    id: "tabs-123",
    type: "Tabs",
    properties: {
      rowTabCount: 3,
      tabLayout: "horizontal",
    },
    components: [
      { id: "t1", properties: { title: "Short Title" }, pageCode: "PAGE_1" },
      {
        id: "t2",
        properties: { title: "A Very Long Title That Will Truncate" },
        pageCode: "PAGE_2",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPendingPageLocationSnapshot.mockReset();
    mockGetPendingPageLocationSnapshot.mockReturnValue(null);

    (useMicrosite as jest.Mock).mockReturnValue({
      setActivePage: mockSetActivePage,
      activePageCode: "CURRENT_PAGE",
    });
    (useControlPanel as jest.Mock).mockReturnValue({
      isAutoSave: false,
      isSaveSuccessful: false,
      pushPageHistory: mockPushPageHistory,
      setPageComponentLocation: mockSetPageComponentLocation,
      getPendingPageLocationSnapshot: mockGetPendingPageLocationSnapshot,
    });
    (usePropertyPane as jest.Mock).mockReturnValue({
      resetActivePage: mockResetActivePage,
    });
    (useUserTask as jest.Mock).mockReturnValue({ hasPageChanges: false });
    (useMicrositePageSave as jest.Mock).mockReturnValue({
      handlePageSave: mockHandlePageSave,
    });

    (useNavigationGuard as jest.Mock).mockReturnValue({
      showModal: false,
      allow: mockAllow,
      block: mockBlock,
      guardedNavigate: mockGuardedNavigate,
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Rendering Logic                             */
  /* -------------------------------------------------------------------------- */

  test("renders tabs with correct titles and active state", () => {
    render(<Tabs component={mockComponentData as any} />);

    const titles = screen.getAllByText(/Title/);
    expect(titles).toHaveLength(1);

    expect(screen.getByText("Short Title")).toBeInTheDocument();

    expect(screen.getByText("A Very Long T...")).toBeInTheDocument();

    const tabs = screen.getAllByText(/Title/).map((el) => el.closest("div"));
    expect(tabs[0]).toHaveClass("active");
  });

  test("renders vertical layout based on properties", () => {
    const verticalData = {
      ...mockComponentData,
      properties: { ...mockComponentData.properties, tabLayout: "vertical" },
    };
    render(<Tabs component={verticalData as any} />);

    const wrapper = screen.getByTestId("tabs-123");
    expect(wrapper).toBeInTheDocument();

    const tabContainer = document.getElementById("vertical");
    expect(tabContainer).toBeInTheDocument();
  });

  test("handles missing components gracefully", () => {
    const emptyData = { ...mockComponentData, components: [] };
    render(<Tabs component={emptyData as any} />);

    expect(screen.queryByText(/Title/)).not.toBeInTheDocument();

    expect(screen.queryByTestId("pageNavigator")).not.toBeInTheDocument();
  });

  test("defaults to first tab when activePageCode is missing", () => {
    (useMicrosite as jest.Mock).mockReturnValue({
      setActivePage: mockSetActivePage,
      activePageCode: undefined,
    });

    render(<Tabs component={mockComponentData as any} />);

    expect(screen.getByTestId("t1")).toHaveClass("active");
    expect(mockSetPageComponentLocation).not.toHaveBeenCalled();
  });

  test("does not reapply restored tab index when restore key is unchanged", () => {
    mockGetPendingPageLocationSnapshot.mockReturnValue({
      scrollTop: 0,
      componentLocations: {
        "tabs-123": {
          activeTabIndex: 1,
        },
      },
    });

    const { rerender } = render(<Tabs component={mockComponentData as any} />);

    expect(mockSetPageComponentLocation).toHaveBeenCalledWith(
      "CURRENT_PAGE",
      "tabs-123",
      { activeTabIndex: 1 },
    );

    rerender(
      <Tabs
        component={{
          ...mockComponentData,
          components: [...mockComponentData.components],
        } as any}
      />,
    );

    expect(screen.getByTestId("t2")).toHaveClass("active");
  });

  /* -------------------------------------------------------------------------- */
  /* User Interactions                           */
  /* -------------------------------------------------------------------------- */

  test("clicking a tab changes the active tab index", () => {
    render(<Tabs component={mockComponentData as any} />);

    const tab1 = screen.getByTestId("t1");

    fireEvent.click(tab1);

    expect(tab1).toHaveClass("active");
  });

  test("clicking 'Go to the Page' triggers navigation guard (Clean State)", () => {
    (useNavigationGuard as jest.Mock).mockReturnValue({
      showModal: false,
      guardedNavigate: (cb: Function) => cb(),
      allow: mockAllow,
      block: mockBlock,
    });

    render(<Tabs component={mockComponentData as any} />);

    const btn = screen.getByTestId("pageNavigator");
    fireEvent.click(btn);

    expect(mockSetActivePage).toHaveBeenCalledWith("PAGE_1");
    expect(mockPushPageHistory).toHaveBeenCalledWith("CURRENT_PAGE", "PAGE_1");
    expect(mockResetActivePage).toHaveBeenCalled();
    expect(mockAllow).toHaveBeenCalled();
  });

  test("does not navigate when active tab page matches the current page", () => {
    const currentPageComponent = {
      ...mockComponentData,
      components: [
        {
          id: "t1",
          properties: { title: "Current Page" },
          pageCode: "CURRENT_PAGE",
        },
      ],
    };

    render(<Tabs component={currentPageComponent as any} />);

    fireEvent.click(screen.getByTestId("pageNavigator"));

    expect(mockGuardedNavigate).not.toHaveBeenCalled();
    expect(mockPushPageHistory).not.toHaveBeenCalled();
    expect(mockSetActivePage).not.toHaveBeenCalled();
  });

  test("restores the saved active tab index from page history location", () => {
    mockGetPendingPageLocationSnapshot.mockReturnValue({
      scrollTop: 0,
      componentLocations: {
        "tabs-123": {
          activeTabIndex: 1,
        },
      },
    });

    render(<Tabs component={mockComponentData as any} />);

    expect(screen.getByTestId("t2")).toHaveClass("active");
    expect(mockSetPageComponentLocation).toHaveBeenCalledWith(
      "CURRENT_PAGE",
      "tabs-123",
      { activeTabIndex: 1 },
    );
  });

  /* -------------------------------------------------------------------------- */
  /* Dirty State & Modal Logic                       */
  /* -------------------------------------------------------------------------- */

  test("displays Modal when changes are detected (isDirty)", () => {
    (useUserTask as jest.Mock).mockReturnValue({ hasPageChanges: true });

    (useNavigationGuard as jest.Mock).mockReturnValue({
      showModal: true,
      guardedNavigate: mockGuardedNavigate,
      allow: mockAllow,
      block: mockBlock,
    });

    render(<Tabs component={mockComponentData as any} />);

    expect(screen.getByTestId("unsaved-modal")).toBeInTheDocument();
  });

  test("Modal Confirm: Should save changes and navigate", async () => {
    (useUserTask as jest.Mock).mockReturnValue({ hasPageChanges: true });
    (useNavigationGuard as jest.Mock).mockReturnValue({
      showModal: true,
      allow: mockAllow,
      block: mockBlock,
      guardedNavigate: mockGuardedNavigate,
    });

    render(<Tabs component={mockComponentData as any} />);
    fireEvent.click(screen.getByTestId("pageNavigator"));

    const confirmBtn = screen.getByText("Modal Confirm");
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(mockHandlePageSave).toHaveBeenCalled();
    expect(mockSetActivePage).toHaveBeenCalledWith("PAGE_1");
    expect(mockResetActivePage).toHaveBeenCalled();
    expect(mockAllow).toHaveBeenCalled();
  });

  test("Modal Leave (Cancel): Should navigate without saving", () => {
    (useUserTask as jest.Mock).mockReturnValue({ hasPageChanges: true });
    (useNavigationGuard as jest.Mock).mockReturnValue({
      showModal: true,
      allow: mockAllow,
      block: mockBlock,
      guardedNavigate: mockGuardedNavigate,
    });

    render(<Tabs component={mockComponentData as any} />);
    fireEvent.click(screen.getByTestId("pageNavigator"));

    const leaveBtn = screen.getByText("Modal Leave");
    fireEvent.click(leaveBtn);

    expect(mockHandlePageSave).not.toHaveBeenCalled();
    expect(mockSetActivePage).toHaveBeenCalledWith("PAGE_1");
    expect(mockResetActivePage).toHaveBeenCalled();
    expect(mockAllow).toHaveBeenCalled();
  });

  test("Modal Backdrop: Should block navigation", () => {
    (useUserTask as jest.Mock).mockReturnValue({ hasPageChanges: true });
    (useNavigationGuard as jest.Mock).mockReturnValue({
      showModal: true,
      allow: mockAllow,
      block: mockBlock,
      guardedNavigate: mockGuardedNavigate,
    });

    render(<Tabs component={mockComponentData as any} />);

    const backDropBtn = screen.getByText("Modal Backdrop");
    fireEvent.click(backDropBtn);

    expect(mockBlock).toHaveBeenCalled();
    expect(mockResetActivePage).not.toHaveBeenCalled();
  });

  test("Modal Leave with no selected page only clears selection and allows", () => {
    (useUserTask as jest.Mock).mockReturnValue({ hasPageChanges: true });
    (useNavigationGuard as jest.Mock).mockReturnValue({
      showModal: true,
      allow: mockAllow,
      block: mockBlock,
      guardedNavigate: mockGuardedNavigate,
    });

    render(<Tabs component={mockComponentData as any} />);

    fireEvent.click(screen.getByText("Modal Leave"));

    expect(mockAllow).toHaveBeenCalled();
    expect(mockPushPageHistory).not.toHaveBeenCalled();
    expect(mockSetActivePage).not.toHaveBeenCalled();
  });

  test("does not render page navigation button when active tab has no page code", () => {
    const missingPageCodeComponent = {
      ...mockComponentData,
      components: [
        {
          id: "t1",
          properties: { title: "No Page" },
        },
      ],
    };

    render(<Tabs component={missingPageCodeComponent as any} />);

    expect(screen.queryByTestId("pageNavigator")).not.toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* Edge Cases & Logic                              */
  /* -------------------------------------------------------------------------- */

  test("calculates shouldOpenModal correctly based on dependencies", () => {
    (useControlPanel as jest.Mock).mockReturnValue({
      isAutoSave: true,
      isSaveSuccessful: false,
      pushPageHistory: mockPushPageHistory,
      setPageComponentLocation: mockSetPageComponentLocation,
      getPendingPageLocationSnapshot: mockGetPendingPageLocationSnapshot,
    });
    (useUserTask as jest.Mock).mockReturnValue({ hasPageChanges: true });

    render(<Tabs component={mockComponentData as any} />);

    expect(useNavigationGuard).toHaveBeenCalledWith(false);

    jest.clearAllMocks();
    (useControlPanel as jest.Mock).mockReturnValue({
      isAutoSave: false,
      isSaveSuccessful: true,
      pushPageHistory: mockPushPageHistory,
      setPageComponentLocation: mockSetPageComponentLocation,
      getPendingPageLocationSnapshot: mockGetPendingPageLocationSnapshot,
    });
    (useUserTask as jest.Mock).mockReturnValue({ hasPageChanges: true });

    render(<Tabs component={mockComponentData as any} />);
    expect(useNavigationGuard).toHaveBeenCalledWith(false);

    jest.clearAllMocks();
    (useControlPanel as jest.Mock).mockReturnValue({
      isAutoSave: false,
      isSaveSuccessful: false,
      pushPageHistory: mockPushPageHistory,
      setPageComponentLocation: mockSetPageComponentLocation,
      getPendingPageLocationSnapshot: mockGetPendingPageLocationSnapshot,
    });
    (useUserTask as jest.Mock).mockReturnValue({ hasPageChanges: true });

    render(<Tabs component={mockComponentData as any} />);
    expect(useNavigationGuard).toHaveBeenCalledWith(true);
  });
});
