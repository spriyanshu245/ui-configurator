export interface NotificationType {
  code: string;
  description: string;
}

export interface Channel {
  code: string;
  desc: string;
  authToken?: string;
  expiryDate?: string;
  authRequired?: boolean;
}

export interface NotificationSubscription {
  subscriptionKey: string;
  desc: string;
  notificationChannelCode: string;
  notificationTypeCode: string;
}

export interface NotificationTemplateMetadata {
  id: number;
  subscriptionKey: string;
  templateContentId?: string;
  templateName: string;
  subject?: string;
  templateMimeType: string;
  language: string;
  primary: boolean;
  vendorTemplateId?: string;
}

export interface NotificationTemplatePayload {
  templateName: string;
  subject?: string;
  templateMimeType: string;
  language: string;
  primary: boolean;
  vendorTemplateId?: string;
}
