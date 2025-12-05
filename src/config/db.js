// src/config/db.js
const mongoose = require('mongoose');
const logger = require('../lib/logger');

module.exports = async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('MONGODB_URI missing');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error', err.message);
    process.exit(1);
  }
};
