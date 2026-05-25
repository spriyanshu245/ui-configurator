"use client";

import { TabListProps } from "./types";
import styles from "./Tabs.module.scss";

const TabList = ({ children, className }: TabListProps) => {
  return (
    <div className={`${styles.tabList} ${className ?? ""}`} role="tablist">
      {children}
    </div>
  );
};

TabList.displayName = "TabList";

export default TabList;
