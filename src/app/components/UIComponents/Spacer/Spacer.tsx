import { SpacerComponent } from "@/app/types/types";

interface SpacerProps {
  readonly component: SpacerComponent;
}
export default function Spacer({ component }: SpacerProps) {
  return <div style={{ height: `${component?.properties?.height}px` }} />;
}
