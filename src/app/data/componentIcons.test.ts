import { componentIcons } from "./componentIcons";

describe("componentIcons", () => {
  it("should be defined", () => {
    expect(componentIcons).toBeDefined();
  });

  it("should be an array", () => {
    expect(Array.isArray(componentIcons)).toBe(true);
  });

  it("should have length greater than zero", () => {
    expect(componentIcons.length).toBeGreaterThan(0);
  });

  it("should contain placeholder icon", () => {
    const placeholder = componentIcons.find(
      (icon) => icon.type === "placeholder"
    );
    expect(placeholder).toBeDefined();
    expect(placeholder?.svgCode).toContain("svg");
  });

  it("should contain placeholder-icon-only", () => {
    const placeholderIconOnly = componentIcons.find(
      (icon) => icon.type === "placeholder-icon-only"
    );
    expect(placeholderIconOnly).toBeDefined();
    expect(placeholderIconOnly?.svgCode).toContain("svg");
  });

  it("should contain heading icon", () => {
    const heading = componentIcons.find((icon) => icon.type === "heading");
    expect(heading).toBeDefined();
    expect(heading?.svgCode).toContain("svg");
  });

  it("should contain typograph icon", () => {
    const typograph = componentIcons.find((icon) => icon.type === "typograph");
    expect(typograph).toBeDefined();
    expect(typograph?.svgCode).toContain("svg");
  });

  it("should contain list icon", () => {
    const list = componentIcons.find((icon) => icon.type === "list");
    expect(list).toBeDefined();
    expect(list?.svgCode).toContain("svg");
  });

  it("should contain tree-structure icon", () => {
    const treeStructure = componentIcons.find(
      (icon) => icon.type === "tree-structure"
    );
    expect(treeStructure).toBeDefined();
    expect(treeStructure?.svgCode).toContain("svg");
  });

  it("should have all items with type and svgCode properties", () => {
    componentIcons.forEach((icon) => {
      expect(icon).toHaveProperty("type");
      expect(icon).toHaveProperty("svgCode");
      expect(typeof icon.type).toBe("string");
      expect(typeof icon.svgCode).toBe("string");
    });
  });
});
