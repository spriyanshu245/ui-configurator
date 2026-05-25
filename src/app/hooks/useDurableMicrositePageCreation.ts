"use client";

import { useParams } from "next/navigation";

import { useMicrosite } from "../context/MicrositeContext";
import { apiRequest } from "../services/APIService";
import { IRequestData, Microsite } from "../types/types";
import { DATA_TYPE_CONFIG } from "../utils/constants";
import useMicrositePageSave from "./useMicrositePageSave";

const useDurableMicrositePageCreation = () => {
  const {
    microsite,
    activePageCode,
    hasChanges,
    addNewPage,
    setActivePage,
    setHasChanges,
    updateMicrositeProperties,
  } = useMicrosite();
  const { handleMicrositeSave } = useMicrositePageSave();
  const { workspaceCode } = useParams();
  const pageConfig = DATA_TYPE_CONFIG["pages"];

  const persistCreatedPage = async (createdPageCode: string) => {
    const previousMicrosite: Microsite = {
      ...microsite,
      pages: [...(microsite.pages ?? [])],
    };
    const previousActivePageCode = activePageCode;
    const previousHasChanges = hasChanges;
    const pageVersion = Number(microsite.version || 1);
    const isFirstPage = previousMicrosite.pages.length === 0;
    const nextMicrosite: Microsite = {
      ...previousMicrosite,
      pages: [
        ...previousMicrosite.pages,
        { pageCode: createdPageCode, pageVersion },
      ],
      firstPageCode: isFirstPage
        ? createdPageCode
        : previousMicrosite.firstPageCode,
    };

    addNewPage(createdPageCode);

    try {
      await handleMicrositeSave({
        micrositeOverride: nextMicrosite,
        forceMicrositeSave: true,
        throwOnError: true,
      });
    } catch (error) {
      updateMicrositeProperties({
        pages: previousMicrosite.pages,
        firstPageCode: previousMicrosite.firstPageCode,
      });
      setActivePage(previousActivePageCode ?? "");
      setHasChanges(previousHasChanges);

      try {
        const requestData: IRequestData = {
          endpoint: `${pageConfig.endpoint}/${createdPageCode}?version=${pageVersion}`,
          method: "DELETE",
          headers: {
            "workspace-code": workspaceCode as string,
          },
        };
        await apiRequest(requestData);
      } catch (cleanupError) {
        const saveErrorMessage =
          error instanceof Error
            ? error.message
            : "Failed to save microsite after creating the page.";
        const cleanupErrorMessage =
          cleanupError instanceof Error
            ? cleanupError.message
            : "Failed to rollback the created page.";
        throw new Error(
          `${saveErrorMessage} Cleanup also failed: ${cleanupErrorMessage}`,
        );
      }

      throw error;
    }
  };

  return {
    persistCreatedPage,
  };
};

export default useDurableMicrositePageCreation;
