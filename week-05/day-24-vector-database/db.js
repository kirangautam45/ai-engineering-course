// Connects to MongoDB with the official driver. Used by Day 24 and Day 25.
import { MongoClient } from "mongodb";
import "../../lib/claude.js"; // loads .env

if (!process.env.MONGODB_URI) {
  console.error("Add MONGODB_URI to your .env file first (see .env.example).");
  process.exit(1);
}

export const mongo = new MongoClient(process.env.MONGODB_URI);
export const db = mongo.db(); // the database named in MONGODB_URI

// Search indexes are built in the background. Wait until this one can be queried.
export async function waitForSearchIndex(collection, name) {
  for (let i = 0; i < 60; i++) {
    const [index] = await collection.listSearchIndexes(name).toArray();
    if (index?.queryable) return;
    if (i === 0) console.log(`Waiting for the "${name}" index to be ready...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`The "${name}" index is still not ready after 2 minutes. Check it in the Atlas UI.`);
}
