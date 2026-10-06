/**
 * @jest-environment node
 */
const insertOne = jest.fn();
const deleteMany = jest.fn();
const updateOne = jest.fn();
const findOne = jest.fn();
const toArray = jest.fn();
const find = jest.fn(() => ({ toArray }));

jest.mock("../../client", () => ({
  db: { collection: jest.fn(() => ({ insertOne, deleteMany, findOne, find, updateOne })) },
}));
jest.mock("uuid", () => ({ v4: () => "uuid-1" }));

import { dslHistory, sessionOps } from "../dsl-history";

const row = {
  _id: "mongo-id",
  id: "h1",
  micrositeId: "m1",
  pagePath: "/home",
  dslSnapshot: { a: 1 },
  operation: "patch_applied",
  patchApplied: [{ op: "add" }],
  description: "d",
  approvedBy: "u1",
  sessionId: "s1",
  wasEdited: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  insertOne.mockResolvedValue({});
  deleteMany.mockResolvedValue({});
  updateOne.mockResolvedValue({});
  toArray.mockResolvedValue([]);
});

describe("dslHistory.saveSnapshot", () => {
  const entry = {
    micrositeId: "m1",
    pagePath: "/home",
    dslSnapshot: { a: 1 },
    operation: "patch_applied" as const,
    description: "d",
    approvedBy: "u1",
  };

  it("inserts a document with a generated id and returns it, defaulting optional fields", async () => {
    const id = await dslHistory.saveSnapshot(entry);

    expect(id).toBe("uuid-1");
    const doc = insertOne.mock.calls[0][0];
    expect(doc).toMatchObject({
      id: "uuid-1",
      micrositeId: "m1",
      pagePath: "/home",
      patchApplied: null,
      wasEdited: false,
    });
    expect(new Date(doc.createdAt).toISOString()).toBe(doc.createdAt);
  });

  it("keeps provided patchApplied, sessionId and wasEdited", async () => {
    await dslHistory.saveSnapshot({ ...entry, patchApplied: [{ op: "add" }], sessionId: "s1", wasEdited: true });

    expect(insertOne.mock.calls[0][0]).toMatchObject({
      patchApplied: [{ op: "add" }],
      sessionId: "s1",
      wasEdited: true,
    });
  });

  it("does not delete anything when 3 or fewer entries exist", async () => {
    await dslHistory.saveSnapshot(entry);

    expect(find).toHaveBeenCalledWith(
      { micrositeId: "m1", pagePath: "/home" },
      { sort: { createdAt: -1 }, skip: 3, projection: { _id: 1 } },
    );
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("prunes entries beyond the newest 3 for the same page", async () => {
    toArray.mockResolvedValue([{ _id: "old-1" }, { _id: "old-2" }]);

    await dslHistory.saveSnapshot(entry);

    expect(deleteMany).toHaveBeenCalledWith({ _id: { $in: ["old-1", "old-2"] } });
  });
});

describe("dslHistory.getEntry", () => {
  it("scopes the lookup by id, microsite and page and maps the row", async () => {
    findOne.mockResolvedValue(row);

    const result = await dslHistory.getEntry("h1", "m1", "/home");

    expect(findOne).toHaveBeenCalledWith({ id: "h1", micrositeId: "m1", pagePath: "/home" });
    expect(result).toEqual({ ...row, _id: undefined });
    expect(result).not.toHaveProperty("_id");
  });

  it("returns null when nothing matches", async () => {
    findOne.mockResolvedValue(null);
    await expect(dslHistory.getEntry("nope", "m1", "/home")).resolves.toBeNull();
  });
});

describe("dslHistory.getHistory / getHistorySummaries", () => {
  it("getHistory defaults to limit 3, newest first, and includes snapshots", async () => {
    toArray.mockResolvedValue([row]);

    const result = await dslHistory.getHistory("m1", "/home");

    expect(find).toHaveBeenCalledWith({ micrositeId: "m1", pagePath: "/home" }, { sort: { createdAt: -1 }, limit: 3 });
    expect(result).toHaveLength(1);
    expect(result[0].dslSnapshot).toEqual({ a: 1 });
    expect(result[0]).not.toHaveProperty("_id");
  });

  it("getHistory honours an explicit limit", async () => {
    await dslHistory.getHistory("m1", "/home", 10);
    expect(find).toHaveBeenCalledWith(expect.anything(), { sort: { createdAt: -1 }, limit: 10 });
  });

  it("getHistorySummaries projects out dslSnapshot and omits it from results", async () => {
    toArray.mockResolvedValue([row]);

    const result = await dslHistory.getHistorySummaries("m1", "/home", 5);

    expect(find).toHaveBeenCalledWith(
      { micrositeId: "m1", pagePath: "/home" },
      { sort: { createdAt: -1 }, limit: 5, projection: { dslSnapshot: 0 } },
    );
    expect(result[0]).toMatchObject({ id: "h1", description: "d", approvedBy: "u1" });
    expect(result[0]).not.toHaveProperty("dslSnapshot");
  });

  it("getHistorySummaries defaults to limit 3", async () => {
    await dslHistory.getHistorySummaries("m1", "/home");
    expect(find).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ limit: 3 }));
  });
});

describe("sessionOps", () => {
  it("saveMessage() upserts and caps the stored conversation at the last 30 messages", async () => {
    const msg = { role: "user", content: "hi" };

    await sessionOps.saveMessage("u1", "m1", msg);

    const [filter, update, opts] = updateOne.mock.calls[0];
    expect(filter).toEqual({ userId: "u1", micrositeId: "m1" });
    expect(update.$push).toEqual({ messages: { $each: [msg], $slice: -30 } });
    expect(update.$set.updatedAt).toEqual(expect.any(String));
    expect(opts).toEqual({ upsert: true });
  });

  describe("getHistory()", () => {
    it.each([
      ["no conversation", null],
      ["no messages field", { userId: "u1" }],
    ])("returns [] for %s", async (_label, doc) => {
      findOne.mockResolvedValue(doc);
      await expect(sessionOps.getHistory("u1", "m1")).resolves.toEqual([]);
    });

    it("keeps the newest 20 messages intact and slims older ones to role + content", async () => {
      const messages = Array.from({ length: 22 }, (_, i) => ({
        role: "user",
        content: `m${i}`,
        toolCalls: [{ big: i }],
      }));
      findOne.mockResolvedValue({ messages });

      const result = await sessionOps.getHistory("u1", "m1");

      expect(result).toHaveLength(22);
      expect(result[0]).toEqual({ role: "user", content: "m0" });
      expect(result[1]).toEqual({ role: "user", content: "m1" });
      expect(result[2]).toEqual(messages[2]);
      expect(result[21]).toEqual(messages[21]);
    });

    it("defaults missing old content to an empty string and leaves role-less old entries alone", async () => {
      const roleless = { foo: "bar" };
      const messages = [{ role: "assistant" }, roleless, ...Array.from({ length: 20 }, () => ({ role: "user", content: "x" }))];
      findOne.mockResolvedValue({ messages });

      const result = await sessionOps.getHistory("u1", "m1");

      expect(result[0]).toEqual({ role: "assistant", content: "" });
      expect(result[1]).toBe(roleless);
    });
  });

  it("appendOp() timestamps the op and keeps only the last 10 per page", async () => {
    const op = { type: "patch" } as any;

    await sessionOps.appendOp("u1", "m1", "/home", op);

    expect(op.ts).toEqual(expect.any(String));
    const [filter, update, opts] = updateOne.mock.calls[0];
    expect(filter).toEqual({ userId: "u1", micrositeId: "m1", pagePath: "/home" });
    expect(update.$push).toEqual({ ops: { $each: [op], $slice: -10 } });
    expect(opts).toEqual({ upsert: true });
  });

  it("saveTask() upserts the task context on the conversation", async () => {
    await sessionOps.saveTask("u1", "m1", { step: 2 });

    const [filter, update, opts] = updateOne.mock.calls[0];
    expect(filter).toEqual({ userId: "u1", micrositeId: "m1" });
    expect(update.$set).toMatchObject({ taskContext: { step: 2 } });
    expect(opts).toEqual({ upsert: true });
  });
});
