import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfigStudioHub from "./ConfigStudioHub";
import { getAllRecords, deleteRecord } from "@/app/utils/dataTableUtils";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { getBaseUrl } from "@/app/utils/utils";
import { useRouter } from "next/navigation";
import { useSelectedWorkspace } from "@/app/hooks/useSelectedWorkspace";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: jest.fn(),
}));

jest.mock("@/app/hooks/useSelectedWorkspace", () => ({
  useSelectedWorkspace: jest.fn(),
}));

jest.mock("@/app/utils/dataTableUtils", () => ({
  getAllRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

jest.mock("@/app/components/SVGIcons/Rahi", () => () => (
  <div data-testid="rahi-logo">Rahi</div>
));

jest.mock("@/app/components/Card/Card", () => ({
  __esModule: true,
  default: ({
    title,
    onClickHandler,
  }: {
    title: string;
    onClickHandler: () => void;
  }) => (
    <button data-testid={`card-${title}`} onClick={onClickHandler}>
      {title}
    </button>
  ),
}));

jest.mock("./WorkspaceSelector/WorkspaceSelector", () => ({
  __esModule: true,
  default: ({
    workspaces,
    selectedCode,
    onSelect,
    onCreated,
    onUpdated,
    onDelete,
  }: {
    workspaces: Array<{ code: string; name: string }>;
    selectedCode: string | null;
    onSelect: (code: string) => void;
    onCreated: (code: string, name: string) => void;
    onUpdated: (payload: { code: string; name: string }) => void;
    onDelete: (item: { code: string; name: string }) => void;
  }) => (
    <div data-testid="workspace-selector">
      <div data-testid="workspace-count">{workspaces.length}</div>
      <div data-testid="selected-code">{selectedCode ?? "none"}</div>
      <button onClick={() => onSelect("ws-2")}>select-ws-2</button>
      <button onClick={() => onCreated("ws-new", "Workspace New")}>
        create-workspace
      </button>
      <button
        onClick={() =>
          onUpdated({ code: "ws-1", name: "Workspace One Updated" })
        }
      >
        update-workspace
      </button>
      <button onClick={() => onDelete({ code: "ws-1", name: "Workspace One" })}>
        delete-workspace
      </button>
    </div>
  ),
}));

describe("ConfigStudioHub", () => {
  const mockPush = jest.fn();
  const mockSetUserNotification = jest.fn();
  const mockSetSelectedCode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useHeaderV2 as jest.Mock).mockReturnValue({
      setUserNotification: mockSetUserNotification,
    });
    (useSelectedWorkspace as jest.Mock).mockReturnValue([
      "ws-1",
      mockSetSelectedCode,
    ]);
    (getAllRecords as jest.Mock).mockResolvedValue([
      { code: "ws-1", name: "Workspace One" },
      { code: "ws-2", name: "Workspace Two" },
    ]);
    (deleteRecord as jest.Mock).mockResolvedValue(undefined);
    Object.defineProperty(window, "open", {
      configurable: true,
      value: jest.fn(),
    });
  });

  it("renders hero, logo, cards and fetched workspaces", async () => {
    render(<ConfigStudioHub />);

    expect(
      screen.queryByText("Welcome to Config Studio"),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Welcome to Config Studio")).toBeInTheDocument();
    });

    expect(screen.getByTestId("rahi-logo")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-selector")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-count")).toHaveTextContent("2");
    expect(screen.getByTestId("selected-code")).toHaveTextContent("ws-1");
    expect(screen.getByTestId("card-Microsites")).toBeInTheDocument();
    expect(screen.getByTestId("card-Communications")).toBeInTheDocument();
    expect(screen.getByTestId("card-Documents")).toBeInTheDocument();
    expect(screen.getByTestId("card-Rules")).toBeInTheDocument();
    expect(screen.getByTestId("card-Workflows")).toBeInTheDocument();
    expect(screen.getByTestId("card-Portal Tasks")).toBeInTheDocument();
    expect(screen.getByTestId("card-Access Controls")).toBeInTheDocument();
    expect(screen.getByTestId("card-Portal Menu")).toBeInTheDocument();
  });

  it("handles fetch failure by leaving the page empty after loading completes", async () => {
    (getAllRecords as jest.Mock).mockRejectedValueOnce(
      new Error("load failed"),
    );

    const { container } = render(<ConfigStudioHub />);

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it("updates selection and handles created and updated workspace callbacks", async () => {
    render(<ConfigStudioHub />);

    await screen.findByTestId("workspace-selector");

    fireEvent.click(screen.getByText("select-ws-2"));
    expect(mockSetSelectedCode).toHaveBeenCalledWith("ws-2");

    fireEvent.click(screen.getByText("create-workspace"));
    expect(mockSetSelectedCode).toHaveBeenCalledWith("ws-new");
    expect(mockSetUserNotification).toHaveBeenCalledWith({
      type: "success",
      text: "Workspace created",
      time: 2000,
    });

    await waitFor(() => {
      expect(screen.getByTestId("workspace-count")).toHaveTextContent("3");
    });

    fireEvent.click(screen.getByText("update-workspace"));
    expect(mockSetUserNotification).toHaveBeenCalledWith({
      type: "success",
      text: "Workspace updated",
      time: 2000,
    });
  });

  it("deletes a workspace and notifies success", async () => {
    render(<ConfigStudioHub />);

    await screen.findByTestId("workspace-selector");
    fireEvent.click(screen.getByText("delete-workspace"));

    await waitFor(() => {
      expect(deleteRecord).toHaveBeenCalledWith(expect.anything(), "ws-1");
      expect(screen.getByTestId("workspace-count")).toHaveTextContent("1");
    });

    expect(mockSetUserNotification).toHaveBeenCalledWith({
      type: "success",
      text: "Workspace deleted",
      time: 2000,
    });
  });

  it("shows delete failure notification", async () => {
    (deleteRecord as jest.Mock).mockRejectedValueOnce(
      new Error("Delete failed"),
    );
    render(<ConfigStudioHub />);

    await screen.findByTestId("workspace-selector");
    fireEvent.click(screen.getByText("delete-workspace"));

    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalledWith({
        type: "error",
        text: "Delete failed",
        time: 2500,
      });
    });
  });

  it("shows default delete failure notification for non-Error values", async () => {
    (deleteRecord as jest.Mock).mockRejectedValueOnce("bad delete");
    render(<ConfigStudioHub />);

    await screen.findByTestId("workspace-selector");
    fireEvent.click(screen.getByText("delete-workspace"));

    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalledWith({
        type: "error",
        text: "Failed to delete workspace",
        time: 2500,
      });
    });
  });

  it("blocks workspace-required actions when nothing is selected", async () => {
    (useSelectedWorkspace as jest.Mock).mockReturnValue([
      null,
      mockSetSelectedCode,
    ]);
    render(<ConfigStudioHub />);

    await screen.findByTestId("workspace-selector");

    fireEvent.click(screen.getByTestId("card-Microsites"));
    fireEvent.click(screen.getByTestId("card-Rules"));
    fireEvent.click(screen.getByTestId("card-Workflows"));

    expect(mockSetUserNotification).toHaveBeenCalledWith({
      type: "error",
      text: "Please select a workspace first",
      time: 2500,
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
  });

  it("navigates to internal and external destinations when a workspace is selected", async () => {
    render(<ConfigStudioHub />);

    await screen.findByTestId("workspace-selector");

    fireEvent.click(screen.getByTestId("card-Microsites"));
    fireEvent.click(screen.getByTestId("card-Communications"));
    fireEvent.click(screen.getByTestId("card-Documents"));
    fireEvent.click(screen.getByTestId("card-Portal Tasks"));
    fireEvent.click(screen.getByTestId("card-Access Controls"));
    fireEvent.click(screen.getByTestId("card-Portal Menu"));
    fireEvent.click(screen.getByTestId("card-Rules"));
    fireEvent.click(screen.getByTestId("card-Workflows"));

    expect(mockPush).toHaveBeenCalledWith("/workspaces/ws-1/microsites");
    expect(mockPush).toHaveBeenCalledWith(
      "/communications/templates?backWs=ws-1",
    );
    expect(mockPush).toHaveBeenCalledWith("/documents/templates?backWs=ws-1");
    expect(mockPush).toHaveBeenCalledWith("/portal-tasks?backWs=ws-1");
    expect(mockPush).toHaveBeenCalledWith("/access-controls?backWs=ws-1");
    expect(mockPush).toHaveBeenCalledWith("/menu");
    expect(window.open).toHaveBeenCalledWith(
      getBaseUrl("rule-designer", process.env.NODE_ENV ?? ""),
      "_blank",
    );
    expect(window.open).toHaveBeenCalledWith(
      getBaseUrl("workflow-designer", process.env.NODE_ENV ?? ""),
      "_blank",
    );
  });

  it("navigates without backWs query when no workspace is selected for non-required cards", async () => {
    (useSelectedWorkspace as jest.Mock).mockReturnValue([
      null,
      mockSetSelectedCode,
    ]);
    render(<ConfigStudioHub />);

    await screen.findByTestId("workspace-selector");

    fireEvent.click(screen.getByTestId("card-Communications"));
    fireEvent.click(screen.getByTestId("card-Documents"));
    fireEvent.click(screen.getByTestId("card-Portal Tasks"));
    fireEvent.click(screen.getByTestId("card-Access Controls"));

    expect(mockPush).toHaveBeenCalledWith("/communications/templates");
    expect(mockPush).toHaveBeenCalledWith("/documents/templates");
    expect(mockPush).toHaveBeenCalledWith("/portal-tasks");
    expect(mockPush).toHaveBeenCalledWith("/access-controls");
  });
});
