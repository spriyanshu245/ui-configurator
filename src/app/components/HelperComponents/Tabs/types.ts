import { ReactNode } from "react";

export interface TabsProps {
  children: ReactNode;
  defaultIndex?: number;
  selectedIndex?: number;
  onSelect?: (index: number, lastIndex: number) => boolean | void;
  className?: string;
}

export interface TabListProps {
  children: ReactNode;
  className?: string;
}

export interface TabProps {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  selectedClassName?: string;
  disabledClassName?: string;
  index?: number;
}

export interface TabPanelProps {
  children: ReactNode;
  className?: string;
  forceRender?: boolean;
  selectedClassName?: string;
  index?: number;
}

export interface TabsContextValue {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}
