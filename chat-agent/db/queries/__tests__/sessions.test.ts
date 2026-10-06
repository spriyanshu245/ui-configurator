/**
 * @jest-environment node
 */

let store: Record<string, any> | null = null;

const findOneAndUpdateMock = jest.fn(async (filter: any, update: any, _opts: any) => {
  const existing = store;

  const doc: Record<string, any> = existing
    ? { ...existing, ...update.$set }
    : { ...update.$setOnInsert, ...update.$set };

  if (update.$addToSet?.clientSessionIds) {
    const id = update.$addToSet.clientSessionIds;
    const ids = new Set(doc.clientSessionIds || []);
    ids.add(id);
    doc.clientSessionIds = Array.from(ids);
  }

  store = doc;
  return doc;
});

const updateOneMock = jest.fn().mockResolvedValue({ acknowledged: true });

jest.mock("../../client", () => ({
  db: {
    collection: jest.fn(() => ({
      findOneAndUpdate: findOneAndUpdateMock,
      updateOne: updateOneMock,
    })),
  },
}));

import { sessionsOps } from "../sessions";

describe("sessionsOps.resolve", () => {
  beforeEach(() => {
    store = null;
    findOneAndUpdateMock.mockClear();
    updateOneMock.mockClear();
  });

  it("creates a new session doc on first call (upsert)", async () => {
    const session = await sessionsOps.resolve("user1", "microsite1", "tab-a");

    expect(findOneAndUpdateMock).toHaveBeenCalledTimes(1);
    const [filter, update, opts] = findOneAndUpdateMock.mock.calls[0];
    expect(filter).toEqual({ userId: "user1", micrositeId: "microsite1" });
    expect(opts).toMatchObject({ upsert: true, returnDocument: "after" });
    expect(update.$setOnInsert.userId).toBe("user1");
    expect(update.$setOnInsert.micrositeId).toBe("microsite1");

    expect(session.userId).toBe("user1");
    expect(session.micrositeId).toBe("microsite1");
    expect(session.id).toEqual(expect.any(String));
    expect(session.taskContext).toEqual({});
    expect(session.historyRefs).toEqual([]);
  });

  it("reuses the same session doc on a second call for the same (userId, micrositeId)", async () => {
    const first = await sessionsOps.resolve("user1", "microsite1", "tab-a");
    const second = await sessionsOps.resolve("user1", "microsite1", "tab-b");

    expect(findOneAndUpdateMock).toHaveBeenCalledTimes(2);
    expect(second.id).toBe(first.id);
    expect(second.clientSessionIds).toEqual(
      expect.arrayContaining(["tab-a", "tab-b"]),
    );
  });

  it("does not call $addToSet when no clientSessionId is provided", async () => {
    await sessionsOps.resolve("user2", "microsite2");
    const [, update] = findOneAndUpdateMock.mock.calls[0];
    expect(update.$addToSet).toBeUndefined();
  });
});

describe("sessionsOps.resolve edge cases", () => {
  beforeEach(() => {
    store = null;
    findOneAndUpdateMock.mockClear();
    updateOneMock.mockClear();
  });

  it("unwraps the {value} result shape and applies defaults for missing fields", async () => {
    findOneAndUpdateMock.mockResolvedValueOnce({ value: { id: "s1", userId: "u", micrositeId: "m" } } as any);

    const session = await sessionsOps.resolve("u", "m");

    expect(session).toMatchObject({
      id: "s1",
      activePageCode: null,
      clientSessionIds: [],
      taskContext: {},
      historyRefs: [],
    });
  });

  it("trims clientSessionIds to the last 10 with a follow-up $slice update", async () => {
    const ids = Array.from({ length: 12 }, (_, i) => `c${i}`);
    findOneAndUpdateMock.mockResolvedValueOnce({ id: "s1", userId: "u", micrositeId: "m", clientSessionIds: ids } as any);

    const session = await sessionsOps.resolve("u", "m", "c11");

    expect(updateOneMock).toHaveBeenCalledWith(
      { userId: "u", micrositeId: "m" },
      { $push: { clientSessionIds: { $each: [], $slice: -10 } } },
    );
    expect(session.clientSessionIds).toEqual(ids.slice(-10));
  });

  it("does not run the trim update at exactly 10 ids", async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `c${i}`);
    findOneAndUpdateMock.mockResolvedValueOnce({ id: "s1", userId: "u", micrositeId: "m", clientSessionIds: ids } as any);

    await sessionsOps.resolve("u", "m", "c9");

    expect(updateOneMock).not.toHaveBeenCalled();
  });
});

describe("sessionsOps.appendHistoryRef / setActivePage", () => {
  beforeEach(() => updateOneMock.mockClear());

  it("appendHistoryRef pushes the ref, keeping the last 20", async () => {
    const ref = { historyId: "h", patchId: "p", pagePath: "/a", createdAt: "t" };

    await sessionsOps.appendHistoryRef("u", "m", ref);

    const [filter, update, opts] = updateOneMock.mock.calls[0];
    expect(filter).toEqual({ userId: "u", micrositeId: "m" });
    expect(update.$push).toEqual({ historyRefs: { $each: [ref], $slice: -20 } });
    expect(opts).toEqual({ upsert: true });
  });

  it.each([["page-1"], [null]])("setActivePage stores %p", async (code) => {
    await sessionsOps.setActivePage("u", "m", code);

    const [filter, update, opts] = updateOneMock.mock.calls[0];
    expect(filter).toEqual({ userId: "u", micrositeId: "m" });
    expect(update.$set.activePageCode).toBe(code);
    expect(opts).toEqual({ upsert: true });
  });
});
