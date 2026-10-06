/**
 * @jest-environment node
 */
const insertOne = jest.fn();
const findOne = jest.fn();
const deleteOne = jest.fn();

jest.mock("../../client", () => ({
  db: { collection: jest.fn(() => ({ insertOne, findOne, deleteOne })) },
}));

import { pendingPatchesDB } from "../pending-patches";

const patch = {
  id: "p1",
  sessionId: "s1",
  micrositeId: "m1",
  pagePath: "/home",
  pageVersion: 4,
  patch: [{ op: "replace", path: "/a", value: 2 }],
  description: "d",
  previewHint: "h",
  affectedComponents: ["c1"],
  currentDsl: { a: 1 },
  patchedDsl: { a: 2 },
  proposedAt: "2026-01-01T00:00:00.000Z",
  expiresAt: new Date("2026-01-02T00:00:00.000Z"),
};

beforeEach(() => {
  jest.clearAllMocks();
  insertOne.mockResolvedValue({});
  deleteOne.mockResolvedValue({});
});

describe("pendingPatchesDB", () => {
  it("save() inserts all fields including expiresAt", async () => {
    await pendingPatchesDB.save(patch);
    expect(insertOne).toHaveBeenCalledWith(patch);
  });

  it("save() defaults pageVersion to 1 and expiresAt to null", async () => {
    const { pageVersion, expiresAt, ...rest } = patch;
    await pendingPatchesDB.save(rest);

    expect(insertOne.mock.calls[0][0]).toMatchObject({ pageVersion: 1, expiresAt: null });
  });

  it("get() maps the stored document without internal fields", async () => {
    findOne.mockResolvedValue({ _id: "x", ...patch });

    const result = await pendingPatchesDB.get("p1");

    expect(findOne).toHaveBeenCalledWith({ id: "p1" });
    const { expiresAt, ...expected } = patch;
    expect(result).toEqual(expected);
  });

  it("get() defaults a missing pageVersion to 1", async () => {
    const { pageVersion, ...legacy } = patch;
    findOne.mockResolvedValue(legacy);

    await expect(pendingPatchesDB.get("p1")).resolves.toMatchObject({ pageVersion: 1 });
  });

  it("get() returns null when the patch is missing or expired", async () => {
    findOne.mockResolvedValue(null);
    await expect(pendingPatchesDB.get("gone")).resolves.toBeNull();
  });

  it("delete() removes by id", async () => {
    await pendingPatchesDB.delete("p1");
    expect(deleteOne).toHaveBeenCalledWith({ id: "p1" });
  });
});
