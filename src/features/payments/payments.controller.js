// src/features/payments/payments.controller.js
const Order = require('../orders/orders.model');
const paymentService = require('../../services/payment.service');
const ordersService = require('../orders/orders.service');

exports.createStripeCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.paymentIntentId) {
      return res.json({
        sessionId: order.paymentIntentId,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'dev',
        reused: true,
      });
    }

    const session = await paymentService.createStripeCheckoutSession({
      order,
      success_url: `${process.env.FRONTEND_URL}/checkout/success`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
    });

    order.paymentProvider = 'stripe';
    order.paymentIntentId = session.id;
    await order.save();

    res.json({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'dev',
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyStripePayment = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'orderId required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    await ordersService.markPaid(orderId, {
      gateway: 'stripe',
      paymentIntentId: 'dev',
    });
    return res.json({ success: true, dev: true });
  }

  res.status(501).json({ message: 'Stripe verification not implemented' });
};

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.paymentIntentId) {
      return res.json({
        orderId: order.paymentIntentId,
        key: process.env.RAZORPAY_KEY_ID || 'dev',
        reused: true,
      });
    }

    const rpOrder = await paymentService.createRazorpayOrder(order);

    order.paymentProvider = 'razorpay';
    order.paymentIntentId = rpOrder.id;
    await order.save();

    res.json({
      orderId: rpOrder.id,
      key: process.env.RAZORPAY_KEY_ID || 'dev',
      amount: rpOrder.amount,
      currency: rpOrder.currency,
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyRazorpaySignature = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'orderId required' });
  }

  if (!process.env.RAZORPAY_KEY_ID) {
    await ordersService.markPaid(orderId, {
      gateway: 'razorpay',
      paymentIntentId: 'dev',
    });
    return res.json({ success: true, dev: true });
  }

  res.status(501).json({ message: 'Razorpay verification not implemented' });
};

exports.getPaymentStatus = async (req, res) => {
  res.json({ status: 'pending' });
};
