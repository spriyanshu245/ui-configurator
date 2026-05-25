import { ComponentType } from "react";
import PlaceholderIcon from "@/app/components/SVGIcons/ComponentIcons/Placeholder";
import { componentPaneIconMap } from "@/app/data/componentPaneIconMap";

export const getComponentRendererIcon = (type: string): ComponentType => {
  return componentPaneIconMap[type] ?? PlaceholderIcon;
};
