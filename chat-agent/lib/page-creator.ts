import { getApiBaseUrl, toCode } from "../../src/app/utils/utils";
import { logger } from "./logger";
import { updateDslCache } from "./dsl-patcher";

export interface CreatePageAuth {
  authHeader?: string | null;
  cookieHeader?: string;
  userIdHeader?: string | null;
  /** Resolved acting user id (e.g. from getUserId(req)) — x-user-id fallback. */
  userId?: string | null;
  /** The real workspace code (from the configurator route param). */
  workspaceCode?: string | null;
}

export interface CreatePageInput {
  micrositeId: string;
  name: string;
  description?: string;
  /** When true, configure the new page's DSL as a popup with default props. */
  isPopup?: boolean;
  auth?: CreatePageAuth;
}

export interface CreatePageResult {
  pageCode: string;
  pageVersion: number;
  slug: string;
  name: string;
  isPopup: boolean;
  /** Set when the page was created but popup configuration failed to apply. */
  popupWarning?: string;
}

/** Default popup page properties applied when the popup checkbox is ticked. */
export const POPUP_DEFAULTS = {
  showAsPopup: true,
  panePosition: "right", // left | right | center | bottom
  popupWidth: 40, // 0-100 (%)
  closeOnBackdropClick: true,
  showTitle: true,
} as const;

function buildHeaders(auth: CreatePageAuth = {}): Record<string, string> {
  const effectiveUserId =
    auth.userIdHeader ||
    (auth.userId && auth.userId !== "anonymous" ? auth.userId : null);
  return {
    accept: "*/*",
    "content-type": "application/json",
    "workspace-code": auth.workspaceCode || "engineering-workspace",
    "x-user-type": "employee",
    ...(auth.cookieHeader ? { Cookie: auth.cookieHeader } : {}),
    ...(auth.authHeader ? { Authorization: auth.authHeader } : {}),
    ...(effectiveUserId ? { "x-user-id": effectiveUserId } : {}),
  };
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  return `${res.status} ${res.statusText}${text ? `: ${text}` : ""}`;
}

interface PageRequestCtx {
  apiUrl: string;
  headers: Record<string, string>;
  micrositeUrl: string;
  code: string;
  micrositeId: string;
  pageVersion: number;
}

/** Fetch the current microsite (fresh): used for the collision check and the PUT body. */
async function loadMicrosite(micrositeUrl: string, headers: Record<string, string>) {
  const res = await fetch(micrositeUrl, { method: "GET", headers });
  if (!res.ok) {
    throw new Error(`Failed to load microsite: ${await readError(res)}`);
  }
  const data: any = await res.json();
  const microsite = data?.dslJson ?? data;
  const existingPages: any[] = Array.isArray(microsite?.pages) ? microsite.pages : [];
  const pageVersion = Number(microsite?.version ?? data?.version ?? 1) || 1;
  return { microsite, existingPages, pageVersion };
}

/** Delete the orphaned page if a later step fails. */
async function deleteOrphan({ apiUrl, code, pageVersion, headers }: PageRequestCtx) {
  try {
    await fetch(`${apiUrl}/api/v1/config/pages/${code}?version=${pageVersion}`, { method: "DELETE", headers });
    logger.info("Rolled back orphaned page", { code });
  } catch (e) {
    logger.error("Failed to clean up orphaned page", { code, error: (e as Error).message });
  }
}

/** Append the page to the microsite and PUT the full record back. */
async function appendPageToMicrosite(ctx: PageRequestCtx, microsite: any, existingPages: any[]) {
  const { code, pageVersion } = ctx;
  // Strip the microsite's own `version` field (the app's saveMicrosite does),
  // keep every other field, and append the new page.
  const { version: _omit, ...micrositeWithoutVersion } = microsite;
  const putBody = {
    ...micrositeWithoutVersion,
    firstPageCode: existingPages.length === 0 ? code : microsite.firstPageCode,
    pages: [...existingPages, { pageCode: code, pageVersion }],
  };
  const putRes = await fetch(ctx.micrositeUrl, {
    method: "PUT",
    headers: ctx.headers,
    body: JSON.stringify(putBody),
  });
  if (!putRes.ok) {
    throw new Error(`Failed to append page to microsite: ${await readError(putRes)}`);
  }
  logger.info("Appended page to microsite", { code, micrositeId: ctx.micrositeId });
}

/** Merge the popup defaults into the new page's DSL and PUT it back. */
async function applyPopupConfig({ apiUrl, code, pageVersion, headers }: PageRequestCtx) {
  const pageUrl = `${apiUrl}/api/v1/config/pages/${code}?version=${pageVersion}`;
  const pageRes = await fetch(pageUrl, { method: "GET", headers });
  const pageDsl: any = pageRes.ok ? await pageRes.json() : {};
  const nextPageDsl = {
    ...pageDsl,
    properties: { ...(pageDsl?.properties ?? {}), ...POPUP_DEFAULTS },
  };
  const popupPutRes = await fetch(pageUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(nextPageDsl),
  });
  if (!popupPutRes.ok) {
    throw new Error(await readError(popupPutRes));
  }
  // Keep the in-memory DSL cache in sync so a later patch sees the popup props.
  updateDslCache(code, nextPageDsl, pageVersion);
  logger.info("Configured page as popup", { code, ...POPUP_DEFAULTS });
}

/**
 * Create a new page and append it to the microsite, mirroring the app's own
 * "Add Page" flow (FormPane POST + useDurableMicrositePageCreation PUT):
 *   1. POST /config/pages          {code,name,description,slug}
 *   2. GET  /config/microsites/{id} (fresh), append {pageCode,pageVersion}, PUT it back
 *   3. If isPopup: GET the new page DSL, merge popup properties, PUT it back
 *   4. On any failure after step 1: DELETE the orphaned page
 *
 * `code` is always `${micrositeId}_${slug}` and `slug = toCode(name)` — the same
 * derivation the UI enforces (page code is read-only, derived from the name).
 */
export async function createPage(
  input: CreatePageInput,
): Promise<CreatePageResult> {
  const { micrositeId, name, description = "", isPopup = false, auth = {} } = input;

  const trimmed = (name || "").trim();
  if (!trimmed) {
    throw new Error("Page name is required.");
  }

  const slug = toCode(trimmed);
  if (!slug) {
    throw new Error(
      `Could not derive a valid slug from "${name}". Use letters, numbers, or spaces.`,
    );
  }
  const code = `${micrositeId}_${slug}`;

  const apiUrl = getApiBaseUrl();
  const headers = buildHeaders(auth);
  const micrositeUrl = `${apiUrl}/api/v1/config/microsites/${micrositeId}?version=1`;

  const { microsite, existingPages, pageVersion } = await loadMicrosite(micrositeUrl, headers);
  if (existingPages.some((p) => p.pageCode === code)) {
    throw new Error(
      `A page with code "${code}" already exists in this microsite. Choose a different name.`,
    );
  }
  const ctx: PageRequestCtx = { apiUrl, headers, micrositeUrl, code, micrositeId, pageVersion };

  // --- Step 1: POST create the page record ---
  const postRes = await fetch(`${apiUrl}/api/v1/config/pages?version=1`, {
    method: "POST",
    headers,
    body: JSON.stringify({ code, name: trimmed, description, slug }),
  });
  if (!postRes.ok) {
    throw new Error(`Failed to create page: ${await readError(postRes)}`);
  }
  logger.info("Created page record", { code });

  // --- Step 2: append the page to the microsite and PUT the full record ---
  try {
    await appendPageToMicrosite(ctx, microsite, existingPages);
  } catch (e) {
    await deleteOrphan(ctx);
    throw e;
  }

  // --- Step 3 (optional): configure the new page as a popup ---
  // The page is already created + registered at this point, so a popup failure
  // is non-fatal: we keep the page and surface a warning rather than deleting it
  // (which would leave a dangling reference in the microsite's pages[]).
  let popupWarning: string | undefined;
  if (isPopup) {
    try {
      await applyPopupConfig(ctx);
    } catch (e) {
      popupWarning = `Page created, but popup configuration failed to apply: ${(e as Error).message}`;
      logger.warn("Popup configuration failed", { code, error: (e as Error).message });
    }
  }

  return {
    pageCode: code,
    pageVersion,
    slug,
    name: trimmed,
    isPopup: isPopup && !popupWarning,
    ...(popupWarning ? { popupWarning } : {}),
  };
}
