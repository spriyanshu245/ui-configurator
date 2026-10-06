/**
 * @jest-environment node
 */
const findOne = jest.fn();
const bulkWrite = jest.fn().mockResolvedValue({});
const updateMany = jest.fn().mockResolvedValue({});
const toArray = jest.fn();
const find = jest.fn(() => ({ toArray }));

jest.mock("../../client", () => ({
  db: { collection: jest.fn(() => ({ findOne, bulkWrite, updateMany, find })) },
}));

import { tempDslOps } from "../temp-dsl";

const dsl = {
  id: "root",
  components: [
    { id: "a", type: "form", properties: { label: "A" } },
    { id: "b", type: "table", properties: { label: "B" } },
  ],
};

beforeEach(() => {
  findOne.mockReset();
  bulkWrite.mockClear();
  updateMany.mockClear();
  find.mockClear();
  toArray.mockReset();
});

describe("tempDslOps.getDslPath", () => {
  it("resolves array indices (the old dot-notation projection returned {} here)", async () => {
    findOne.mockResolvedValue({ dsl });
    await expect(tempDslOps.getDslPath("k", "/components/1/properties/label")).resolves.toBe("B");
    await expect(tempDslOps.getDslPath("k", "components.0.type")).resolves.toBe("form");
    await expect(tempDslOps.getDslPath("k", "components[1].id")).resolves.toBe("b");
  });

  it("projects only the top-level key, never a numeric segment", async () => {
    findOne.mockResolvedValue({ dsl });
    await tempDslOps.getDslPath("k", "/components/1");
    expect(findOne).toHaveBeenLastCalledWith({ toolCallId: "k" }, { projection: { _id: 0, "dsl.components": 1 } });

    await tempDslOps.getDslPath("k", "");
    expect(findOne).toHaveBeenLastCalledWith({ toolCallId: "k" }, { projection: { _id: 0, dsl: 1 } });
  });

  it("returns undefined for a missing doc, a doc without dsl, or a missing path", async () => {
    findOne.mockResolvedValue(null);
    await expect(tempDslOps.getDslPath("k", "/components/0")).resolves.toBeUndefined();
    findOne.mockResolvedValue({});
    await expect(tempDslOps.getDslPath("k", "/components/0")).resolves.toBeUndefined();
    findOne.mockResolvedValue({ dsl });
    await expect(tempDslOps.getDslPath("k", "/components/9")).resolves.toBeUndefined();
  });
});

describe("tempDslOps.storeMany", () => {
  it("stores several pages in ONE unordered bulk write", async () => {
    await tempDslOps.storeMany([
      { toolCallId: "dsl:m:p1", dsl: { id: 1 }, meta: { pageCode: "p1" } },
      { toolCallId: "dsl:m:p2", dsl: { id: 2 }, meta: { pageCode: "p2" } },
    ]);
    expect(bulkWrite).toHaveBeenCalledTimes(1);
    expect(bulkWrite.mock.calls[0][1]).toEqual({ ordered: false });
    const ops = bulkWrite.mock.calls[0][0];
    expect(ops).toHaveLength(2);
    expect(ops[0].updateOne.filter).toEqual({ toolCallId: "dsl:m:p1" });
    expect(ops[0].updateOne.upsert).toBe(true);
    expect(ops[1].updateOne.update.$set).toEqual(expect.objectContaining({ pageCode: "p2", dsl: { id: 2 } }));
    expect(ops[0].updateOne.update.$set.createdAt).toBe(ops[1].updateOne.update.$set.createdAt);
  });

  it("works for entries without meta", async () => {
    await tempDslOps.storeMany([{ toolCallId: "k", dsl: { id: 1 } }]);

    const $set = bulkWrite.mock.calls[0][0][0].updateOne.update.$set;
    expect(Object.keys($set).sort()).toEqual(["createdAt", "dsl"]);
  });

  it("skips the write when there is nothing to store", async () => {
    await tempDslOps.storeMany([]);
    expect(bulkWrite).not.toHaveBeenCalled();
  });
});

describe("tempDslOps.getMany", () => {
  it("fetches all ids in one $in query with a slim projection", async () => {
    toArray.mockResolvedValue([{ toolCallId: "a", dsl }]);

    const rows = await tempDslOps.getMany(["a", "b"]);

    expect(rows).toEqual([{ toolCallId: "a", dsl }]);
    expect(find).toHaveBeenCalledWith(
      { toolCallId: { $in: ["a", "b"] } },
      { projection: { _id: 0, toolCallId: 1, dsl: 1, pageVersion: 1, createdAt: 1 } },
    );
  });

  it("returns [] without querying for an empty id list", async () => {
    await expect(tempDslOps.getMany([])).resolves.toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });
});

describe("tempDslOps.refreshByPageCode", () => {
  it("overwrites every cached copy of the page and bumps pageVersion when given", async () => {
    await tempDslOps.refreshByPageCode("p1", { id: "new" }, 7);

    const [filter, update] = updateMany.mock.calls[0];
    expect(filter).toEqual({ pageCode: "p1" });
    expect(update.$set).toMatchObject({ dsl: { id: "new" }, pageVersion: 7 });
    expect(update.$set.createdAt).toBeInstanceOf(Date);
  });

  it("leaves pageVersion untouched when none is given", async () => {
    await tempDslOps.refreshByPageCode("p1", { id: "new" });

    expect(updateMany.mock.calls[0][1].$set).not.toHaveProperty("pageVersion");
  });

  it("treats pageVersion 0 as a real version", async () => {
    await tempDslOps.refreshByPageCode("p1", { id: "new" }, 0);

    expect(updateMany.mock.calls[0][1].$set.pageVersion).toBe(0);
  });
});
