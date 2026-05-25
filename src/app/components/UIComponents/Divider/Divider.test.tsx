import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Divider from "./Divider";
import { DividerComponent } from "../../../types/types";

// Mock the styles module
jest.mock("./Divider.module.scss", () => ({
  container: "container",
  divider: "divider",
  alignLeft: "alignLeft",
  alignRight: "alignRight",
  alignCenter: "alignCenter",
}));

describe("Divider Component", () => {
  const createMockComponent = (properties?: any): DividerComponent => ({
    id: "test-divider",
    category: "component",
    properties: properties || {},
    type: "divider",
  });

  describe("Rendering", () => {
    it("renders with default props when no properties provided", () => {
      const component = createMockComponent();
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toBeInTheDocument();
      expect(dividerElement).toHaveClass("divider");
      expect(dividerElement).toHaveStyle({
        height: "1px",
        width: "100%",
      });
    });

    it("renders with empty properties object", () => {
      const component = createMockComponent({});
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toBeInTheDocument();
      expect(dividerElement).toHaveStyle({
        height: "1px",
        width: "100%",
      });
    });

    it("renders container with correct default classes", () => {
      const component = createMockComponent();
      const { container } = render(<Divider component={component} />);

      const containerElement = container.firstChild;
      expect(containerElement).toHaveClass("container", "alignCenter");
    });
  });

  describe("Alignment functionality", () => {
    it('applies left alignment class when align is "left"', () => {
      const component = createMockComponent({ align: "left" });
      const { container } = render(<Divider component={component} />);

      const containerElement = container.firstChild;
      expect(containerElement).toHaveClass("container", "alignLeft");
    });

    it('applies right alignment class when align is "right"', () => {
      const component = createMockComponent({ align: "right" });
      const { container } = render(<Divider component={component} />);

      const containerElement = container.firstChild;
      expect(containerElement).toHaveClass("container", "alignRight");
    });

    it('applies center alignment class when align is "center"', () => {
      const component = createMockComponent({ align: "center" });
      const { container } = render(<Divider component={component} />);

      const containerElement = container.firstChild;
      expect(containerElement).toHaveClass("container", "alignCenter");
    });

    it("applies center alignment class for unknown align value", () => {
      const component = createMockComponent({ align: "unknown" });
      const { container } = render(<Divider component={component} />);

      const containerElement = container.firstChild;
      expect(containerElement).toHaveClass("container", "alignCenter");
    });

    it("applies center alignment class when align is undefined", () => {
      const component = createMockComponent({ align: undefined });
      const { container } = render(<Divider component={component} />);

      const containerElement = container.firstChild;
      expect(containerElement).toHaveClass("container", "alignCenter");
    });
  });

  describe("Width formatting", () => {
    it("handles percentage string width correctly", () => {
      const component = createMockComponent({ width: "50%" });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ width: "50%" });
    });

    it("converts numeric width to percentage", () => {
      const component = createMockComponent({ width: 75 });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ width: "75%" });
    });

    it("converts string numeric width to percentage", () => {
      const component = createMockComponent({ width: "60" });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ width: "60%" });
    });

    it('handles width as "0"', () => {
      const component = createMockComponent({ width: "0" });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ width: "0%" });
    });

    it("handles empty string width", () => {
      const component = createMockComponent({ width: "" });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ width: "100%" });
    });

    it("handles null width", () => {
      const component = createMockComponent({ width: null });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ width: "100%" });
    });

    it("handles undefined width", () => {
      const component = createMockComponent({ width: undefined });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ width: "100%" });
    });
  });

  describe("Height functionality", () => {
    it("applies custom height", () => {
      const component = createMockComponent({ height: 5 });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ height: "5px" });
    });

    it("uses default height when height is undefined", () => {
      const component = createMockComponent({ height: undefined });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ height: "1px" });
    });
  });

  describe("Color functionality", () => {
    it("applies custom background color", () => {
      const component = createMockComponent({ backgroundColor: "#ff0000" });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ backgroundColor: "#ff0000" });
    });

    it("applies default background color when backgroundColor is undefined", () => {
      const component = createMockComponent({ backgroundColor: undefined });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement?.style.backgroundColor).toBe("var(--dark-gray-4)");
    });

    it("applies default background color when backgroundColor is empty string", () => {
      const component = createMockComponent({ backgroundColor: "" });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement?.style.backgroundColor).toBe("var(--dark-gray-4)");
    });

    it("applies default background color when backgroundColor is null", () => {
      const component = createMockComponent({ backgroundColor: null });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement?.style.backgroundColor).toBe("var(--dark-gray-4)");
    });
  });

  describe("Combined properties", () => {
    it("applies all properties together", () => {
      const component = createMockComponent({
        width: "80%",
        height: 3,
        color: "#blue",
        align: "right",
      });
      const { container } = render(<Divider component={component} />);

      const containerElement = container.firstChild;
      const dividerElement = container.querySelector("hr");

      expect(containerElement).toHaveClass("container", "alignRight");
      expect(dividerElement).toHaveStyle({
        width: "80%",
        height: "3px",
        backgroundColor: "#blue",
      });
    });

    it.skip("handles mix of defined and undefined properties", () => {
      const component = createMockComponent({
        width: 50,
        backgroundColor: "green",
      });
      const { container } = render(<Divider component={component} />);

      const containerElement = container.firstChild;
      const dividerElement = container.querySelector("hr");

      expect(containerElement).toHaveClass("container", "alignCenter");
      expect(dividerElement).toHaveStyle({
        width: "50%",
        backgroundColor: "green",
      });
    });
  });

  describe("Edge cases", () => {
    it("handles component with null properties", () => {
      const component = { properties: null } as any;
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toBeInTheDocument();
      expect(dividerElement).toHaveStyle({
        height: "1px",
        width: "100%",
      });
    });

    it("handles component as null", () => {
      const component = null as any;
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toBeInTheDocument();
      expect(dividerElement).toHaveStyle({
        height: "1px",
        width: "100%",
      });
    });

    it("handles decimal width values", () => {
      const component = createMockComponent({ width: 33.5 });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ width: "33.5%" });
    });

    it("handles string decimal width values", () => {
      const component = createMockComponent({ width: "25.7" });
      const { container } = render(<Divider component={component} />);

      const dividerElement = container.querySelector("hr");
      expect(dividerElement).toHaveStyle({ width: "25.7%" });
    });
  });
});
