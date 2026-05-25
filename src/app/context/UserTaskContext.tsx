"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  SetStateAction,
  useCallback,
  useEffect,
  Dispatch,
} from "react";
import {
  UserTask,
  UIComponent,
  ComponentGroup,
  BaseComponent,
  FormsNameKeys,
  IRequestData,
} from "../types/types";
import { useUserTaskComponentActions } from "../hooks/useUserTaskComponentActions";
import { getAllFormsNameKeys } from "../utils/formsUtils";
import { DATA_TYPE_CONFIG } from "../utils/constants";
import { apiRequest } from "../services/APIService";
import { useParams } from "next/navigation";
import { useMicrosite } from "./MicrositeContext";

interface UserTaskContextType {
  userTask: UserTask | undefined;
  isLoading: boolean;
  hasPageChanges: boolean;
  setHasPageChanges: Dispatch<SetStateAction<boolean>>;
  addComponent: (component: UIComponent, componentId: string) => void;
  addComponentAtIndex: (
    component: UIComponent,
    componentId: string,
    index: number,
  ) => void;
  moveComponentToIndex: (
    componentId: string,
    targetComponentId: string,
    targetIndex: number,
  ) => void;
  addComponentToComponent: (
    parentComponentId: string,
    newComponent: UIComponent,
    index: number,
  ) => void;
  updateComponentProperties: (
    componentId: string,
    keyOrProperties: string | { [key: string]: any },
    value?: any,
    isOuterUpdate?: boolean,
  ) => void;
  getComponentById: (componentId: string) => BaseComponent | null;
  removeComponent: (componentId: string) => void;
  importComponent: ({
    importData,
    componentId,
  }: {
    importData: UIComponent;
    componentId: string;
  }) => void;
  pageCode: string;
  moveComponent: (
    componentId: string,
    targetParentId: string,
    targetIndex: number,
  ) => void;
  updateUserTask: (value: SetStateAction<UserTask>) => void;
  formsNamekeys: FormsNameKeys;
  setFormsNamekeys: (value: SetStateAction<FormsNameKeys>) => void;
  tablesNameKeys: FormsNameKeys;
  setTablesNameKeys: (value: SetStateAction<FormsNameKeys>) => void;
  getPageDSL: (pagecode: string) => Promise<UserTask | undefined>;
}

export const UserTaskContext = createContext<UserTaskContextType | undefined>(
  undefined,
);

interface UserTaskProviderProps {
  children: ReactNode;
  pageCode?: string;
  version?: number;
}

export const UserTaskProvider = ({
  children,
  pageCode: initialPageCode,
  version = 1,
}: UserTaskProviderProps) => {
  const [userTask, setUserTask] = useState<UserTask | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [pageCode, setPageCode] = useState<string>(initialPageCode ?? "");
  const dataConfig = DATA_TYPE_CONFIG["pages"];
  const [hasPageChanges, setHasPageChanges] = useState<boolean>(false);
  const { workspaceCode } = useParams();

  const { activePageCode, microsite } = useMicrosite();

  const [formsNamekeys, setFormsNamekeys] = useState<FormsNameKeys>({});
  const [tablesNameKeys, setTablesNameKeys] = useState<FormsNameKeys>({});

  const getPageDSL = async (
    pageCode: string,
  ): Promise<UserTask | undefined> => {
    if (!pageCode || !workspaceCode) {
      console.log("Skipping fetch: missing pageCode, config, or workspaceCode");
      return;
    }

    const pageVersion = Number(
      microsite.pages.find((page) => page.pageCode === pageCode)?.pageVersion ?? version,
    );

    try {
      const requestData: IRequestData = {
        endpoint: `${dataConfig.endpoint}/${pageCode}?version=${pageVersion}`,
        method: "GET",
        headers: { "workspace-code": workspaceCode as string },
      };
      const apiResponse = await apiRequest(requestData);
      return apiResponse;
    } catch (error) {
      console.error("Failed to fetch page:", error);
      return;
    }
  };

  const getPage = async (pageCode: string) => {
    try {
      setIsLoading(true);
      const pageDsl = await getPageDSL(pageCode);
      if (pageDsl) {
        setUserTask(pageDsl);
        setPageCode(pageCode);
        const nameKeys = getAllFormsNameKeys(pageDsl);
        setFormsNamekeys(nameKeys.formsNameKeys);
        setTablesNameKeys(nameKeys.tablesNameKeys);
      }
    } catch (error) {
      console.error("Failed to fetch page:", error);
      setUserTask(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activePageCode) {
      getPage(activePageCode);
    } else if (!activePageCode) {
      setUserTask(undefined);
      setPageCode("");
    }
  }, [activePageCode, workspaceCode, version, microsite.pages]);

  useEffect(() => {
    if (userTask) {
      const nameKeys = getAllFormsNameKeys(userTask);
      setFormsNamekeys(nameKeys.formsNameKeys);
      setTablesNameKeys(nameKeys.tablesNameKeys);
    }
  }, [pageCode]);

  const updateUserTask = useCallback(
    (value: SetStateAction<UserTask>) => {
      if (!userTask) return;
      setUserTask((prevUserTask) => {
        if (!prevUserTask) return prevUserTask;
        return typeof value === "function" ? value(prevUserTask) : value;
      });
      setHasPageChanges(true);
    },
    [userTask],
  );

  const {
    addComponent,
    addComponentAtIndex,
    removeComponent,
    moveComponentToIndex,
    addComponentToComponent,
    updateComponentProperties,
    moveComponent,
    importComponent,
  } = useUserTaskComponentActions(updateUserTask);

  const getComponentById = (componentId: string): BaseComponent | null => {
    const searchComponents = (
      components: BaseComponent[] | undefined,
    ): BaseComponent | null => {
      if (!components) return null;
      for (const component of components) {
        if (component.id === componentId) {
          return component;
        }
        if ((component as ComponentGroup).components) {
          const found = searchComponents(
            (component as ComponentGroup).components,
          );
          if (found) return found;
        }
      }
      return null;
    };

    return searchComponents(userTask?.components);
  };

  const contextValue = useMemo(
    () => ({
      userTask,
      isLoading,
      hasPageChanges,
      setHasPageChanges,
      addComponent,
      addComponentAtIndex,
      moveComponentToIndex,
      addComponentToComponent,
      updateComponentProperties,
      getComponentById,
      removeComponent,
      importComponent,
      pageCode,
      moveComponent,
      updateUserTask,
      formsNamekeys,
      setFormsNamekeys,
      tablesNameKeys,
      setTablesNameKeys,
      getPageDSL,
    }),
    [
      userTask,
      isLoading,
      formsNamekeys,
      tablesNameKeys,
      pageCode,
      hasPageChanges,
    ],
  );

  return (
    <UserTaskContext.Provider value={contextValue}>
      {children}
    </UserTaskContext.Provider>
  );
};

export const useUserTask = (): UserTaskContextType => {
  const context = useContext(UserTaskContext);
  if (!context) {
    throw new Error("useUserTask must be used within a UserTaskProvider");
  }
  return context;
};
