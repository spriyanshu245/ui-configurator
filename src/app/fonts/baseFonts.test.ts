// baseFonts.test.ts
import localFont from "next/font/local";
import { gotham } from "./baseFonts";

// Mock next/font/local to return a simple object with a className.
jest.mock("next/font/local", () => {
  return jest.fn((options) => {
    return {
      className: "gotham-font",
      // Note: The actual returned object does not expose the options,
      // so we only check the call parameters.
    };
  });
});

describe("Gotham font", () => {
  const expectedSrc = [
    {
      path: "./Gotham-Book.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Gotham-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./Gotham-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./Gotham-Medium.otf",
      weight: "500",
      style: "normal",
    },
  ];

  it("should be defined and have the expected className", () => {
    expect(gotham).toBeDefined();
    expect(gotham.className).toBe("gotham-font");
  });

  it("should be created with .otf files and correct options", () => {
    // Check that localFont was called with the expected src options.
    expect(localFont).toHaveBeenCalledWith({
      src: expectedSrc,
    });

    // Additionally, ensure each font file path ends with ".otf"
    expectedSrc.forEach((fontOption) => {
      expect(fontOption.path.endsWith(".otf")).toBe(true);
    });
  });
});
