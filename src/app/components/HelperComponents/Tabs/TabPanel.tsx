"use client";

import { useTabsContext } from "./TabsContext";
import { TabPanelProps } from "./types";
import styles from "./Tabs.module.scss";

const TabPanel = ({
  children,
  className,
  forceRender = false,
  selectedClassName,
  index = 0,
}: TabPanelProps) => {
  const { selectedIndex } = useTabsContext();

  const isSelected = index === selectedIndex;

  if (!isSelected && !forceRender) {
    return null;
  }

  const classNames = [
    styles.tabPanel,
    className ?? "",
    isSelected ? selectedClassName ?? styles.selected : "",
    !isSelected && forceRender ? styles.hidden : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="tabpanel"
      className={classNames}
      hidden={!isSelected && forceRender}
    >
      {children}
    </div>
  );
};

TabPanel.displayName = "TabPanel";

export default TabPanel;
