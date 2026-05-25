import { RoutePlanComponent } from "@/app/types/types";
import React from "react";

interface RoutePlanProps {
  component: RoutePlanComponent;
}

const RoutePlan = ({ component }: Readonly<RoutePlanProps>) => {
  return <div>Custom component {component.type}</div>;
};

export default RoutePlan;
