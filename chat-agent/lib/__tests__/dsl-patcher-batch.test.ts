/**
 * @jest-environment node
 */

jest.mock("../microsite-loader", () => ({
  fetchMicrositePages: jest.fn(),
  fetchPageDsl: jest.fn(),
}));

import { queueBatch, updateDslCache } from "../dsl-patcher";
import { fetchMicrositePages, fetchPageDsl } from "../microsite-loader";

const fetchMicrositePagesMock = fetchMicrositePages as jest.Mock;
const fetchPageDslMock = fetchPageDsl as jest.Mock;

function makeDsl(value: string) {
  return {
    id: "root",
    type: "root",
    components: [
      { id: "a", type: "root", properties: { value } },
    ],
  };
}

describe("queueBatch", () => {
  beforeEach(() => {
    fetchMicrositePagesMock.mockReset();
    fetchPageDslMock.mockReset();
  });

  it("returns a batch with N operations, all status pending, when every page validates", async () => {
    fetchMicrositePagesMock.mockResolvedValue({
      pages: [
        { pageCode: "/home", pageVersion: 1 },
        { pageCode: "/about", pageVersion: 1 },
      ],
    });
    fetchPageDslMock
      .mockResolvedValueOnce(makeDsl("home-old"))
      .mockResolvedValueOnce(makeDsl("about-old"));

    const args = {
      microsite_id: "m1",
      batch_description: "Update home and about",
      navigate_to: "/about",
      operations: [
        {
          page_path: "/home",
          patch: [{ op: "replace", path: "/components/0/properties/value", value: "home-new" }],
          description: "Update home text",
          preview_hint: "Text changes on home",
          affected_components: ["a"],
        },
        {
          page_path: "/about",
          patch: [{ op: "replace", path: "/components/0/properties/value", value: "about-new" }],
          description: "Update about text",
          preview_hint: "Text changes on about",
          affected_components: ["a"],
        },
      ],
    };

    const result = await queueBatch(args, "session-1") as any;

    expect(result.error).toBeUndefined();
    expect(result.micrositeId).toBe("m1");
    expect(result.batchDescription).toBe("Update home and about");
    expect(result.navigateTo).toBe("/about");
    expect(result.status).toBe("pending");
    expect(result.operations).toHaveLength(2);
    for (const op of result.operations) {
      expect(op.status).toBe("pending");
    }
    expect(result.operations[0].pagePath).toBe("/home");
    expect(result.operations[0].patchedDsl.components[0].properties.value).toBe("home-new");
    expect(result.operations[1].pagePath).toBe("/about");
    expect(result.operations[1].patchedDsl.components[0].properties.value).toBe("about-new");
    expect(typeof result.id).toBe("string");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it("returns {error} and queues NOTHING when one page's patch is invalid, leaving dslCache/DB untouched", async () => {
    fetchMicrositePagesMock.mockResolvedValue({
      pages: [
        { pageCode: "/home", pageVersion: 1 },
        { pageCode: "/contact", pageVersion: 1 },
      ],
    });
    fetchPageDslMock
      .mockResolvedValueOnce(makeDsl("home-old"))
      .mockResolvedValueOnce(makeDsl("contact-old"));

    const args = {
      microsite_id: "m1",
      batch_description: "Update home and contact",
      operations: [
        {
          page_path: "/home",
          patch: [{ op: "replace", path: "/components/0/properties/value", value: "home-new" }],
          description: "Update home text",
          preview_hint: "hint",
          affected_components: ["a"],
        },
        {
          page_path: "/contact",
          // Invalid: path does not exist on the DSL.
          patch: [{ op: "replace", path: "/components/5/properties/value", value: "oops" }],
          description: "Update contact text",
          preview_hint: "hint",
          affected_components: ["a"],
        },
      ],
    };

    const result = await queueBatch(args, "session-1") as any;

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/Validation failed on page "\/contact"/);
    expect(result.id).toBeUndefined();
    expect(result.operations).toBeUndefined();
  });

  it("returns {error} when a page is not found in the microsite, without queuing anything", async () => {
    fetchMicrositePagesMock.mockResolvedValue({
      pages: [{ pageCode: "/home", pageVersion: 1 }],
    });
    fetchPageDslMock.mockResolvedValueOnce(makeDsl("home-old"));

    const args = {
      microsite_id: "m1",
      batch_description: "Update home and missing page",
      operations: [
        {
          page_path: "/home",
          patch: [{ op: "replace", path: "/components/0/properties/value", value: "home-new" }],
          description: "d",
          preview_hint: "h",
          affected_components: [],
        },
        {
          page_path: "/does-not-exist",
          patch: [{ op: "replace", path: "/components/0/properties/value", value: "x" }],
          description: "d",
          preview_hint: "h",
          affected_components: [],
        },
      ],
    };

    const result = await queueBatch(args, "session-1") as any;

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/Validation failed on page "\/does-not-exist"/);
    expect(result.error).toMatch(/not found in microsite/);
  });

  it("returns {error} when operations is empty", async () => {
    const result = await queueBatch(
      { microsite_id: "m1", batch_description: "empty", operations: [] },
      "session-1",
    ) as any;
    expect(result.error).toBeDefined();
    expect(fetchMicrositePagesMock).not.toHaveBeenCalled();
  });

  it("uses the dslCache instead of re-fetching when a page's current DSL is already cached", async () => {
    updateDslCache("/cached-page", makeDsl("cached-value"));

    const args = {
      microsite_id: "m1",
      batch_description: "Uses cache",
      operations: [
        {
          page_path: "/cached-page",
          patch: [{ op: "replace", path: "/components/0/properties/value", value: "new-cached-value" }],
          description: "d",
          preview_hint: "h",
          affected_components: [],
        },
      ],
    };

    const result = await queueBatch(args, "session-1") as any;

    expect(result.error).toBeUndefined();
    expect(fetchMicrositePagesMock).not.toHaveBeenCalled();
    expect(fetchPageDslMock).not.toHaveBeenCalled();
    expect(result.operations[0].patchedDsl.components[0].properties.value).toBe("new-cached-value");
  });
});
