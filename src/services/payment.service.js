// src/services/payment.service.js
const Stripe = require('stripe');
const Razorpay = require('razorpay');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const Razor = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {
  stripe,

  // ---------- Stripe ----------
  createStripeSession: async ({ order, success_url, cancel_url }) => {
    const line_items = (order.items || []).map((it) => ({
      price_data: {
        currency: (order.currency || 'INR').toLowerCase(),
        product_data: { name: it.title },
        unit_amount: Math.round((it.unitPrice || it.price || 0) * 100),
      },
      quantity: it.qty,
    }));

    // Stripe v20 syntax
    return await stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      success_url,
      cancel_url,
      metadata: { orderId: String(order._id) },
    });
  },

  // ---------- Razorpay ----------
  createRazorpayOrder: async ({ order }) => {
    const amount = Math.round((order.totalAmount || 0) * 100);

    return await Razor.orders.create({
      amount,
      currency: order.currency || 'INR',
      receipt: String(order._id),
      notes: {
        orderId: String(order._id), // webhook needs this
      },
    });
  },
};
