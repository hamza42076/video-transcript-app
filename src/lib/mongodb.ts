import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) throw new Error("MONGODB_URL .env me define nahi hai");

let cached = (global as any).mongoose ?? { conn: null, promise: null };
(global as any).mongoose = cached;

export default async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.promise ??= mongoose.connect(MONGODB_URL!);
  cached.conn = await cached.promise;
  return cached.conn;
}
