import { render, screen } from "@testing-library/react";
import HiddenField from "./HiddenField";
import { HiddenFieldComponent } from "../../..//types/types";

const baseComponent: HiddenFieldComponent = {
  id: "hidden-1",
  type: 'hidden-field',
  category: "form",
  properties: {},
};

describe("HiddenField Component", () => {
  it("renders a div with the correct id", () => {
    render(<HiddenField component={baseComponent} />);
    const divElement = screen.getByTestId("hidden-field");
    expect(divElement).toBeInTheDocument();
    expect(divElement).toHaveAttribute("id", "hidden-1");
  });
});
