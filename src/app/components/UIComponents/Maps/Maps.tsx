import { MapsComponent } from "@/app/types/types";
import React from "react";

interface MapsProps {
  component: MapsComponent;
}

const Maps = ({ component }: Readonly<MapsProps>) => {
  return <div>Custom component {component.type}</div>;
};

export default Maps;
