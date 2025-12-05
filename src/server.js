// src/server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const connectDB = require('./config/db');
const logger = require('./lib/logger');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// --- DB Connection ---
connectDB();

// --- Security ---
app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// --- Webhooks must be BEFORE express.json() ---
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  require('./features/webhooks/webhooks.routes').stripe
);

app.post(
  '/api/webhooks/razorpay',
  express.json(),
  require('./features/webhooks/webhooks.routes').razorpay
);

// --- Global JSON parser ---
app.use(express.json({ limit: '2mb' }));

// --- Feature Routes ---
app.use('/api/auth', require('./features/auth/auth.routes'));
app.use('/api/products', require('./features/products/products.routes'));
app.use('/api/orders', require('./features/orders/orders.routes'));
app.use('/api/payments', require('./features/payments/payments.routes'));

// ✅ ADDING YOUR NEW FEATURE:
app.use('/api/users', require('./features/users/users.routes'));

// --- Health Route ---
app.get('/', (req, res) => res.send('Zaynarah API - Feature Based'));

// --- Error Handler ---
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => logger.info(`Server running on port ${port}`));
