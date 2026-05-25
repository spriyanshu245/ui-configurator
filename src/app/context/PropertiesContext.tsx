"use client";

import { ReactNode, useState, useContext, createContext, useMemo } from "react";

export interface PropertyPaneContextType {
  isPropertyPaneVisible: boolean;
  propertyComponentId: string | null;
  propertyPageCode: string | null;
  setActiveComponent: (componentId: string) => void;
  togglePropertyPane: () => void;
  resetActiveComponent: () => void;
  setActivePage: (pageId: string) => void;
  resetActivePage: () => void;
  togglePanel?: (panelId: string) => void;
  isPanelOpen?: (panelId: string) => boolean;
}

const PropertyPaneContext = createContext<PropertyPaneContextType | undefined>(
  undefined
);

export { PropertyPaneContext as PropertiesContext };
interface PropertyPaneProviderProps {
  children: ReactNode;
}

export const PropertyPaneProvider = ({
  children,
}: PropertyPaneProviderProps) => {
  const [isPropertyPaneVisible, setIsPropertyPaneVisible] = useState(false);
  const [propertyComponentId, setPropertyComponentId] = useState<string | null>(
    null
  );

  const [propertyPageCode, setPropertyPageCode] = useState<string | null>(null);

  const [openPanels, setOpenPanels] = useState<string[]>([]);

  const openPanel = (panelId: string) => {
    setOpenPanels([...openPanels, panelId]);
  };

  const closePanel = (panelId: string) => {
    const newPanels = openPanels.filter((panel) => panel !== panelId);
    setOpenPanels(newPanels);
  };

  const togglePanel = (panelId: string) => {
    if (openPanels.includes(panelId)) {
      closePanel(panelId);
    } else {
      openPanel(panelId);
    }
  };

  const isPanelOpen = (panelId: string) => openPanels.includes(panelId);

  const togglePropertyPane = () => {
    if (!isPropertyPaneVisible) resetActiveComponent();
    setIsPropertyPaneVisible(!isPropertyPaneVisible);
  };

  const setActiveComponent = (componentId: string) => {
    if (!componentId.trim()) {
      return;
    }
    setPropertyPageCode(null);
    setPropertyComponentId(componentId);
    setIsPropertyPaneVisible(true);
  };

  const resetActiveComponent = () => {
    setPropertyComponentId(null);
    setIsPropertyPaneVisible(false);
  };

  const setActivePage = (pageCode: string) => {
    setPropertyComponentId(null);
    setPropertyPageCode(pageCode);
    setIsPropertyPaneVisible(true);
  };

  const resetActivePage = () => {
    setPropertyPageCode(null);
    setIsPropertyPaneVisible(false);
  };

  const propertiesContext = useMemo(
    () => ({
      isPropertyPaneVisible,
      propertyComponentId,
      propertyPageCode,
      setActiveComponent,
      resetActiveComponent,
      setActivePage,
      resetActivePage,
      togglePropertyPane,
      togglePanel,
      isPanelOpen,
    }),
    [
      isPropertyPaneVisible,
      propertyComponentId,
      propertyPageCode,
      togglePropertyPane,
      togglePanel,
      isPanelOpen,
    ]
  );

  return (
    <PropertyPaneContext.Provider value={propertiesContext}>
      {children}
    </PropertyPaneContext.Provider>
  );
};

export const usePropertyPane = (): PropertyPaneContextType => {
  const context = useContext(PropertyPaneContext);
  if (!context) {
    throw new Error(
      "usePropertyPane must be used within a PropertyPaneProvider"
    );
  }
  return context;
};
