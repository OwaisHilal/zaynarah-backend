// src/workers/orderWorker.js
const { Worker } = require('bullmq');
const { connection } = require('../services/queue.service') || {};
const logger = require('../lib/logger');

if (connection) {
  new Worker(
    'orders',
    async (job) => {
      logger.info('Processing order job', job.id, job.name);
      // TODO: fulfill order, call external services, update inventory
      return true;
    },
    connection
  );
} else {
  logger.warn('Order worker: no redis connection configured');
}
