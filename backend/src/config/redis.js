const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient;

async function connectRedis() {
  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL not configured; cache disabled');
    return null;
  }

  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (error) => logger.error('Redis error', error));
  await redisClient.connect();
  logger.info('Redis connected');
  return redisClient;
}

function getRedisClient() {
  return redisClient;
}

module.exports = { connectRedis, getRedisClient };

