import mongoose from "mongoose";
import { DatabaseError } from "@/errors/DatabaseError";

/**
 * Next.js hot-reloads modules in development, which would otherwise open a
 * fresh Mongoose connection on every edit. Caching the connection (and the
 * in-flight connect promise) on `globalThis` survives that reloading so we
 * only ever connect once per process.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.mongooseCache ?? { conn: null, promise: null };
globalThis.mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new DatabaseError("MONGODB_URI environment variable is not set");
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw new DatabaseError("Failed to connect to MongoDB", error);
  }

  return cache.conn;
}
