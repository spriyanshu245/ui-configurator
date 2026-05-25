import { apiRequest } from "../services/APIService";
import { DataTypeConfig, IRequestData } from "../types/types";

export const getRecord = async <T>(
  dataConfig: DataTypeConfig,

  code: string,
  version?: number,
  workspaceCode?: string,
): Promise<T> => {
  const requestData: IRequestData = {
    method: "GET",
    endpoint: `${dataConfig.endpoint}/${code}?version=${version}`,
    ...(dataConfig.requiresWorkspace && {
      headers: { "workspace-code": workspaceCode as string },
    }),
  };
  return apiRequest(requestData);
};

export const updateRecord = async <T>(
  requestData: IRequestData,
): Promise<T> => {
  return apiRequest(requestData);
};

export const getAllRecords = async <T>(
  requestData: IRequestData,
): Promise<T[]> => {
  return apiRequest(requestData);
};

export const getRecordVersions = async <T>(
  code: string,
  dataConfig: DataTypeConfig,

  workspaceCode?: string,
): Promise<T[]> => {
  const requestData: IRequestData = {
    method: "GET",
    endpoint: `${dataConfig.endpoint}?latest=false`,
    ...(dataConfig.requiresWorkspace && {
      headers: { "workspace-code": workspaceCode as string, code },
    }),
  };
  return apiRequest(requestData);
};

export const createRecord = async <T>(
  requestData: IRequestData,
): Promise<T> => {
  return apiRequest(requestData);
};

export const duplicateRecord = async <T>(
  requestData: IRequestData,
): Promise<T> => {
  return apiRequest(requestData);
};

export const deleteRecord = async (
  dataConfig: DataTypeConfig,

  code: string,
  workspaceCode?: string,
): Promise<void> => {
  const requestData: IRequestData = {
    method: "DELETE",
    endpoint: `${dataConfig.endpoint}/${code}`,
    ...(dataConfig.requiresWorkspace && {
      headers: { "workspace-code": workspaceCode as string },
    }),
  };
  await apiRequest(requestData);
};
