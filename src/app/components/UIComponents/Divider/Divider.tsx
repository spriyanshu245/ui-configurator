import { DividerComponent } from "@/app/types/types";
import styles from "./Divider.module.scss";

interface DividerProps {
  readonly component: DividerComponent;
}

const Divider = ({ component }: DividerProps) => {
  const getAlignmentClass = (align: string) => {
    switch (align) {
      case "left":
        return styles.alignLeft;
      case "right":
        return styles.alignRight;
      case "center":
        return styles.alignCenter;
      default:
        return styles.alignCenter;
    }
  };

  const formatWidth = (width: string | number) => {
    if (!width) return "100%";

    if (typeof width === "string" && width.includes("%")) {
      return width;
    }

    const numericValue = typeof width === "string" ? parseFloat(width) : width;
    return `${numericValue}%`;
  };

  const width = formatWidth(component?.properties?.width ?? 100);
  const height = component?.properties?.height ?? 1;
  const color = component?.properties?.backgroundColor?.trim() 
  ? component.properties.backgroundColor 
  : "var(--dark-gray-4)";

  const align = component?.properties?.align ?? "center";

  const containerClasses = `${styles.container} ${getAlignmentClass(align)}`;

  const dynamicStyles: React.CSSProperties = {
    height: `${height}px`,
    width: width,
  };

  if (color) {
    dynamicStyles.backgroundColor = color;
  }

  return (
    <div className={containerClasses}>
      <hr className={styles.divider} style={dynamicStyles} />
    </div>
  );
};

export default Divider;
