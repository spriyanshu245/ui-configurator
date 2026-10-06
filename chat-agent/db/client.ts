// All logic lives in ./connection (fully unit-tested).
import { connectMongo, verifyAndIndex } from "./connection";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "layoutX";

const connection = await connectMongo(uri, dbName);

export const client = connection.client;
export const db = connection.db;

await verifyAndIndex(db, dbName);
