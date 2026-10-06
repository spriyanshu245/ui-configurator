/**
 * @jest-environment node
 */
import { ensureIndexes, ensureTempDslTtl } from "../ensure-indexes";

type MockCollection = {
  createIndex: jest.Mock;
  listIndexes: jest.Mock;
};

const collections: Record<string, MockCollection> = {};

function makeCollection(name: string): MockCollection {
  return {
    createIndex: jest.fn().mockResolvedValue(`${name}_index_created`),
    listIndexes: jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    }),
  };
}

const COLLECTION_NAMES = [
  "dsl_history",
  "conversations",
  "sessions",
  "page_ops",
  "pending_patches",
  "pending_batches",
  "skill_entries",
  "user_preferences",
  "temp_dsl",
];

jest.mock("../client", () => {
  return {
    db: {
      collection: jest.fn((name: string) => {
        return collections[name];
      }),
    },
  };
});

describe("ensureIndexes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const name of COLLECTION_NAMES) {
      collections[name] = makeCollection(name);
    }
  });

  it("creates every expected index with its explicit name", async () => {
    await ensureIndexes();

    const expected: Array<{ collection: string; name: string }> = [
      { collection: "dsl_history", name: "dsl_history_lookup" },
      { collection: "conversations", name: "conversations_lookup" },
      { collection: "sessions", name: "sessions_lookup" },
      { collection: "page_ops", name: "page_ops_lookup" },
      { collection: "pending_patches", name: "pending_patches_id" },
      { collection: "pending_patches", name: "pending_patches_ttl" },
      { collection: "pending_batches", name: "pending_batches_id" },
      { collection: "pending_batches", name: "pending_batches_ttl" },
      { collection: "pending_batches", name: "pending_batches_microsite_status" },
      { collection: "skill_entries", name: "skill_entries_mergekey" },
      { collection: "skill_entries", name: "skill_entries_compile_order" },
      { collection: "user_preferences", name: "user_preferences_key" },
      { collection: "temp_dsl", name: "temp_dsl_lookup" },
      { collection: "temp_dsl", name: "temp_dsl_ttl" },
    ];

    for (const { collection, name } of expected) {
      const createIndexCalls = collections[collection].createIndex.mock.calls;
      const matched = createIndexCalls.some(
        (call) => call[1] && call[1].name === name,
      );
      expect(matched).toBe(true);
    }
  });

  it("creates the dsl_history index WITHOUT expireAfterSeconds", async () => {
    await ensureIndexes();

    const createIndexCalls = collections["dsl_history"].createIndex.mock.calls;
    expect(createIndexCalls.length).toBeGreaterThan(0);
    for (const call of createIndexCalls) {
      const options = call[1] || {};
      expect(options.expireAfterSeconds).toBeUndefined();
    }
  });

  it("asserts pending_patches and temp_dsl TTL indexes are created with expireAfterSeconds", async () => {
    await ensureIndexes();

    const pendingPatchesCalls =
      collections["pending_patches"].createIndex.mock.calls;
    const ttlCall = pendingPatchesCalls.find(
      (call) => call[1]?.name === "pending_patches_ttl",
    );
    expect(ttlCall?.[1]?.expireAfterSeconds).toBe(0);

    const tempDslCalls = collections["temp_dsl"].createIndex.mock.calls;
    const tempDslTtlCall = tempDslCalls.find(
      (call) => call[1]?.name === "temp_dsl_ttl",
    );
    expect(tempDslTtlCall?.[1]?.expireAfterSeconds).toBe(900);

    const pendingBatchesCalls =
      collections["pending_batches"].createIndex.mock.calls;
    const batchTtlCall = pendingBatchesCalls.find(
      (call) => call[1]?.name === "pending_batches_ttl",
    );
    expect(batchTtlCall?.[1]?.expireAfterSeconds).toBe(0);
  });

  it("throws if a mocked dsl_history index reports expireAfterSeconds (guard against manual TTL mistakes)", async () => {
    collections["dsl_history"].listIndexes = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([
        { name: "dsl_history_lookup", key: { micrositeId: 1 } },
        {
          name: "some_manual_ttl_index",
          key: { createdAt: 1 },
          expireAfterSeconds: 3600,
        },
      ]),
    });

    await expect(ensureIndexes()).rejects.toThrow(/expireAfterSeconds/i);
  });

  it("does not throw when dsl_history indexes have no expireAfterSeconds", async () => {
    collections["dsl_history"].listIndexes = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([
        { name: "dsl_history_lookup", key: { micrositeId: 1 } },
        { name: "_id_", key: { _id: 1 } },
      ]),
    });

    await expect(ensureIndexes()).resolves.toBeUndefined();
  });
});

describe("ensureTempDslTtl", () => {
  beforeEach(() => {
    collections["temp_dsl"] = makeCollection("temp_dsl");
    (collections["temp_dsl"] as any).dropIndex = jest.fn().mockResolvedValue(undefined);
  });

  it("drops a legacy non-TTL createdAt index, then creates the TTL index", async () => {
    const order: string[] = [];
    const col: any = collections["temp_dsl"];
    col.listIndexes = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([
        { name: "_id_", key: { _id: 1 } },
        { name: "createdAt_1", key: { createdAt: 1 } },
        { name: "temp_dsl_lookup", key: { toolCallId: 1 }, unique: true },
      ]),
    });
    col.dropIndex = jest.fn(async (name: string) => { order.push(`drop:${name}`); });
    col.createIndex = jest.fn(async (_k: any, o: any) => { order.push(`create:${o.name}`); return o.name; });

    await ensureTempDslTtl();

    expect(order).toEqual(["drop:createdAt_1", "create:temp_dsl_ttl"]);
    expect(col.createIndex).toHaveBeenCalledWith(
      { createdAt: 1 },
      { name: "temp_dsl_ttl", expireAfterSeconds: 900 },
    );
  });

  it("keeps an already-correct TTL index", async () => {
    const col: any = collections["temp_dsl"];
    col.listIndexes = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([
        { name: "temp_dsl_ttl", key: { createdAt: 1 }, expireAfterSeconds: 900 },
      ]),
    });
    await ensureTempDslTtl();
    expect(col.dropIndex).not.toHaveBeenCalled();
  });

  it("drops a TTL index with a different expiry", async () => {
    const col: any = collections["temp_dsl"];
    col.listIndexes = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([
        { name: "temp_dsl_ttl", key: { createdAt: 1 }, expireAfterSeconds: 3600 },
      ]),
    });
    await ensureTempDslTtl();
    expect(col.dropIndex).toHaveBeenCalledWith("temp_dsl_ttl");
  });

  it("works when the collection does not exist yet", async () => {
    const col: any = collections["temp_dsl"];
    col.listIndexes = jest.fn().mockReturnValue({ toArray: jest.fn().mockRejectedValue(new Error("ns not found")) });
    await expect(ensureTempDslTtl()).resolves.toBe("temp_dsl_index_created");
  });
});
