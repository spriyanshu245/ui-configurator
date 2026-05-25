import React from "react";
import { render, screen } from "@testing-library/react";
import TextArea from "./TextArea";

// Mock CSS modules
jest.mock("./TextArea.module.scss", () => ({
  formGroup: "formGroup",
  textAreaContainer: "textAreaContainer",
  textArea: "textArea",
}));

jest.mock("./../../../styles/shared.module.scss", () => ({
  formGroup: "sharedFormGroup",
  formGroupLabel: "formGroupLabel",
}));

describe("TextArea", () => {
  const baseComponent = {
    id: "test-textarea-id",
    properties: {
      label: "Test Label",
      showLabel: true,
      placeholder: "Enter text here",
      rowCount: 5,
    },
  };

  it("renders with all properties when showLabel is true", () => {
    render(<TextArea component={baseComponent} />);

    // Check container div
    const container = screen.getByRole("textbox").closest("div")!.parentElement;
    expect(container).toHaveAttribute("id", "test-textarea-id");

    // Check label is rendered
    const label = screen.getByText("Test Label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute("for", "test-textarea-id");
    expect(label).toHaveClass("formGroupLabel");

    // Check textarea attributes
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("name", "test-textarea-id");
    expect(textarea).toHaveAttribute("id", "test-textarea-id");
    expect(textarea).toHaveAttribute("placeholder", "Enter text here");
    expect(textarea).toHaveAttribute("rows", "5");
    expect(textarea).toBeDisabled();
  });

  it("does not render label when showLabel is false", () => {
    const componentWithoutLabel = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        showLabel: false,
      },
    };

    render(<TextArea component={componentWithoutLabel} />);

    expect(screen.queryByText("Test Label")).not.toBeInTheDocument();

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
  });

  it("does not render label when label property is missing", () => {
    const componentWithoutLabelProp = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        label: undefined,
        showLabel: true,
      },
    };

    render(<TextArea component={componentWithoutLabelProp} />);

    expect(screen.queryByLabelText(/test label/i)).not.toBeInTheDocument();
  });

  it("uses default rowCount of 3 when rowCount is not provided", () => {
    const componentWithoutRowCount = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        rowCount: null,
      },
    };

    render(<TextArea component={componentWithoutRowCount} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "3");
  });

  it("uses default rowCount of 3 when rowCount is undefined", () => {
    const componentWithUndefinedRowCount = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        rowCount: undefined,
      },
    };

    render(<TextArea component={componentWithUndefinedRowCount} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "3");
  });

  it("renders without optional properties", () => {
    const minimalComponent = {
      id: "minimal-textarea",
      properties: {
        // Only required properties, no optional ones
      },
    };

    render(<TextArea component={minimalComponent} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("id", "minimal-textarea");
    expect(textarea).toHaveAttribute("name", "minimal-textarea");
    expect(textarea).toHaveAttribute("rows", "3"); // Default value
    expect(textarea).toBeDisabled();

    // Optional attributes should not be set when properties are missing
    expect(textarea).not.toHaveAttribute("placeholder");
    expect(textarea).not.toHaveAttribute("cols");
    expect(textarea).not.toHaveAttribute("maxlength");
    expect(textarea).not.toHaveAttribute("minlength");
  });

  it("renders with empty string values for optional properties", () => {
    const componentWithEmptyStrings = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        placeholder: "",
        label: "",
      },
    };

    render(<TextArea component={componentWithEmptyStrings} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("placeholder", "");

    // Empty label should not render
    expect(screen.queryByLabelText("")).not.toBeInTheDocument();
  });

  it("has correct key attribute on container", () => {
    render(<TextArea component={baseComponent} />);

    const container = screen.getByRole("textbox").closest("div")!.parentElement;
    expect(container).toHaveAttribute("id", "test-textarea-id");
  });
});
