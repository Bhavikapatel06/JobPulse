const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Connect to MongoDB with automatic retry on failure.
 */
const connectDB = async (attempt = 1) => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/jobpulse';

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    logger.info(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB error: ${err.message}`);
    });
  } catch (err) {
    logger.error(`❌ MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);

    if (attempt < MAX_RETRIES) {
      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }

    logger.error('Could not connect to MongoDB after maximum retries. Exiting.');
    process.exit(1);
  }
};

module.exports = connectDB;
