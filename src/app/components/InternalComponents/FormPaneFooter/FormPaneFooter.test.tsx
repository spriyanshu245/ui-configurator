import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import FormPaneFooter from "./FormPaneFooter";

describe("FormPaneFooter", () => {
  const mockOnCancel = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders default labels and triggers handlers", () => {
    render(
      <FormPaneFooter
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        isValid
      />,
    );

    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Create"));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it("renders custom labels and test ids", () => {
    render(
      <FormPaneFooter
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        isValid
        cancelLabel="Back"
        submitLabel="Save"
        cancelButtonTestId="cancel-btn"
        submitButtonTestId="submit-btn"
      />,
    );

    expect(screen.getByTestId("cancel-btn")).toHaveTextContent("Back");
    expect(screen.getByTestId("submit-btn")).toHaveTextContent("Save");
  });

  it("disables both buttons while submitting and shows the submitting label", () => {
    render(
      <FormPaneFooter
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        isSubmitting
        isValid
        submittingLabel="Saving..."
      />,
    );

    expect(screen.getByText("Cancel")).toBeDisabled();
    expect(screen.getByText("Saving...")).toBeDisabled();
  });

  it("disables submit when the form is invalid", () => {
    render(
      <FormPaneFooter
        onCancel={mockOnCancel}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        isValid={false}
      />,
    );

    expect(screen.getByText("Create")).toBeDisabled();
    expect(screen.getByText("Cancel")).not.toBeDisabled();
  });
});
