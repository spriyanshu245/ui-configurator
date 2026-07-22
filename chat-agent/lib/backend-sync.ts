import { getApiBaseUrl } from "../../src/app/utils/utils";
import { updateDslCache } from "./dsl-patcher";
import { logger } from "./logger";

export interface PutPageDslOptions {
  authHeader?: string | null;
  cookieHeader?: string;
  userIdHeader?: string | null;
  version?: number;
}

export interface PutPageDslResult {
  latestDsl: any;
}

/**
 * PUT a page DSL to the external backend, then re-GET it and refresh the
 * in-memory DSL cache. Extracted from the inline logic in
 * src/app/api/patch/approve/route.ts.
 */
export async function putPageDsl(
  pagePath: string,
  dsl: unknown,
  opts: PutPageDslOptions = {},
): Promise<PutPageDslResult> {
  const { authHeader, cookieHeader, userIdHeader, version = 1 } = opts;

  const API_URL = getApiBaseUrl();
  logger.debug("Backend API resolution", { baseUrl: API_URL });

  const putUrl = `${API_URL}/api/v1/config/pages/${pagePath}?version=${version}`;
  logger.debug("Submitting patch to backend", {
    url: putUrl,
    patchSize: JSON.stringify(dsl).length,
  });

  const headers: Record<string, string> = {
    accept: "*/*",
    "content-type": "application/json",
    "workspace-code": "engineering-workspace",
    "x-user-type": "employee",
    Cookie: cookieHeader || "",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(userIdHeader ? { "x-user-id": userIdHeader } : {}),
  };

  const putResponse = await fetch(putUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(dsl),
  });

  if (!putResponse.ok) {
    const errorText = await putResponse.text().catch(() => "");
    logger.error("PUT request failed", {
      status: putResponse.status,
      statusText: putResponse.statusText,
    });
    throw new Error(
      `Failed to apply patch to backend API (Status: ${putResponse.status} ${putResponse.statusText}): ${errorText}`,
    );
  }

  let latestDsl: any = dsl;
  try {
    const getResponse = await fetch(putUrl, {
      method: "GET",
      headers,
    });
    if (getResponse.ok) {
      latestDsl = await getResponse.json();
      updateDslCache(pagePath, latestDsl);
      logger.info("Updated in-memory DSL cache", { pagePath });
    }
  } catch (e) {
    logger.warn("Failed to fetch latest DSL after PUT", { error: (e as Error).message });
  }

  return { latestDsl };
}
