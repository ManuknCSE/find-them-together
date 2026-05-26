const { getRedisClient } = require('../config/redis');

async function getJson(key) {
  const client = getRedisClient();
  if (!client) return null;
  const value = await client.get(key);
  return value ? JSON.parse(value) : null;
}

async function setJson(key, value, ttlSeconds = 300) {
  const client = getRedisClient();
  if (!client) return null;
  return client.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

async function del(key) {
  const client = getRedisClient();
  if (!client) return null;
  return client.del(key);
}

module.exports = { getJson, setJson, del };

