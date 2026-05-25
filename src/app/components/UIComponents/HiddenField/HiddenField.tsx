"use client";
import { HiddenFieldComponent } from "@/app/types/types";

interface HiddenFieldProps {
  component: HiddenFieldComponent;
}

export default function HiddenField({ component }: Readonly<HiddenFieldProps>) {

  return (
    <div
      id={component.id}
      key={component.id}
      data-testid="hidden-field"
    />
  );
}
