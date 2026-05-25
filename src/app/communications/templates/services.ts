import { apiRequest } from "@/app/services/APIService";
import { IRequestData } from "@/app/types/types";
import {
  Channel,
  NotificationSubscription,
  NotificationTemplateMetadata,
  NotificationTemplatePayload,
  NotificationType,
} from "@/app/communications/templates/types";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

const COMMUNICATION_BASE = "/api/v1/communication";

const request = async <T>(
  data: IRequestData,
  optionsOverride?: { responseType?: "json" | "blob" | "text" },
): Promise<T> => {
  const requestData = {
    headers: DEFAULT_HEADERS,
    ...data,
  };
  if (optionsOverride) {
    return (await apiRequest(requestData, optionsOverride)) as T;
  }
  return (await apiRequest(requestData)) as T;
};

const encoded = (value: string | number) => encodeURIComponent(String(value));

export const normalizeNotificationTemplateData = (template: string): string => {
  const trimmed = template.trim();
  if (trimmed.length < 2 || !trimmed.startsWith('"') || !trimmed.endsWith('"')) {
    return template;
  }

  try {
    const decoded = JSON.parse(template);
    return typeof decoded === "string" ? decoded : template;
  } catch {
    return template;
  }
};

export const getChannels = async (): Promise<Channel[]> => {
  return request<Channel[]>({
    method: "GET",
    endpoint: `${COMMUNICATION_BASE}/channels`,
  });
};

export const getNotificationTypes = async (): Promise<NotificationType[]> => {
  return request<NotificationType[]>({
    method: "GET",
    endpoint: `${COMMUNICATION_BASE}/notification-types`,
  });
};

export const getNotificationSubscriptions = async (
  type: string,
): Promise<NotificationSubscription[]> => {
  return request<NotificationSubscription[]>({
    method: "GET",
    endpoint: `${COMMUNICATION_BASE}/notification-types/${encoded(type)}/subscriptions`,
  });
};

export const createNotificationSubscription = async (
  type: string,
  payload: NotificationSubscription,
): Promise<NotificationSubscription> => {
  return request<NotificationSubscription>({
    method: "POST",
    endpoint: `${COMMUNICATION_BASE}/notification-types/${encoded(type)}/subscriptions`,
    body: payload,
  });
};

export const updateNotificationSubscription = async (
  type: string,
  subscriptionKey: string,
  payload: NotificationSubscription,
): Promise<NotificationSubscription> => {
  return request<NotificationSubscription>({
    method: "PUT",
    endpoint: `${COMMUNICATION_BASE}/notification-types/${encoded(type)}/subscriptions/${encoded(subscriptionKey)}`,
    body: payload,
  });
};

export const deleteNotificationSubscription = async (
  type: string,
  subscriptionKey: string,
): Promise<void> => {
  await request<void>({
    method: "DELETE",
    endpoint: `${COMMUNICATION_BASE}/notification-types/${encoded(type)}/subscriptions/${encoded(subscriptionKey)}`,
  });
};

export const getNotificationTemplates = async (
  type: string,
  subscriptionKey: string,
): Promise<NotificationTemplateMetadata[]> => {
  return request<NotificationTemplateMetadata[]>({
    method: "GET",
    endpoint: `${COMMUNICATION_BASE}/notification-types/${encoded(type)}/subscriptions/${encoded(subscriptionKey)}/template`,
  });
};

export const getNotificationTemplate = async (
  type: string,
  subscriptionKey: string,
  templateId: string,
): Promise<NotificationTemplateMetadata> => {
  const templates = await getNotificationTemplates(type, subscriptionKey);
  const template = templates.find((item) => String(item.id) === templateId);
  if (!template) {
    throw new Error(
      `Template metadata not found for subscription ${subscriptionKey}`,
    );
  }
  return template;
};

export const getNotificationTemplateData = async (
  type: string,
  subscriptionKey: string,
  templateId: string,
): Promise<string> => {
  const template = await request<string>(
    {
      method: "GET",
      endpoint: `${COMMUNICATION_BASE}/notification-types/${encoded(type)}/subscriptions/${encoded(subscriptionKey)}/template/${encoded(templateId)}/data`,
    },
    { responseType: "text" },
  );
  return normalizeNotificationTemplateData(template);
};

export const createNotificationTemplate = async (
  type: string,
  subscriptionKey: string,
  payload: NotificationTemplatePayload,
): Promise<NotificationTemplateMetadata> => {
  return request<NotificationTemplateMetadata>({
    method: "POST",
    endpoint: `${COMMUNICATION_BASE}/notification-types/${encoded(type)}/subscriptions/${encoded(subscriptionKey)}/template`,
    body: payload,
  });
};

export const updateNotificationTemplate = async (
  type: string,
  subscriptionKey: string,
  templateId: string | number,
  payload: NotificationTemplatePayload,
): Promise<NotificationTemplateMetadata> => {
  return request<NotificationTemplateMetadata>({
    method: "PUT",
    endpoint: `${COMMUNICATION_BASE}/notification-types/${encoded(type)}/subscriptions/${encoded(subscriptionKey)}/template/${encoded(templateId)}`,
    body: payload,
  });
};

export const deleteNotificationTemplate = async (
  type: string,
  subscriptionKey: string,
  templateId: string | number,
): Promise<void> => {
  await request<void>({
    method: "DELETE",
    endpoint: `${COMMUNICATION_BASE}/notification-types/${encoded(type)}/subscriptions/${encoded(subscriptionKey)}/template/${encoded(templateId)}`,
  });
};

export const saveNotificationTemplateData = async (
  type: string,
  subscriptionKey: string,
  templateId: string | number,
  template: string,
): Promise<string> => {
  return request<string>(
    {
      method: "POST",
      endpoint: `${COMMUNICATION_BASE}/notification-types/${encoded(type)}/subscriptions/${encoded(subscriptionKey)}/template/${encoded(templateId)}/data`,
      body: template,
      rawBody: true,
    },
    { responseType: "text" },
  );
};

export const toNotificationTemplatePayload = (
  template: NotificationTemplateMetadata,
  primary = template.primary,
): NotificationTemplatePayload => ({
  templateName: template.templateName,
  subject: template.subject,
  templateMimeType: template.templateMimeType,
  language: template.language,
  primary,
  vendorTemplateId: template.vendorTemplateId,
});
