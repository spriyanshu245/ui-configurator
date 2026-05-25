"use client";

import { createContext, useContext } from "react";
import { TabsContextValue } from "./types";

const TabsContext = createContext<TabsContextValue | null>(null);

export const useTabsContext = (): TabsContextValue => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs compound components must be used within <Tabs>");
  }
  return context;
};

export default TabsContext;
