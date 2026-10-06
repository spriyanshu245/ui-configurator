/**
 * @jest-environment node
 */

type FakeDoc = Record<string, any>;

let rows: FakeDoc[] = [];
let idCounter = 0;

function matches(row: FakeDoc, filter: FakeDoc): boolean {
  return Object.entries(filter).every(([key, value]) => {
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

  it("get() returns undefined when the preference does not exist", async () => {
    await expect(userPreferences.get("user1", "microsite1", "missing")).resolves.toBeUndefined();
  });

  it("set() overwrites an existing value instead of duplicating the row", async () => {
    await userPreferences.set("user1", "microsite1", "theme", "dark");
    await userPreferences.set("user1", "microsite1", "theme", "light");

    expect(rows).toHaveLength(1);
    expect((await userPreferences.get("user1", "microsite1", "theme"))?.value).toBe("light");
  });

  it("set() stamps updatedAt as an ISO string", async () => {
    await userPreferences.set("user1", "microsite1", "theme", "dark");

    const row = await userPreferences.get("user1", "microsite1", "theme");
    expect(new Date(row!.updatedAt).toISOString()).toBe(row!.updatedAt);
  });
});
