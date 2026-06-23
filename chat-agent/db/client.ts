import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "layoutX";

let activeClient: MongoClient;
let activeDb: Db;

console.log("Connecting to MongoDB at:", uri);

try {
  // Primary attempt
  activeClient = new MongoClient(uri);
  await activeClient.connect();
  activeDb = activeClient.db(dbName);
  console.log("Connected to MongoDB successfully!");
} catch (err) {
  console.error("First connection attempt failed:", (err as Error).message);
  
  if (uri.includes("localhost")) {
    const fallbackUri = uri.replace("localhost", "127.0.0.1");
    console.log("Attempting fallback connection to:", fallbackUri);
    try {
      activeClient = new MongoClient(fallbackUri);
      await activeClient.connect();
      activeDb = activeClient.db(dbName);
      console.log("Connected to MongoDB via fallback URI successfully!");
    } catch (fallbackErr) {
      console.error("Fallback connection attempt also failed:", (fallbackErr as Error).message);
      throw fallbackErr;
    }
  } else {
    throw err;
  }
}

export const client = activeClient;
export const db = activeDb;

// Try to initialize/create the database by performing an idempotent write/touch
try {
  console.log(`Initializing/ensuring database "${dbName}" exists...`);
  await db.collection("system_init").updateOne(
    { name: "status" },
    { $set: { initializedAt: new Date(), status: "active" } },
    { upsert: true }
  );
  console.log(`Database "${dbName}" initialized successfully!`);
} catch (initErr) {
  console.error("Warning: Failed to perform database initialization write:", (initErr as Error).message);
}
