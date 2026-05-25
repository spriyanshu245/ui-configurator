import React from "react";
import { render, screen } from "@testing-library/react";
import Maps from "./Maps";
import "@testing-library/jest-dom";

import { MapsComponent } from "../../../../app/types/types";

// Sample base component
const baseComponent: MapsComponent = {
  id: "maps1",
  type: "maps",
  category: "component",
  properties: {},
};

describe("Maps Component", () => {
  test("renders component type correctly", () => {
    render(<Maps component={baseComponent} />);

    expect(screen.getByText("Custom component maps")).toBeInTheDocument();
  });

  test("renders correctly when type changes", () => {
    const component = {
      ...baseComponent,
      type: "google-maps",
    };

    render(<Maps component={component} />);

    expect(
      screen.getByText("Custom component google-maps"),
    ).toBeInTheDocument();
  });

  test("renders without crashing when properties are empty", () => {
    const component = {
      ...baseComponent,
      properties: undefined,
    };

    render(<Maps component={component} />);

    expect(screen.getByText(/Custom component/i)).toBeInTheDocument();
  });
});
