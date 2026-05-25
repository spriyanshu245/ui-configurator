import { render, screen } from "@testing-library/react";
import Stepper from "./Stepper";
import { StepperComponent } from "@/app/types/types";
import "@testing-library/jest-dom";

describe("Stepper Component", () => {
  const baseComponent: StepperComponent = {
    id: "stepper-1",
    name: "testStepper",
    type: "stepper",
    category: "component",
    properties: {},
  };

  it("renders the stepper container with correct id", () => {
    const { container } = render(<Stepper component={baseComponent} />);
    const stepperEl = container.querySelector("#stepper-1");
    expect(stepperEl).toBeInTheDocument();
  });

  it("renders exactly three preview steps", () => {
    render(<Stepper component={baseComponent} />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
  });

  it("renders description text for each step", () => {
    render(<Stepper component={baseComponent} />);
    const descriptions = screen.getAllByText("Configure via properties panel");
    expect(descriptions).toHaveLength(3);
  });

  it("renders SVG icons for all three steps", () => {
    const { container } = render(<Stepper component={baseComponent} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(3);
  });

  it("renders connector lines for non-last steps only", () => {
    const { container } = render(<Stepper component={baseComponent} />);
    const connectors = container.querySelectorAll("[class*='connector']");
    expect(connectors).toHaveLength(2);
  });

  it("applies completed connector style to the first connector", () => {
    const { container } = render(<Stepper component={baseComponent} />);
    const connectors = container.querySelectorAll("[class*='connector']");
    expect(connectors[0].className).toContain("connectorCompleted");
  });

  it("does not apply completed connector style to the second connector", () => {
    const { container } = render(<Stepper component={baseComponent} />);
    const connectors = container.querySelectorAll("[class*='connector']");
    expect(connectors[1].className).not.toContain("connectorCompleted");
  });

  it("applies contentLast class only to the last step", () => {
    const { container } = render(<Stepper component={baseComponent} />);
    const contentDivs = container.querySelectorAll("[class*='content']");
    const lastContent = contentDivs[contentDivs.length - 1];
    expect(lastContent.className).toContain("contentLast");
  });

  it("does not apply contentLast class to non-last steps", () => {
    const { container } = render(<Stepper component={baseComponent} />);
    const contentDivs = container.querySelectorAll("[class*='content']");
    for (let i = 0; i < contentDivs.length - 1; i++) {
      expect(contentDivs[i].className).not.toContain("contentLast");
    }
  });
});
