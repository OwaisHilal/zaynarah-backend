// src/middlewares/rawBodyForWebhooks.js
const express = require('express');

exports.rawBodyForWebhooks = express.raw({
  type: '*/*', // allow Stripe & Razorpay to receive raw body
});
