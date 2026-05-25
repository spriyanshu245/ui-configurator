import { Microsite, WorkspaceItem, IRequestData } from "@/app/types/types";
import { apiRequest } from "../services/APIService";

export const fetchWorkspaceList = async (): Promise<WorkspaceItem[]> => {
  return apiRequest({
    endpoint: `/api/v1/config/workspaces`,
    method: "GET",
  });
};

export const fetchMicrositeList = async (
  workspaceId: string
): Promise<Microsite[]> => {
  return apiRequest({
    endpoint: `/api/v1/config/microsites`,
    method: "GET",
    headers: { "workspace-code": workspaceId },
  });
};

export const fetchMicrositeDSL = async (
  workspaceId: string,
  code: string,
  version: number
): Promise<Microsite> => {
  const data = await apiRequest({
    endpoint: `/api/v1/config/microsites/${code}?version=${version}`,
    method: "GET",
    headers: { "workspace-code": workspaceId },
  });

  return data?.dslJson ?? data;
};

export const fetchPageDSL = async (
  pageCode: string,
  pageVersion?: number,
) => {
  return apiRequest({
    endpoint: `/api/v1/config/pages/${pageCode}?version=${pageVersion ?? 1}`,
    method: "GET",
  });
};

export const fetchMicrositeDSLBySlug = async (
  micrositeSlug: string,
  version: number
): Promise<{
  dslJson: {
    code: string;
    name: string;
    pages: Array<{
      id?: string;
      title?: string;
      components: Array<{
        id: string;
        type: string;
        name?: string;
        properties?: Record<string, unknown>;
        components?: unknown[];
      }>;
    }>;
  };
  version: number;
}> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/config/microsites/${encodeURIComponent(
      micrositeSlug
    )}?version=${version}`,
    method: "GET",
  };

  const data = await apiRequest(requestData);
  return data;
};
