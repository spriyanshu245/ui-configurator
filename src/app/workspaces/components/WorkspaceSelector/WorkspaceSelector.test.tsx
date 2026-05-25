import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import WorkspaceSelector from "./WorkspaceSelector";
import { createRecord } from "@/app/utils/dataTableUtils";

jest.mock("@/app/utils/dataTableUtils", () => ({
  createRecord: jest.fn(),
}));

jest.mock("@/app/components/SVGIcons/Plus", () => () => (
  <span data-testid="plus-icon">plus</span>
));
jest.mock("@/app/components/SVGIcons/Search", () => () => (
  <span data-testid="search-icon">search</span>
));
jest.mock("@/app/components/SVGIcons/ChevronDown", () => () => (
  <span data-testid="chevron-icon">chevron</span>
));

jest.mock("./WorkspaceChip", () => ({
  __esModule: true,
  default: ({
    workspace,
    isSelected,
    onSelect,
    onUpdated,
    onDelete,
  }: {
    workspace: { code: string; name: string };
    isSelected: boolean;
    onSelect: () => void;
    onUpdated: (payload: { code: string; name: string }) => void;
    onDelete: () => void;
  }) => (
    <div>
      <button
        data-testid={`workspace-chip-${workspace.code}`}
        data-selected={isSelected}
        onClick={onSelect}
      >
        {workspace.name}-{workspace.code}
      </button>
      <button
        data-testid={`workspace-update-${workspace.code}`}
        onClick={() =>
          onUpdated({ code: workspace.code, name: `${workspace.name} updated` })
        }
      >
        update-{workspace.code}
      </button>
      <button
        data-testid={`workspace-delete-${workspace.code}`}
        onClick={onDelete}
      >
        delete-{workspace.code}
      </button>
    </div>
  ),
}));

describe("WorkspaceSelector", () => {
  const mockOnSelect = jest.fn();
  const mockOnCreated = jest.fn();
  const mockOnUpdated = jest.fn();
  const mockOnDelete = jest.fn();

  const workspaces = [
    { code: "ws-1", name: "Workspace One" },
    { code: "ws-2", name: "Workspace Two" },
  ];

  beforeAll(() => {
    class ResizeObserverMock {
      observe = jest.fn();
      disconnect = jest.fn();
    }

    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: ResizeObserverMock,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (createRecord as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("shows the collapsed selected workspace view by default when a workspace is selected", () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode="ws-1"
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Workspace One")).toBeInTheDocument();
    expect(screen.getByText("(ws-1)")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Filter workspaces..."),
    ).not.toBeInTheDocument();
  });

  it("starts expanded when no workspace is selected and can toggle search open and closed", () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByTestId("workspace-chip-ws-1")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-chip-ws-2")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Search workspaces"));
    expect(
      screen.getByPlaceholderText("Filter workspaces..."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Filter workspaces..."), {
      target: { value: "two" },
    });
    expect(screen.queryByTestId("workspace-chip-ws-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("workspace-chip-ws-2")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Search workspaces"));
    expect(screen.queryByDisplayValue("two")).not.toBeInTheDocument();
  });

  it("shows a no results message when filtering has no matches", () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Search workspaces"));
    fireEvent.change(screen.getByPlaceholderText("Filter workspaces..."), {
      target: { value: "missing" },
    });

    expect(screen.getByText("No workspaces match")).toBeInTheDocument();
  });

  it("collapses and resets search when a workspace chip is selected", () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Search workspaces"));
    fireEvent.change(screen.getByPlaceholderText("Filter workspaces..."), {
      target: { value: "one" },
    });

    fireEvent.click(screen.getByTestId("workspace-chip-ws-1"));

    expect(mockOnSelect).toHaveBeenCalledWith("ws-1");
    expect(
      screen.queryByPlaceholderText("Filter workspaces..."),
    ).not.toBeInTheDocument();
  });

  it("clears open search state when collapsing with the chevron toggle", () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Search workspaces"));
    fireEvent.change(screen.getByPlaceholderText("Filter workspaces..."), {
      target: { value: "two" },
    });

    fireEvent.click(screen.getByLabelText("Collapse workspaces"));
    expect(
      screen.queryByPlaceholderText("Filter workspaces..."),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Expand workspaces"));
    fireEvent.click(screen.getByLabelText("Search workspaces"));
    expect(screen.getByPlaceholderText("Filter workspaces...")).toHaveValue("");
  });

  it("creates a workspace successfully and resets the inline form", async () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Create a new workspace"));
    fireEvent.change(screen.getByPlaceholderText("Workspace name"), {
      target: { value: "New Workspace" },
    });

    expect(screen.getByDisplayValue("new-workspace")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(createRecord).toHaveBeenCalledWith({
        method: "POST",
        endpoint: "/api/v1/config/workspaces",
        body: { code: "new-workspace", name: "New Workspace" },
      });
      expect(mockOnCreated).toHaveBeenCalledWith(
        "new-workspace",
        "New Workspace",
      );
    });

    expect(screen.getByLabelText("Create a new workspace")).toBeInTheDocument();
  });

  it("supports manual code editing and create keyboard shortcuts", async () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Create a new workspace"));
    fireEvent.change(screen.getByPlaceholderText("Workspace name"), {
      target: { value: "Manual Name" },
    });
    fireEvent.change(screen.getByPlaceholderText("code"), {
      target: { value: "custom code" },
    });

    expect(screen.getByDisplayValue("custom-code")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByPlaceholderText("Workspace name"), {
      key: "Enter",
    });

    await waitFor(() => {
      expect(createRecord).toHaveBeenCalledWith({
        method: "POST",
        endpoint: "/api/v1/config/workspaces",
        body: { code: "custom-code", name: "Manual Name" },
      });
    });
  });

  it("does not submit create when the form is invalid", () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Create a new workspace"));
    fireEvent.keyDown(screen.getByPlaceholderText("Workspace name"), {
      key: "Enter",
    });

    expect(createRecord).not.toHaveBeenCalled();
    expect(mockOnCreated).not.toHaveBeenCalled();
  });

  it("cancels the create form with Escape and Cancel", () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Create a new workspace"));
    fireEvent.keyDown(screen.getByPlaceholderText("Workspace name"), {
      key: "Escape",
    });
    expect(screen.getByLabelText("Create a new workspace")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Create a new workspace"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByLabelText("Create a new workspace")).toBeInTheDocument();
  });

  it("shows create errors and keeps the inline form open", async () => {
    (createRecord as jest.Mock).mockRejectedValueOnce(
      new Error("Create failed"),
    );

    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Create a new workspace"));
    fireEvent.change(screen.getByPlaceholderText("Workspace name"), {
      target: { value: "Broken Workspace" },
    });
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("Create failed")).toBeInTheDocument();
    });

    expect(
      screen.queryByLabelText("Create a new workspace"),
    ).not.toBeInTheDocument();
  });

  it("focuses the search and create inputs after opening them", () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Search workspaces"));
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(screen.getByPlaceholderText("Filter workspaces...")).toHaveFocus();

    fireEvent.click(screen.getByLabelText("Create a new workspace"));
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(screen.getByPlaceholderText("Workspace name")).toHaveFocus();
  });

  it("passes update and delete callbacks through each workspace chip", () => {
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        selectedCode={null}
        onSelect={mockOnSelect}
        onCreated={mockOnCreated}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByTestId("workspace-update-ws-1"));
    fireEvent.click(screen.getByTestId("workspace-delete-ws-2"));

    expect(mockOnUpdated).toHaveBeenCalledWith({
      code: "ws-1",
      name: "Workspace One updated",
    });
    expect(mockOnDelete).toHaveBeenCalledWith({
      code: "ws-2",
      name: "Workspace Two",
    });
  });
});
