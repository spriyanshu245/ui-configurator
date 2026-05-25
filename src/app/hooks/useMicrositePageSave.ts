import { IRequestData, Microsite } from "../types/types";
import { useMicrosite } from "../context/MicrositeContext";
import { useUserTask } from "../context/UserTaskContext";
import { DATA_TYPE_CONFIG } from "../utils/constants";
import { useParams } from "next/navigation";
import { apiRequest } from "../services/APIService";
import { saveMicrosite } from "../utils/userTask/userTaskUtils";
import { useControlPanel } from "../context/ControlPanelContext";
import { useHeaderV2 } from "../context/HeaderContextV2";

const useMicrositePageSave = () => {
  const dataConfig = DATA_TYPE_CONFIG["microsites"];
  const pageConfig = DATA_TYPE_CONFIG["pages"];
  const {
    activePageCode,
    isEditing,
    hasChanges,
    microsite,
    setHasChanges,
    updateMicrositeProperties,
    getPageVersion,
  } = useMicrosite();
  const { userTask, setHasPageChanges, hasPageChanges } = useUserTask();
  const { setUserNotification } = useHeaderV2();

  const { micrositeUrlSlug, version, workspaceCode } = useParams();
  const { setIsAutoSaveInProgress, setIsSaveSuccessful } = useControlPanel();

  type HandleMicrositeSaveOptions = {
    micrositeOverride?: Microsite;
    forceMicrositeSave?: boolean;
    throwOnError?: boolean;
  };

  const handlePageSave = async () => {
    if (!isEditing || !hasPageChanges) return true;
    try {
      const requestData: IRequestData = {
        endpoint: `${pageConfig.endpoint}/${activePageCode}?version=${getPageVersion(
          activePageCode ?? "",
        )}`,
        method: "PUT",
        headers: { "workspace-code": workspaceCode as string },
        body: userTask,
      };
      await apiRequest(requestData);
      setHasPageChanges(false);
      return true;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const handleMicrositeSave = async (
    options: HandleMicrositeSaveOptions = {},
  ) => {
    const {
      micrositeOverride,
      forceMicrositeSave = false,
      throwOnError = false,
    } = options;
    const shouldSaveMicrosite = forceMicrositeSave || hasChanges;

    if (!isEditing || (!shouldSaveMicrosite && !hasPageChanges)) return true;
    setIsAutoSaveInProgress(true);
    setIsSaveSuccessful(false);

    try {
      await handlePageSave();
      if (shouldSaveMicrosite) {
        const requestData: IRequestData = {
          endpoint: `${
            dataConfig.endpoint
          }/${micrositeUrlSlug}?version=${version?.toString()?.substring(1)}`,
          method: "PUT",
          headers: { "workspace-code": workspaceCode as string },
          body: saveMicrosite(micrositeOverride ?? microsite),
        };
        const apiResponse = await apiRequest(requestData);
        if (apiResponse?.micrositeData?.updatedOn) {
          updateMicrositeProperties({
            lastUpdatedOn: apiResponse.micrositeData.updatedOn,
          });
        }

        setHasChanges(false);
      }
      setIsSaveSuccessful(true);
      setUserNotification({
        text: "Saved",
        time: 2000,
        type: "success",
      });
      return true;
    } catch (error) {
      setIsSaveSuccessful(false);
      setUserNotification({
        text: (error as any)?.message ?? "Invalid DSL JSON",
        time: 7000,
        type: "error",
      });
      if (throwOnError) {
        throw error;
      }
      return false;
    } finally {
      setIsAutoSaveInProgress(false);
    }
  };
  return {
    handlePageSave,
    handleMicrositeSave,
  };
};

export default useMicrositePageSave;
