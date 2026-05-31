import app from "../backend/src/app.js";
import db from "../backend/src/config/database.js";
import redis from "../backend/src/config/redis.js";

const { connectDatabase } = db;
const { connectRedis } = redis;

let isConnected = false;

async function ensureConnections() {
  if (!isConnected) {
    try {
      await connectDatabase();
      await connectRedis();
      isConnected = true;
    } catch (error) {
      console.error("Failed to connect to databases:", error);
      throw error;
    }
  }
}

export default async function handler(req, res) {
  await ensureConnections();
  return app(req, res);
}
