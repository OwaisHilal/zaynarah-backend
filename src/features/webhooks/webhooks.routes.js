// src/features/webhooks/webhooks.routes.js
const Stripe = require('stripe');
const crypto = require('crypto');
const Order = require('../orders/orders.model');
const logger = require('../../lib/logger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.stripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    logger.warn('Stripe webhook: Missing stripe-signature header');
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
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          logger.warn('Stripe webhook: Missing orderId metadata.');
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
        logger.info(`Stripe webhook: Order updated to PAID (${orderId})`);
        break;
      }

      default:
        logger.debug(`Stripe webhook: Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook handler error:', err);
    return res.status(500).send('Internal webhook error');
  }
};

exports.razorpay = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  if (!signature) {
    logger.warn('Razorpay webhook: Missing signature header');
    return res.status(400).send('Missing signature');
  }

  try {
    const rawBody = (req.rawBody || req.body).toString('utf8');

    // Validate signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      logger.warn('Razorpay webhook: Signature mismatch', {
        expected,
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

    if (!evt) {
      logger.warn('Razorpay webhook: Missing event type');
      return res.json({ ok: true });
    }

    if ((evt === 'payment.captured' || evt === 'order.paid') && orderId) {
      const order = await Order.findById(orderId);

      if (!order) {
        logger.warn(`Razorpay webhook: Order not found (${orderId})`);
      } else if (order.status === 'paid') {
        logger.info(`Razorpay webhook: Order already paid (${orderId})`);
      } else {
        order.status = 'paid';
        order.paymentProvider = 'razorpay';
        order.paymentIntentId = paymentEntity?.id;

        await order.save();
        logger.info(`Razorpay webhook: Order updated to PAID (${orderId})`);
      }
    } else {
      logger.debug(`Razorpay webhook: Unhandled event type ${evt}`);
    }

    return res.json({ ok: true });
  } catch (err) {
    logger.error('Razorpay webhook handler error:', err);
    return res.status(500).send('Internal webhook error');
  }
};
