import React from "react";
import styles from "./Tabs.module.scss";

interface TabProps {
  children: React.ReactNode;
}

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  activeTab: number;
}

export const Tabs: React.FC<TabProps> = ({ children }) => {
  return <div className={styles.tabs}>{children}</div>;
};

export const TabList: React.FC<TabProps> = ({ children }) => {
  return <div className={styles.tabList}>{children}</div>;
};

export const Tab: React.FC<{
  index: number;
  setActiveTab: (index: number) => void;
  activeTab: number;
  children: React.ReactNode;
}> = ({ index, setActiveTab, activeTab, children }) => {
  return (
    <button
      className={`${styles.tab} ${activeTab === index ? styles.active : ""}`}
      onClick={() => setActiveTab(index)}
    >
      {children}
    </button>
  );
};

export const TabPanels: React.FC<TabProps> = ({ children }) => {
  return <div className={styles.tabPanels}>{children}</div>;
};

export const TabPanel: React.FC<TabPanelProps> = ({
  children,
  index,
  activeTab,
}) => {
  return activeTab === index ? (
    <div className={styles.tabPanel}>{children}</div>
  ) : null;
};
