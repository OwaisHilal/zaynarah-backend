// backend/src/features/webhooks/webhooks.routes.js
const stripeWebhook = require('./stripe.webhook');
const razorpayWebhook = require('./razorpay.webhook');

module.exports = {
  stripe: stripeWebhook,
  razorpay: razorpayWebhook,
};
