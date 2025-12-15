const Order = require('../orders/orders.model');
const paymentService = require('../../services/payment.service');
const ordersService = require('../orders/orders.service');

/* ========================= STRIPE ========================= */

exports.createStripeCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // DEV MODE — no Stripe keys yet
    if (!process.env.STRIPE_SECRET_KEY) {
      order.paymentProvider = 'stripe';
      order.paymentIntentId = `dev_stripe_${order._id}`;
      await order.save();

      return res.json({
        sessionId: order.paymentIntentId,
        publishableKey: 'dev',
        dev: true,
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
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    next(err);
  }
};

exports.createStripePaymentIntent = async (req, res) => {
  // Optional flow – keep simple for now
  res.status(501).json({ message: 'Stripe PaymentIntent not enabled yet' });
};

exports.verifyStripePayment = async (req, res) => {
  const { orderId } = req.body;

  // DEV MODE → auto-success
  if (!process.env.STRIPE_SECRET_KEY && orderId) {
    await ordersService.markPaid(orderId, {
      gateway: 'stripe',
      paymentIntentId: 'dev',
    });
    return res.json({ success: true, dev: true });
  }

  res.status(501).json({ message: 'Stripe verification not enabled yet' });
};

/* ======================== RAZORPAY ======================== */

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // DEV MODE — no Razorpay keys
    if (!process.env.RAZORPAY_KEY_ID) {
      order.paymentProvider = 'razorpay';
      order.paymentIntentId = `dev_rp_${order._id}`;
      await order.save();

      return res.json({
        orderId: order.paymentIntentId,
        key: 'dev',
        amount: order.cartTotal.grand * 100,
        currency: order.cartTotal.currency || 'INR',
        dev: true,
      });
    }

    const rpOrder = await paymentService.createRazorpayOrder(order);

    order.paymentProvider = 'razorpay';
    order.paymentIntentId = rpOrder.id;
    await order.save();

    res.json({
      orderId: rpOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyRazorpaySignature = async (req, res) => {
  const { orderId } = req.body;

  // DEV MODE → auto-success
  if (!process.env.RAZORPAY_KEY_ID && orderId) {
    await ordersService.markPaid(orderId, {
      gateway: 'razorpay',
      paymentIntentId: 'dev',
    });
    return res.json({ success: true, dev: true });
  }

  res.status(501).json({ message: 'Razorpay verification not enabled yet' });
};

/* ======================== COMMON ========================== */

exports.getPaymentStatus = async (req, res) => {
  res.json({ status: 'pending' });
};
