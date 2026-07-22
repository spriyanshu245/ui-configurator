/**
 * @jest-environment node
 */

type FakeDoc = Record<string, any>;

let rows: FakeDoc[] = [];
let idCounter = 0;

function matches(row: FakeDoc, filter: FakeDoc): boolean {
  return Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === "object" && "$exists" in value) {
      const exists = Object.hasOwn(row, key);
      return exists === value.$exists;
    }
    return row[key] === value;
  });
}

function matchesQuery(row: FakeDoc, query: FakeDoc): boolean {
  if (query.$or) {
    return query.$or.some((clause: FakeDoc) => matches(row, clause));
  }
  return matches(row, query);
}

const collectionApi = {
  find: jest.fn((query: FakeDoc = {}) => ({
    toArray: async () => rows.filter((r) => matchesQuery(r, query)),
  })),
  findOne: jest.fn(async (query: FakeDoc) => rows.find((r) => matches(r, query)) || null),
  updateOne: jest.fn(async (filter: FakeDoc, update: FakeDoc, opts: FakeDoc = {}) => {
    let row = rows.find((r) => matches(r, filter));
    if (!row) {
      if (!opts.upsert) return { matchedCount: 0 };
      row = { _id: `id-${idCounter++}`, ...filter };
      rows.push(row);
    }
    if (update.$set) {
      Object.assign(row, update.$set);
    }
    return { acknowledged: true };
  }),
};

jest.mock("../../client", () => ({
  db: {
    collection: jest.fn(() => collectionApi),
  },
}));

import { userPreferences, GLOBAL_SCOPE } from "../user-preferences";

describe("userPreferences", () => {
  beforeEach(() => {
    rows = [];
    idCounter = 0;
    jest.clearAllMocks();
  });

  it("set() then get() round-trips a value scoped by (userId, micrositeId, key)", async () => {
    await userPreferences.set("user1", "microsite1", "theme", "dark");

    const result = await userPreferences.get("user1", "microsite1", "theme");
    expect(result?.value).toBe("dark");
    expect(result?.userId).toBe("user1");
    expect(result?.micrositeId).toBe("microsite1");
  });

  it("scopes preferences per user + microsite — different users/microsites don't collide", async () => {
    await userPreferences.set("user1", "microsite1", "theme", "dark");
    await userPreferences.set("user2", "microsite1", "theme", "light");
    await userPreferences.set("user1", "microsite2", "theme", "solarized");

    expect((await userPreferences.get("user1", "microsite1", "theme"))?.value).toBe("dark");
    expect((await userPreferences.get("user2", "microsite1", "theme"))?.value).toBe("light");
    expect((await userPreferences.get("user1", "microsite2", "theme"))?.value).toBe("solarized");
  });

  it("findAll returns per-user rows plus __global__ rows", async () => {
    await userPreferences.set("user1", "microsite1", "theme", "dark");
    await userPreferences.set(GLOBAL_SCOPE, GLOBAL_SCOPE, "default_layout", "grid");
    await userPreferences.set("user2", "microsite1", "theme", "light");

    const all = await userPreferences.findAll("user1", "microsite1");
    const keys = all.map((p) => p.key);
    expect(keys).toContain("theme");
    expect(keys).toContain("default_layout");
    expect(all.find((p) => p.key === "theme")?.value).toBe("dark");
    // user2's row must not leak into user1's findAll
    expect(all.some((p) => p.userId === "user2")).toBe(false);
  });

  describe("migrateGlobalPrefs", () => {
    it("migrates legacy rows (no userId) to userId/micrositeId = __global__", async () => {
      rows.push({ _id: "legacy-1", key: "legacy_key", value: "legacy_value", updatedAt: "2020-01-01" });

      const result = await userPreferences.migrateGlobalPrefs();
      expect(result.migrated).toBe(1);

      const migrated = rows.find((r) => r._id === "legacy-1");
      expect(migrated?.userId).toBe(GLOBAL_SCOPE);
      expect(migrated?.micrositeId).toBe(GLOBAL_SCOPE);
    });

    it("is idempotent — running twice migrates 0 the second time", async () => {
      rows.push({ _id: "legacy-2", key: "legacy_key2", value: "v", updatedAt: "2020-01-01" });

      const first = await userPreferences.migrateGlobalPrefs();
      expect(first.migrated).toBe(1);

      const second = await userPreferences.migrateGlobalPrefs();
      expect(second.migrated).toBe(0);
    });

    it("does not touch rows that already have a userId", async () => {
      await userPreferences.set("user1", "microsite1", "theme", "dark");

      const result = await userPreferences.migrateGlobalPrefs();
      expect(result.migrated).toBe(0);

      const row = await userPreferences.get("user1", "microsite1", "theme");
      expect(row?.userId).toBe("user1");
    });
  });
});
