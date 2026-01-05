// backend/src/services/queue.service.js
const { Queue, Worker } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../lib/logger');

const connection = {
  connection: redis,
};

const ordersQueue = new Queue('orders', connection);
const notificationsQueue = new Queue('notifications', connection);
const emailsQueue = new Queue('emails', connection);

module.exports = {
  ordersQueue,
  notificationsQueue,
  emailsQueue,
  Worker,
  connection,
  logger,
};
