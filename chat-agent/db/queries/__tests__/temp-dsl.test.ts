/**
 * @jest-environment node
 */
const findOne = jest.fn();
const bulkWrite = jest.fn().mockResolvedValue({});
const updateOne = jest.fn().mockResolvedValue({});

jest.mock("../../client", () => ({
  db: { collection: jest.fn(() => ({ findOne, bulkWrite, updateOne })) },
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
  updateOne.mockClear();
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

  it("returns undefined for a missing doc or path", async () => {
    findOne.mockResolvedValue(null);
    await expect(tempDslOps.getDslPath("k", "/components/0")).resolves.toBeUndefined();
    findOne.mockResolvedValue({ dsl });
    await expect(tempDslOps.getDslPath("k", "/components/9")).resolves.toBeUndefined();
  });
});

describe("tempDslOps.storeMany / getManyPaths", () => {
  it("stores several pages in ONE bulk write", async () => {
    await tempDslOps.storeMany([
      { toolCallId: "dsl:m:p1", dsl: { id: 1 }, meta: { pageCode: "p1" } },
      { toolCallId: "dsl:m:p2", dsl: { id: 2 }, meta: { pageCode: "p2" } },
    ]);
    expect(bulkWrite).toHaveBeenCalledTimes(1);
    const ops = bulkWrite.mock.calls[0][0];
    expect(ops).toHaveLength(2);
    expect(ops[0].updateOne.filter).toEqual({ toolCallId: "dsl:m:p1" });
    expect(ops[0].updateOne.upsert).toBe(true);
    expect(ops[1].updateOne.update.$set).toEqual(expect.objectContaining({ pageCode: "p2", dsl: { id: 2 } }));
  });

  it("skips the write when there is nothing to store", async () => {
    await tempDslOps.storeMany([]);
    expect(bulkWrite).not.toHaveBeenCalled();
  });

  it("runs lookups in parallel and keeps their order", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    findOne.mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return { dsl };
    });
    const res = await tempDslOps.getManyPaths([
      { tempDslId: "k1", path: "/components/0/id" },
      { tempDslId: "k2", path: "/components/1/id" },
    ]);
    expect(res.map((r) => r.data)).toEqual(["a", "b"]);
    expect(maxInFlight).toBe(2);
  });

  it("updateDslPath accepts JSON Pointer and writes dot notation", async () => {
    await tempDslOps.updateDslPath("k", "/components/1/properties/label", "C");
    expect(updateOne).toHaveBeenCalledWith(
      { toolCallId: "k" },
      { $set: { "dsl.components.1.properties.label": "C" } },
    );
  });
});
