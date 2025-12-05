// src/features/webhooks/webhooks.routes.js
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const crypto = require('crypto');
const Order = require('../orders/orders.model');
const logger = require('../../lib/logger');

// --- STRIPE WEBHOOK ---
exports.stripe = async (req, res) => {
  let event;
  const signature = req.headers['stripe-signature'];

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Stripe webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { status: 'paid' });
      logger.info('Order marked paid', orderId);
    }
  }

  res.json({ received: true });
};

// --- RAZORPAY WEBHOOK ---
exports.razorpay = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== signature) {
    return res.status(400).send('Invalid signature');
  }

  const evt = req.body.event;
  const payload =
    req.body.payload?.payment?.entity || req.body.payload?.payment;

  const orderId = payload?.notes?.orderId;

  if (evt === 'payment.captured' || evt === 'order.paid') {
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { status: 'paid' });
      logger.info('Razorpay: marked paid', orderId);
    }
  }

  res.json({ ok: true });
};
