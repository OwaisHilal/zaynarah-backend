// src/services/payment.service.js
const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const ApiError = require('../core/errors/ApiError');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

module.exports = {
  // create Stripe Checkout Session
  createStripeCheckoutSession: async ({ order, success_url, cancel_url }) => {
    if (!order) throw new ApiError(400, 'Order missing');

    const lineItems = (order.items || []).map((item) => ({
      price_data: {
        currency: (order.currency || 'INR').toLowerCase(),
        product_data: { name: item.name || item.title || 'Product' },
        unit_amount: Math.round((item.price || 0) * 100),
      },
      quantity: item.qty || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url,
      cancel_url,
      metadata: { orderId: order._id.toString() },
    });

    return session;
  },

  // create Stripe PaymentIntent (alternative flow)
  createStripePaymentIntent: async (order) => {
    if (!order) throw new ApiError(400, 'Order missing');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round((order.totalAmount || 0) * 100),
      currency: (order.currency || 'INR').toLowerCase(),
      metadata: { orderId: order._id.toString() },
    });

    return paymentIntent;
  },

  // verify Stripe PaymentIntent status
  verifyStripePayment: async (paymentIntentId) => {
    if (!paymentIntentId) throw new ApiError(400, 'PaymentIntentId missing');

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return intent && intent.status === 'succeeded';
  },

  // Create Razorpay order
  createRazorpayOrder: async (order) => {
    if (!order) throw new ApiError(400, 'Order missing');

    const amountPaise = Math.round((order.totalAmount || 0) * 100);
    const options = {
      amount: amountPaise,
      currency: (order.currency || 'INR').toUpperCase(),
      receipt: order._id.toString(),
      payment_capture: 1,
      notes: { orderId: order._id.toString() },
    };

    const rpOrder = await razorpay.orders.create(options);
    return rpOrder;
  },

  // Verify Razorpay signature (server-side)
  verifyRazorpaySignature: (orderId, paymentId, signature) => {
    if (!orderId || !paymentId || !signature) return false;
    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return generated === signature;
  },

  // get payment status (try stripe then razorpay)
  getPaymentStatus: async (paymentId) => {
    if (!paymentId) throw new ApiError(400, 'paymentId missing');

    // Try Stripe
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentId);
      if (intent && intent.status) return intent.status;
    } catch (err) {
      // ignore and try razorpay
    }

    // Try Razorpay
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      if (payment && payment.status) return payment.status;
    } catch (err) {
      // ignore
    }

    return 'unknown';
  },

  // Stripe webhook handler (raw body + sig header)
  handleStripeWebhook: async (rawBody, sigHeader) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret)
      throw new ApiError(500, 'Stripe webhook secret not configured');

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sigHeader,
      endpointSecret
    );

    return event;
  },
};
