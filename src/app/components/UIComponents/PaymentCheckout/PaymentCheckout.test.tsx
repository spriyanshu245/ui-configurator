import React from "react";
import { render } from "@testing-library/react";
import PaymentCheckout from "./PaymentCheckout";

describe("PaymentCheckout", () => {
  it("renders a div with the correct height", () => {
    const { container } = render(<PaymentCheckout />);
    const divElement = container.firstChild as HTMLElement;
    expect(divElement).toHaveStyle("height: 20px");
  });
});
