// src/server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const connectDB = require('./config/db');
const logger = require('./lib/logger');

const errorHandler = require('./core/errors/errorHandler');
const { rawBodyForWebhooks } = require('./middlewares/rawBodyForWebhooks');

// Webhook handlers (they expect raw body)
const webhookRoutes = require('./features/webhooks/webhooks.routes');

const app = express();

const startServer = async () => {
  // --- CONNECT DATABASE ---
  await connectDB();

  // --- SECURITY MIDDLEWARE ---
  app.use(helmet());
  app.use(
    cors({
      origin: '*',
      credentials: true,
    })
  );

  /* -------------------------------------------------------------
     WEBHOOK ROUTES (RAW BODY MUST COME BEFORE express.json)
  ------------------------------------------------------------- */
  app.post('/api/webhooks/stripe', rawBodyForWebhooks, webhookRoutes.stripe);

  app.post(
    '/api/webhooks/razorpay',
    rawBodyForWebhooks,
    webhookRoutes.razorpay
  );

  /* -------------------------------------------------------------
     STANDARD JSON PARSER — AFTER WEBHOOKS
  ------------------------------------------------------------- */
  app.use(express.json({ limit: '2mb' }));

  /* -------------------------------------------------------------
     FEATURE ROUTES
  ------------------------------------------------------------- */
  app.use('/api/auth', require('./features/auth/auth.routes'));
  app.use('/api/products', require('./features/products/products.routes'));
  app.use('/api/orders', require('./features/orders/orders.routes'));
  app.use('/api/payments', require('./features/payments/payments.routes'));
  app.use('/api/users', require('./features/users/users.routes'));

  /* -------------------------------------------------------------
     HEALTH CHECK
  ------------------------------------------------------------- */
  app.get('/', (req, res) => res.send('Zaynarah API - Feature Based'));

  /* -------------------------------------------------------------
     GLOBAL ERROR HANDLER (MUST BE LAST)
  ------------------------------------------------------------- */
  app.use(errorHandler);

  // --- START SERVER ---
  const port = process.env.PORT || 5000;
  app.listen(port, () => logger.info(`Server running on port ${port}`));
};

startServer();
