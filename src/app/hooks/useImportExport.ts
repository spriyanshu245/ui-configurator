import { useState, useRef, SetStateAction, Dispatch } from "react";
import { useHeaderV2 } from "../context/HeaderContextV2";
import { replaceIdsInJson, stripKeys } from "../utils/utils";
import { keysToRemove } from "../utils/constants";

interface UseImportExportProps {
  component?: Record<string, any>;
  setIsModalOpen?: (isOpen: boolean) => void;
}

interface UseImportExportReturn {
  importData: Record<string, any> | null;
  setImportData: Dispatch<SetStateAction<Record<string, any> | null>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleExportDslJson: () => void;
  handleImportDslJson: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => Promise<void>;
}
export const useImportExport = ({
  component,
  setIsModalOpen,
}: UseImportExportProps): UseImportExportReturn => {
  const [importData, setImportData] = useState<Record<string, any> | null>(
    null
  );
  const { setUserNotification } = useHeaderV2();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportDslJson = () => {
    let dslJson = {};
    if (component) {
      const name: string =
        component.name ??
        component.properties?.name ??
        `${component.type}-${component.id}`;
      dslJson = stripKeys(component, keysToRemove);
      const blob = new Blob([JSON.stringify({ dslJson }, null, 2)], {
        type: "application/json",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setUserNotification({
        text: `${name.replace(" ", "-")} Exported successfully`,
        time: 2000,
        type: "success",
      });
    }
  };

  const handleImportDslJson = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await file.text();
      if (typeof result === "string") {
        const parseImport = JSON.parse(result);

        const parsedData =
          parseImport?.dslJson?.code && parseImport.dslJson.slug
            ?parseImport: replaceIdsInJson(JSON.parse(result));
        if (parsedData?.dslJson) {
          setImportData(parsedData.dslJson);
          setIsModalOpen && setIsModalOpen(true);
        } else {
          throw new Error("Invalid file format");
        }
      }
    } catch (error) {
      console.log("Error in handleImportDslJson function:", error);
      setUserNotification({
        text: "Invalid file format",
        time: 3000,
        type: "error",
      });
    }

    if (event.target) {
      event.target.value = "";
    }
  };

  return {
    importData,
    fileInputRef,
    setImportData,
    handleExportDslJson,
    handleImportDslJson,
  };
};
