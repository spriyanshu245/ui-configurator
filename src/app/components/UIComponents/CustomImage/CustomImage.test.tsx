import React from "react";
import { render, screen } from "@testing-library/react";
import CustomImage from "./CustomImage";
import { ImageComponent } from "@/app/types/types";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { priority, ...rest } = props as Record<string, unknown>;
    return <img {...rest} data-priority={priority ? "true" : "false"} />;
  },
}));

jest.mock("@/app/data/componentIcons", () => ({
  componentIcons: [
    {
      type: "image",
      svgCode: '<svg data-testid="placeholder-svg"></svg>',
    },
  ],
}));

describe("CustomImage", () => {
  const createComponent = (
    overrides: Partial<ImageComponent["properties"]> = {}
  ): ImageComponent => ({
    id: "test-image-id",
    type: "image",
    category: "component",
    properties: {
      src: "",
      alt: "",
      ...overrides,
    },
  });

  it("renders placeholder when src is not provided", () => {
    const component = createComponent({ src: "", alt: "Test" });
    render(<CustomImage component={component} />);
    expect(screen.getByTestId("placeholder-svg")).toBeInTheDocument();
  });

  it("renders placeholder when src is undefined", () => {
    const component: ImageComponent = {
      id: "test-image-id",
      type: "image",
      category: "component",
      properties: {
        src: "",
        alt: "Test",
      },
    };
    component.properties = undefined as unknown as ImageComponent["properties"];
    render(<CustomImage component={component} />);
    expect(screen.getByTestId("placeholder-svg")).toBeInTheDocument();
  });

  it("renders image when src is provided", () => {
    const component = createComponent({
      src: "https://example.com/image.jpg",
      alt: "Test Image",
    });
    render(<CustomImage component={component} />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
    expect(img).toHaveAttribute("alt", "Test Image");
  });

  it("uses default alt text when alt is not provided", () => {
    const component = createComponent({
      src: "https://example.com/image.jpg",
      alt: "",
    });
    render(<CustomImage component={component} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Default alt text");
  });

  it("applies width style when width is provided", () => {
    const component = createComponent({
      src: "https://example.com/image.jpg",
      alt: "Test",
      width: 50,
    });
    const { container } = render(<CustomImage component={component} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: "50%" });
  });

  it("applies undefined width style when width is not provided", () => {
    const component = createComponent({
      src: "https://example.com/image.jpg",
      alt: "Test",
    });
    const { container } = render(<CustomImage component={component} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute("id", "test-image-id");
  });

  it("sets correct id on the wrapper element", () => {
    const component = createComponent({
      src: "https://example.com/image.jpg",
      alt: "Test",
    });
    const { container } = render(<CustomImage component={component} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute("id", "test-image-id");
  });

  it("renders with priority set to true for next/image", () => {
    const component = createComponent({
      src: "https://example.com/image.jpg",
      alt: "Test",
    });
    render(<CustomImage component={component} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("data-priority", "true");
  });
});
