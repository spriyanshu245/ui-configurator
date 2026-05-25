"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";

export interface UserNotificationV2 {
  type: "success" | "error" | "info";
  text: string;
  time: number;
}

interface HeaderContextV2Type {
  userNotification: UserNotificationV2 | null;
  setUserNotification: React.Dispatch<
    React.SetStateAction<UserNotificationV2 | null>
  >;
  pageTitle: string;
  setPageTitle: React.Dispatch<React.SetStateAction<string>>;
  pageSubTitle: string;
  setPageSubTitle: React.Dispatch<React.SetStateAction<string>>;
  resourceCode: string;
  setResourceCode: React.Dispatch<React.SetStateAction<string>>;
  resourceMetadata: string;
  setResourceMetadata: React.Dispatch<React.SetStateAction<string>>;
  resourceStatus: string;
  setResourceStatus: React.Dispatch<React.SetStateAction<string>>;
  resourceVersion: string;
  setResourceVersion: React.Dispatch<React.SetStateAction<string>>;
  backRoute: string;
  setBackRoute: React.Dispatch<React.SetStateAction<string>>;
  showCloseIcon: boolean;
  setShowCloseIcon: React.Dispatch<React.SetStateAction<boolean>>;
  resetResourceData: () => void;
}

const HeaderContextV2 = createContext<HeaderContextV2Type | undefined>(
  undefined,
);

interface HeaderProviderV2Props {
  children: ReactNode;
}

export const HeaderProviderV2 = ({ children }: HeaderProviderV2Props) => {
  const [userNotification, setUserNotification] =
    useState<UserNotificationV2 | null>(null);
  const [pageTitle, setPageTitle] = useState<string>("");
  const [pageSubTitle, setPageSubTitle] = useState<string>("");
  const [resourceCode, setResourceCode] = useState<string>("");
  const [resourceMetadata, setResourceMetadata] = useState<string>("");
  const [resourceStatus, setResourceStatus] = useState<string>("");
  const [resourceVersion, setResourceVersion] = useState<string>("");
  const [backRoute, setBackRoute] = useState<string>("/");
  const [showCloseIcon, setShowCloseIcon] = useState<boolean>(false);

  const resetResourceData = useCallback(() => {
    setResourceCode("");
    setResourceMetadata("");
    setResourceStatus("");
    setResourceVersion("");
  }, []);

  const value = React.useMemo(
    () => ({
      userNotification,
      setUserNotification,
      pageTitle,
      setPageTitle,
      pageSubTitle,
      setPageSubTitle,
      resourceCode,
      setResourceCode,
      resourceMetadata,
      setResourceMetadata,
      resourceStatus,
      setResourceStatus,
      resourceVersion,
      setResourceVersion,
      backRoute,
      setBackRoute,
      showCloseIcon,
      setShowCloseIcon,
      resetResourceData,
    }),
    [
      userNotification,
      pageTitle,
      pageSubTitle,
      resourceCode,
      resourceMetadata,
      resourceStatus,
      resourceVersion,
      backRoute,
      showCloseIcon,
      resetResourceData,
    ],
  );

  return (
    <HeaderContextV2.Provider value={value}>
      {children}
    </HeaderContextV2.Provider>
  );
};

export const useHeaderV2 = (): HeaderContextV2Type => {
  const context = useContext(HeaderContextV2);
  if (!context) {
    throw new Error("useHeaderV2 must be used within a HeaderProviderV2");
  }
  return context;
};
