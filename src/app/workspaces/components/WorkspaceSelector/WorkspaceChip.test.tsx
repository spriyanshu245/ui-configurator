import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import WorkspaceChip from "./WorkspaceChip";
import { updateRecord } from "@/app/utils/dataTableUtils";

jest.mock("@/app/utils/dataTableUtils", () => ({
  updateRecord: jest.fn(),
}));

jest.mock("@/app/components/SVGIcons/ThreeDotMenu", () => () => (
  <span data-testid="menu-icon">menu</span>
));
jest.mock("@/app/components/SVGIcons/EditIcon", () => () => (
  <span data-testid="edit-icon">edit</span>
));
jest.mock("@/app/components/SVGIcons/Delete", () => () => (
  <span data-testid="delete-icon">delete</span>
));

jest.mock("@/app/components/InternalComponents/Modal/Modal", () => ({
  __esModule: true,
  default: ({
    isOpen,
    title,
    onSubmit,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    onSubmit: () => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="delete-modal">
        <span>{title}</span>
        <button onClick={onSubmit}>confirm-delete</button>
        <button onClick={onClose}>cancel-delete</button>
      </div>
    ) : null,
}));

describe("WorkspaceChip", () => {
  const mockOnSelect = jest.fn();
  const mockOnUpdated = jest.fn();
  const mockOnDelete = jest.fn();

  const workspace = { code: "ws-1", name: "Workspace One" };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (updateRecord as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders the workspace chip and selects it on click", () => {
    render(
      <WorkspaceChip
        workspace={workspace}
        isSelected
        onSelect={mockOnSelect}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Select workspace Workspace One" }),
    );
    expect(mockOnSelect).toHaveBeenCalled();
    expect(screen.getByText("Workspace One")).toBeInTheDocument();
    expect(screen.getByText("ws-1")).toBeInTheDocument();
  });

  it("opens and closes the action menu from trigger, outside click, and scroll", () => {
    render(
      <WorkspaceChip
        workspace={workspace}
        isSelected={false}
        onSelect={mockOnSelect}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Workspace actions"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Workspace actions"));
    expect(screen.getByText("Edit")).toBeInTheDocument();

    fireEvent.scroll(window);
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("opens inline edit mode, focuses the name input, and cancels with Escape or Cancel", () => {
    render(
      <WorkspaceChip
        workspace={workspace}
        isSelected={false}
        onSelect={mockOnSelect}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Workspace actions"));
    fireEvent.click(screen.getByText("Edit"));

    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(screen.getByPlaceholderText("Workspace name")).toHaveFocus();
    expect(screen.getByDisplayValue("Workspace One")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByPlaceholderText("Workspace name"), {
      key: "Escape",
    });
    expect(
      screen.queryByPlaceholderText("Workspace name"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Workspace actions"));
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(
      screen.queryByPlaceholderText("Workspace name"),
    ).not.toBeInTheDocument();
  });

  it("saves inline edits successfully from button click and Enter key", async () => {
    render(
      <>
        <WorkspaceChip
          workspace={workspace}
          isSelected={false}
          onSelect={mockOnSelect}
          onUpdated={mockOnUpdated}
          onDelete={mockOnDelete}
        />
        <WorkspaceChip
          workspace={{ code: "ws-2", name: "Workspace Two" }}
          isSelected={false}
          onSelect={mockOnSelect}
          onUpdated={mockOnUpdated}
          onDelete={mockOnDelete}
        />
      </>,
    );

    fireEvent.click(screen.getAllByLabelText("Workspace actions")[0]);
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByPlaceholderText("Workspace name"), {
      target: { value: "Workspace One Updated" },
    });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(updateRecord).toHaveBeenCalledWith({
        method: "PUT",
        endpoint: "/api/v1/config/workspaces/ws-1",
        body: { code: "ws-1", name: "Workspace One Updated" },
      });
      expect(mockOnUpdated).toHaveBeenCalledWith({
        code: "ws-1",
        name: "Workspace One Updated",
      });
    });

    fireEvent.click(screen.getAllByLabelText("Workspace actions")[1]);
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByPlaceholderText("Workspace name"), {
      target: { value: "Workspace Two Updated" },
    });
    fireEvent.keyDown(screen.getByPlaceholderText("Workspace name"), {
      key: "Enter",
    });

    await waitFor(() => {
      expect(updateRecord).toHaveBeenCalledWith({
        method: "PUT",
        endpoint: "/api/v1/config/workspaces/ws-2",
        body: { code: "ws-2", name: "Workspace Two Updated" },
      });
      expect(mockOnUpdated).toHaveBeenCalledWith({
        code: "ws-2",
        name: "Workspace Two Updated",
      });
    });
  });

  it("shows edit errors and keeps edit mode open", async () => {
    (updateRecord as jest.Mock).mockRejectedValueOnce(
      new Error("Update failed"),
    );

    render(
      <WorkspaceChip
        workspace={workspace}
        isSelected={false}
        onSelect={mockOnSelect}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Workspace actions"));
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByPlaceholderText("Workspace name"), {
      target: { value: "Broken Name" },
    });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText("Update failed")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("Workspace name")).toBeInTheDocument();
    expect(mockOnUpdated).not.toHaveBeenCalled();
  });

  it("does not submit edits when the name is blank", () => {
    render(
      <WorkspaceChip
        workspace={workspace}
        isSelected={false}
        onSelect={mockOnSelect}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Workspace actions"));
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByPlaceholderText("Workspace name"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByText("Save"));

    expect(updateRecord).not.toHaveBeenCalled();
  });

  it("opens delete confirmation and supports confirm and cancel flows", async () => {
    render(
      <WorkspaceChip
        workspace={workspace}
        isSelected={false}
        onSelect={mockOnSelect}
        onUpdated={mockOnUpdated}
        onDelete={mockOnDelete}
      />,
    );

    fireEvent.click(screen.getByLabelText("Workspace actions"));
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
    expect(screen.getByText('Delete "Workspace One"?')).toBeInTheDocument();

    fireEvent.click(screen.getByText("cancel-delete"));
    expect(screen.queryByTestId("delete-modal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Workspace actions"));
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });
});
