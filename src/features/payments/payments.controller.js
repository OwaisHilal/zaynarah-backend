// src/features/payments/payments.controller.js
const Order = require('../orders/orders.model');
const paymentService = require('../../services/payment.service');
const ordersService = require('../orders/orders.service'); // to mark paid after verification

/**
 * Create Stripe Checkout Session
 * frontend expects { sessionId, publishableKey }
 */
exports.createStripeCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Missing orderId' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const success_url = `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${process.env.FRONTEND_URL}/checkout/cancel`;

    const session = await paymentService.createStripeCheckoutSession({
      order,
      success_url,
      cancel_url,
    });

    // Save provider / intent if available (best-effort)
    order.paymentProvider = 'stripe';
    order.paymentIntentId =
      session.payment_intent || session.id || order.paymentIntentId;
    await order.save();

    return res.json({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create Stripe PaymentIntent (alternative flow)
 */
exports.createStripePaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Missing orderId' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const paymentIntent = await paymentService.createStripePaymentIntent(order);

    order.paymentProvider = 'stripe';
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    return res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verify Stripe Payment (client may call, or webhook used)
 */
exports.verifyStripePayment = async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    if (!paymentIntentId)
      return res.status(400).json({ message: 'Missing paymentIntentId' });

    const ok = await paymentService.verifyStripePayment(paymentIntentId);
    if (!ok)
      return res
        .status(400)
        .json({ success: false, message: 'Payment not succeeded' });

    // optionally mark order paid if orderId provided
    if (orderId) {
      await ordersService.markPaid(orderId, {
        paymentIntentId,
        gateway: 'stripe',
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Create Razorpay Order (frontend expects { orderId, key, amount, currency })
 * note: rpOrder.id is razorpay order id; we save it to paymentIntentId
 */
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Missing orderId' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const rpOrder = await paymentService.createRazorpayOrder(order);

    // Save razorpay order id on our order.paymentIntentId
    order.paymentProvider = 'razorpay';
    order.paymentIntentId = rpOrder.id;
    await order.save();

    return res.json({
      orderId: rpOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verify Razorpay signature.
 */
exports.verifyRazorpaySignature = async (req, res, next) => {
  try {
    const { orderId: providedOrderId, paymentId, signature } = req.body;
    if (!providedOrderId || !paymentId || !signature)
      return res
        .status(400)
        .json({ message: 'orderId, paymentId & signature required' });

    // Try to resolve our order
    let order = null;
    const isProbablyObjectId = /^[0-9a-fA-F]{24}$/.test(
      String(providedOrderId)
    );
    if (isProbablyObjectId) {
      order = await Order.findById(providedOrderId);
    }
    if (!order) {
      order = await Order.findOne({ paymentIntentId: providedOrderId });
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const razorpayOrderId = order.paymentIntentId || providedOrderId;

    const isValid = paymentService.verifyRazorpaySignature(
      razorpayOrderId,
      paymentId,
      signature
    );
    if (!isValid)
      return res
        .status(400)
        .json({ success: false, message: 'Invalid signature' });

    try {
      await ordersService.markPaid(order._id, {
        paymentIntentId: paymentId,
        gateway: 'razorpay',
      });
    } catch (err) {
      console.error(
        'Failed to mark order paid after signature verification:',
        err
      );
      return res
        .status(500)
        .json({ success: false, message: 'Failed to mark order paid' });
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Get payment status (tries stripe then razorpay)
 */
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId)
      return res.status(400).json({ message: 'Missing paymentId' });

    const status = await paymentService.getPaymentStatus(paymentId);
    res.json({ paymentId, status });
  } catch (err) {
    next(err);
  }
};
