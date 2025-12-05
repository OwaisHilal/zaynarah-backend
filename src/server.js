// src/server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const connectDB = require('./config/db');
const logger = require('./lib/logger');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

const startServer = async () => {
  // --- DB Connection ---
  await connectDB();

  // --- Security ---
  app.use(helmet());
  app.use(
    cors({
      origin: '*',
      credentials: true,
    })
  );

  // --- Stripe Webhook (raw body required) ---
  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    require('./features/webhooks/webhooks.routes').stripe
  );

  // --- Razorpay Webhook (ALSO raw body required) ---
  app.post(
    '/api/webhooks/razorpay',
    express.raw({ type: 'application/json' }),
    require('./features/webhooks/webhooks.routes').razorpay
  );

  // ------------------------------------------------------------------
  // Global JSON parser for ALL normal routes (AFTER webhooks)
  // ------------------------------------------------------------------
  app.use(express.json({ limit: '2mb' }));

  // --- Feature Routes ---
  app.use('/api/auth', require('./features/auth/auth.routes'));
  app.use('/api/products', require('./features/products/products.routes'));
  app.use('/api/orders', require('./features/orders/orders.routes'));
  app.use('/api/payments', require('./features/payments/payments.routes'));
  app.use('/api/users', require('./features/users/users.routes'));

  // --- Health Route ---
  app.get('/', (req, res) => res.send('Zaynarah API - Feature Based'));

  // --- Error Handler ---
  app.use(errorHandler);

  const port = process.env.PORT || 5000;
  app.listen(port, () => logger.info(`Server running on port ${port}`));
};

startServer();
