import { HeadingComponent } from "@/app/types/types";
import React from "react";

interface HeadingProps {
  readonly component: HeadingComponent;
}

export default function Heading({ component }: HeadingProps) {
  const level = component.properties?.level ?? 1;
  const text = component.properties?.text ?? "Heading";
  const textAlign = component.properties?.textAlign ?? "left";
  const textColor = component.properties?.textColor ?? "#000000";
  const width = component.properties?.width
    ? `${component.properties.width}%`
    : "100%";

  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

  return (
    <HeadingTag
      id={component.id}
      style={{ textAlign: textAlign, color: textColor, width: width }}
    >
      {text}
    </HeadingTag>
  );
}
