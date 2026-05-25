"use client";
import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  SetStateAction,
  Dispatch,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { IRequestData, Microsite } from "../types/types";
import { DATA_TYPE_CONFIG } from "../utils/constants";
import { Loader } from "../components/Loader/Loader";
import { useRouter } from "next/navigation";
import { getRecord, getRecordVersions } from "../utils/dataTableUtils";
import { apiRequest } from "../services/APIService";

interface MicrositeContextType {
  microsite: Microsite;
  activePageCode?: string;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  hasChanges: boolean;
  setHasChanges: Dispatch<SetStateAction<boolean>>;
  setActivePage: (pageCode: string) => void;
  getActivePageCode: () => string;
  getPages: () => { code: string }[];
  getPageVersion: (pageCode: string) => number;
  addPage: (pageCode: string) => void;
  addNewPage: (pageCode: string) => void;
  removePage: (pageCode: string) => void;
  updateMicrositeProperties: (newProperties: Partial<Microsite>) => void;
}

const MicrositeContext = createContext<MicrositeContextType | undefined>(
  undefined
);

interface MicrositeProviderProps {
  children: ReactNode;
  code?: string;
  version?: number;
  workspaceCode?: string;
}

export const MicrositeProvider = ({
  children,
  code,
  version,
  workspaceCode,
}: MicrositeProviderProps) => {
  const router = useRouter();

  const dataConfig = DATA_TYPE_CONFIG["microsites"];
  const [isEditing, setIsEditing] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [microsite, setMicrosite] = useState<Microsite>({
    code: "",
    name: "Untitled Microsite",
    description: "",
    accessControlled: false,
    sourceSystem: "",
    firstPageCode: "",
    version: 1,
    pages: [],
  });

  const [activePageCode, setActivePageCode] = useState<string | undefined>(
    undefined
  );

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    if (code && version && !Number.isNaN(version) && workspaceCode) {
      hasFetched.current = true;
      fetchMicrosite(workspaceCode, code, version);
    }
  }, [code, version, workspaceCode]);

  const fetchMicrosite = async (
    workspaceCode: string,
    code: string,
    version: number
  ) => {
    try {
      setIsLoading(true);
      const [data, versions] = await Promise.all([
        getRecord<Microsite>(dataConfig, code, version, workspaceCode),
        getRecordVersions<Microsite>(code, dataConfig, workspaceCode),
      ]);

      if (data) {
        setMicrosite({
          ...data,
          version,
          pages: data.pages || [],
        });
        // Set active page to first page or firstPageCode
        if (data.pages && data.pages.length > 0) {
          const initialPage = data.firstPageCode
            ? data.pages.find((p) => p.pageCode === data.firstPageCode)
                ?.pageCode
            : data.pages[0].pageCode;
          setActivePageCode(initialPage ?? "");
        }
      }
      if (Array.isArray(versions)) {
        const micrositeVersion = versions.find(
          (item) => item.version === version
        );
        if (micrositeVersion) {
          setIsEditing(!micrositeVersion.published);
        }
      }
    } catch (error) {
      console.error(error);
      router.push(`/workspaces/${workspaceCode}/microsites`);
    } finally {
      setIsLoading(false);
    }
  };

  const setActivePage = (pageCode: string) => {
    setActivePageCode(pageCode);
  };

  const getActivePageCode = () =>
    microsite.pages.find((page) => page.pageCode === activePageCode)
      ?.pageCode ?? "";

  const getPages = () =>
    microsite.pages.map((page) => ({
      code: page.pageCode ?? "",
    }));

  const getPageVersion = (pageCode: string) =>
    Number(
      microsite.pages.find((page) => page.pageCode === pageCode)?.pageVersion ??
        1,
    );

  const addNewPage = (pageCode: string) => {
    addPage(pageCode);
  };

  const addPage = (pageCode: string) => {
    const isFirstPage = microsite.pages.length === 0;
    setHasChanges(true);
    setMicrosite((prev) => ({
      ...prev,
      firstPageCode: isFirstPage ? pageCode : prev.firstPageCode,
      pages: [...prev.pages, { pageCode, pageVersion: prev.version || 1 }],
    }));
    if (isFirstPage) {
      setActivePageCode(pageCode);
    }
  };

  const removePage = async (pageCode: string) => {
    if (!workspaceCode) return;
    const pageVersion = Number(
      microsite.pages.find((page) => page.pageCode === pageCode)?.pageVersion ??
        1,
    );
    try {
      const requestData: IRequestData = {
        endpoint: `/api/v1/config/pages/${pageCode}?version=${pageVersion}`,
        method: "DELETE",
        headers: {
          "workspace-code": workspaceCode,
        },
      };

      await apiRequest(requestData);

      setHasChanges(true);
      setMicrosite((prev) => {
        const remainingPages = prev.pages.filter(
          (p) => p.pageCode !== pageCode
        );
        const nextActivePage =
          activePageCode === pageCode
            ? remainingPages[0]?.pageCode
            : activePageCode;
        setActivePageCode(nextActivePage);
        return {
          ...prev,
          firstPageCode:
            prev.firstPageCode === pageCode
              ? remainingPages[0]?.pageCode
              : prev.firstPageCode,
          pages: remainingPages,
        };
      });
    } catch (error) {
      console.error("Failed to delete page:", error);
    }
  };

  const updateMicrositeProperties = (newProperties: Partial<Microsite>) => {
    setHasChanges(true);
    setMicrosite((prev) => ({
      ...prev,
      ...newProperties,
    }));
  };
  const value = useMemo(
    () => ({
      microsite,
      activePageCode,
      isEditing,
      setIsEditing,
      hasChanges,
      setHasChanges,
      setActivePage,
      getActivePageCode,
      getPages,
      getPageVersion,
      addPage,
      addNewPage,
      removePage,
      updateMicrositeProperties,
    }),
    [microsite, activePageCode, isEditing, hasChanges]
  );

  if (isLoading) {
    return <Loader />;
  }

  return (
    <MicrositeContext.Provider value={value}>
      {children}
    </MicrositeContext.Provider>
  );
};

export const useMicrosite = (): MicrositeContextType => {
  const context = useContext(MicrositeContext);
  if (!context) {
    throw new Error("useMicrosite must be used within a MicrositeProvider");
  }
  return context;
};
