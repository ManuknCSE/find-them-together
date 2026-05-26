const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  logger.info('MongoDB connected');
}

module.exports = { connectDatabase };

