// src/services/payment.service.js
const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createStripeCheckoutSession = async ({
  order,
  success_url,
  cancel_url,
}) => {
  if (!order) throw new Error('Order missing');

  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: 'inr',
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.qty,
  }));

  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    success_url,
    cancel_url,
    metadata: { orderId: order._id.toString() },
  });
};

exports.createStripePaymentIntent = async (order) => {
  if (!order) throw new Error('Order missing');

  return await stripe.paymentIntents.create({
    amount: Math.round(order.totalAmount * 100),
    currency: 'inr',
    metadata: { orderId: order._id.toString() },
  });
};

exports.verifyStripePayment = async (paymentIntentId) => {
  if (!paymentIntentId) throw new Error('PaymentIntentId missing');

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent.status === 'succeeded';
};

exports.createRazorpayOrder = async (order) => {
  if (!order) throw new Error('Order missing');

  return await razorpay.orders.create({
    amount: Math.round(order.totalAmount * 100),
    currency: 'INR',
    receipt: order._id.toString(),
    notes: { orderId: order._id.toString() },
  });
};

exports.verifyRazorpaySignature = async (orderId, paymentId, signature) => {
  if (!orderId || !paymentId || !signature) return false;

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

exports.getPaymentStatus = async (paymentId) => {
  if (!paymentId) throw new Error('paymentId missing');

  // Try Stripe first
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentId);
    return intent.status;
  } catch {
    // Fallback to Razorpay
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment.status;
    } catch {
      return 'unknown';
    }
  }
};
