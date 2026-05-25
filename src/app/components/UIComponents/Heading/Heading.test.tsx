import React from "react";
import { render, screen } from "@testing-library/react";
import Heading from "./Heading";
import { HeadingComponent } from "@/app/types/types";

describe("Heading", () => {
  const createComponent = (
    overrides: Partial<HeadingComponent["properties"]> = {}
  ): HeadingComponent => ({
    id: "test-heading-id",
    type: "heading",
    category: "component",
    properties: {
      level: 1,
      text: "Test Heading",
      ...overrides,
    },
  });

  it("renders with default values when properties are minimal", () => {
    const component: HeadingComponent = {
      id: "heading-1",
      type: "heading",
      category: "component",
      properties: {
        level: 1,
        text: "Heading",
      },
    };
    render(<Heading component={component} />);
    expect(screen.getByText("Heading")).toBeInTheDocument();
  });

  it("renders h1 when level is 1", () => {
    const component = createComponent({ level: 1, text: "H1 Heading" });
    const { container } = render(<Heading component={component} />);
    const h1 = container.querySelector("h1");
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent("H1 Heading");
  });

  it("renders h2 when level is 2", () => {
    const component = createComponent({ level: 2, text: "H2 Heading" });
    const { container } = render(<Heading component={component} />);
    const h2 = container.querySelector("h2");
    expect(h2).toBeInTheDocument();
    expect(h2).toHaveTextContent("H2 Heading");
  });

  it("renders h3 when level is 3", () => {
    const component = createComponent({ level: 3, text: "H3 Heading" });
    const { container } = render(<Heading component={component} />);
    const h3 = container.querySelector("h3");
    expect(h3).toBeInTheDocument();
  });

  it("renders h4 when level is 4", () => {
    const component = createComponent({ level: 4, text: "H4 Heading" });
    const { container } = render(<Heading component={component} />);
    const h4 = container.querySelector("h4");
    expect(h4).toBeInTheDocument();
  });

  it("renders h5 when level is 5", () => {
    const component = createComponent({ level: 5, text: "H5 Heading" });
    const { container } = render(<Heading component={component} />);
    const h5 = container.querySelector("h5");
    expect(h5).toBeInTheDocument();
  });

  it("renders h6 when level is 6", () => {
    const component = createComponent({ level: 6, text: "H6 Heading" });
    const { container } = render(<Heading component={component} />);
    const h6 = container.querySelector("h6");
    expect(h6).toBeInTheDocument();
  });

  it("applies correct textAlign style", () => {
    const component = createComponent({
      level: 1,
      text: "Centered",
      textAlign: "center",
    });
    const { container } = render(<Heading component={component} />);
    const h1 = container.querySelector("h1");
    expect(h1).toHaveStyle({ textAlign: "center" });
  });

  it("applies correct textColor style", () => {
    const component = createComponent({
      level: 1,
      text: "Colored",
      textColor: "#ff0000",
    });
    const { container } = render(<Heading component={component} />);
    const h1 = container.querySelector("h1");
    expect(h1).toHaveStyle({ color: "#ff0000" });
  });

  it("applies correct width style when provided", () => {
    const component = createComponent({
      level: 1,
      text: "Width Test",
      width: 50,
    });
    const { container } = render(<Heading component={component} />);
    const h1 = container.querySelector("h1");
    expect(h1).toHaveStyle({ width: "50%" });
  });

  it("applies default width of 100% when not provided", () => {
    const component = createComponent({
      level: 1,
      text: "Default Width",
    });
    const { container } = render(<Heading component={component} />);
    const h1 = container.querySelector("h1");
    expect(h1).toHaveStyle({ width: "100%" });
  });

  it("applies default textAlign left when not provided", () => {
    const component = createComponent({
      level: 1,
      text: "Default Align",
    });
    const { container } = render(<Heading component={component} />);
    const h1 = container.querySelector("h1");
    expect(h1).toHaveStyle({ textAlign: "left" });
  });

  it("applies default textColor when not provided", () => {
    const component = createComponent({
      level: 1,
      text: "Default Color",
    });
    const { container } = render(<Heading component={component} />);
    const h1 = container.querySelector("h1");
    expect(h1).toHaveStyle({ color: "#000000" });
  });

  it("uses default text when text is not provided", () => {
    const component: HeadingComponent = {
      id: "heading-1",
      type: "heading",
      category: "component",
      properties: {
        level: 1,
        text: "",
      },
    };
    render(<Heading component={component} />);
    const headingElement = document.querySelector("h1");
    expect(headingElement).toBeInTheDocument();
  });

  it("uses default level 1 when level is not provided", () => {
    const component: HeadingComponent = {
      id: "heading-1",
      type: "heading",
      category: "component",
      properties: {} as HeadingComponent["properties"],
    };
    const { container } = render(<Heading component={component} />);
    const h1 = container.querySelector("h1");
    expect(h1).toBeInTheDocument();
  });

  it("renders with right text alignment", () => {
    const component = createComponent({
      level: 1,
      text: "Right Aligned",
      textAlign: "right",
    });
    const { container } = render(<Heading component={component} />);
    const h1 = container.querySelector("h1");
    expect(h1).toHaveStyle({ textAlign: "right" });
  });

  it("sets correct id on the heading element", () => {
    const component = createComponent({
      level: 1,
      text: "ID Test",
    });
    const { container } = render(<Heading component={component} />);
    const h1 = container.querySelector("h1");
    expect(h1).toHaveAttribute("id", "test-heading-id");
  });
});
