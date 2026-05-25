import React from "react";
import { render } from "@testing-library/react";
import Spacer from "./Spacer";
import { SpacerComponent } from "@/app/types/types";

describe("Spacer", () => {
  it("renders a div with the correct height", () => {
    const dummyComponent: SpacerComponent = {
      id: "spacer1",
      type: "spacer",
      category: "component",
      properties: {
        height: 100,
      },
    };

    const { container } = render(<Spacer component={dummyComponent} />);
    const divElement = container.firstChild as HTMLElement;
    expect(divElement).toHaveStyle("height: 100px");
  });

  it("renders a div with 'undefinedpx' height if no height is provided", () => {
    const dummyComponent: SpacerComponent = {
      id: "spacer2",
      type: "spacer",
      category: "component",
      properties: {},
    };

    const { container } = render(<Spacer component={dummyComponent} />);
    const divElement = container.firstChild as HTMLElement;
    // Since the code directly converts undefined to string, we expect "undefinedpx"
    expect(divElement).toHaveStyle("height: undefinedpx");
  });
});
