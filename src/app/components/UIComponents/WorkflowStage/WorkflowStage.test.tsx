import React from "react";
import { render } from "@testing-library/react";
import WorkflowStage from "./WorkflowStage";

describe("WorkflowStage", () => {
  it("renders a div with the correct height", () => {
    const { container } = render(<WorkflowStage />);
    const divElement = container.firstChild as HTMLElement;
    expect(divElement).toHaveStyle("height: 20px");
  });
});
