import { MongoClient, Db } from "mongodb";
import { ensureIndexes } from "./ensure-indexes";
import { logger } from "../lib/logger";

export interface MongoConnection {
  client: MongoClient;
  db: Db;
}

async function open(uri: string, dbName: string): Promise<MongoConnection> {
  const client = new MongoClient(uri);
  await client.connect();
  return { client, db: client.db(dbName) };
}

/**
 * Connects to Mongo. A failed `localhost` connection is retried once against
 * 127.0.0.1 (Node may resolve localhost to ::1 while Mongo listens on IPv4 only).
 * Any other failure is rethrown.
 */
export async function connectMongo(uri: string, dbName: string): Promise<MongoConnection> {
  logger.info("Connecting to MongoDB", { uriConfigured: Boolean(process.env.MONGODB_URI), dbName });

  try {
    const connection = await open(uri, dbName);
    logger.info("Connected to MongoDB");
    return connection;
  } catch (err) {
    logger.error("First MongoDB connection attempt failed", { error: (err as Error).message });
    if (!uri.includes("localhost")) throw err;

    logger.info("Attempting MongoDB fallback connection (127.0.0.1)");
    try {
      const connection = await open(uri.replace("localhost", "127.0.0.1"), dbName);
      logger.info("Connected to MongoDB via fallback URI");
      return connection;
    } catch (fallbackErr) {
      logger.error("MongoDB fallback connection also failed", { error: (fallbackErr as Error).message });
      throw fallbackErr;
    }
  }
}

/** Non-fatal post-connect steps: ping, then idempotent index creation. Failures only warn. */
export async function verifyAndIndex(db: Db, dbName: string): Promise<void> {
  try {
    await db.command({ ping: 1 });
    logger.info("MongoDB connection verified", { dbName });
  } catch (pingErr) {
    logger.warn("MongoDB ping failed", { error: (pingErr as Error).message });
  }

  try {
    await ensureIndexes();
    logger.info("MongoDB indexes ensured");
  } catch (indexErr) {
    logger.warn("Failed to ensure MongoDB indexes", { error: (indexErr as Error).message });
  }
}
