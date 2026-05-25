import { render, screen, fireEvent } from "@testing-library/react";
import DeleteConfirmCell from "./DeleteConfirmCell";

describe("DeleteConfirmCell", () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the confirmation text", () => {
    render(
      <DeleteConfirmCell
        isDeleting={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    expect(screen.getByText("Delete?")).toBeInTheDocument();
  });

  it("renders Yes button when not deleting", () => {
    render(
      <DeleteConfirmCell
        isDeleting={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    expect(screen.getByTestId("confirm-button-yes")).toHaveTextContent("Yes");
  });

  it("renders ... on Yes button when deleting", () => {
    render(
      <DeleteConfirmCell
        isDeleting
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    expect(screen.getByTestId("confirm-button-yes")).toHaveTextContent("...");
  });

  it("renders Cancel button", () => {
    render(
      <DeleteConfirmCell
        isDeleting={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    expect(screen.getByTestId("confirm-button-cancel")).toHaveTextContent(
      "Cancel",
    );
  });

  it("calls onConfirm when Yes is clicked", () => {
    render(
      <DeleteConfirmCell
        isDeleting={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    fireEvent.click(screen.getByTestId("confirm-button-yes"));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel is clicked", () => {
    render(
      <DeleteConfirmCell
        isDeleting={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    fireEvent.click(screen.getByTestId("confirm-button-cancel"));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons when isDeleting is true", () => {
    render(
      <DeleteConfirmCell
        isDeleting
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    expect(screen.getByTestId("confirm-button-yes")).toBeDisabled();
    expect(screen.getByTestId("confirm-button-cancel")).toBeDisabled();
  });

  it("buttons are enabled when isDeleting is false", () => {
    render(
      <DeleteConfirmCell
        isDeleting={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    expect(screen.getByTestId("confirm-button-yes")).not.toBeDisabled();
    expect(screen.getByTestId("confirm-button-cancel")).not.toBeDisabled();
  });

  it("calls onConfirm on Enter key press on Yes button", () => {
    render(
      <DeleteConfirmCell
        isDeleting={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("confirm-button-yes"), {
      key: "Enter",
    });
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel on Enter key press on Cancel button", () => {
    render(
      <DeleteConfirmCell
        isDeleting={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("confirm-button-cancel"), {
      key: "Enter",
    });
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm on Space key press on Yes button", () => {
    render(
      <DeleteConfirmCell
        isDeleting={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("confirm-button-yes"), {
      key: " ",
    });
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not call onConfirm on non-activation keys", () => {
    render(
      <DeleteConfirmCell
        isDeleting={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("confirm-button-yes"), {
      key: "Tab",
    });
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});
