import { render } from "@testing-library/react";
import SpinningLoader from "./SpinningLoader";
import styles from "./ButtonLoader.module.scss";

describe("SpinningLoader", () => {
  it("renders SVG with correct attributes", () => {
    const { container } = render(<SpinningLoader />);
    const svg = container.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("fill", "hsl(228, 97%, 42%)");
    expect(svg).toHaveAttribute("viewBox", "0 0 20 20");
    expect(svg).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");
  });

  it("renders linear gradient definition", () => {
    const { container } = render(<SpinningLoader />);
    const gradientElement = container.querySelector("linearGradient");

    expect(gradientElement).toBeInTheDocument();
    expect(gradientElement).toHaveAttribute("id", "RadialGradient8932");
  });

  it("renders circle with correct attributes", () => {
    const { container } = render(<SpinningLoader />);
    const circle = container.querySelector("circle");

    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute("cx", "10");
    expect(circle).toHaveAttribute("cy", "10");
    expect(circle).toHaveAttribute("r", "8");
    expect(circle).toHaveAttribute("stroke-width", "2");
    expect(circle).toHaveClass(styles.spinner);
  });
});
