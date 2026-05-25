import React from "react";
import { render, screen } from "@testing-library/react";
import RoutePlan from "./RoutePlan";
import "@testing-library/jest-dom";

import { RoutePlanComponent } from "../../../../app/types/types";

// Base mock component
const baseComponent: RoutePlanComponent = {
  id: "route1",
  type: "route-plan",
  category: "component",
  properties: {
    namePathKey: "",
    pathToArray: "",
    addressPathKey: "",
    latitudePathKey: "",
    longitudePathKey: "",
  },
};

describe("RoutePlan Component", () => {
  test("renders component type correctly", () => {
    render(<RoutePlan component={baseComponent} />);

    expect(screen.getByText("Custom component route-plan")).toBeInTheDocument();
  });

  test("renders correctly when type changes", () => {
    const component = {
      ...baseComponent,
      type: "optimized-route",
    };

    render(<RoutePlan component={component} />);

    expect(
      screen.getByText("Custom component optimized-route"),
    ).toBeInTheDocument();
  });

  test("renders without crashing when properties are undefined", () => {
    const component = {
      ...baseComponent,
      properties: undefined,
    };

    render(<RoutePlan component={component} />);

    expect(screen.getByText(/Custom component/i)).toBeInTheDocument();
  });
});
