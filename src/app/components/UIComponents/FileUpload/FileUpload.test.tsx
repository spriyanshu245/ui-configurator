import { render, screen } from "@testing-library/react";
import FileUpload from "./FileUpload";
import { FileUploadComponent } from "../../../types/types";

const baseComponent: FileUploadComponent = {
  id: "file-upload1",
  type: "file-upload",
  category: "form",
  properties: {
    label: "test-label",
    showLabel: true,
  },
};

jest.mock("../../SVGIcons/FileUploadIcon", () =>
  jest.fn(() => <svg data-testid="file-upload-icon" />)
);

describe("FileUpload component", () => {
  it("renders a div with the correct id", () => {
    render(<FileUpload component={baseComponent} />);

    const divElement = screen.getByTestId("file-upload");

    expect(divElement).toBeInTheDocument();
    expect(divElement).toHaveAttribute("id", "file-upload1");
  });

  it("does not render label when showLabel is false", () => {
    const component = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        showLabel: false,
      },
    };
    render(<FileUpload component={component} />);

    expect(screen.queryByText("test-label")).not.toBeInTheDocument();
  });

  it("shows label when showLabel is true", () => {
    render(<FileUpload component={baseComponent} />);

    expect(screen.getByText("test-label")).toBeInTheDocument();
  });

  it("tests correct ID is used for htmlFor attribute", () => {
    render(<FileUpload component={baseComponent} />);

    const labelElement = screen.getByText("test-label");
    expect(labelElement).toHaveAttribute("for", "file-upload1");
  });

  it("should render FileUploadIcon component", () => {
    render(<FileUpload component={baseComponent} />);

    const fileUploadIcon = screen.getByTestId("file-upload-icon");
    expect(fileUploadIcon).toBeInTheDocument();
  });
});
