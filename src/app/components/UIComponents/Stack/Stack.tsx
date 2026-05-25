import { StackComponent } from "@/app/types/types";
import ComponentRenderer from "../../ComponentRenderer/ComponentRenderer";
import styles from "./Stack.module.scss";
import FormElementDropZone from "../../FormElementDropZone/FormElementDropZone";
import ComponentDropZone from "../../ComponentDropZone/ComponentDropZone";
import { useMemo } from "react";
import { useStack } from "@/app/hooks/useStack";

interface StackProps {
  component: StackComponent;
}

export default function Stack({ component }: Readonly<StackProps>) {
  const { columnGap, gridTemplateColumns, components, getDropZoneProps } =
    useStack({ component });

  const DropZoneComponent = useMemo(
    () =>
      component.category === "form" ? FormElementDropZone : ComponentDropZone,
    [component.category]
  );
  const {
    padding,
    independentPadding,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    hasFixedColumns,
    alignment,
    justification,
    direction,
  } = component.properties;

  const getStackStyles = () => {
    if (hasFixedColumns) {
      return {
        display: "grid",
        gridTemplateColumns,
        columnGap: `${columnGap}px`,
      };
    } else {
      return {
        width: "100%",
        display: "flex",
        flexDirection: direction,
        gap: `${columnGap}px`,
      };
    }
  };

  const renderDropZone = () => {
    const dropZoneProps = getDropZoneProps();
    return (
      <div
        className={styles.dropZone}
        style={{ flex: `${components.length / 10}` }}
      >
        <DropZoneComponent key="dropzone-slot" {...dropZoneProps} />
      </div>
    );
  };

  const stackStyles = getStackStyles();
  return (
    <div
      id={component.id}
      className={styles.stack}
      style={{
        ...stackStyles,
        justifyContent: justification,
        alignItems: alignment,
        padding: independentPadding
          ? `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`
          : `${padding}px`,
      }}
      data-testid={component.id}
    >
      {components.map((childComponent) => (
        <ComponentRenderer key={childComponent.id} component={childComponent} />
      ))}
      {renderDropZone()}
    </div>
  );
}
