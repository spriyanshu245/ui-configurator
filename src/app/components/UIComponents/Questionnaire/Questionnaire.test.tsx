import React from "react";
import { render } from "@testing-library/react";
import Questionnaire from "./Questionnaire";

describe("Questionnaire", () => {
  it("renders a div with the correct height", () => {
    const { container } = render(<Questionnaire />);
    const divElement = container.firstChild as HTMLElement;
    expect(divElement).toHaveStyle("height: 20px");
  });
});
