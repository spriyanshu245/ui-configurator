import React from "react";
import { render } from "@testing-library/react";
import { Loader } from "./Loader";

// Mock the CSS module so that we have predictable class names.
jest.mock("./Loader.module.scss", () => ({
  loader: "loader",
}));

describe("Loader Component", () => {
  test("renders loader container with SVG and expected paths", () => {
    const { container } = render(<Loader />);

    // Verify the container div has the loader class.
    const loaderDiv = container.querySelector("div.loader");
    expect(loaderDiv).toBeInTheDocument();

    // Verify the SVG element and its attributes.
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "35");
    expect(svg).toHaveAttribute("height", "40");
    expect(svg).toHaveAttribute("viewBox", "0 0 35 40");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Verify the first path element (path1) is rendered with expected attributes.
    const path1 = container.querySelector("path#path1");
    expect(path1).toBeInTheDocument();
    expect(path1).toHaveAttribute("fill", "#1A75B7");
    expect(path1).toHaveAttribute("stroke", "#1A75B7");
    // Check for dash-case attribute
    expect(path1).toHaveAttribute("stroke-width", "2");

    // Verify the animate element inside path1.
    const animate1 = path1?.querySelector("animate");
    expect(animate1).toBeInTheDocument();
    expect(animate1).toHaveAttribute("attributeName", "opacity");
    expect(animate1).toHaveAttribute("values", "1;0;1");
    expect(animate1).toHaveAttribute("dur", "1.5s");
    expect(animate1).toHaveAttribute("repeatCount", "indefinite");

    // Verify the second path element (path2) is rendered with expected attributes.
    const path2 = container.querySelector("path#path2");
    expect(path2).toBeInTheDocument();
    expect(path2).toHaveAttribute("fill", "#16A197");
    expect(path2).toHaveAttribute("stroke", "#16A197");
    // Check for dash-case attribute
    expect(path2).toHaveAttribute("stroke-width", "2");

    // Verify the animate element inside path2.
    const animate2 = path2?.querySelector("animate");
    expect(animate2).toBeInTheDocument();
    expect(animate2).toHaveAttribute("attributeName", "opacity");
    expect(animate2).toHaveAttribute("values", "1;0;1");
    expect(animate2).toHaveAttribute("dur", "1.5s");
    expect(animate2).toHaveAttribute("repeatCount", "indefinite");
  });
});
