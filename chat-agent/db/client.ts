import { MongoClient, Db } from "mongodb";
import { ensureIndexes } from "./ensure-indexes";
import { logger } from "../lib/logger";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "layoutX";

let activeClient: MongoClient;
let activeDb: Db;

logger.info("Connecting to MongoDB", { uriConfigured: Boolean(process.env.MONGODB_URI), dbName });

try {
  // Primary attempt
  activeClient = new MongoClient(uri);
  await activeClient.connect();
  activeDb = activeClient.db(dbName);
  logger.info("Connected to MongoDB");
} catch (err) {
  logger.error("First MongoDB connection attempt failed", { error: (err as Error).message });

  if (uri.includes("localhost")) {
    const fallbackUri = uri.replace("localhost", "127.0.0.1");
    logger.info("Attempting MongoDB fallback connection (127.0.0.1)");
    try {
      activeClient = new MongoClient(fallbackUri);
      await activeClient.connect();
      activeDb = activeClient.db(dbName);
      logger.info("Connected to MongoDB via fallback URI");
    } catch (fallbackErr) {
      logger.error("MongoDB fallback connection also failed", { error: (fallbackErr as Error).message });
      throw fallbackErr;
    }
  } else {
    throw err;
  }
}

export const client = activeClient;
export const db = activeDb;

try {
  await db.command({ ping: 1 });
  logger.info("MongoDB connection verified", { dbName });
} catch (pingErr) {
  logger.warn("MongoDB ping failed", { error: (pingErr as Error).message });
}

// Ensure all required indexes exist across collections (idempotent, safe to re-run).
try {
  await ensureIndexes();
  logger.info("MongoDB indexes ensured");
} catch (indexErr) {
  logger.warn("Failed to ensure MongoDB indexes", { error: (indexErr as Error).message });
}
