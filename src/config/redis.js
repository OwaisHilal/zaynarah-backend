// src/config/redis.js
const Redis = require('ioredis');
const logger = require('../lib/logger');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl);

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (e) => logger.error('Redis error', e));

module.exports = redis;
