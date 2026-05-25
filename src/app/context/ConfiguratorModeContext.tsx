"use client";
import React, { createContext, useContext, ReactNode, useMemo } from "react";

type ConfiguratorMode = "microsite" | "page";

interface ConfiguratorModeContextType {
  mode: ConfiguratorMode;
}

const ConfiguratorModeContext = createContext<
  ConfiguratorModeContextType | undefined
>(undefined);

interface ConfiguratorModeProviderProps {
  children: ReactNode;
  mode: ConfiguratorMode;
}

export function ConfiguratorModeProvider({
  children,
  mode,
}: Readonly<ConfiguratorModeProviderProps>) {
  const value = useMemo(() => ({ mode }), [mode]);

  return (
    <ConfiguratorModeContext.Provider value={value}>
      {children}
    </ConfiguratorModeContext.Provider>
  );
}

export function useConfiguratorMode() {
  const context = useContext(ConfiguratorModeContext);
  if (!context) {
    throw new Error(
      "useConfiguratorMode must be used within a ConfiguratorModeProvider"
    );
  }
  return context;
}
