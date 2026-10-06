import { db } from "../client";
import { parseDslPath, resolveSegments } from "../../lib/dsl-compact";

export interface TempDslEntry {
  toolCallId: string;
  dsl: any;
  createdAt: Date;
  micrositeId?: string;
  pageCode?: string;
  pageVersion?: number;
}

const TEMP_COLLECTION = "temp_dsl";

/**
 * Mongo projection for a path. Only the FIRST segment can be projected safely:
 * a numeric segment in dot notation (`dsl.components.2`) is treated by Mongo as
 * a field name, not an array index, and returns empty objects. So we project
 * the top-level key (cuts transfer size) and resolve the rest in JS.
 */
function projectionFor(segments: string[]): Record<string, number> {
  const first = segments[0];
  if (!first || /^\d+$/.test(first)) return { _id: 0, dsl: 1 };
  return { _id: 0, [`dsl.${first}`]: 1 };
}

export const tempDslOps = {
  /**
   * Store several page DSLs in ONE round trip (bulk upsert).
   */
  storeMany: async (
    entries: Array<{
      toolCallId: string;
      dsl: any;
      meta?: Partial<TempDslEntry>;
    }>,
  ) => {
    if (!entries.length) return;
    const col = db.collection(TEMP_COLLECTION);
    const createdAt = new Date();
    await col.bulkWrite(
      entries.map((e) => ({
        updateOne: {
          filter: { toolCallId: e.toolCallId },
          update: { $set: { ...(e.meta ?? {}), dsl: e.dsl, createdAt } },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  },

  /**
   * Fetch several stored pages in ONE query ($in) instead of one findOne each.
   */
  getMany: async (toolCallIds: string[]) => {
    if (!toolCallIds.length) return [];
    const col = db.collection(TEMP_COLLECTION);
    return col
      .find<Pick<TempDslEntry, "toolCallId" | "dsl" | "pageVersion" | "createdAt">>(
        { toolCallId: { $in: toolCallIds } },
        { projection: { _id: 0, toolCallId: 1, dsl: 1, pageVersion: 1, createdAt: 1 } },
      )
      .toArray();
  },

  /**
   * Write-through after an authoritative save (approve/rollback): replace the
   * stored copy of a page wherever it is cached, so later reads aren't stale.
   */
  refreshByPageCode: async (pageCode: string, dsl: any, pageVersion?: number) => {
    const col = db.collection(TEMP_COLLECTION);
    await col.updateMany(
      { pageCode },
      {
        $set: {
          dsl,
          createdAt: new Date(),
          ...(typeof pageVersion === "number" ? { pageVersion } : {}),
        },
      },
    );
  },

  /**
   * Resolve a path inside a stored DSL. Accepts JSON Pointer ("/components/0"),
   * dot ("components.0") or bracket ("components[0]") syntax. Returns
   * `undefined` when the DSL or the path doesn't exist.
   */
  getDslPath: async (toolCallId: string, path: string) => {
    const col = db.collection(TEMP_COLLECTION);
    const segments = parseDslPath(path);
    const projection = projectionFor(segments);
    const doc = await col.findOne({ toolCallId }, { projection });
    return !doc || doc.dsl === undefined
      ? undefined
      : resolveSegments(doc.dsl, segments);
  },
};
