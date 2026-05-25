import { propertyIcons } from "./propertyIcons";

describe("propertyIcons", () => {
  it("should be defined", () => {
    expect(propertyIcons).toBeDefined();
  });

  it("should be an array", () => {
    expect(Array.isArray(propertyIcons)).toBe(true);
  });

  it("should have length greater than zero", () => {
    expect(propertyIcons.length).toBeGreaterThan(0);
  });

  it("should contain textAlign left icon", () => {
    const leftAlign = propertyIcons.find(
      (icon) => icon.property === "textAlign" && icon.value === "left"
    );
    expect(leftAlign).toBeDefined();
    expect(leftAlign?.svgCode).toContain("svg");
  });

  it("should contain textAlign center icon", () => {
    const centerAlign = propertyIcons.find(
      (icon) => icon.property === "textAlign" && icon.value === "center"
    );
    expect(centerAlign).toBeDefined();
    expect(centerAlign?.svgCode).toContain("svg");
  });

  it("should contain textAlign right icon", () => {
    const rightAlign = propertyIcons.find(
      (icon) => icon.property === "textAlign" && icon.value === "right"
    );
    expect(rightAlign).toBeDefined();
    expect(rightAlign?.svgCode).toContain("svg");
  });

  it("should have all items with property, value and svgCode properties", () => {
    propertyIcons.forEach((icon) => {
      expect(icon).toHaveProperty("property");
      expect(icon).toHaveProperty("value");
      expect(icon).toHaveProperty("svgCode");
      expect(typeof icon.property).toBe("string");
      expect(typeof icon.value).toBe("string");
      expect(typeof icon.svgCode).toBe("string");
    });
  });

  it("should have valid SVG content in svgCode", () => {
    propertyIcons.forEach((icon) => {
      expect(icon.svgCode).toContain("svg");
      expect(icon.svgCode).toContain("path");
    });
  });
});
