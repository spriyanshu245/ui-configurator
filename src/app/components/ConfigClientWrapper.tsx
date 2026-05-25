"use client";

import { ReactNode } from "react";
import { ConfigProvider } from "@/app/context/ConfigContext";

interface ConfigClientWrapperProps {
  children: ReactNode;
}

const ConfigClientWrapper = ({ children }: ConfigClientWrapperProps) => {
  return <ConfigProvider>{children}</ConfigProvider>;
};

export default ConfigClientWrapper;
