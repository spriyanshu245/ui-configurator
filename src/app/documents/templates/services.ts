import { apiRequest } from "@/app/services/APIService";
import { IRequestData } from "@/app/types/types";
import { TemplateListing, TemplateContent } from "@/app/template-designer/types";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const getAllTemplates = async (): Promise<TemplateListing[]> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/config/templates`,
    method: "GET",
    headers: DEFAULT_HEADERS,
  };

  const data = await apiRequest(requestData);
  return (data ?? []) as TemplateListing[];
};

export const getTemplate = async (id: string): Promise<TemplateListing> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/config/templates/${id}`,
    method: "GET",
    headers: DEFAULT_HEADERS,
  };

  const data = (await apiRequest(requestData)) as TemplateListing;

  if (data.content && !data.contents) {
    data.contents = [
      {
        content: data.content,
        language: "en",
        isDefault: true,
      },
    ];
  }

  return data;
};

export interface CreateTemplatePayload {
  name: string;
  category: string;
  contents: TemplateContent[];
  mimeType?: string;
}

export const createTemplate = async (
  payload: CreateTemplatePayload,
): Promise<TemplateListing> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/config/templates`,
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: payload,
  };

  const data = await apiRequest(requestData);
  return data as TemplateListing;
};

export const duplicateTemplate = async (
  sourceTemplate: TemplateListing,
  newName: string,
): Promise<TemplateListing> => {
  const payload: CreateTemplatePayload = {
    name: newName.trim(),
    category: sourceTemplate.category,
    mimeType: sourceTemplate.mimeType ?? "text/html",
    contents: sourceTemplate.contents ?? [],
  };

  const requestData: IRequestData = {
    endpoint: `/api/v1/config/templates`,
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: payload,
  };

  const data = await apiRequest(requestData);
  return data as TemplateListing;
};

export interface UpdateTemplatePayload {
  id: string;
  name: string;
  category: string;
  contents: TemplateContent[];
  mimeType: string;
}

export const updateTemplate = async (
  id: string,
  payload: UpdateTemplatePayload,
): Promise<TemplateListing> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/config/templates/${id}`,
    method: "PUT",
    headers: DEFAULT_HEADERS,
    body: payload,
  };

  const data = await apiRequest(requestData);
  return data as TemplateListing;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const requestData: IRequestData = {
    endpoint: `/api/v1/config/templates/${id}`,
    method: "DELETE",
    headers: DEFAULT_HEADERS,
  };

  await apiRequest(requestData);
};
