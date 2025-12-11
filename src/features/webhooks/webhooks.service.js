// src/features/webhooks/webhooks.service.js
const Stripe = require('stripe');
const crypto = require('crypto');
const ordersService = require('../orders/orders.service');
const logger = require('../../lib/logger');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = {
  /* -------------------------------------------------------------
     STRIPE SIGNATURE VERIFICATION
  ------------------------------------------------------------- */
  verifyStripeSignature(rawBody, signature) {
    if (!signature) throw new Error('Missing stripe-signature');

    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  },

  async processStripeEvent(event) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        return { message: 'No orderId provided' };
      }

      await ordersService.markPaid(orderId, {
        paymentIntentId: session.payment_intent || session.id,
        gateway: 'stripe',
      });

      return { message: 'Order marked as paid (Stripe)' };
    }

    return { message: 'Unhandled Stripe event' };
  },

  /* -------------------------------------------------------------
     RAZORPAY SIGNATURE VERIFICATION
  ------------------------------------------------------------- */
  verifyRazorpaySignature(rawBody, signature) {
    if (!signature) throw new Error('Missing x-razorpay-signature');

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      throw new Error('Razorpay signature mismatch');
    }

    return true;
  },

  async processRazorpayEvent(payload) {
    const event = payload.event;
    const entity =
      payload.payload?.payment?.entity || payload.payload?.order?.entity || {};

    const orderId = entity?.notes?.orderId || entity?.receipt;

    if (!orderId) {
      return { message: 'No orderId found' };
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      await ordersService.markPaid(orderId, {
        paymentIntentId: entity.id,
        gateway: 'razorpay',
      });

      return { message: 'Order marked as paid (Razorpay)' };
    }

    return { message: 'Unhandled Razorpay event' };
  },
};
