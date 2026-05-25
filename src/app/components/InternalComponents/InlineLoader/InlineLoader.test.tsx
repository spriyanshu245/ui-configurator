import React from "react";
import { render, screen } from "@testing-library/react";
import InlineLoaderIcon from "./InlineLoader";

jest.mock("./inlineLoader.module.scss", () => ({ spinner: "spinner" }));

describe("InlineLoaderIcon (coverage)", () => {
  it("renders with default gradient and spinner class", () => {
    render(<InlineLoaderIcon id="loader" />);
    const svg = screen.getByTestId("loader");
    expect(svg.tagName.toLowerCase()).toBe("svg");
    const circle = svg.querySelector("circle");
    expect(circle).not.toBeNull();
    expect(circle?.getAttribute("class")?.split(" ")).toContain("spinner");
    const defs = svg.querySelector("defs linearGradient#BlueRadialGradient");
    expect(defs).not.toBeNull();
  });

  it("applies custom stopColor", () => {
    render(<InlineLoaderIcon id="loader2" stopColor="#ff0000" />);
    const svg = screen.getByTestId("loader2");
    const stops = svg.querySelectorAll(
      "linearGradient#BlueRadialGradient stop"
    );
    expect(stops.length).toBe(2);
    stops.forEach((s) =>
      expect(s.getAttribute("stop-color") || s.getAttribute("stopColor")).toBe(
        "#ff0000"
      )
    );
  });
});
