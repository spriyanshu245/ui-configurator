import {
  buildDuplicatePageCode,
  createNextDraftMicrositeVersion,
  executeDeleteMicrositeOperation,
  duplicateMicrosite,
  ensureEditableMicrositeVersion,
  planMicrositeDelete,
  rewriteMicrositeDsl,
  rewritePageDsl,
  summarizeDeleteMicrositeOperations,
  dedupePageCodes,
  getPageReferenceVersion,
  fetchMicrositeVersions,
  fetchSourcePageDsls,
  getPageCodeSuffix,
  normalizePageCodeInput,
  normalizePageCodeSuffixInput,
  buildPageCodeWithPrefix,
} from "./micrositeOrchestration";
import { apiRequest } from "@/app/services/APIService";

jest.mock("@/app/services/APIService", () => ({
  apiRequest: jest.fn(),
}));

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const sourceMicrosite = {
  code: "application-data-entry",
  slug: "application-data-entry",
  name: "Application Data Entry",
  description: "Source microsite",
  sourceSystem: "LOS",
  accessControlled: true,
  firstPageCode: "application-data-entry_identifier",
  version: 1,
  pages: [
    { pageCode: "application-data-entry_identifier", pageVersion: 1 },
    { pageCode: "application-data-entry_applicant" },
  ],
  routeTemplate:
    "${application-data-entry.identifier.value} micrositeNav.application-data-entry.selected.applicationNumber",
};

const targetMicrosite = {
  code: "application-data-entry-copy",
  slug: "application-data-entry-copy",
  name: "Application Data Entry Copy",
  description: "Duplicated microsite",
  sourceSystem: "LOS",
  accessControlled: false,
  version: 1,
  published: false,
};

const pageCodeMap = {
  "application-data-entry_identifier":
    "application-data-entry-copy-123_identifier",
  "application-data-entry_applicant":
    "application-data-entry-copy-123_applicant",
};

describe("micrositeOrchestration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds duplicate page code suggestions while preserving the original page-name casing", () => {
    expect(
      buildDuplicatePageCode(
        "application-data-entry-copy",
        "application-data-entry_identifier",
      ),
    ).toBe("application-data-entry-copy_identifier");

    expect(
      buildDuplicatePageCode(
        "account-type-master-as-per-bureau-copy",
        "account-type-master-as-per-bureau_accountTypeMasterasperBureau",
      ),
    ).toBe(
      "account-type-master-as-per-bureau-copy_accountTypeMasterasperBureau",
    );
  });

  it("rewrites microsite DSL fields, page references, and microsite-key strings", () => {
    const rewrittenMicrosite = rewriteMicrositeDsl({
      sourceMicrosite,
      targetMicrosite,
      pageCodeMap,
      pageVersionMap: {
        "application-data-entry_identifier": 1,
        "application-data-entry_applicant": 1,
      },
    });

    expect(rewrittenMicrosite.code).toBe("application-data-entry-copy");
    expect(rewrittenMicrosite.slug).toBe("application-data-entry-copy");
    expect(rewrittenMicrosite.firstPageCode).toBe(
      "application-data-entry-copy-123_identifier",
    );
    expect(rewrittenMicrosite.pages).toEqual([
      {
        pageCode: "application-data-entry-copy-123_identifier",
        pageVersion: 1,
      },
      {
        pageCode: "application-data-entry-copy-123_applicant",
        pageVersion: 1,
      },
    ]);
    expect(rewrittenMicrosite.routeTemplate).toContain(
      "${application-data-entry-copy.identifier.value}",
    );
    expect(rewrittenMicrosite.routeTemplate).toContain(
      "micrositeNav.application-data-entry-copy.selected.applicationNumber",
    );
  });

  it("rewrites page DSL references while preserving the original page slug", () => {
    const sourcePageDsl = {
      code: "application-data-entry_identifier",
      slug: "identifier",
      name: "Identifier",
      prefillPath: "${application-data-entry.identifier.value}",
      sessionScript:
        'sessionStorage.setItem("application-data-entry.identifier.identity-verify-pan", "1"); micrositeNav.application-data-entry.selected.applicationNumber;',
      buttonTarget: "application-data-entry_applicant",
      jsObject:
        'const data = { micrositSlug: "application-data-entry" }; return data;',
    };

    const rewrittenPage = rewritePageDsl({
      sourcePageDsl,
      sourceMicrosite,
      targetMicrosite,
      pageCodeMap,
      targetPageCode: "application-data-entry-copy-123_identifier",
    });

    expect(rewrittenPage.code).toBe(
      "application-data-entry-copy-123_identifier",
    );
    expect(rewrittenPage.slug).toBe("identifier");
    expect(rewrittenPage.prefillPath).toBe(
      "${application-data-entry-copy.identifier.value}",
    );
    expect(rewrittenPage.sessionScript).toContain(
      '"application-data-entry-copy.identifier.identity-verify-pan"',
    );
    expect(rewrittenPage.sessionScript).toContain(
      "micrositeNav.application-data-entry-copy.selected.applicationNumber",
    );
    expect(rewrittenPage.buttonTarget).toBe(
      "application-data-entry-copy-123_applicant",
    );
    expect(rewrittenPage.jsObject).toContain(
      'micrositSlug: "application-data-entry-copy"',
    );
  });

  it("creates the next draft using the same page codes and incremented page versions", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({
        code: "application-data-entry_applicant",
        slug: "applicant",
        name: "Applicant",
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const result = await createNextDraftMicrositeVersion({
      workspaceCode: "engineering-workspace",
      sourceMicrosite,
      currentVersion: 1,
    });

    expect(result.version).toBe(2);
    expect(result.pageCodeMap).toEqual({
      "application-data-entry_identifier": "application-data-entry_identifier",
      "application-data-entry_applicant": "application-data-entry_applicant",
    });

    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        endpoint:
          "/api/v1/config/pages/application-data-entry_identifier?version=1",
        method: "GET",
      }),
    );
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        endpoint:
          "/api/v1/config/pages/application-data-entry_applicant?version=1",
        method: "GET",
      }),
    );
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        endpoint: "/api/v1/config/pages?version=2",
        method: "POST",
        body: expect.objectContaining({
          code: "application-data-entry_identifier",
        }),
      }),
    );
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        endpoint: "/api/v1/config/pages?version=2",
        method: "POST",
        body: expect.objectContaining({
          code: "application-data-entry_applicant",
        }),
      }),
    );
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        endpoint: "/api/v1/config/microsites?version=2",
        method: "POST",
        body: expect.objectContaining({
          code: "application-data-entry",
          version: 2,
          published: false,
          pages: [
            {
              pageCode: "application-data-entry_identifier",
              pageVersion: 2,
            },
            {
              pageCode: "application-data-entry_applicant",
              pageVersion: 2,
            },
          ],
        }),
      }),
    );
  });

  it("emits progress events while creating the next draft", async () => {
    const onProgress = jest.fn();

    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({
        code: "application-data-entry_applicant",
        slug: "applicant",
        name: "Applicant",
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await createNextDraftMicrositeVersion({
      workspaceCode: "engineering-workspace",
      sourceMicrosite,
      currentVersion: 1,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "loading-source",
        current: 1,
        total: 4,
      }),
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "creating-pages",
        current: 2,
        total: 4,
        detail: "application-data-entry_identifier",
      }),
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "creating-microsite",
        current: 4,
        total: 4,
      }),
    );
  });

  it("returns an existing editable draft without creating another one", async () => {
    mockedApiRequest.mockResolvedValueOnce([
      { version: 4, published: false },
      { version: 3, published: true },
    ]);

    const result = await ensureEditableMicrositeVersion({
      workspaceCode: "engineering-workspace",
      micrositeCode: "application-data-entry",
    });

    expect(result).toEqual({ version: 4, created: false });
    expect(mockedApiRequest).toHaveBeenCalledTimes(1);
  });

  it("emits shifted progress events when an editable draft must be created", async () => {
    const onProgress = jest.fn();

    mockedApiRequest
      .mockResolvedValueOnce([{ version: 3, published: true }])
      .mockResolvedValueOnce({
        ...sourceMicrosite,
        version: 3,
        published: true,
      })
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({
        code: "application-data-entry_applicant",
        slug: "applicant",
        name: "Applicant",
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await ensureEditableMicrositeVersion({
      workspaceCode: "engineering-workspace",
      micrositeCode: "application-data-entry",
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "loading-source",
        current: 2,
        total: 5,
      }),
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "creating-microsite",
        current: 5,
        total: 5,
      }),
    );
  });

  it("rolls back created pages if microsite duplication fails after page creation", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({
        code: "application-data-entry_applicant",
        slug: "applicant",
        name: "Applicant",
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Microsite create failed"))
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await expect(
      duplicateMicrosite({
        workspaceCode: "engineering-workspace",
        sourceMicrosite,
        targetMicrosite,
        pageMappings: [
          {
            sourcePageCode: "application-data-entry_identifier",
            targetPageCode: "application-data-entry-copy-123_identifier",
          },
          {
            sourcePageCode: "application-data-entry_applicant",
            targetPageCode: "application-data-entry-copy-123_applicant",
          },
        ],
      }),
    ).rejects.toThrow("Microsite create failed");

    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      6,
      expect.objectContaining({
        endpoint:
          "/api/v1/config/pages/application-data-entry-copy-123_applicant?version=1",
        method: "DELETE",
      }),
    );
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      7,
      expect.objectContaining({
        endpoint:
          "/api/v1/config/pages/application-data-entry-copy-123_identifier?version=1",
        method: "DELETE",
      }),
    );
  });

  it("deduplicates repeated source page references during microsite duplication", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await duplicateMicrosite({
      workspaceCode: "engineering-workspace",
      sourceMicrosite: {
        ...sourceMicrosite,
        pages: [
          { pageCode: "application-data-entry_identifier", pageVersion: 1 },
          { pageCode: "application-data-entry_identifier", pageVersion: 1 },
        ],
      },
      targetMicrosite,
      pageMappings: [
        {
          sourcePageCode: "application-data-entry_identifier",
          targetPageCode: "application-data-entry-copy-123_identifier",
        },
        {
          sourcePageCode: "application-data-entry_identifier",
          targetPageCode: "application-data-entry-copy-123_identifier",
        },
      ],
    });

    expect(mockedApiRequest).toHaveBeenCalledTimes(3);
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        endpoint:
          "/api/v1/config/pages/application-data-entry_identifier?version=1",
        method: "GET",
      }),
    );
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        endpoint: "/api/v1/config/pages?version=1",
        method: "POST",
        body: expect.objectContaining({
          code: "application-data-entry-copy-123_identifier",
        }),
      }),
    );
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        endpoint: "/api/v1/config/microsites?version=1",
        method: "POST",
        body: expect.objectContaining({
          pages: [
            {
              pageCode: "application-data-entry-copy-123_identifier",
              pageVersion: 1,
            },
          ],
        }),
      }),
    );
  });

  it("emits progress events while duplicating a microsite", async () => {
    const onProgress = jest.fn();

    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({
        code: "application-data-entry_applicant",
        slug: "applicant",
        name: "Applicant",
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await duplicateMicrosite({
      workspaceCode: "engineering-workspace",
      sourceMicrosite,
      targetMicrosite,
      pageMappings: [
        {
          sourcePageCode: "application-data-entry_identifier",
          targetPageCode: "application-data-entry-copy_identifier",
        },
        {
          sourcePageCode: "application-data-entry_applicant",
          targetPageCode: "application-data-entry-copy_applicant",
        },
      ],
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "loading-source-pages",
        current: 1,
        total: 4,
      }),
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "creating-pages",
        current: 2,
        total: 4,
        detail: "application-data-entry-copy_identifier",
      }),
    );
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "creating-microsite",
        current: 4,
        total: 4,
      }),
    );
  });

  it("builds a delete plan across all microsite versions in newest-first order", async () => {
    mockedApiRequest
      .mockResolvedValueOnce([
        { version: 3, published: true, name: "Application Data Entry" },
        { version: 2, published: false, name: "Application Data Entry" },
      ])
      .mockResolvedValueOnce({
        ...sourceMicrosite,
        version: 3,
        published: true,
        pages: [
          { pageCode: "application-data-entry_identifier", pageVersion: 3 },
          { pageCode: "application-data-entry_applicant", pageVersion: 3 },
        ],
      })
      .mockResolvedValueOnce({
        ...sourceMicrosite,
        version: 2,
        published: false,
        pages: [
          { pageCode: "application-data-entry_identifier", pageVersion: 2 },
          { pageCode: "application-data-entry_identifier", pageVersion: 2 },
          { pageCode: "application-data-entry_review", pageVersion: 2 },
        ],
      });

    const plan = await planMicrositeDelete({
      workspaceCode: "engineering-workspace",
      micrositeCode: "application-data-entry",
    });

    expect(plan.micrositeName).toBe("Application Data Entry");
    expect(plan.totalMicrositeVersions).toBe(2);
    expect(plan.totalUniquePageVersions).toBe(4);
    expect(plan.versions).toEqual([
      { version: 3, published: true, pageCount: 2 },
      { version: 2, published: false, pageCount: 2 },
    ]);
    expect(plan.operations.map((operation) => operation.detail)).toEqual([
      "application-data-entry_identifier",
      "application-data-entry_applicant",
      "application-data-entry (Published)",
      "application-data-entry_identifier",
      "application-data-entry_review",
      "application-data-entry (Draft)",
    ]);
    expect(plan.operations.map((operation) => operation.type)).toEqual([
      "page",
      "page",
      "micrositeVersion",
      "page",
      "page",
      "micrositeVersion",
    ]);
  });

  it("deduplicates repeated page references within the delete plan", async () => {
    mockedApiRequest
      .mockResolvedValueOnce([
        { version: 2, published: true, name: "Application Data Entry" },
        { version: 1, published: false, name: "Application Data Entry" },
      ])
      .mockResolvedValueOnce({
        ...sourceMicrosite,
        version: 2,
        published: true,
        pages: [
          { pageCode: "application-data-entry_identifier", pageVersion: 1 },
          { pageCode: "application-data-entry_identifier", pageVersion: 1 },
        ],
      })
      .mockResolvedValueOnce({
        ...sourceMicrosite,
        version: 1,
        published: false,
        pages: [
          { pageCode: "application-data-entry_identifier", pageVersion: 1 },
        ],
      });

    const plan = await planMicrositeDelete({
      workspaceCode: "engineering-workspace",
      micrositeCode: "application-data-entry",
    });

    expect(plan.totalUniquePageVersions).toBe(1);
    expect(plan.operations.map((operation) => operation.type)).toEqual([
      "page",
      "micrositeVersion",
      "micrositeVersion",
    ]);
  });

  it("executes the concrete delete request stored on an operation", async () => {
    mockedApiRequest.mockResolvedValueOnce({});

    await executeDeleteMicrositeOperation({
      id: "page-op",
      type: "page",
      status: "pending",
      label: "Deleting page v1",
      detail: "application-data-entry_identifier",
      micrositeCode: "application-data-entry",
      micrositeVersion: 3,
      pageCode: "application-data-entry_identifier",
      pageVersion: 1,
      requestData: {
        endpoint:
          "/api/v1/config/pages/application-data-entry_identifier?version=1",
        method: "DELETE",
        headers: { "workspace-code": "engineering-workspace" },
      },
    });

    expect(mockedApiRequest).toHaveBeenCalledWith({
      endpoint:
        "/api/v1/config/pages/application-data-entry_identifier?version=1",
      method: "DELETE",
      headers: { "workspace-code": "engineering-workspace" },
    });
  });

  it("summarizes delete operations for final reporting", () => {
    const summary = summarizeDeleteMicrositeOperations([
      {
        id: "page-success",
        type: "page",
        status: "succeeded",
        label: "Deleting page v1",
        detail: "page-one",
        micrositeCode: "ms1",
        micrositeVersion: 3,
        pageCode: "page-one",
        pageVersion: 1,
        requestData: {
          endpoint: "/api/v1/config/pages/page-one?version=1",
          method: "DELETE",
        },
      },
      {
        id: "microsite-skipped",
        type: "micrositeVersion",
        status: "skipped",
        label: "Deleting microsite version v3",
        detail: "ms1 (Published)",
        micrositeCode: "ms1",
        micrositeVersion: 3,
        requestData: {
          endpoint: "/api/v1/config/microsites/ms1?version=3",
          method: "DELETE",
        },
      },
    ]);

    expect(summary).toEqual({
      result: "partial_success",
      totalOperations: 2,
      succeeded: 1,
      skipped: 1,
      failed: 0,
      deletedMicrositeVersions: 0,
      deletedPageVersions: 1,
    });
  });

  describe("dedupePageCodes", () => {
    it("should return unique non-empty page codes", () => {
      const result = dedupePageCodes(["pg1", "pg2", "pg1", "pg3"]);
      expect(result).toEqual(["pg1", "pg2", "pg3"]);
    });

    it("should filter out empty strings and whitespace-only strings", () => {
      const result = dedupePageCodes(["pg1", "", "  ", "pg2"]);
      expect(result).toEqual(["pg1", "pg2"]);
    });

    it("should filter out null/undefined entries", () => {
      const result = dedupePageCodes([
        null as unknown as string,
        "pg1",
        undefined as unknown as string,
      ]);
      expect(result).toEqual(["pg1"]);
    });
  });

  describe("getPageReferenceVersion", () => {
    it("should return pageVersion from reference when set", () => {
      expect(getPageReferenceVersion({ pageVersion: 3 })).toBe(3);
    });

    it("should return default version 1 for null input", () => {
      expect(getPageReferenceVersion(null)).toBe(1);
    });

    it("should return default version 1 for undefined input", () => {
      expect(getPageReferenceVersion(undefined)).toBe(1);
    });

    it("should return default version 1 when pageVersion is undefined", () => {
      expect(getPageReferenceVersion({ pageCode: "pg1" })).toBe(1);
    });
  });

  describe("getPageCodeSuffix", () => {
    it("should return text after the first underscore", () => {
      expect(getPageCodeSuffix("microsite-code_identifier")).toBe("identifier");
    });

    it("should return entire pageCode when there is no underscore", () => {
      expect(getPageCodeSuffix("simple-code")).toBe("simple-code");
    });
  });

  describe("normalizePageCodeInput", () => {
    it("should lowercase, hyphenate special chars, and trim edge hyphens", () => {
      expect(normalizePageCodeInput("-Hello World-")).toBe("hello-world");
    });

    it("should handle values with leading hyphens", () => {
      expect(normalizePageCodeInput("--my-page")).toBe("my-page");
    });

    it("should handle values with trailing hyphens", () => {
      expect(normalizePageCodeInput("my-page--")).toBe("my-page");
    });
  });

  describe("normalizePageCodeSuffixInput", () => {
    it("should strip edge hyphens and replace invalid chars", () => {
      expect(normalizePageCodeSuffixInput("-Suffix-")).toBe("Suffix");
    });

    it("should handle leading hyphens", () => {
      expect(normalizePageCodeSuffixInput("---suffix")).toBe("suffix");
    });

    it("should handle trailing hyphens", () => {
      expect(normalizePageCodeSuffixInput("suffix---")).toBe("suffix");
    });
  });

  describe("buildPageCodeWithPrefix", () => {
    it("should combine microsite code and suffix with underscore", () => {
      expect(buildPageCodeWithPrefix("my-site", "page-name")).toBe(
        "my-site_page-name",
      );
    });

    it("should return empty string when targetMicrositeCode normalizes to empty", () => {
      expect(buildPageCodeWithPrefix("---", "suffix")).toBe("");
    });

    it("should return empty string when pageCodeSuffix normalizes to empty", () => {
      expect(buildPageCodeWithPrefix("my-site", "---")).toBe("");
    });

    it("should return empty string when both inputs are empty", () => {
      expect(buildPageCodeWithPrefix("", "")).toBe("");
    });
  });

  describe("fetchMicrositeVersions", () => {
    it("should return versions sorted in descending order", async () => {
      mockedApiRequest.mockResolvedValueOnce([
        { version: 1, published: false },
        { version: 3, published: true },
        { version: 2, published: false },
      ]);

      const result = await fetchMicrositeVersions("ws", "ms-code");
      expect(result[0].version).toBe(3);
      expect(result[1].version).toBe(2);
      expect(result[2].version).toBe(1);
    });
  });

  describe("fetchSourcePageDsls", () => {
    it("should fetch page DSLs for valid page references", async () => {
      mockedApiRequest.mockResolvedValueOnce({ code: "pg1", slug: "pg1" });

      const result = await fetchSourcePageDsls("ws", [
        { pageCode: "pg1", pageVersion: 2 },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].pageCode).toBe("pg1");
      expect(result[0].pageVersion).toBe(2);
      expect(mockedApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: expect.stringContaining("pg1") }),
      );
    });

    it("should skip empty string page references (normalizePageReference returns null)", async () => {
      const result = await fetchSourcePageDsls("ws", [""]);
      expect(result).toHaveLength(0);
      expect(mockedApiRequest).not.toHaveBeenCalled();
    });

    it("should skip object page references with empty pageCode", async () => {
      const result = await fetchSourcePageDsls("ws", [
        { pageCode: "", pageVersion: 1 },
      ]);
      expect(result).toHaveLength(0);
      expect(mockedApiRequest).not.toHaveBeenCalled();
    });

    it("should handle plain string page references and use default version 1", async () => {
      mockedApiRequest.mockResolvedValueOnce({ code: "pg1", slug: "pg1" });

      const result = await fetchSourcePageDsls("ws", ["pg1"]);
      expect(result).toHaveLength(1);
      expect(result[0].pageCode).toBe("pg1");
      expect(result[0].pageVersion).toBe(1);
    });

    it("should deduplicate page references with same code and version", async () => {
      mockedApiRequest.mockResolvedValueOnce({ code: "pg1" });

      const result = await fetchSourcePageDsls("ws", [
        { pageCode: "pg1", pageVersion: 1 },
        { pageCode: "pg1", pageVersion: 1 },
      ]);

      expect(result).toHaveLength(1);
      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    });
  });

  it("throws when no published microsite version found to create draft from", async () => {
    mockedApiRequest.mockResolvedValueOnce([]);

    await expect(
      ensureEditableMicrositeVersion({
        workspaceCode: "ws",
        micrositeCode: "application-data-entry",
      }),
    ).rejects.toThrow(
      "No published microsite version found to create a draft from.",
    );
  });

  it("throws when no microsite versions found to delete", async () => {
    mockedApiRequest.mockResolvedValueOnce([]);

    await expect(
      planMicrositeDelete({
        workspaceCode: "ws",
        micrositeCode: "application-data-entry",
      }),
    ).rejects.toThrow("No microsite versions found to delete.");
  });

  it("throws enhanced error when createNextDraftMicrositeVersion microsite POST fails and rollback also fails", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Microsite POST failed"))
      .mockRejectedValueOnce(new Error("Rollback DELETE failed"));

    await expect(
      createNextDraftMicrositeVersion({
        workspaceCode: "ws",
        sourceMicrosite: {
          ...sourceMicrosite,
          pages: [
            { pageCode: "application-data-entry_identifier", pageVersion: 1 },
          ],
        },
        currentVersion: 1,
      }),
    ).rejects.toThrow("Cleanup also failed for:");
  });

  it("throws when createNextDraftMicrositeVersion microsite POST fails and rollback succeeds", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Microsite POST failed"))
      .mockResolvedValueOnce({});

    await expect(
      createNextDraftMicrositeVersion({
        workspaceCode: "ws",
        sourceMicrosite: {
          ...sourceMicrosite,
          pages: [
            { pageCode: "application-data-entry_identifier", pageVersion: 1 },
          ],
        },
        currentVersion: 1,
      }),
    ).rejects.toThrow("Microsite POST failed");
  });

  it("throws enhanced error when page creation fails and rollback also fails during page creation", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({
        code: "application-data-entry_applicant",
        slug: "applicant",
        name: "Applicant",
      })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Page creation failed"))
      .mockRejectedValueOnce(new Error("Rollback DELETE failed"));

    await expect(
      duplicateMicrosite({
        workspaceCode: "ws",
        sourceMicrosite,
        targetMicrosite,
        pageMappings: [
          {
            sourcePageCode: "application-data-entry_identifier",
            targetPageCode: "application-data-entry-copy_identifier",
          },
          {
            sourcePageCode: "application-data-entry_applicant",
            targetPageCode: "application-data-entry-copy_applicant",
          },
        ],
      }),
    ).rejects.toThrow("Cleanup also failed for:");
  });

  it("throws when page creation fails and rollback succeeds during page creation", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({
        code: "application-data-entry_applicant",
        slug: "applicant",
        name: "Applicant",
      })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Page creation failed"))
      .mockResolvedValueOnce({});

    await expect(
      duplicateMicrosite({
        workspaceCode: "ws",
        sourceMicrosite,
        targetMicrosite,
        pageMappings: [
          {
            sourcePageCode: "application-data-entry_identifier",
            targetPageCode: "application-data-entry-copy_identifier",
          },
          {
            sourcePageCode: "application-data-entry_applicant",
            targetPageCode: "application-data-entry-copy_applicant",
          },
        ],
      }),
    ).rejects.toThrow("Page creation failed");
  });

  it("throws enhanced error when duplicateMicrosite microsite POST fails and rollback also fails", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Microsite POST failed"))
      .mockRejectedValueOnce(new Error("Rollback DELETE failed"));

    await expect(
      duplicateMicrosite({
        workspaceCode: "ws",
        sourceMicrosite: {
          ...sourceMicrosite,
          pages: [
            { pageCode: "application-data-entry_identifier", pageVersion: 1 },
          ],
        },
        targetMicrosite,
        pageMappings: [
          {
            sourcePageCode: "application-data-entry_identifier",
            targetPageCode: "application-data-entry-copy_identifier",
          },
        ],
      }),
    ).rejects.toThrow("Cleanup also failed for:");
  });

  it("uses default error message for non-Error rejection in createPagesWithProgress", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({
        code: "application-data-entry_applicant",
        slug: "applicant",
        name: "Applicant",
      })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce("non-error rejection")
      .mockRejectedValueOnce(new Error("Rollback failed"));

    await expect(
      duplicateMicrosite({
        workspaceCode: "ws",
        sourceMicrosite,
        targetMicrosite,
        pageMappings: [
          {
            sourcePageCode: "application-data-entry_identifier",
            targetPageCode: "application-data-entry-copy_identifier",
          },
          {
            sourcePageCode: "application-data-entry_applicant",
            targetPageCode: "application-data-entry-copy_applicant",
          },
        ],
      }),
    ).rejects.toThrow("Failed to create cloned pages.");
  });

  it("uses default error message for non-Error rejection in createNextDraftMicrositeVersion microsite POST", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce("non-error rejection")
      .mockRejectedValueOnce(new Error("Rollback failed"));

    await expect(
      createNextDraftMicrositeVersion({
        workspaceCode: "ws",
        sourceMicrosite: {
          ...sourceMicrosite,
          pages: [
            { pageCode: "application-data-entry_identifier", pageVersion: 1 },
          ],
        },
        currentVersion: 1,
      }),
    ).rejects.toThrow(
      "Published, but failed to create the next draft microsite.",
    );
  });

  it("uses default error message for non-Error rejection in duplicateMicrosite microsite POST", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce("non-error rejection")
      .mockRejectedValueOnce(new Error("Rollback failed"));

    await expect(
      duplicateMicrosite({
        workspaceCode: "ws",
        sourceMicrosite: {
          ...sourceMicrosite,
          pages: [
            { pageCode: "application-data-entry_identifier", pageVersion: 1 },
          ],
        },
        targetMicrosite,
        pageMappings: [
          {
            sourcePageCode: "application-data-entry_identifier",
            targetPageCode: "application-data-entry-copy_identifier",
          },
        ],
      }),
    ).rejects.toThrow("Failed to duplicate microsite.");
  });

  it("rewrites microsite DSL when sourceMicrosite has no slug and targetMicrosite has no description/sourceSystem/version", () => {
    const result = rewriteMicrositeDsl({
      sourceMicrosite: {
        code: "ms-code",
        firstPageCode: "ms-code_unknown",
        version: null,
        pages: [{ pageCode: "ms-code_page1", pageVersion: 2 }],
      },
      targetMicrosite: {
        code: "ms-copy",
        name: "MS Copy",
        slug: "ms-copy",
        description: undefined,
        sourceSystem: undefined,
        version: undefined,
        published: false,
      },
      pageCodeMap: { "ms-code_page1": "ms-copy_page1" },
      pageVersionMap: {},
    });

    expect(result.code).toBe("ms-copy");
    expect(result.description).toBe("");
    expect(result.sourceSystem).toBe("");
    expect(result.version).toBe(1);
    expect(result.firstPageCode).toBe("ms-code_unknown");
  });

  it("rewrites microsite DSL when sourceMicrosite has no slug and no code", () => {
    const result = rewriteMicrositeDsl({
      sourceMicrosite: {
        slug: null,
        code: null,
        pages: [],
      },
      targetMicrosite: {
        code: "ms-copy",
        name: "MS Copy",
        slug: "ms-copy",
        published: false,
      },
      pageCodeMap: {},
    });

    expect(result.code).toBe("ms-copy");
    expect(result.pages).toEqual([]);
  });

  it("rewrites microsite DSL when targetMicrosite has no version but sourceMicrosite has version", () => {
    const result = rewriteMicrositeDsl({
      sourceMicrosite: { code: "ms", slug: "ms", version: 5, pages: [] },
      targetMicrosite: {
        code: "ms-copy",
        name: "MS Copy",
        slug: "ms-copy",
        version: undefined,
        published: false,
      },
      pageCodeMap: {},
    });

    expect(result.version).toBe(5);
  });

  it("rewrites microsite DSL when pageVersionMap does not contain a page code", () => {
    const result = rewriteMicrositeDsl({
      sourceMicrosite: {
        code: "ms",
        slug: "ms",
        pages: [{ pageCode: "ms_page1", pageVersion: 3 }],
      },
      targetMicrosite: {
        code: "ms-copy",
        name: "MS Copy",
        slug: "ms-copy",
        version: 1,
        published: false,
      },
      pageCodeMap: { ms_page1: "ms-copy_page1" },
      pageVersionMap: {},
    });

    expect(
      (result.pages as { pageCode: string; pageVersion: number }[])[0].pageCode,
    ).toBe("ms-copy_page1");
    expect(
      (result.pages as { pageCode: string; pageVersion: number }[])[0]
        .pageVersion,
    ).toBe(3);
  });

  it("rewrites page DSL when sourceMicrosite has no slug", () => {
    const result = rewritePageDsl({
      sourcePageDsl: { code: "ms_page1", slug: "page1" },
      sourceMicrosite: { code: "ms", slug: null },
      targetMicrosite: {
        code: "ms-copy",
        name: "MS Copy",
        slug: "ms-copy",
        published: false,
      },
      pageCodeMap: {},
      targetPageCode: "ms-copy_page1",
    });

    expect(result.code).toBe("ms-copy_page1");
    expect(result.slug).toBe("page1");
  });

  it("fetches page DSLs with object reference having null pageCode (covers ??) ", async () => {
    const result = await fetchSourcePageDsls("ws", [
      { pageCode: null as unknown as string, pageVersion: 1 },
    ]);
    expect(result).toHaveLength(0);
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it("createNextDraftMicrositeVersion handles sourceMicrosite with null/undefined properties", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Microsite POST failed"));

    await expect(
      createNextDraftMicrositeVersion({
        workspaceCode: "ws",
        sourceMicrosite: {
          code: null,
          name: null,
          slug: null,
          description: null,
          sourceSystem: null,
          accessControlled: null,
          pages: [{ pageCode: "page1", pageVersion: 1 }],
        },
        currentVersion: 1,
      }),
    ).rejects.toThrow("Microsite POST failed");
  });

  it("duplicateMicrosite handles sourceMicrosite with null pages", async () => {
    mockedApiRequest
      .mockResolvedValueOnce({
        code: "application-data-entry_identifier",
        slug: "identifier",
        name: "Identifier",
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await duplicateMicrosite({
      workspaceCode: "ws",
      sourceMicrosite: {
        ...sourceMicrosite,
        pages: null as unknown as never[],
      },
      targetMicrosite: { ...targetMicrosite, version: undefined },
      pageMappings: [
        {
          sourcePageCode: "application-data-entry_identifier",
          targetPageCode: "application-data-entry-copy_identifier",
        },
      ],
    });

    expect(mockedApiRequest).toHaveBeenCalledTimes(3);
  });

  it("planMicrositeDelete handles micrositeDsl with no pages property", async () => {
    mockedApiRequest
      .mockResolvedValueOnce([{ version: 1, published: true, name: "Test MS" }])
      .mockResolvedValueOnce({ name: "Test MS" });

    const plan = await planMicrositeDelete({
      workspaceCode: "ws",
      micrositeCode: "test-ms",
    });
    expect(plan.totalUniquePageVersions).toBe(0);
    expect(plan.operations.map((op) => op.type)).toEqual(["micrositeVersion"]);
  });

  it("summarizeDeleteMicrositeOperations returns success when all operations succeeded", () => {
    const summary = summarizeDeleteMicrositeOperations([
      {
        id: "ms-success",
        type: "micrositeVersion",
        status: "succeeded",
        label: "Deleting ms v1",
        detail: "ms1 (Published)",
        micrositeCode: "ms1",
        micrositeVersion: 1,
        requestData: {
          endpoint: "/api/v1/config/microsites/ms1?version=1",
          method: "DELETE",
        },
      },
      {
        id: "page-success",
        type: "page",
        status: "succeeded",
        label: "Deleting page",
        detail: "page1",
        micrositeCode: "ms1",
        micrositeVersion: 1,
        pageCode: "page1",
        pageVersion: 1,
        requestData: {
          endpoint: "/api/v1/config/pages/page1?version=1",
          method: "DELETE",
        },
      },
    ]);

    expect(summary.result).toBe("success");
    expect(summary.deletedMicrositeVersions).toBe(1);
    expect(summary.deletedPageVersions).toBe(1);
  });
});
