// src/features/payments/payments.controller.js
const Order = require('../orders/orders.model');
const paymentService = require('../../services/payment.service');

exports.createStripeCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.validatedBody;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.paymentIntentId) {
      return res.json({
        sessionId: order.paymentIntentId,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'dev',
        reused: true,
      });
    }

    if (order.status !== 'payment_pending') {
      return res.status(400).json({
        message: `Order not ready for payment (status: ${order.status})`,
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

exports.verifyStripePayment = async (_req, res) => {
  res.status(403).json({
    message:
      'Direct payment verification is disabled. Payments are confirmed server-side via webhooks.',
  });
};

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.validatedBody;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.paymentIntentId) {
      return res.json({
        orderId: order.paymentIntentId,
        key: process.env.RAZORPAY_KEY_ID || 'dev',
        reused: true,
      });
    }

    if (order.status !== 'payment_pending') {
      return res.status(400).json({
        message: `Order not ready for payment (status: ${order.status})`,
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

exports.verifyRazorpaySignature = async (_req, res) => {
  res.status(403).json({
    message:
      'Direct payment verification is disabled. Payments are confirmed server-side via webhooks.',
  });
};

exports.refundPayment = async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.validatedBody;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Order is not paid' });
    }

    let refund;

    if (order.paymentProvider === 'stripe') {
      refund = await paymentService.refundStripe({
        paymentIntentId: order.paymentIntentId,
        amount,
      });
    }

    if (order.paymentProvider === 'razorpay') {
      refund = await paymentService.refundRazorpay({
        paymentId: order.paymentIntentId,
        amount,
      });
    }

    order.refunds.push({
      amount,
      gateway: order.paymentProvider,
      refundId: refund?.id || 'dev',
      reason,
    });

    await order.save();

    res.json({ success: true, refund });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentStatus = async (req, res) => {
  const { paymentId } = req.validatedParams;
  res.json({ status: 'pending', paymentId });
};
