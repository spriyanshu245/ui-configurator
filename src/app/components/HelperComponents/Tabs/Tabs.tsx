"use client";

import {
  useState,
  useCallback,
  useMemo,
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
} from "react";
import TabsContext from "./TabsContext";
import { TabsProps, TabListProps, TabPanelProps, TabProps } from "./types";
import styles from "./Tabs.module.scss";

const Tabs = ({
  children,
  defaultIndex = 0,
  selectedIndex: controlledIndex,
  onSelect,
  className,
}: TabsProps) => {
  const [internalIndex, setInternalIndex] = useState(defaultIndex);

  const isControlled = controlledIndex !== undefined;
  const selectedIndex = isControlled ? controlledIndex : internalIndex;

  const setSelectedIndex = useCallback(
    (newIndex: number) => {
      if (newIndex === selectedIndex) return;

      const shouldProceed = onSelect?.(newIndex, selectedIndex);
      if (shouldProceed === false) return;

      if (!isControlled) {
        setInternalIndex(newIndex);
      }
    },
    [selectedIndex, onSelect, isControlled]
  );

  const contextValue = useMemo(
    () => ({
      selectedIndex,
      setSelectedIndex,
    }),
    [selectedIndex, setSelectedIndex]
  );

  const processChildren = (): ReactNode => {
    let tabIdx = 0;
    let panelIdx = 0;

    return Children.map(children, (child) => {
      if (!isValidElement(child)) return child;

      const displayName = (child.type as { displayName?: string })?.displayName;

      if (displayName === "TabList") {
        const tabListChild = child as ReactElement<TabListProps>;
        const processedTabListChildren = Children.map(
          tabListChild.props.children,
          (tabChild) => {
            if (!isValidElement(tabChild)) return tabChild;
            const tabDisplayName = (tabChild.type as { displayName?: string })
              ?.displayName;
            if (tabDisplayName === "Tab") {
              const currentIndex = tabIdx;
              tabIdx += 1;
              return cloneElement(tabChild as ReactElement<TabProps>, {
                index: currentIndex,
              });
            }
            return tabChild;
          }
        );
        return cloneElement(tabListChild, {}, processedTabListChildren);
      }

      if (displayName === "TabPanel") {
        const currentIndex = panelIdx;
        panelIdx += 1;
        return cloneElement(child as ReactElement<TabPanelProps>, {
          index: currentIndex,
        });
      }

      return child;
    });
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`${styles.tabs} ${className ?? ""}`}>
        {processChildren()}
      </div>
    </TabsContext.Provider>
  );
};

export default Tabs;
