import { render, screen } from "@testing-library/react";
import ImageCapture from "./ImageCapture";
import { ImageCaptureComponent } from "@/app/types/types";

const baseComponent: ImageCaptureComponent = {
  type: "imageCapture",
  category: "form",
  properties: {
    id: "image-capture1",
    label: "Capture Image",
    showLabel: true,
    preview: true,
    alt: "image-capture-placeholder",
  },
  displayName: "Image Capture",
  id: "image-capture1",
};

describe("ImageCapture component", () => {
  it("renders wrapper with correct id and data-testid", () => {
    render(<ImageCapture component={baseComponent} />);

    const wrapper = screen.getByTestId("capture-image");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute("id", baseComponent.id);
  });

  it("renders label when showLabel is true and label is provided", () => {
    render(<ImageCapture component={baseComponent} />);

    const label = screen.getByText("Capture Image");
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute("for", baseComponent.id);
  });

  it("does not render label when showLabel is false", () => {
    const componentWithoutLabel: ImageCaptureComponent = {
      ...baseComponent,
      properties: {
        ...baseComponent.properties,
        showLabel: false,
      },
    };

    render(<ImageCapture component={componentWithoutLabel} />);

    expect(screen.queryByText("Capture Image")).not.toBeInTheDocument();
  });

  it("renders the camera icon container", () => {
    render(<ImageCapture component={baseComponent} />);

    const iconWrapper = screen.getByTestId("capture-image-icon");
    expect(iconWrapper).toBeInTheDocument();
    expect(iconWrapper.querySelector("svg")).toBeInTheDocument();
  });
});
