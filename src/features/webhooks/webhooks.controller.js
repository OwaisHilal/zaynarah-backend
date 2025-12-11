// src/features/webhooks/webhooks.controller.js
const webhookService = require('./webhooks.service');
const logger = require('../../lib/logger');

module.exports = {
  handleStripeWebhook: async (req, res) => {
    try {
      const event = webhookService.verifyStripeSignature(
        req.rawBody,
        req.headers['stripe-signature']
      );

      const result = await webhookService.processStripeEvent(event);

      logger.info('Stripe webhook processed:', result?.message);
      return res.json({ received: true });
    } catch (err) {
      logger.error('Stripe webhook error:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  },

  handleRazorpayWebhook: async (req, res) => {
    try {
      webhookService.verifyRazorpaySignature(
        req.rawBody,
        req.headers['x-razorpay-signature']
      );

      const parsed = JSON.parse(req.rawBody.toString('utf8'));
      const result = await webhookService.processRazorpayEvent(parsed);

      logger.info('Razorpay webhook processed:', result?.message);
      return res.json({ received: true });
    } catch (err) {
      logger.error('Razorpay webhook error:', err);
      return res.status(400).send('Invalid webhook');
    }
  },
};
