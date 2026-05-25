"use client";
import styles from "./ComponentItem.module.scss";
import { BuilderComponent } from "@/app/types/types";
import { componentIcons } from "@/app/data/componentIcons";
import Tooltip from "../../Tooltip/Tooltip";
import { useDraggableBuilderComponent } from "@/app/hooks/useDraggableBuilderComponent";

interface ComponentItemProps {
  component: BuilderComponent;
  isFormFound?: boolean;
}

export default function ComponentItem({
  component,
  isFormFound,
}: Readonly<ComponentItemProps>) {
  const {
    disableExternalIntegration,
    draggable,
    handleDragEnd,
    handleDragStart,
    showTooltip,
    tooltipText,
  } = useDraggableBuilderComponent({
    component,
    isFormFound,
    ghostClassName: styles.ghost,
  });

  return (
    <div
      role="presentation"
      className={`${styles.componentItem} ${
        !draggable ? styles.disable : ""
      } ${disableExternalIntegration ? styles.disable : ""}`}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Tooltip text={tooltipText} visibilityCondition={showTooltip}>
        {(() => {
          if (
            !componentIcons.filter((icon) => icon.type === component.type)[0]
          ) {
            return (
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    componentIcons.filter(
                      (icon) => icon.type === "placeholder"
                    )[0].svgCode || "",
                }}
                className={styles.componentItemIcon}
              ></div>
            );
          } else {
            return (
              <div className={styles.componentItemIcon}>
                <div className={styles.outerIconBackground}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        componentIcons.filter(
                          (icon) => icon.type === component.type
                        )[0]?.svgCode || "",
                    }}
                    className={styles.innerIcon}
                  ></div>
                </div>
              </div>
            );
          }
        })()}
        <div className={styles.componentItemLabel}>{component.displayName}</div>
      </Tooltip>
    </div>
  );
}
