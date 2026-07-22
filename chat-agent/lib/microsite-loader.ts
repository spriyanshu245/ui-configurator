// A utility library to fetch all microsite pages
// In a real application, this would talk to the API Server directly
// or use Server Actions if integrated in Next.js

import { cookies, headers } from "next/headers";
import { getApiBaseUrl } from "../../src/app/utils/utils";
import { logger } from "./logger";

/**
 * Build request headers with cookies and authorization.
 * @private
 */
async function buildRequestHeaders(): Promise<Record<string, string>> {
  let cookieHeader = "";
  let authHeader: string | null = null;

  try {
    const cookieStore = await cookies();
    cookieHeader = cookieStore.toString();

    const headerStore = await headers();
    authHeader = headerStore.get("authorization");
  } catch (e) {
    logger.warn(
      "Could not retrieve cookies or headers from next/headers (this is expected if running outside a request context)",
      { error: (e as Error).message },
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

  return reqHeaders;
}

export async function fetchMicrositePages(micrositeId: string) {
  const API_URL = getApiBaseUrl();
  const reqHeaders = await buildRequestHeaders();

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

/**
 * Fetch the list of all microsites from the backend config service.
 * Returns a normalized array of { id, name, slug, pageCount }. The backend
 * response shape can vary (bare array vs. { data | microsites | items: [...] }),
 * so we normalize defensively and never throw for the caller — an empty list
 * is a valid answer the agent can reason about.
 */
export async function fetchMicrosites(): Promise<
  Array<{ id: string; name: string; slug?: string; pageCount?: number }>
> {
  const API_URL = getApiBaseUrl();
  const reqHeaders = await buildRequestHeaders();

  const response = await fetch(`${API_URL}/api/v1/config/microsites?version=1`, {
    headers: reqHeaders,
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch microsites (Status: ${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  const data = await response.json();
  const rows: any[] = Array.isArray(data)
    ? data
    : data?.data ?? data?.microsites ?? data?.items ?? [];

  return rows.map((m: any) => ({
    id: m.code ?? m.id ?? m.slug,
    name: m.name ?? m.code ?? m.id,
    slug: m.slug ?? m.code,
    pageCount: Array.isArray(m.pages) ? m.pages.length : undefined,
  }));
}

export async function fetchPageDsl(pageCode: string, version: number) {
  const API_URL = getApiBaseUrl();
  const reqHeaders = await buildRequestHeaders();

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
