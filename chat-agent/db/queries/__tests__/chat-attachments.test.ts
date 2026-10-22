/**
 * @jest-environment node
 */
const updateOne = jest.fn();
const findOneAndUpdate = jest.fn();
const toArray = jest.fn();
const limit = jest.fn(() => ({ toArray }));
const sort = jest.fn(() => ({ limit }));
const find = jest.fn(() => ({ sort }));
const collection = jest.fn(() => ({ updateOne, findOneAndUpdate, find }));

jest.mock("../../client", () => ({ db: { collection: (...a: any[]) => (collection as any)(...a) } }));

import { chatAttachmentsOps } from "../chat-attachments";

const doc = {
  handle: "att-0123456789",
  userId: "u1",
  micrositeId: "m1",
  sessionId: "s1",
  name: "dev.json",
  format: "json",
  kind: "dsl" as const,
  size: 12,
  sha256: "abc",
  text: "{}",
};

beforeEach(() => jest.clearAllMocks());

describe("chatAttachmentsOps.save", () => {
  it("upserts by handle, refreshing lastUsedAt and only setting createdAt on insert", async () => {
    await chatAttachmentsOps.save(doc);

    expect(collection).toHaveBeenCalledWith("chat_attachments");
    const [filter, update, options] = updateOne.mock.calls[0];
    expect(filter).toEqual({ handle: doc.handle });
    expect(update.$set).toMatchObject({ ...doc, lastUsedAt: expect.any(Date) });
    expect(update.$set.createdAt).toBeUndefined();
    expect(update.$setOnInsert.createdAt).toBeInstanceOf(Date);
    expect(options).toEqual({ upsert: true });
  });
});

describe("chatAttachmentsOps.getByHandle", () => {
  it("scopes to the microsite when given and touches lastUsedAt", async () => {
    findOneAndUpdate.mockResolvedValue({ ...doc });
    const found = await chatAttachmentsOps.getByHandle(doc.handle, "m1");

    const [filter, update, options] = findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ handle: doc.handle, micrositeId: "m1" });
    expect(update.$set.lastUsedAt).toBeInstanceOf(Date);
    expect(options).toEqual({ returnDocument: "after" });
    expect(found?.handle).toBe(doc.handle);
  });

  it("looks up by handle alone without a microsite", async () => {
    findOneAndUpdate.mockResolvedValue({ ...doc });
    await chatAttachmentsOps.getByHandle(doc.handle);
    expect(findOneAndUpdate.mock.calls[0][0]).toEqual({ handle: doc.handle });
  });

  it("returns null when nothing matches", async () => {
    findOneAndUpdate.mockResolvedValue(null);
    await expect(chatAttachmentsOps.getByHandle("att-missing")).resolves.toBeNull();
  });
});

describe("chatAttachmentsOps.listForSession", () => {
  it("returns [] without querying when there is no session", async () => {
    await expect(chatAttachmentsOps.listForSession("")).resolves.toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });

  it("lists bodiless entries oldest first with the default limit", async () => {
    const rows = [{ handle: "att-1", name: "a", kind: "dsl", size: 1, createdAt: new Date() }];
    toArray.mockResolvedValue(rows);

    await expect(chatAttachmentsOps.listForSession("s1")).resolves.toBe(rows);

    const [filter, options] = find.mock.calls[0] as any[];
    expect(filter).toEqual({ sessionId: "s1" });
    expect(options.projection).toEqual({ _id: 0, handle: 1, name: 1, kind: 1, size: 1, summary: 1, createdAt: 1 });
    expect(options.projection.text).toBeUndefined();
    expect(options.projection.dataBase64).toBeUndefined();
    expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
    expect(limit).toHaveBeenCalledWith(20);
  });

  it("honors a custom limit", async () => {
    toArray.mockResolvedValue([]);
    await chatAttachmentsOps.listForSession("s1", 5);
    expect(limit).toHaveBeenCalledWith(5);
  });
});
