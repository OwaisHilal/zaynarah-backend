// backend/src/services/payment.service.js
const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const ApiError = require('../core/errors/ApiError');

const stripe =
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_')
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' })
    : null;

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

function resolveFinalAmount(order) {
  if (!order || !order.cartTotal) {
    throw new ApiError(400, 'Order pricing not finalized');
  }

  const grand = Number(order.cartTotal.grand);
  if (!Number.isFinite(grand) || grand <= 0) {
    throw new ApiError(400, 'Invalid order total');
  }

  return Math.round(grand * 100);
}

exports.createStripeCheckoutSession = async ({
  order,
  success_url,
  cancel_url,
}) => {
  if (!order) throw new ApiError(400, 'Order missing');
  if (!stripe) throw new ApiError(503, 'Stripe not configured');

  const amount = resolveFinalAmount(order);
  const currency = (order.cartTotal.currency || 'INR').toLowerCase();

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: `Order ${order._id}` },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url,
    cancel_url,
    metadata: {
      orderId: order._id.toString(),
    },
  });
};

exports.createRazorpayOrder = async (order) => {
  if (!order) throw new ApiError(400, 'Order missing');
  if (!razorpay) throw new ApiError(503, 'Razorpay not configured');

  const amount = resolveFinalAmount(order);
  const currency = (order.cartTotal.currency || 'INR').toUpperCase();

  return razorpay.orders.create({
    amount,
    currency,
    receipt: order._id.toString(),
    payment_capture: 1,
    notes: {
      orderId: order._id.toString(),
    },
  });
};

exports.verifyRazorpaySignature = (orderId, paymentId, signature) => {
  if (!orderId || !paymentId || !signature) return false;

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expected === signature;
};

exports.refundStripe = async ({ paymentIntentId, amount }) => {
  if (!stripe) throw new ApiError(503, 'Stripe not configured');

  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.round(amount * 100),
  });
};

exports.refundRazorpay = async ({ paymentId, amount }) => {
  if (!razorpay) throw new ApiError(503, 'Razorpay not configured');

  return razorpay.payments.refund(paymentId, {
    amount: Math.round(amount * 100),
  });
};
