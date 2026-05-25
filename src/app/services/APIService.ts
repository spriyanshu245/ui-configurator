import { IRequestData } from "../types/types";
import sessionManager from "../../platforms/session/SessionManagerService";
import { appEnv, getApiBaseUrl } from "../utils/utils";

const getAccessToken = () => {
  return `Bearer ${sessionStorage.getItem("accessToken")}`;
};

export const apiRequest = async (
  data: IRequestData,
  optionsOverride?: { responseType?: "json" | "blob" | "text" }
): Promise<any> => {
  try {
    const resumed = await sessionManager.notifyActivity();

    if (!resumed) {
      throw new Error("Session resume failed. User logged out.");
    }

    await sessionManager.waitForOngoingRefresh?.();

    const API_BASE_URL = getApiBaseUrl();
    const { method, endpoint, headers, body, credentials, rawBody } = data;
    const url = `${API_BASE_URL}${endpoint}`;
    const requestHeaders: IRequestData["headers"] = {
      "Content-Type": rawBody ? "text/plain" : "application/json",
      "X-User-Type": "employee",
      ...headers,
      "x-user-id": JSON.parse(sessionStorage.getItem("global.login.userDetails") as string)?.userId ?? ""
    };
if (appEnv === "development") {
      requestHeaders.authorization = getAccessToken()
    }

    const options: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: credentials as RequestCredentials ?? "include",
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      options.body = rawBody ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
      await sessionManager.handle401();
      throw new Error("Unauthorized - session expired");
    }

    if (response.status === 204) {
      return null;
    }

    const responseType = optionsOverride?.responseType ?? "json";
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      const errorBody = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      throw new Error(
        typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody)
      );
    }

    if (responseType === "blob") {
      return (await response.blob());
    }
    if (responseType === "text") {
      return await response.text();
    }
    return await response?.json();
  } catch (error) {
    throw error;
  }
};
