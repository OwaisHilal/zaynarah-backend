// src/features/payments/payments.controller.js
const Order = require('../orders/orders.model');
const paymentService = require('../../services/payment.service');

exports.createStripeSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const session = await paymentService.createStripeSession({
      order,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });

    order.paymentProvider = 'stripe';
    order.paymentIntentId = session.payment_intent ?? session.id;
    await order.save();

    res.json({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    next(err);
  }
};

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const rOrder = await paymentService.createRazorpayOrder({ order });

    order.paymentProvider = 'razorpay';
    order.paymentIntentId = rOrder.id;
    await order.save();

    res.json({
      id: rOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: rOrder.amount,
      currency: rOrder.currency,
    });
  } catch (err) {
    next(err);
  }
};
