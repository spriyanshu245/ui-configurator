import { db } from '../client';

export interface TempDslEntry {
  toolCallId: string;
  dsl: any;
  createdAt: Date;
}

const TEMP_COLLECTION = 'temp_dsl';

export const tempDslOps = {
  /**
   * Ensure TTL index exists. Documents expire 1 hour (3600 seconds) after createdAt.
   */
  initIndex: async () => {
    const col = db.collection(TEMP_COLLECTION);
    await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
  },

  /**
   * Store the full DSL payload keyed by a toolCallId.
   */
  storeDsl: async (toolCallId: string, dsl: any) => {
    const col = db.collection(TEMP_COLLECTION);
    await col.updateOne(
      { toolCallId },
      {
        $set: {
          dsl,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  },

  /**
   * Retrieve the full DSL payload by toolCallId.
   */
  getDsl: async (toolCallId: string) => {
    const col = db.collection(TEMP_COLLECTION);
    const doc = await col.findOne({ toolCallId });
    return doc ? doc.dsl : null;
  },

  /**
   * Query a specific JSON path or subset using MongoDB projection.
   * Path format should match MongoDB dot notation (e.g., 'components.2.props').
   */
  getDslPath: async (toolCallId: string, path: string) => {
    const col = db.collection(TEMP_COLLECTION);
    const projection: Record<string, number> = { _id: 0 };
    projection[`dsl.${path}`] = 1;
    
    const doc = await col.findOne({ toolCallId }, { projection });
    
    // Resolve the dot notation path to extract just the target value
    if (doc && doc.dsl) {
      return path.split('.').reduce((acc, part) => acc && acc[part], doc.dsl);
    }
    return null;
  },

  /**
   * Update only a specific part of the JSON using MongoDB's $set operator with dot notation.
   */
  updateDslPath: async (toolCallId: string, path: string, newValue: any) => {
    const col = db.collection(TEMP_COLLECTION);
    const updateQuery: Record<string, any> = {};
    updateQuery[`dsl.${path}`] = newValue;

    await col.updateOne(
      { toolCallId },
      { $set: updateQuery }
    );
  },

  /**
   * Optional: Explicit cleanup strategy to delete prior to TTL if required.
   */
  deleteDsl: async (toolCallId: string) => {
    const col = db.collection(TEMP_COLLECTION);
    await col.deleteOne({ toolCallId });
  }
};
