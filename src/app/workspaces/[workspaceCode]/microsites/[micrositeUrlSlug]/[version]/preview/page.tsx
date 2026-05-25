"use client";
import { useCallback, useEffect, useState } from "react";
import PreviewWindow from "@/app/components/PreviewWindow/PreviewWindow";
import { apiRequest } from "@/app/services/APIService";
import { IRequestData, Microsite } from "@/app/types/types";
import { useParams } from "next/navigation";
import { DATA_TYPE_CONFIG } from "@/app/utils/constants";

const PreviewPage = () => {
  const dataConfig = DATA_TYPE_CONFIG["microsites"];

  const [micrositeResponse, setMicrositeResponse] = useState<Microsite>();

  const { micrositeUrlSlug, version, workspaceCode } = useParams();

  const getMicrositePage = useCallback(
    async (workspaceCode: string, micrositeSlug: string, version: string) => {
      try {
        const requestData: IRequestData = {
          endpoint: `${dataConfig.endpoint}/${micrositeSlug}?version=${version
            ?.toString()
            ?.substring(1)}`,
          method: "GET",
          headers: { "workspace-code": workspaceCode },
        };
        const response: Microsite = await apiRequest(requestData);
        if (response) {
          const newMicrosite = {
            ...response,
            pages: response.pages,
          };
          setMicrositeResponse(newMicrosite);
        }

        return response;
      } catch (error: unknown) {
        console.error("Failed to fetch microsite page:", error);
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    (async () => {
      if (micrositeUrlSlug && version) {
        setMicrositeResponse(undefined);
        await getMicrositePage(
          workspaceCode as string,
          micrositeUrlSlug as string,
          version as string,
        );
      }
    })();
  }, [micrositeUrlSlug, version, getMicrositePage]);

  if (!micrositeResponse) {
    return <div>Loading microsite...</div>;
  }

  return (
    <>
      {micrositeResponse?.firstPageCode && (
        <PreviewWindow
          microsite={micrositeResponse}
          activePageSlug={micrositeResponse?.firstPageCode}
          micrositeSlug={micrositeUrlSlug as string}
          sourceSystem={micrositeResponse?.sourceSystem}
        />
      )}
    </>
  );
};

export default PreviewPage;
