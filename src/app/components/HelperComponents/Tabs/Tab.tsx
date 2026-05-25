"use client";

import { useCallback } from "react";
import { useTabsContext } from "./TabsContext";
import { TabProps } from "./types";
import styles from "./Tabs.module.scss";

const Tab = ({
  children,
  disabled = false,
  className,
  selectedClassName,
  disabledClassName,
  index = 0,
}: TabProps) => {
  const { selectedIndex, setSelectedIndex } = useTabsContext();

  const isSelected = index === selectedIndex;

  const handleClick = useCallback(() => {
    if (!disabled) {
      setSelectedIndex(index);
    }
  }, [disabled, index, setSelectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const classNames = [
    styles.tab,
    className ?? "",
    isSelected ? selectedClassName ?? styles.active : "",
    disabled ? disabledClassName ?? styles.disabled : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-disabled={disabled}
      tabIndex={isSelected ? 0 : -1}
      className={classNames}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

Tab.displayName = "Tab";

export default Tab;
