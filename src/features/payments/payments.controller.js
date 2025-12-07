const Order = require('../orders/orders.model');
const paymentService = require('../../services/payment.service');

exports.createStripeCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Missing orderId' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const session = await paymentService.createStripeCheckoutSession({
      order,
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
    });

    order.paymentProvider = 'stripe';
    order.paymentIntentId = session.payment_intent || session.id;
    await order.save();

    res.json({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    next(err);
  }
};

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

    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyStripePayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId)
      return res.status(400).json({ message: 'Missing paymentIntentId' });

    const verified = await paymentService.verifyStripePayment(paymentIntentId);
    res.json({ success: verified });
  } catch (err) {
    next(err);
  }
};

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Missing orderId' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const rpOrder = await paymentService.createRazorpayOrder(order);

    order.paymentProvider = 'razorpay';
    order.paymentIntentId = rpOrder.id;
    await order.save();

    res.json({
      paymentId: rpOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyRazorpaySignature = (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    if (!orderId || !paymentId || !signature)
      return res
        .status(400)
        .json({ message: 'orderId, paymentId & signature required' });

    const isValid = paymentService.verifyRazorpaySignature(
      orderId,
      paymentId,
      signature
    );
    res.json({ success: isValid });
  } catch (err) {
    next(err);
  }
};

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
