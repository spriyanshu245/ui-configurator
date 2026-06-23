// A utility library to fetch all microsite pages
// In a real application, this would talk to the API Server directly
// or use Server Actions if integrated in Next.js

import { cookies, headers } from "next/headers";
import { getApiBaseUrl } from "../../src/app/utils/utils";

export async function fetchMicrositePages(micrositeId: string) {
  const API_URL = getApiBaseUrl();

  let cookieHeader = "";
  let authHeader = null;

  try {
    const cookieStore = await cookies();
    cookieHeader = cookieStore.toString();

    const headerStore = await headers();
    authHeader = headerStore.get("authorization");
  } catch (e) {
    console.warn(
      "Could not retrieve cookies or headers from next/headers (this is expected if running outside a request context):",
      (e as Error).message,
    );
  }

  const reqHeaders: Record<string, string> = {
    accept: "*/*",
    "content-type": "application/json",
    "workspace-code": "engineering-workspace",
    "x-user-type": "employee",
  };

  if (cookieHeader) {
    reqHeaders["Cookie"] = cookieHeader;
  }
  if (authHeader) {
    reqHeaders["Authorization"] = authHeader;
  }

  const response = await fetch(
    `${API_URL}/api/v1/config/microsites/${micrositeId}?version=1`,
    {
      headers: reqHeaders,
      method: "GET",
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch microsite pages (Status: ${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  const data = await response.json();
  return data;
}

export async function fetchPageDsl(pageCode: string, version: number) {
  const API_URL = getApiBaseUrl();

  let cookieHeader = "";
  let authHeader = null;

  try {
    const cookieStore = await cookies();
    cookieHeader = cookieStore.toString();

    const headerStore = await headers();
    authHeader = headerStore.get("authorization");
  } catch (e) {
    console.warn(
      "Could not retrieve cookies or headers from next/headers (this is expected if running outside a request context):",
      (e as Error).message,
    );
  }

  const reqHeaders: Record<string, string> = {
    accept: "*/*",
    "content-type": "application/json",
    "workspace-code": "engineering-workspace",
    "x-user-type": "employee",
  };

  if (cookieHeader) {
    reqHeaders["Cookie"] = cookieHeader;
  }
  if (authHeader) {
    reqHeaders["Authorization"] = authHeader;
  }

  const response = await fetch(
    `${API_URL}/api/v1/config/pages/${pageCode}?version=${version}`,
    {
      headers: reqHeaders,
      method: "GET",
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch page DSL (Status: ${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  const data = await response.json();
  return data;
}
