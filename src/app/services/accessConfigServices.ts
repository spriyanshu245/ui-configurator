import { apiRequest } from "./APIService";
import { IRequestData } from "../types/types";
import {
  AccessConfigListing,
  AccessConfigDetail,
  AccessConfigPage,
} from "../types/accessControlConfig";

interface CreateAccessConfigPayload {
  accessConfigCode: string;
  micrositeSlug: string;
  version: number;
}

interface UpdateAccessConfigPayload {
  accessConfigId: string;
  accessConfigCode: string;
  micrositeSlug: string;
  version: number;
  pages: AccessConfigPage[];
}

export const getAllAccessConfigs = async (): Promise<AccessConfigListing[]> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/access-configs`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const data = await apiRequest(requestData);
  return (data ?? []) as AccessConfigListing[];
};

export const deleteAccessConfig = async (
  accessConfigCode: string
): Promise<void> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/access-configs/${encodeURIComponent(accessConfigCode)}`,
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };

  await apiRequest(requestData);
};

export const createAccessConfig = async (
  payload: CreateAccessConfigPayload
): Promise<AccessConfigDetail> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/access-configs`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  };

  const data = await apiRequest(requestData);
  return data as AccessConfigDetail;
};

export const duplicateAccessConfig = async (
  sourceAccessConfig: AccessConfigListing,
  newAccessConfigCode: string
): Promise<AccessConfigDetail> => {
  return createAccessConfig({
    accessConfigCode: newAccessConfigCode,
    micrositeSlug: sourceAccessConfig.micrositeSlug,
    version: sourceAccessConfig.version,
  });
};

export const getAccessConfig = async (
  accessConfigCode: string
): Promise<AccessConfigDetail> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/access-configs/${encodeURIComponent(accessConfigCode)}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const data = await apiRequest(requestData);
  return data as AccessConfigDetail;
};

export const updateAccessConfig = async (
  accessConfigCode: string,
  payload: UpdateAccessConfigPayload
): Promise<AccessConfigDetail> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/access-configs/${encodeURIComponent(accessConfigCode)}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  };

  const data = await apiRequest(requestData);
  return data as AccessConfigDetail;
};

