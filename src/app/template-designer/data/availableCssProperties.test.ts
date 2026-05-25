import { CSS_PROPERTIES } from "./availableCssProperties";

describe("CSS_PROPERTIES", () => {
  it("exports an array of CSS property names", () => {
    expect(Array.isArray(CSS_PROPERTIES)).toBe(true);
    expect(CSS_PROPERTIES.length).toBeGreaterThan(0);
  });

  it("contains common background properties", () => {
    expect(CSS_PROPERTIES).toContain("background");
    expect(CSS_PROPERTIES).toContain("background-color");
    expect(CSS_PROPERTIES).toContain("background-image");
    expect(CSS_PROPERTIES).toContain("background-position");
    expect(CSS_PROPERTIES).toContain("background-repeat");
    expect(CSS_PROPERTIES).toContain("background-size");
  });

  it("contains all border properties", () => {
    expect(CSS_PROPERTIES).toContain("border");
    expect(CSS_PROPERTIES).toContain("border-bottom");
    expect(CSS_PROPERTIES).toContain("border-left");
    expect(CSS_PROPERTIES).toContain("border-right");
    expect(CSS_PROPERTIES).toContain("border-top");
    expect(CSS_PROPERTIES).toContain("border-radius");
  });

  it("contains border color properties", () => {
    expect(CSS_PROPERTIES).toContain("border-bottom-color");
    expect(CSS_PROPERTIES).toContain("border-left-color");
    expect(CSS_PROPERTIES).toContain("border-right-color");
    expect(CSS_PROPERTIES).toContain("border-top-color");
    expect(CSS_PROPERTIES).toContain("border-color");
  });

  it("contains border width properties", () => {
    expect(CSS_PROPERTIES).toContain("border-width");
    expect(CSS_PROPERTIES).toContain("border-bottom-width");
    expect(CSS_PROPERTIES).toContain("border-left-width");
    expect(CSS_PROPERTIES).toContain("border-right-width");
    expect(CSS_PROPERTIES).toContain("border-top-width");
  });

  it("contains border style properties", () => {
    expect(CSS_PROPERTIES).toContain("border-style");
    expect(CSS_PROPERTIES).toContain("border-bottom-style");
    expect(CSS_PROPERTIES).toContain("border-left-style");
    expect(CSS_PROPERTIES).toContain("border-right-style");
    expect(CSS_PROPERTIES).toContain("border-top-style");
  });

  it("contains typography properties", () => {
    expect(CSS_PROPERTIES).toContain("color");
    expect(CSS_PROPERTIES).toContain("font-family");
    expect(CSS_PROPERTIES).toContain("font-size");
    expect(CSS_PROPERTIES).toContain("font-style");
    expect(CSS_PROPERTIES).toContain("font-weight");
  });

  it("contains spacing properties", () => {
    expect(CSS_PROPERTIES).toContain("margin");
    expect(CSS_PROPERTIES).toContain("margin-top");
    expect(CSS_PROPERTIES).toContain("margin-bottom");
    expect(CSS_PROPERTIES).toContain("margin-left");
    expect(CSS_PROPERTIES).toContain("margin-right");
    expect(CSS_PROPERTIES).toContain("padding");
    expect(CSS_PROPERTIES).toContain("padding-top");
    expect(CSS_PROPERTIES).toContain("padding-bottom");
    expect(CSS_PROPERTIES).toContain("padding-left");
    expect(CSS_PROPERTIES).toContain("padding-right");
  });

  it("contains text formatting properties", () => {
    expect(CSS_PROPERTIES).toContain("text-align");
    expect(CSS_PROPERTIES).toContain("text-decoration");
    expect(CSS_PROPERTIES).toContain("text-indent");
    expect(CSS_PROPERTIES).toContain("text-overflow");
    expect(CSS_PROPERTIES).toContain("text-transform");
  });

  it("contains dimension properties", () => {
    expect(CSS_PROPERTIES).toContain("width");
    expect(CSS_PROPERTIES).toContain("height");
  });

  it("contains visual properties", () => {
    expect(CSS_PROPERTIES).toContain("box-shadow");
    expect(CSS_PROPERTIES).toContain("opacity");
    expect(CSS_PROPERTIES).toContain("outline");
  });

  it("contains layout properties", () => {
    expect(CSS_PROPERTIES).toContain("vertical-align");
    expect(CSS_PROPERTIES).toContain("object-fit");
  });

  it("contains text and word properties", () => {
    expect(CSS_PROPERTIES).toContain("letter-spacing");
    expect(CSS_PROPERTIES).toContain("line-height");
    expect(CSS_PROPERTIES).toContain("white-space");
    expect(CSS_PROPERTIES).toContain("word-break");
    expect(CSS_PROPERTIES).toContain("word-spacing");
    expect(CSS_PROPERTIES).toContain("word-wrap");
  });

  it("contains list properties", () => {
    expect(CSS_PROPERTIES).toContain("list-style");
    expect(CSS_PROPERTIES).toContain("list-style-type");
  });

  it("all values are strings", () => {
    CSS_PROPERTIES.forEach((prop) => {
      expect(typeof prop).toBe("string");
    });
  });

  it("all values are non-empty strings", () => {
    CSS_PROPERTIES.forEach((prop) => {
      expect(prop.length).toBeGreaterThan(0);
    });
  });

  it("all property names are lowercase with hyphens", () => {
    CSS_PROPERTIES.forEach((prop) => {
      expect(prop).toMatch(/^[a-z][a-z-]*[a-z]$/);
    });
  });

  it("has no duplicate properties", () => {
    const uniqueProps = new Set(CSS_PROPERTIES);
    expect(uniqueProps.size).toBe(CSS_PROPERTIES.length);
  });
});
