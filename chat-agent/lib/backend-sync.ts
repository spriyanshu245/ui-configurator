import { getApiBaseUrl } from "../../src/app/utils/utils";
import { updateDslCache } from "./dsl-patcher";
import { logger } from "./logger";

export interface PutPageDslOptions {
  authHeader?: string | null;
  cookieHeader?: string;
  userIdHeader?: string | null;
  /**
   * Resolved acting user id (e.g. from getUserId(req)). Used as the `x-user-id`
   * header when the incoming request didn't carry one — the backend derives the
   * acting user from this header and rejects the write with a ContextException
   * ("Failed to get User Id from context") if it is missing.
   */
  userId?: string | null;
  /**
   * The page's REAL backend version (from the microsite's pages[].pageVersion),
   * used as the `?version=` slot on the PUT/GET. Callers must pass the page's
   * actual version — the `1` fallback is only a last-resort default and writing
   * to the wrong version slot silently fails or corrupts a different version.
   */
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
  const { authHeader, cookieHeader, userIdHeader, userId, version = 1 } = opts;

  const API_URL = getApiBaseUrl();
  logger.debug("Backend API resolution", { baseUrl: API_URL });

  const putUrl = `${API_URL}/api/v1/config/pages/${pagePath}?version=${version}`;
  // Prefer the incoming x-user-id header; otherwise fall back to the resolved
  // acting user id so the backend always has a user in context.
  const effectiveUserId = userIdHeader || (userId && userId !== "anonymous" ? userId : null);
  logger.debug("Submitting patch to backend", {
    url: putUrl,
    patchSize: JSON.stringify(dsl).length,
    hasUserId: !!effectiveUserId,
  });

  const headers: Record<string, string> = {
    accept: "*/*",
    "content-type": "application/json",
    "workspace-code": "engineering-workspace",
    "x-user-type": "employee",
    Cookie: cookieHeader || "",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(effectiveUserId ? { "x-user-id": effectiveUserId } : {}),
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
      updateDslCache(pagePath, latestDsl, version);
      logger.info("Updated in-memory DSL cache", { pagePath });
    }
  } catch (e) {
    logger.warn("Failed to fetch latest DSL after PUT", { error: (e as Error).message });
  }

  return { latestDsl };
}
