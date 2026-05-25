import { apiRequest } from "./APIService";
import { IRequestData } from "../types/types";
import {
  PortalTaskConfigListing,
  AccessConfigPage,
  PortalTaskConfig,
} from "../types/accessControlConfig";

interface CreatePortalTaskConfigPayload {
  portalTaskConfigCode: string;
  micrositeSlug: string;
  version: number;
}

interface UpdatePortalTaskConfigPayload {
  portalTaskConfigCode: string;
  micrositeSlug: string;
  version: number;
  pages: AccessConfigPage[];
}

export const getAllPortalTaskConfigs = async (): Promise<
  PortalTaskConfigListing[]
> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/portal-task-configs`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const data = await apiRequest(requestData);
  return (data ?? []) as PortalTaskConfigListing[];
};

export const deletePortalTaskConfig = async (
  portalTaskConfigCode: string
): Promise<void> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/portal-task-configs/${encodeURIComponent(
      portalTaskConfigCode
    )}`,
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };

  await apiRequest(requestData);
};

export const createPortalTaskConfig = async (
  payload: CreatePortalTaskConfigPayload
): Promise<PortalTaskConfigListing> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/portal-task-configs`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  };

  const data = await apiRequest(requestData);
  return data;
};

export const duplicatePortalTaskConfig = async (
  sourcePortalTaskConfig: PortalTaskConfigListing,
  newPortalTaskConfigCode: string
): Promise<PortalTaskConfigListing> => {
  return createPortalTaskConfig({
    portalTaskConfigCode: newPortalTaskConfigCode,
    micrositeSlug: sourcePortalTaskConfig.micrositeSlug,
    version: sourcePortalTaskConfig.version,
  });
};

export const getPortalTaskConfig = async (
  portalTaskConfigCode: string
): Promise<PortalTaskConfig> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/portal-task-configs/${encodeURIComponent(
      portalTaskConfigCode
    )}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const data = await apiRequest(requestData);
  return data;
};

export const updatePortalTaskConfig = async (
  portalTaskConfigCode: string,

  payload: UpdatePortalTaskConfigPayload
): Promise<PortalTaskConfig> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/portal-task-configs/${encodeURIComponent(
      portalTaskConfigCode
    )}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  };

  const data = await apiRequest(requestData);
  return data;
};


