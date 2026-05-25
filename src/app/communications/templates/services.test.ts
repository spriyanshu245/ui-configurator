import * as APIService from "@/app/services/APIService";
import {
  createNotificationSubscription,
  createNotificationTemplate,
  deleteNotificationSubscription,
  deleteNotificationTemplate,
  getChannels,
  getNotificationSubscriptions,
  getNotificationTemplate,
  getNotificationTemplateData,
  getNotificationTemplates,
  getNotificationTypes,
  normalizeNotificationTemplateData,
  saveNotificationTemplateData,
  toNotificationTemplatePayload,
  updateNotificationSubscription,
  updateNotificationTemplate,
} from "@/app/communications/templates/services";
import {
  NotificationSubscription,
  NotificationTemplateMetadata,
} from "@/app/communications/templates/types";

jest.mock("@/app/services/APIService", () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = APIService.apiRequest as jest.Mock;

const headers = { "Content-Type": "application/json" };

describe("communication template services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches channels and notification types", async () => {
    mockApiRequest.mockResolvedValueOnce([{ code: "EMAIL", desc: "Email" }]);
    await expect(getChannels()).resolves.toEqual([
      { code: "EMAIL", desc: "Email" },
    ]);
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "GET",
      endpoint: "/api/v1/communication/channels",
      headers,
    });

    mockApiRequest.mockResolvedValueOnce([
      { code: "WELCOME", description: "Welcome" },
    ]);
    await expect(getNotificationTypes()).resolves.toEqual([
      { code: "WELCOME", description: "Welcome" },
    ]);
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "GET",
      endpoint: "/api/v1/communication/notification-types",
      headers,
    });
  });

  it("performs subscription CRUD calls", async () => {
    const subscription: NotificationSubscription = {
      subscriptionKey: "WELCOME_EMAIL",
      desc: "Welcome Email",
      notificationChannelCode: "EMAIL",
      notificationTypeCode: "WELCOME",
    };

    mockApiRequest.mockResolvedValueOnce([subscription]);
    await getNotificationSubscriptions("WELCOME");
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "GET",
      endpoint:
        "/api/v1/communication/notification-types/WELCOME/subscriptions",
      headers,
    });

    mockApiRequest.mockResolvedValueOnce(subscription);
    await createNotificationSubscription("WELCOME", subscription);
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "POST",
      endpoint:
        "/api/v1/communication/notification-types/WELCOME/subscriptions",
      headers,
      body: subscription,
    });

    mockApiRequest.mockResolvedValueOnce(subscription);
    await updateNotificationSubscription(
      "WELCOME",
      "WELCOME_EMAIL",
      subscription,
    );
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "PUT",
      endpoint:
        "/api/v1/communication/notification-types/WELCOME/subscriptions/WELCOME_EMAIL",
      headers,
      body: subscription,
    });

    mockApiRequest.mockResolvedValueOnce(null);
    await deleteNotificationSubscription("WELCOME", "WELCOME_EMAIL");
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "DELETE",
      endpoint:
        "/api/v1/communication/notification-types/WELCOME/subscriptions/WELCOME_EMAIL",
      headers,
    });
  });

  it("performs template metadata and data calls", async () => {
    const template: NotificationTemplateMetadata = {
      id: 7,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "Welcome",
      subject: "Hello",
      templateMimeType: "text/html",
      language: "en",
      primary: false,
      vendorTemplateId: "vendor-1",
    };
    const payload = toNotificationTemplatePayload(template, true);

    mockApiRequest.mockResolvedValueOnce([template]);
    await getNotificationTemplates("WELCOME", "WELCOME_EMAIL");
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "GET",
      endpoint:
        "/api/v1/communication/notification-types/WELCOME/subscriptions/WELCOME_EMAIL/template",
      headers,
    });

    mockApiRequest.mockResolvedValueOnce([template]);
    await getNotificationTemplate("WELCOME", "WELCOME_EMAIL", "7");
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "GET",
      endpoint:
        "/api/v1/communication/notification-types/WELCOME/subscriptions/WELCOME_EMAIL/template",
      headers,
    });

    mockApiRequest.mockResolvedValueOnce(template);
    await createNotificationTemplate("WELCOME", "WELCOME_EMAIL", payload);
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "POST",
      endpoint:
        "/api/v1/communication/notification-types/WELCOME/subscriptions/WELCOME_EMAIL/template",
      headers,
      body: payload,
    });

    mockApiRequest.mockResolvedValueOnce(template);
    await updateNotificationTemplate("WELCOME", "WELCOME_EMAIL", 7, payload);
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "PUT",
      endpoint:
        "/api/v1/communication/notification-types/WELCOME/subscriptions/WELCOME_EMAIL/template/7",
      headers,
      body: payload,
    });

    mockApiRequest.mockResolvedValueOnce("<html />");
    await getNotificationTemplateData("WELCOME", "WELCOME_EMAIL", "7");
    expect(mockApiRequest).toHaveBeenLastCalledWith(
      {
        method: "GET",
        endpoint:
          "/api/v1/communication/notification-types/WELCOME/subscriptions/WELCOME_EMAIL/template/7/data",
        headers,
      },
      { responseType: "text" },
    );

    mockApiRequest.mockResolvedValueOnce("<html />");
    await saveNotificationTemplateData(
      "WELCOME",
      "WELCOME_EMAIL",
      7,
      "<html />",
    );
    expect(mockApiRequest).toHaveBeenLastCalledWith(
      {
        method: "POST",
        endpoint:
          "/api/v1/communication/notification-types/WELCOME/subscriptions/WELCOME_EMAIL/template/7/data",
        headers,
        body: "<html />",
        rawBody: true,
      },
      { responseType: "text" },
    );

    mockApiRequest.mockResolvedValueOnce(null);
    await deleteNotificationTemplate("WELCOME", "WELCOME_EMAIL", 7);
    expect(mockApiRequest).toHaveBeenLastCalledWith({
      method: "DELETE",
      endpoint:
        "/api/v1/communication/notification-types/WELCOME/subscriptions/WELCOME_EMAIL/template/7",
      headers,
    });
  });

  it("throws when getNotificationTemplate cannot find a matching template", async () => {
    mockApiRequest.mockResolvedValueOnce([]);
    await expect(
      getNotificationTemplate("WELCOME", "WELCOME_EMAIL", "7"),
    ).rejects.toThrow(
      "Template metadata not found for subscription WELCOME_EMAIL",
    );
  });

  it("derives template payload primary flag from metadata when not overridden", () => {
    const template: NotificationTemplateMetadata = {
      id: 1,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "Welcome",
      subject: "Hello",
      templateMimeType: "text/html",
      language: "en",
      primary: true,
      vendorTemplateId: "vendor-1",
    };
    expect(toNotificationTemplatePayload(template).primary).toBe(true);
  });

  it("normalizes legacy JSON-stringified template data", async () => {
    mockApiRequest.mockResolvedValueOnce(
      "\"<!DOCTYPE html>\\n<html><body>Hello</body></html>\"",
    );

    await expect(
      getNotificationTemplateData("WELCOME", "WELCOME_EMAIL", "7"),
    ).resolves.toBe("<!DOCTYPE html>\n<html><body>Hello</body></html>");
  });

  it("leaves already-normalized template data unchanged", () => {
    expect(normalizeNotificationTemplateData("<p>Hello</p>")).toBe(
      "<p>Hello</p>",
    );
  });
});
