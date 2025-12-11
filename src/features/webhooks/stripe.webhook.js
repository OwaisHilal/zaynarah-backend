// src/features/webhooks/stripe.webhook.js
const Stripe = require('stripe');
const Order = require('../orders/orders.model');
const logger = require('../../lib/logger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    logger.warn('Stripe webhook: Missing stripe-signature');
    return res.status(400).send('Missing stripe-signature');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody || req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Stripe webhook: Verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          logger.warn('Stripe webhook: No orderId metadata');
          return res.json({ received: true });
        }

        const order = await Order.findById(orderId);

        if (!order) {
          logger.warn(`Stripe webhook: Order not found (${orderId})`);
          break;
        }

        if (order.status === 'paid') {
          logger.info(`Stripe webhook: Order already paid (${orderId})`);
          break;
        }

        order.status = 'paid';
        order.paymentProvider = 'stripe';
        order.paymentIntentId = session.payment_intent || session.id;

        await order.save();
        logger.info(`Stripe webhook: Order marked PAID (${orderId})`);
        break;
      }

      default:
        logger.debug(`Stripe webhook: Unhandled event ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook internal error:', err);
    return res.status(500).send('Internal webhook error');
  }
};
