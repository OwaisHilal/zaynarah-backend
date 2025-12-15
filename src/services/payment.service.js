// src/services/payment.service.js

const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const ApiError = require('../core/errors/ApiError');

const stripe =
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_')
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2022-11-15',
      })
    : null;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dev',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dev',
});

function resolveAmount(order) {
  if (!order) throw new ApiError(400, 'Order missing');

  // Prefer finalized totals
  let amount = Number(order?.cartTotal?.grand);

  // Fallback: calculate from items
  if (!amount || isNaN(amount) || amount <= 0) {
    amount = (order.items || []).reduce((sum, item) => {
      return (
        sum + Number(item.price || 0) * Number(item.qty || item.quantity || 1)
      );
    }, 0);
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    throw new ApiError(400, 'Order total amount is invalid');
  }

  return Math.round(amount * 100); // convert to paise
}

exports.createStripeCheckoutSession = async ({
  order,
  success_url,
  cancel_url,
}) => {
  if (!order) throw new ApiError(400, 'Order missing');

  /* ---------- DEV MODE (NO STRIPE KEYS) ---------- */
  if (!stripe) {
    return {
      id: `dev_stripe_${order._id}`,
      dev: true,
    };
  }

  const lineItems = (order.items || []).map((item) => ({
    price_data: {
      currency: (order.cartTotal?.currency || 'INR').toLowerCase(),
      product_data: {
        name: item.title || item.name || 'Product',
      },
      unit_amount: Math.round((item.price || 0) * 100),
    },
    quantity: item.qty || 1,
  }));

  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    success_url,
    cancel_url,
    metadata: {
      orderId: order._id.toString(),
    },
  });
};

exports.createRazorpayOrder = async (order) => {
  if (!order) throw new ApiError(400, 'Order missing');

  const amountPaise = resolveAmount(order);

  /* ---------- DEV MODE (NO RAZORPAY KEYS) ---------- */
  if (!process.env.RAZORPAY_KEY_ID) {
    return {
      id: `dev_rp_${order._id}`,
      amount: amountPaise,
      currency: order.cartTotal?.currency || 'INR',
      dev: true,
    };
  }

  return razorpay.orders.create({
    amount: amountPaise,
    currency: (order.cartTotal?.currency || 'INR').toUpperCase(),
    receipt: order._id.toString(),
    payment_capture: 1,
    notes: {
      orderId: order._id.toString(),
    },
  });
};

exports.verifyRazorpaySignature = (orderId, paymentId, signature) => {
  if (!orderId || !paymentId || !signature) return false;

  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dev')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generated === signature;
};
