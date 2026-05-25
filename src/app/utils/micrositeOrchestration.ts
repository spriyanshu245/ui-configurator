import { MicrositesV2 } from "@/app/types/internalTypes";
import {
  Microsite,
  IRequestData,
  MicrositePageReference,
} from "@/app/types/types";
import { apiRequest } from "@/app/services/APIService";
import { DATA_TYPE_CONFIG } from "@/app/utils/constants";
import { deepClone } from "@/app/utils/utils";

type JsonRecord = Record<string, any>;
type PageReferenceInput = string | MicrositePageReference;
type ResolvedPageReference = { pageCode: string; pageVersion: number };
const DEFAULT_PAGE_VERSION = 1;

export interface DuplicateMicrositeTarget {
  code: string;
  name: string;
  slug: string;
  description?: string;
  sourceSystem?: string;
  accessControlled?: boolean;
  version?: number;
  published?: boolean;
}

export interface DuplicatePageCodeMapping {
  sourcePageCode: string;
  targetPageCode: string;
}

export interface NextDraftCreationResult {
  version: number;
  pageCodeMap: Record<string, string>;
}

export interface EditableDraftResult {
  version: number;
  created: boolean;
}

export interface OperationProgress {
  phase: string;
  label: string;
  current: number;
  total: number;
  detail?: string;
}

export type DeleteMicrositeOperationStatus =
  | "pending"
  | "in_progress"
  | "succeeded"
  | "failed"
  | "skipped";

export type DeleteMicrositeOperationType = "page" | "micrositeVersion";

export interface DeleteMicrositeVersionPreview {
  version: number;
  published: boolean;
  pageCount: number;
}

export interface DeleteMicrositeOperation {
  id: string;
  type: DeleteMicrositeOperationType;
  status: DeleteMicrositeOperationStatus;
  label: string;
  detail: string;
  micrositeCode: string;
  micrositeVersion: number;
  pageCode?: string;
  pageVersion?: number;
  requestData: IRequestData;
  error?: string;
}

export interface DeleteMicrositePlan {
  micrositeCode: string;
  micrositeName: string;
  versions: DeleteMicrositeVersionPreview[];
  totalMicrositeVersions: number;
  totalUniquePageVersions: number;
  operations: DeleteMicrositeOperation[];
}

export interface DeleteMicrositeSummary {
  result: "success" | "partial_success";
  totalOperations: number;
  succeeded: number;
  skipped: number;
  failed: number;
  deletedMicrositeVersions: number;
  deletedPageVersions: number;
}

export interface DeleteMicrositeWorkflowResult {
  summary: DeleteMicrositeSummary;
  operations: DeleteMicrositeOperation[];
}

const pageConfig = DATA_TYPE_CONFIG.pages;
const micrositeConfig = DATA_TYPE_CONFIG.microsites;
const MICROSITE_SLUG_KEYS = ["micrositeSlug", "micrositSlug"];

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sortReplacementEntries = (replacementMap: Record<string, string>) =>
  Object.entries(replacementMap)
    .filter(([source, target]) => source && target && source !== target)
    .sort((left, right) => right[0].length - left[0].length);

const createRequest = <T>(requestData: IRequestData) =>
  apiRequest(requestData) as Promise<T>;

const emitProgress = (
  onProgress: ((progress: OperationProgress) => void) | undefined,
  progress: OperationProgress,
) => {
  onProgress?.(progress);
};

const buildDeleteOperationId = (
  type: DeleteMicrositeOperationType,
  micrositeCode: string,
  micrositeVersion: number,
  pageCode?: string,
  pageVersion?: number,
) =>
  [
    type,
    micrositeCode,
    `v${micrositeVersion}`,
    pageCode ? `${pageCode}:v${pageVersion ?? DEFAULT_PAGE_VERSION}` : "",
  ]
    .filter(Boolean)
    .join("::");

export const dedupePageCodes = (pageCodes: string[]) => {
  const seenPageCodes = new Set<string>();

  return pageCodes.filter((pageCode) => {
    const normalizedPageCode = pageCode?.trim();

    if (!normalizedPageCode || seenPageCodes.has(normalizedPageCode)) {
      return false;
    }

    seenPageCodes.add(normalizedPageCode);
    return true;
  });
};

export const getPageReferenceVersion = (
  pageReference?: Partial<MicrositePageReference> | null,
) => Number(pageReference?.pageVersion ?? DEFAULT_PAGE_VERSION);

const normalizePageReference = (
  pageReference: PageReferenceInput,
): ResolvedPageReference | null => {
  if (typeof pageReference === "string") {
    const normalizedPageCode = pageReference?.trim();

    if (!normalizedPageCode) {
      return null;
    }

    return {
      pageCode: normalizedPageCode,
      pageVersion: DEFAULT_PAGE_VERSION,
    };
  }

  const normalizedPageCode = String(pageReference?.pageCode ?? "").trim();

  if (!normalizedPageCode) {
    return null;
  }

  return {
    pageCode: normalizedPageCode,
    pageVersion: getPageReferenceVersion(pageReference),
  };
};

const dedupePageReferences = (pageReferences: PageReferenceInput[]) => {
  const seenPageReferences = new Set<string>();

  return pageReferences
    .map(normalizePageReference)
    .filter((pageReference): pageReference is ResolvedPageReference =>
      Boolean(pageReference),
    )
    .filter((pageReference) => {
      const pageKey = `${pageReference.pageCode}:${pageReference.pageVersion}`;

      if (seenPageReferences.has(pageKey)) {
        return false;
      }

      seenPageReferences.add(pageKey);
      return true;
    });
};

const dedupePageMappings = (pageMappings: DuplicatePageCodeMapping[]) => {
  const seenPageCodes = new Set<string>();

  return pageMappings.filter(({ sourcePageCode }) => {
    const normalizedPageCode = sourcePageCode?.trim();

    if (!normalizedPageCode || seenPageCodes.has(normalizedPageCode)) {
      return false;
    }

    seenPageCodes.add(normalizedPageCode);
    return true;
  });
};

const dedupeSourcePageDsls = (
  sourcePageDsls: Array<{
    pageCode: string;
    pageVersion: number;
    pageDsl: JsonRecord;
  }>,
) => {
  const seenPageCodes = new Set<string>();

  return sourcePageDsls.filter(({ pageCode, pageVersion }) => {
    const normalizedPageCode = pageCode?.trim();
    const pageKey = `${normalizedPageCode}:${pageVersion}`;

    if (!normalizedPageCode || seenPageCodes.has(pageKey)) {
      return false;
    }

    seenPageCodes.add(pageKey);
    return true;
  });
};

const fetchMicrositeDsl = async (
  workspaceCode: string,
  micrositeCode: string,
  version: number,
) =>
  createRequest<JsonRecord>({
    endpoint: `${micrositeConfig.endpoint}/${micrositeCode}?version=${version}`,
    method: "GET",
    headers: { "workspace-code": workspaceCode },
  });

export const fetchMicrositeVersions = async (
  workspaceCode: string,
  micrositeCode: string,
) => {
  const versions = await createRequest<MicrositesV2[]>({
    endpoint: `${micrositeConfig.endpoint}?latest=false`,
    method: "GET",
    headers: {
      "workspace-code": workspaceCode,
      code: micrositeCode,
    },
  });

  return [...versions].sort((left, right) => right.version - left.version);
};

export const fetchSourcePageDsls = async (
  workspaceCode: string,
  pageReferences: PageReferenceInput[],
) =>
  Promise.all(
    dedupePageReferences(pageReferences).map(
      async ({ pageCode, pageVersion }) => {
        const pageDsl = await createRequest<JsonRecord>({
          endpoint: `${pageConfig.endpoint}/${pageCode}?version=${pageVersion}`,
          method: "GET",
          headers: { "workspace-code": workspaceCode },
        });

        return {
          pageCode,
          pageVersion,
          pageDsl,
        };
      },
    ),
  );

export const getPageCodeSuffix = (pageCode: string) => {
  const underscoreIndex = pageCode.indexOf("_");
  return underscoreIndex === -1
    ? pageCode
    : pageCode.slice(underscoreIndex + 1);
};

const trimEdgeHyphens = (value: string) => {
  let start = 0;
  let end = value.length;

  while (start < end && value.charAt(start) === "-") {
    start += 1;
  }

  while (end > start && value.charAt(end - 1) === "-") {
    end -= 1;
  }

  return value.slice(start, end);
};

export const normalizePageCodeInput = (value: string) =>
  trimEdgeHyphens(
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/-+/g, "-"),
  );

export const normalizePageCodeSuffixInput = (value: string) =>
  trimEdgeHyphens(
    value
      .trim()
      .replace(/[^A-Za-z0-9_-]+/g, "-")
      .replace(/-+/g, "-"),
  );

export const buildPageCodeWithPrefix = (
  targetMicrositeCode: string,
  pageCodeSuffix: string,
) => {
  const normalizedMicrositeCode = normalizePageCodeInput(targetMicrositeCode);
  const normalizedPageCodeSuffix = normalizePageCodeSuffixInput(pageCodeSuffix);

  if (!normalizedMicrositeCode || !normalizedPageCodeSuffix) {
    return "";
  }

  return `${normalizedMicrositeCode}_${normalizedPageCodeSuffix}`;
};

export const buildDuplicatePageCode = (
  targetMicrositeCode: string,
  sourcePageCode: string,
) =>
  buildPageCodeWithPrefix(
    targetMicrositeCode,
    getPageCodeSuffix(sourcePageCode),
  );

const replaceMicrositeSlugReferences = (
  value: string,
  sourceSlug: string,
  targetSlug: string,
) => {
  if (!sourceSlug || sourceSlug === targetSlug) {
    return value;
  }

  let rewrittenValue = value;
  const slugWithDotPattern = new RegExp(
    `(^|[^a-z0-9_-])${escapeRegExp(sourceSlug)}(?=\\.)`,
    "g",
  );

  rewrittenValue = rewrittenValue.replace(
    slugWithDotPattern,
    (_, prefix: string) => `${prefix}${targetSlug}`,
  );

  for (const slugKey of MICROSITE_SLUG_KEYS) {
    const slugKeyPattern = new RegExp(
      `(${slugKey}\\s*[:=]\\s*["'])${escapeRegExp(sourceSlug)}(?=["'])`,
      "g",
    );
    rewrittenValue = rewrittenValue.replace(slugKeyPattern, `$1${targetSlug}`);
  }

  return rewrittenValue;
};

const rewriteStringValue = ({
  value,
  pageCodeMap,
  sourceMicrositeCode,
  targetMicrositeCode,
  sourceMicrositeSlug,
  targetMicrositeSlug,
}: {
  value: string;
  pageCodeMap: Record<string, string>;
  sourceMicrositeCode: string;
  targetMicrositeCode: string;
  sourceMicrositeSlug: string;
  targetMicrositeSlug: string;
}) => {
  let rewrittenValue = value;

  for (const [sourcePageCode, targetPageCode] of sortReplacementEntries(
    pageCodeMap,
  )) {
    rewrittenValue = rewrittenValue.split(sourcePageCode).join(targetPageCode);
  }

  rewrittenValue = replaceMicrositeSlugReferences(
    rewrittenValue,
    sourceMicrositeSlug,
    targetMicrositeSlug,
  );

  if (
    sourceMicrositeCode &&
    targetMicrositeCode &&
    sourceMicrositeCode !== targetMicrositeCode
  ) {
    const micrositeCodePattern = new RegExp(
      `(^|[^a-z0-9-])${escapeRegExp(sourceMicrositeCode)}(?=$|[^a-z0-9-])`,
      "g",
    );
    rewrittenValue = rewrittenValue.replace(
      micrositeCodePattern,
      (_, prefix: string) => `${prefix}${targetMicrositeCode}`,
    );
  }

  return rewrittenValue;
};

const rewriteDslValue = ({
  value,
  pageCodeMap,
  sourceMicrositeCode,
  targetMicrositeCode,
  sourceMicrositeSlug,
  targetMicrositeSlug,
}: {
  value: any;
  pageCodeMap: Record<string, string>;
  sourceMicrositeCode: string;
  targetMicrositeCode: string;
  sourceMicrositeSlug: string;
  targetMicrositeSlug: string;
}): any => {
  if (typeof value === "string") {
    return rewriteStringValue({
      value,
      pageCodeMap,
      sourceMicrositeCode,
      targetMicrositeCode,
      sourceMicrositeSlug,
      targetMicrositeSlug,
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      rewriteDslValue({
        value: item,
        pageCodeMap,
        sourceMicrositeCode,
        targetMicrositeCode,
        sourceMicrositeSlug,
        targetMicrositeSlug,
      }),
    );
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const rewrittenObject: JsonRecord = {};

  Object.entries(value).forEach(([key, nestedValue]) => {
    rewrittenObject[key] = rewriteDslValue({
      value: nestedValue,
      pageCodeMap,
      sourceMicrositeCode,
      targetMicrositeCode,
      sourceMicrositeSlug,
      targetMicrositeSlug,
    });
  });

  return rewrittenObject;
};

export const rewriteMicrositeDsl = ({
  sourceMicrosite,
  targetMicrosite,
  pageCodeMap,
  pageVersionMap = {},
}: {
  sourceMicrosite: JsonRecord;
  targetMicrosite: DuplicateMicrositeTarget;
  pageCodeMap: Record<string, string>;
  pageVersionMap?: Record<string, number>;
}) => {
  const sourceMicrositeSlug = String(
    sourceMicrosite.slug ?? sourceMicrosite.code ?? "",
  );
  const rewrittenMicrosite = rewriteDslValue({
    value: deepClone(sourceMicrosite),
    pageCodeMap,
    sourceMicrositeCode: String(sourceMicrosite.code ?? ""),
    targetMicrositeCode: targetMicrosite.code,
    sourceMicrositeSlug,
    targetMicrositeSlug: targetMicrosite.slug,
  }) as JsonRecord;

  rewrittenMicrosite.code = targetMicrosite.code;
  rewrittenMicrosite.name = targetMicrosite.name;
  rewrittenMicrosite.slug = targetMicrosite.slug;
  rewrittenMicrosite.description = targetMicrosite.description ?? "";
  rewrittenMicrosite.sourceSystem = targetMicrosite.sourceSystem ?? "";
  rewrittenMicrosite.accessControlled = Boolean(
    targetMicrosite.accessControlled,
  );
  rewrittenMicrosite.version =
    targetMicrosite.version ?? Number(sourceMicrosite.version ?? 1);
  rewrittenMicrosite.published = Boolean(targetMicrosite.published);

  if (sourceMicrosite.firstPageCode) {
    rewrittenMicrosite.firstPageCode =
      pageCodeMap[String(sourceMicrosite.firstPageCode)] ??
      sourceMicrosite.firstPageCode;
  }

  if (Array.isArray(sourceMicrosite.pages)) {
    const seenPageEntries = new Set<string>();

    rewrittenMicrosite.pages = sourceMicrosite.pages
      .filter((page: JsonRecord) => {
        const pageCode = String(page.pageCode ?? "").trim();
        const pageVersion = getPageReferenceVersion(
          page as MicrositePageReference,
        );
        const pageKey = `${pageCode}:${pageVersion}`;

        if (!pageCode || seenPageEntries.has(pageKey)) {
          return false;
        }

        seenPageEntries.add(pageKey);
        return true;
      })
      .map((page: JsonRecord) => ({
        ...page,
        pageCode: pageCodeMap[String(page.pageCode)] ?? page.pageCode,
        pageVersion:
          pageVersionMap[String(page.pageCode)] ??
          getPageReferenceVersion(page as MicrositePageReference),
      }));
  }

  return rewrittenMicrosite;
};

export const rewritePageDsl = ({
  sourcePageDsl,
  sourceMicrosite,
  targetMicrosite,
  pageCodeMap,
  targetPageCode,
}: {
  sourcePageDsl: JsonRecord;
  sourceMicrosite: JsonRecord;
  targetMicrosite: DuplicateMicrositeTarget;
  pageCodeMap: Record<string, string>;
  targetPageCode: string;
}) => {
  const rewrittenPage = rewriteDslValue({
    value: deepClone(sourcePageDsl),
    pageCodeMap,
    sourceMicrositeCode: String(sourceMicrosite.code ?? ""),
    targetMicrositeCode: targetMicrosite.code,
    sourceMicrositeSlug: String(
      sourceMicrosite.slug ?? sourceMicrosite.code ?? "",
    ),
    targetMicrositeSlug: targetMicrosite.slug,
  }) as JsonRecord;

  rewrittenPage.code = targetPageCode;

  if (typeof sourcePageDsl.slug === "string") {
    rewrittenPage.slug = sourcePageDsl.slug;
  }

  return rewrittenPage;
};

const rollbackCreatedPages = async (
  workspaceCode: string,
  createdPageCodes: string[],
  version: number,
) => {
  const cleanupFailures: string[] = [];

  for (const pageCode of [...createdPageCodes].reverse()) {
    try {
      await createRequest<void>({
        endpoint: `${pageConfig.endpoint}/${pageCode}?version=${version}`,
        method: "DELETE",
        headers: { "workspace-code": workspaceCode },
      });
    } catch (_error) {
      cleanupFailures.push(pageCode);
    }
  }

  return cleanupFailures;
};

const createPagesWithProgress = async ({
  workspaceCode,
  pagesToCreate,
  onProgress,
  phase,
  total,
  currentOffset,
  label,
  version,
}: {
  workspaceCode: string;
  pagesToCreate: JsonRecord[];
  onProgress?: (progress: OperationProgress) => void;
  phase: string;
  total: number;
  currentOffset: number;
  label: string;
  version: number;
}) => {
  const createdPageCodes: string[] = [];

  try {
    for (const [index, pageDsl] of pagesToCreate.entries()) {
      emitProgress(onProgress, {
        phase,
        label,
        current: currentOffset + index,
        total,
        detail: String(pageDsl.code ?? ""),
      });

      await createRequest({
        endpoint: `${pageConfig.endpoint}?version=${version}`,
        method: "POST",
        headers: { "workspace-code": workspaceCode },
        body: pageDsl,
      });

      createdPageCodes.push(String(pageDsl.code));
    }

    return createdPageCodes;
  } catch (error) {
    const cleanupFailures = await rollbackCreatedPages(
      workspaceCode,
      createdPageCodes,
      version,
    );
    const baseMessage =
      error instanceof Error ? error.message : "Failed to create cloned pages.";

    if (cleanupFailures.length > 0) {
      throw new Error(
        `${baseMessage} Cleanup also failed for: ${cleanupFailures.join(", ")}`,
      );
    }

    throw error;
  }
};

export const createNextDraftMicrositeVersion = async ({
  workspaceCode,
  sourceMicrosite,
  currentVersion,
  onProgress,
}: {
  workspaceCode: string;
  sourceMicrosite: Microsite | JsonRecord;
  currentVersion: number;
  onProgress?: (progress: OperationProgress) => void;
}): Promise<NextDraftCreationResult> => {
  const nextVersion = currentVersion + 1;
  const targetMicrosite: DuplicateMicrositeTarget = {
    code: String(sourceMicrosite.code ?? ""),
    name: String(sourceMicrosite.name ?? ""),
    slug: String(sourceMicrosite.slug ?? sourceMicrosite.code ?? ""),
    description: String(sourceMicrosite.description ?? ""),
    sourceSystem: String(sourceMicrosite.sourceSystem ?? ""),
    accessControlled: Boolean(sourceMicrosite.accessControlled),
    version: nextVersion,
    published: false,
  };
  const uniqueSourcePageReferences = dedupePageReferences(
    (sourceMicrosite.pages ?? []).map((page: MicrositePageReference) => ({
      pageCode: String(page.pageCode ?? ""),
      pageVersion: getPageReferenceVersion(page),
    })),
  );
  const uniqueSourcePageCodes = uniqueSourcePageReferences.map(
    ({ pageCode }) => pageCode,
  );

  const pageCodeMap = Object.fromEntries(
    uniqueSourcePageCodes.map((pageCode) => [pageCode, pageCode]),
  );
  const pageVersionMap = Object.fromEntries(
    uniqueSourcePageCodes.map((pageCode) => [pageCode, nextVersion]),
  );
  const total = uniqueSourcePageCodes.length + 2;

  emitProgress(onProgress, {
    phase: "loading-source",
    label: "Loading source pages for the next draft...",
    current: 1,
    total,
  });

  const sourcePages = await fetchSourcePageDsls(
    workspaceCode,
    uniqueSourcePageReferences,
  );
  const pagesToCreate = sourcePages.map(({ pageCode, pageDsl }) =>
    rewritePageDsl({
      sourcePageDsl: pageDsl,
      sourceMicrosite: sourceMicrosite as JsonRecord,
      targetMicrosite,
      pageCodeMap,
      targetPageCode: pageCodeMap[pageCode],
    }),
  );

  const createdPageCodes = await createPagesWithProgress({
    workspaceCode,
    pagesToCreate,
    onProgress,
    phase: "creating-pages",
    total,
    currentOffset: 2,
    label: "Creating pages for the next draft...",
    version: nextVersion,
  });

  try {
    emitProgress(onProgress, {
      phase: "creating-microsite",
      label: "Creating the next draft microsite...",
      current: total,
      total,
    });

    const nextDraftMicrosite = rewriteMicrositeDsl({
      sourceMicrosite: sourceMicrosite as JsonRecord,
      targetMicrosite,
      pageCodeMap,
      pageVersionMap,
    });

    await createRequest({
      endpoint: `${micrositeConfig.endpoint}?version=${nextVersion}`,
      method: "POST",
      headers: { "workspace-code": workspaceCode },
      body: nextDraftMicrosite,
    });

    return {
      version: nextVersion,
      pageCodeMap,
    };
  } catch (error) {
    const cleanupFailures = await rollbackCreatedPages(
      workspaceCode,
      createdPageCodes,
      nextVersion,
    );
    const baseMessage =
      error instanceof Error
        ? error.message
        : "Published, but failed to create the next draft microsite.";

    if (cleanupFailures.length > 0) {
      throw new Error(
        `${baseMessage} Cleanup also failed for: ${cleanupFailures.join(", ")}`,
      );
    }

    throw error;
  }
};

export const ensureEditableMicrositeVersion = async ({
  workspaceCode,
  micrositeCode,
  onProgress,
}: {
  workspaceCode: string;
  micrositeCode: string;
  onProgress?: (progress: OperationProgress) => void;
}): Promise<EditableDraftResult> => {
  const versions = await fetchMicrositeVersions(workspaceCode, micrositeCode);
  const latestDraft = versions.find((version) => !version.published);

  if (latestDraft) {
    return {
      version: latestDraft.version,
      created: false,
    };
  }

  const latestPublished = versions.find((version) => version.published);

  if (!latestPublished) {
    throw new Error(
      "No published microsite version found to create a draft from.",
    );
  }

  const sourceMicrosite = await fetchMicrositeDsl(
    workspaceCode,
    micrositeCode,
    latestPublished.version,
  );
  const nextDraft = await createNextDraftMicrositeVersion({
    workspaceCode,
    sourceMicrosite,
    currentVersion: latestPublished.version,
    onProgress: (progress) =>
      emitProgress(onProgress, {
        ...progress,
        current: progress.current + 1,
        total: progress.total + 1,
      }),
  });

  return {
    version: nextDraft.version,
    created: true,
  };
};

export const duplicateMicrosite = async ({
  workspaceCode,
  sourceMicrosite,
  targetMicrosite,
  pageMappings,
  onProgress,
}: {
  workspaceCode: string;
  sourceMicrosite: JsonRecord;
  targetMicrosite: DuplicateMicrositeTarget;
  pageMappings: DuplicatePageCodeMapping[];
  onProgress?: (progress: OperationProgress) => void;
}) => {
  const uniquePageMappings = dedupePageMappings(pageMappings);
  const sourcePageReferenceMap = new Map<string, number>(
    (sourceMicrosite.pages ?? []).map((page: MicrositePageReference) => [
      String(page.pageCode ?? ""),
      getPageReferenceVersion(page),
    ]),
  );
  const sourcePageReferences = uniquePageMappings.map(({ sourcePageCode }) => ({
    pageCode: sourcePageCode,
    pageVersion:
      sourcePageReferenceMap.get(sourcePageCode) ?? DEFAULT_PAGE_VERSION,
  }));
  const pageCodeMap = Object.fromEntries(
    uniquePageMappings.map(({ sourcePageCode, targetPageCode }) => [
      sourcePageCode,
      targetPageCode,
    ]),
  );
  const pageVersionMap = Object.fromEntries(
    uniquePageMappings.map(({ sourcePageCode }) => [
      sourcePageCode,
      DEFAULT_PAGE_VERSION,
    ]),
  );
  const total = uniquePageMappings.length + 2;

  emitProgress(onProgress, {
    phase: "loading-source-pages",
    label: "Loading source pages...",
    current: 1,
    total,
  });

  const uniqueSourcePageDsls = dedupeSourcePageDsls(
    await fetchSourcePageDsls(workspaceCode, sourcePageReferences),
  );
  const pagesToCreate = uniqueSourcePageDsls
    .filter(({ pageCode }) => Boolean(pageCodeMap[pageCode]))
    .map(({ pageCode, pageDsl }) =>
      rewritePageDsl({
        sourcePageDsl: pageDsl,
        sourceMicrosite,
        targetMicrosite,
        pageCodeMap,
        targetPageCode: pageCodeMap[pageCode],
      }),
    );

  const createdPageCodes = await createPagesWithProgress({
    workspaceCode,
    pagesToCreate,
    onProgress,
    phase: "creating-pages",
    total,
    currentOffset: 2,
    label: "Creating duplicated pages...",
    version: targetMicrosite.version ?? DEFAULT_PAGE_VERSION,
  });

  try {
    emitProgress(onProgress, {
      phase: "creating-microsite",
      label: "Creating duplicated microsite...",
      current: total,
      total,
    });

    const duplicatedMicrosite = rewriteMicrositeDsl({
      sourceMicrosite,
      targetMicrosite,
      pageCodeMap,
      pageVersionMap,
    });

    await createRequest({
      endpoint: `${micrositeConfig.endpoint}?version=${
        targetMicrosite.version ?? DEFAULT_PAGE_VERSION
      }`,
      method: "POST",
      headers: { "workspace-code": workspaceCode },
      body: duplicatedMicrosite,
    });
  } catch (error) {
    const cleanupFailures = await rollbackCreatedPages(
      workspaceCode,
      createdPageCodes,
      targetMicrosite.version ?? DEFAULT_PAGE_VERSION,
    );
    const baseMessage =
      error instanceof Error ? error.message : "Failed to duplicate microsite.";

    if (cleanupFailures.length > 0) {
      throw new Error(
        `${baseMessage} Cleanup also failed for: ${cleanupFailures.join(", ")}`,
      );
    }

    throw error;
  }
};

export const planMicrositeDelete = async ({
  workspaceCode,
  micrositeCode,
}: {
  workspaceCode: string;
  micrositeCode: string;
}): Promise<DeleteMicrositePlan> => {
  const versions = await fetchMicrositeVersions(workspaceCode, micrositeCode);

  if (versions.length === 0) {
    throw new Error("No microsite versions found to delete.");
  }

  const detailedVersions = await Promise.all(
    versions.map(async (version) => {
      const micrositeDsl = await fetchMicrositeDsl(
        workspaceCode,
        micrositeCode,
        version.version,
      );
      const pageReferences = dedupePageReferences(
        (micrositeDsl.pages ?? []).map((page: MicrositePageReference) => ({
          pageCode: String(page.pageCode ?? ""),
          pageVersion: getPageReferenceVersion(page),
        })),
      );

      return {
        version,
        micrositeDsl,
        pageReferences,
      };
    }),
  );

  const seenPageDeletes = new Set<string>();
  const operations: DeleteMicrositeOperation[] = [];

  detailedVersions.forEach(({ version, pageReferences }) => {
    pageReferences.forEach(({ pageCode, pageVersion }) => {
      const pageKey = `${pageCode}:${pageVersion}`;
      if (seenPageDeletes.has(pageKey)) {
        return;
      }

      seenPageDeletes.add(pageKey);
      operations.push({
        id: buildDeleteOperationId(
          "page",
          micrositeCode,
          version.version,
          pageCode,
          pageVersion,
        ),
        type: "page",
        status: "pending",
        label: `Deleting page v${pageVersion}`,
        detail: pageCode,
        micrositeCode,
        micrositeVersion: version.version,
        pageCode,
        pageVersion,
        requestData: {
          endpoint: `${pageConfig.endpoint}/${encodeURIComponent(
            pageCode,
          )}?version=${pageVersion}`,
          method: "DELETE",
          headers: { "workspace-code": workspaceCode },
        },
      });
    });

    operations.push({
      id: buildDeleteOperationId(
        "micrositeVersion",
        micrositeCode,
        version.version,
      ),
      type: "micrositeVersion",
      status: "pending",
      label: `Deleting microsite version v${version.version}`,
      detail: `${micrositeCode} (${version.published ? "Published" : "Draft"})`,
      micrositeCode,
      micrositeVersion: version.version,
      requestData: {
        endpoint: `${micrositeConfig.endpoint}/${encodeURIComponent(
          micrositeCode,
        )}?version=${version.version}`,
        method: "DELETE",
        headers: { "workspace-code": workspaceCode },
      },
    });
  });

  const micrositeName = String(
    detailedVersions[0]?.micrositeDsl?.name ??
      versions[0]?.name ??
      micrositeCode,
  );

  return {
    micrositeCode,
    micrositeName,
    versions: detailedVersions.map(({ version, pageReferences }) => ({
      version: version.version,
      published: Boolean(version.published),
      pageCount: pageReferences.length,
    })),
    totalMicrositeVersions: detailedVersions.length,
    totalUniquePageVersions: seenPageDeletes.size,
    operations,
  };
};

export const executeDeleteMicrositeOperation = async (
  operation: DeleteMicrositeOperation,
) => {
  await createRequest<void>(operation.requestData);
};

export const summarizeDeleteMicrositeOperations = (
  operations: DeleteMicrositeOperation[],
): DeleteMicrositeSummary => {
  const succeeded = operations.filter(
    (operation) => operation.status === "succeeded",
  );
  const skipped = operations.filter(
    (operation) => operation.status === "skipped",
  );
  const failed = operations.filter(
    (operation) => operation.status === "failed",
  );

  return {
    result:
      skipped.length > 0 || failed.length > 0 ? "partial_success" : "success",
    totalOperations: operations.length,
    succeeded: succeeded.length,
    skipped: skipped.length,
    failed: failed.length,
    deletedMicrositeVersions: succeeded.filter(
      (operation) => operation.type === "micrositeVersion",
    ).length,
    deletedPageVersions: succeeded.filter(
      (operation) => operation.type === "page",
    ).length,
  };
};
