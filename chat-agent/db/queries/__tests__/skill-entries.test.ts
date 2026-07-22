/**
 * @jest-environment node
 */

const findOneMock = jest.fn();
const findOneAndUpdateMock = jest.fn();
const updateOneMock = jest.fn();
const updateManyMock = jest.fn();
const countDocumentsMock = jest.fn();
const deleteManyMock = jest.fn();

function makeCursor(rows: any[]) {
  return {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue(rows),
  };
}

let findReturnRows: any[] = [];
const findMock = jest.fn((_query?: any) => makeCursor(findReturnRows));

jest.mock("../../client", () => ({
  db: {
    collection: jest.fn(() => ({
      find: findMock,
      findOne: findOneMock,
      findOneAndUpdate: findOneAndUpdateMock,
      updateOne: updateOneMock,
      updateMany: updateManyMock,
      countDocuments: countDocumentsMock,
      deleteMany: deleteManyMock,
    })),
  },
}));

import { skillEntries, buildMergeKey, mergeContent } from "../skill-entries";

describe("buildMergeKey", () => {
  it("slugifies title and joins with category", () => {
    expect(buildMergeKey("component_pattern", "Table Session-Data Binding!")).toBe(
      "component_pattern::table-session-data-binding",
    );
  });

  it("collapses whitespace and strips punctuation", () => {
    expect(buildMergeKey("dsl_rule", "  Multiple   Spaces & Punct.!! ")).toBe(
      "dsl_rule::multiple-spaces-punct",
    );
  });
});

describe("mergeContent", () => {
  it("returns new content when there is no existing content", () => {
    expect(mergeContent(undefined, "Fresh content.")).toBe("Fresh content.");
    expect(mergeContent("", "Fresh content.")).toBe("Fresh content.");
  });

  it("keeps existing content when new content is > 0.6 Jaccard similar (dedup, no duplicate paragraph)", () => {
    const existing = "On a Table component, set storeDataInSession true with apiName and pathToTableData.";
    const similar = "On a Table component, set storeDataInSession true with apiName and pathToTableData values.";
    const result = mergeContent(existing, similar);
    expect(result).toBe(existing);
  });

  it("appends new content as a paragraph when sufficiently different", () => {
    const existing = "Forms use storePrefillInSession with prefillApiName.";
    const different = "Tables use storeDataInSession with apiName and pathToTableData and nameKeyIds for writes.";
    const result = mergeContent(existing, different);
    expect(result).toContain(existing);
    expect(result).toContain(different);
  });

  it("caps total sentences to ~5, truncating the oldest first", () => {
    const existing = "S1. S2. S3. S4.";
    const different = "Completely unrelated brand new distinct sentence about routing keys.";
    const result = mergeContent(existing, different);
    const sentences = result.split(/(?<=[.!?])\s+/).filter(Boolean);
    expect(sentences.length).toBeLessThanOrEqual(5);
    // The newest sentence must survive truncation.
    expect(result).toContain("routing keys");
  });
});

describe("skillEntries.upsert", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findReturnRows = [];
  });

  it("uses an atomic findOneAndUpdate keyed on mergeKey (no find-then-write)", async () => {
    findOneMock.mockResolvedValue(null);
    findOneAndUpdateMock.mockResolvedValue({
      id: "new-id",
      mergeKey: "component_pattern::table-session-data-binding",
    });

    const id = await skillEntries.upsert({
      category: "component_pattern",
      title: "Table session-data binding",
      content: "Uses storeDataInSession, apiName, pathToTableData, nameKeyIds.",
      confidence: 0.7,
      source: "agent_reflection",
    });

    expect(findOneAndUpdateMock).toHaveBeenCalledTimes(1);
    const [filter, update, opts] = findOneAndUpdateMock.mock.calls[0];
    expect(filter).toEqual({ mergeKey: "component_pattern::table-session-data-binding" });
    expect(update.$setOnInsert.mergeKey).toBe("component_pattern::table-session-data-binding");
    expect(update.$setOnInsert.usageCount).toBe(0);
    expect(opts).toEqual({ upsert: true, returnDocument: "after" });
    expect(id).toBe("new-id");
  });

  it("does NOT increment usageCount on upsert", async () => {
    findOneMock.mockResolvedValue({ content: "existing", confidence: 0.5 });
    findOneAndUpdateMock.mockResolvedValue({ id: "existing-id" });

    await skillEntries.upsert({
      category: "dsl_rule",
      title: "Some rule",
      content: "New content here.",
      confidence: 0.8,
      source: "agent_reflection",
    });

    const [, update] = findOneAndUpdateMock.mock.calls[0];
    expect(update.$set.usageCount).toBeUndefined();
    expect(update.$setOnInsert.usageCount).toBe(0);
  });

  it("takes the max confidence between new and existing", async () => {
    findOneMock.mockResolvedValue({ content: "existing content", confidence: 0.9 });
    findOneAndUpdateMock.mockResolvedValue({ id: "id1" });

    await skillEntries.upsert({
      category: "dsl_rule",
      title: "Some rule",
      content: "Totally different unrelated content about routing.",
      confidence: 0.3,
      source: "agent_reflection",
    });

    const [, update] = findOneAndUpdateMock.mock.calls[0];
    expect(update.$set.confidence).toBe(0.9);
  });
});

describe("skillEntries.markUsed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("increments usageCount and sets lastUsedAt for the given ids", async () => {
    updateManyMock.mockResolvedValue({ acknowledged: true });
    await skillEntries.markUsed(["a", "b"]);

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    const [filter, update] = updateManyMock.mock.calls[0];
    expect(filter).toEqual({ id: { $in: ["a", "b"] } });
    expect(update.$inc).toEqual({ usageCount: 1 });
    expect(update.$set.lastUsedAt).toBeDefined();
  });

  it("no-ops for an empty id list", async () => {
    await skillEntries.markUsed([]);
    expect(updateManyMock).not.toHaveBeenCalled();
  });
});

describe("skillEntries.enforceBounds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findReturnRows = [];
  });

  it("decays confidence for entries not updated in 30+ days", async () => {
    const staleDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    findMock.mockImplementation((query: any) => {
      if (query?.updatedAt) {
        return makeCursor([{ id: "stale-1", confidence: 0.8, updatedAt: staleDate }]);
      }
      return makeCursor([]);
    });
    countDocumentsMock.mockResolvedValue(1);

    await skillEntries.enforceBounds(150);

    expect(updateOneMock).toHaveBeenCalledWith(
      { id: "stale-1" },
      { $set: { confidence: expect.closeTo(0.76, 5) } },
    );
  });

  it("floors decayed confidence at 0.05", async () => {
    const staleDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    findMock.mockImplementation((query: any) => {
      if (query?.updatedAt) {
        return makeCursor([{ id: "stale-2", confidence: 0.01, updatedAt: staleDate }]);
      }
      return makeCursor([]);
    });
    countDocumentsMock.mockResolvedValue(1);

    await skillEntries.enforceBounds(150);

    expect(updateOneMock).toHaveBeenCalledWith(
      { id: "stale-2" },
      { $set: { confidence: 0.05 } },
    );
  });

  it("evicts lowest-scored non-seed entries when over maxEntries, and never evicts source:seed", async () => {
    findMock.mockImplementation((query: any) => {
      if (query?.updatedAt) {
        return makeCursor([]); // no stale entries in this test
      }
      if (query?.source) {
        // eviction candidate query excludes seeds
        return makeCursor([{ id: "low-1" }, { id: "low-2" }]);
      }
      return makeCursor([]);
    });
    countDocumentsMock.mockResolvedValue(152); // 2 over the cap of 150

    await skillEntries.enforceBounds(150);

    // Eviction query must exclude seeds
    const calls = findMock.mock.calls as unknown as any[][];
    const evictionFindCall = calls.find((c) => c[0]?.source);
    expect(evictionFindCall?.[0]).toEqual({ source: { $ne: "seed" } });

    expect(deleteManyMock).toHaveBeenCalledWith({ id: { $in: ["low-1", "low-2"] } });
  });

  it("does not evict anything when under maxEntries", async () => {
    findMock.mockImplementation(() => makeCursor([]));
    countDocumentsMock.mockResolvedValue(10);

    await skillEntries.enforceBounds(150);

    expect(deleteManyMock).not.toHaveBeenCalled();
  });
});
