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

function resolveAmount(order) {
  if (!order) throw new ApiError(400, 'Order missing');

  const itemsTotal = (order.items || []).reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || item.quantity || 1);
    return sum + price * qty;
  }, 0);

  if (!itemsTotal || isNaN(itemsTotal) || itemsTotal <= 0) {
    throw new ApiError(400, 'Order items total is invalid');
  }

  const shipping =
    typeof order?.cartTotal === 'object'
      ? Number(order.cartTotal.shipping || 0)
      : 0;

  const tax =
    typeof order?.cartTotal === 'object' ? Number(order.cartTotal.tax || 0) : 0;

  const grand =
    typeof order?.cartTotal === 'object' && Number(order.cartTotal.grand) > 0
      ? Number(order.cartTotal.grand)
      : itemsTotal + shipping + tax;

  if (!grand || isNaN(grand) || grand <= 0) {
    throw new ApiError(400, 'Order total amount is invalid');
  }

  return Math.round(grand * 100);
}

exports.createStripeCheckoutSession = async ({
  order,
  success_url,
  cancel_url,
}) => {
  if (!order) throw new ApiError(400, 'Order missing');

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

  if (!razorpay) {
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
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generated === signature;
};
