import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnsavedChangesModal } from "./UnsavedChangesPopup";

jest.mock(
  "../Modal/Modal",
  () =>
    ({
      isOpen,
      title,
      submitText,
      cancelText,
      onClose,
      onSubmit,
      description,
    }: any) => {
      return (
        <div data-testid="modal">
          <h1>{title}</h1>
          <p>{description}</p>
          <button onClick={onSubmit}>{submitText}</button>
          <button onClick={onClose}>{cancelText}</button>
        </div>
      );
    }
);

describe("UnsavedChangesModal", () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when open is false", () => {
    const { queryByTestId } = render(
      <UnsavedChangesModal
        open={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
        backDrop={() => {}}
      />
    );

    expect(queryByTestId("modal")).toBeNull();
  });

  it("renders when open is true", () => {
    render(
      <UnsavedChangesModal
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        backDrop={() => {}}
      />
    );

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You have unsaved changes. Are you sure you want to leave?"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Save and Exit")).toBeInTheDocument();
    expect(screen.getByText("Leave")).toBeInTheDocument();
  });

  it("calls onConfirm when 'Save and Exit' button is clicked", () => {
    render(
      <UnsavedChangesModal
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        backDrop={() => {}}
      />
    );

    fireEvent.click(screen.getByText("Save and Exit"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when 'Leave' button is clicked", () => {
    render(
      <UnsavedChangesModal
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        backDrop={() => {}}
      />
    );

    fireEvent.click(screen.getByText("Leave"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
