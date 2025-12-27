// backend/src/services/payment.service.js
const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const ApiError = require('../core/errors/ApiError');

const isStripeLive =
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_');

const stripe = isStripeLive
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
    })
  : null;

const isRazorpayLive =
  Boolean(process.env.RAZORPAY_KEY_ID) &&
  Boolean(process.env.RAZORPAY_KEY_SECRET);

const razorpay = isRazorpayLive
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
  if (!grand || isNaN(grand) || grand <= 0) {
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

  const amountPaise = resolveFinalAmount(order);
  const currency = (order.cartTotal.currency || 'INR').toLowerCase();

  if (!stripe) {
    return {
      id: `dev_stripe_${order._id}`,
      dev: true,
    };
  }

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Order ${order._id}`,
          },
          unit_amount: amountPaise,
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

  const amountPaise = resolveFinalAmount(order);
  const currency = (order.cartTotal.currency || 'INR').toUpperCase();

  if (!razorpay) {
    return {
      id: `dev_rp_${order._id}`,
      amount: amountPaise,
      currency,
      dev: true,
    };
  }

  return razorpay.orders.create({
    amount: amountPaise,
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

  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generated === signature;
};
