// src/features/webhooks/webhooks.routes.js
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const Order = require('../orders/orders.model');
const logger = require('../../lib/logger');

/**
 * IMPORTANT:
 * This file REQUIRES express.raw() middleware on these routes.
 * server.js already uses express.raw() — so req.body is ALWAYS a Buffer.
 */

/* -------------------------------------------------------------
   STRIPE WEBHOOK
------------------------------------------------------------- */
exports.stripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    logger.warn('Stripe webhook: Missing stripe-signature header');
    return res.status(400).send('Missing stripe-signature');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw Buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Stripe webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        logger.warn('Stripe webhook: No orderId in metadata.');
        return res.json({ received: true });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        logger.warn('Stripe webhook: Order not found:', orderId);
      } else if (order.status === 'paid') {
        logger.info('Stripe webhook: Order already marked paid:', orderId);
      } else {
        // Update order
        order.status = 'paid';
        order.paymentProvider = 'stripe';
        order.paymentIntentId = session.payment_intent || session.id;
        await order.save();

        logger.info('Stripe webhook: Order marked paid:', orderId);
      }
    }

    return res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook handler error:', err);
    return res.status(500).send('Internal Webhook Error');
  }
};

/* -------------------------------------------------------------
   RAZORPAY WEBHOOK
   Razorpay signs the RAW request body with SHA256 HMAC
------------------------------------------------------------- */
exports.razorpay = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  if (!signature) {
    logger.warn('Razorpay webhook: Missing x-razorpay-signature');
    return res.status(400).send('Missing signature');
  }

  try {
    const rawBody = req.body.toString('utf8');

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('Razorpay webhook: Signature mismatch', {
        expected: expectedSignature,
        provided: signature,
      });
      return res.status(400).send('Invalid signature');
    }

    const data = JSON.parse(rawBody);

    const evt = data.event;
    const paymentEntity =
      data.payload?.payment?.entity || data.payload?.payment || {};
    const orderId =
      paymentEntity?.notes?.orderId || paymentEntity?.receipt || null;

    if ((evt === 'payment.captured' || evt === 'order.paid') && orderId) {
      const order = await Order.findById(orderId);

      if (!order) {
        logger.warn('Razorpay webhook: Order not found:', orderId);
      } else if (order.status === 'paid') {
        logger.info('Razorpay webhook: Order already paid:', orderId);
      } else {
        order.status = 'paid';
        order.paymentProvider = 'razorpay';
        order.paymentIntentId = paymentEntity?.id;
        await order.save();

        logger.info('Razorpay webhook: Order marked paid:', orderId);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    logger.error('Razorpay webhook handler error:', err);
    return res.status(500).send('Internal Webhook Error');
  }
};
