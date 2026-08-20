/**
 * @jest-environment node
 */

const insertOneMock = jest.fn();
const findOneMock = jest.fn();
const deleteOneMock = jest.fn();
const updateOneMock = jest.fn();

jest.mock("../../client", () => ({
  db: {
    collection: jest.fn(() => ({
      insertOne: insertOneMock,
      findOne: findOneMock,
      deleteOne: deleteOneMock,
      updateOne: updateOneMock,
    })),
  },
}));

import { pendingBatchesDB } from "../pending-batches";

describe("pendingBatchesDB", () => {
  beforeEach(() => {
    insertOneMock.mockReset().mockResolvedValue({ acknowledged: true });
    findOneMock.mockReset();
    deleteOneMock.mockReset().mockResolvedValue({ acknowledged: true });
    updateOneMock.mockReset().mockResolvedValue({ acknowledged: true });
  });

  const sampleBatch = {
    id: "batch-1",
    sessionId: "s1",
    micrositeId: "m1",
    batchDescription: "desc",
    navigateTo: "/about",
    operations: [
      {
        pagePath: "/home",
        pageVersion: 1,
        description: "d",
        previewHint: "h",
        affectedComponents: [],
        currentDsl: { a: 1 },
        patchedDsl: { a: 2 },
        patch: [{ op: "replace", path: "/a", value: 2 }],
        status: "pending" as const,
      },
    ],
    proposedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: new Date("2026-01-02T00:00:00.000Z"),
    status: "pending" as const,
  };

  it("save() inserts the batch document", async () => {
    await pendingBatchesDB.save(sampleBatch);

    expect(insertOneMock).toHaveBeenCalledTimes(1);
    const inserted = insertOneMock.mock.calls[0][0];
    expect(inserted.id).toBe("batch-1");
    expect(inserted.micrositeId).toBe("m1");
    expect(inserted.operations).toHaveLength(1);
    expect(inserted.status).toBe("pending");
  });

  it("get() returns null when not found", async () => {
    findOneMock.mockResolvedValue(null);
    const result = await pendingBatchesDB.get("missing");
    expect(result).toBeNull();
  });

  it("get() returns the mapped document when found", async () => {
    findOneMock.mockResolvedValue(sampleBatch);
    const result = await pendingBatchesDB.get("batch-1");
    expect(result).toEqual(
      expect.objectContaining({
        id: "batch-1",
        micrositeId: "m1",
        batchDescription: "desc",
        navigateTo: "/about",
        status: "pending",
      }),
    );
  });

  it("delete() deletes by id", async () => {
    await pendingBatchesDB.delete("batch-1");
    expect(deleteOneMock).toHaveBeenCalledWith({ id: "batch-1" });
  });

  it("updateStatus() sets the batch-level status", async () => {
    await pendingBatchesDB.updateStatus("batch-1", "applying");
    expect(updateOneMock).toHaveBeenCalledWith(
      { id: "batch-1" },
      { $set: { status: "applying" } },
    );
  });

  it("updateOpStatus() sets the status of the matching operation via positional operator", async () => {
    await pendingBatchesDB.updateOpStatus("batch-1", "/home", "applied");
    expect(updateOneMock).toHaveBeenCalledWith(
      { id: "batch-1", "operations.pagePath": "/home" },
      { $set: { "operations.$.status": "applied" } },
    );
  });

  it("findApplyingForMicrosite() returns null when nothing is applying", async () => {
    findOneMock.mockResolvedValue(null);
    const result = await pendingBatchesDB.findApplyingForMicrosite("m1");
    expect(result).toBeNull();
    expect(findOneMock).toHaveBeenCalledWith({ micrositeId: "m1", status: "applying" });
  });

  it("findApplyingForMicrosite() excludes the given batch id", async () => {
    findOneMock.mockResolvedValue(null);
    await pendingBatchesDB.findApplyingForMicrosite("m1", "batch-1");
    expect(findOneMock).toHaveBeenCalledWith({
      micrositeId: "m1",
      status: "applying",
      id: { $ne: "batch-1" },
    });
  });
});
