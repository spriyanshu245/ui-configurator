/**
 * @jest-environment node
 */
jest.mock("../microsite-loader", () => ({ fetchMicrositePages: jest.fn(), fetchPageDsl: jest.fn() }));

import { assignMissingIds } from "../dsl-patcher";

describe("assignMissingIds", () => {
  it("assigns ids to typed nodes anywhere, including inside properties", () => {
    const dsl: any = {
      id: "root",
      type: "page",
      components: [
        {
          type: "table",
          properties: { tableColumns: [{ type: "table-column", properties: { label: "LAN" } }] },
          components: [{ type: "button-v2", properties: { label: "Go" } }],
        },
      ],
    };
    assignMissingIds(dsl);
    const table = dsl.components[0];
    expect(table.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(table.properties.tableColumns[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(table.components[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("keeps existing ids and leaves untyped objects alone", () => {
    const dsl: any = { id: "root", type: "page", components: [{ id: "keep", type: "spacer" }], properties: { meta: { a: 1 } } };
    assignMissingIds(dsl);
    expect(dsl.components[0].id).toBe("keep");
    expect(dsl.properties.meta).toEqual({ a: 1 });
  });
});
