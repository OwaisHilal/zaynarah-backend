// src/services/queue.service.js
const { Queue, Worker } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../lib/logger');

const connection = { connection: redis };

const ordersQueue = new Queue('orders', connection);
const emailsQueue = new Queue('emails', connection);

// worker example would be in workers/
module.exports = { ordersQueue, emailsQueue, Worker, connection, logger };
