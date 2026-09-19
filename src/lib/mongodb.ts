import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) throw new Error("MONGODB_URL .env me define nahi hai");

// Cache the connection on `global` so hot reloads in dev reuse it instead of reconnecting
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = global as typeof globalThis & { mongoose?: Cache };
const cached: Cache = g.mongoose ?? { conn: null, promise: null };
g.mongoose = cached;

export default async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.promise ??= mongoose.connect(MONGODB_URL!);
  cached.conn = await cached.promise;
  return cached.conn;
}
