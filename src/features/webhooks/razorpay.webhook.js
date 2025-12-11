// src/features/webhooks/razorpay.webhook.js
const crypto = require('crypto');
const Order = require('../orders/orders.model');
const logger = require('../../lib/logger');

module.exports = async function razorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];

  if (!signature) {
    logger.warn('Razorpay webhook: Missing signature');
    return res.status(400).send('Missing signature');
  }

  try {
    const rawBody = (req.rawBody || req.body).toString('utf8');

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      logger.warn('Razorpay webhook: Signature mismatch', {
        expected,
        provided: signature,
      });
      return res.status(400).send('Invalid signature');
    }

    const data = JSON.parse(rawBody);
    const evt = data.event;

    const paymentEntity =
      data.payload?.payment?.entity || data.payload?.payment || {};

    const orderId =
      paymentEntity?.notes?.orderId || paymentEntity?.receipt || null;

    if (!evt) {
      logger.warn('Razorpay webhook: Missing event type');
      return res.json({ ok: true });
    }

    if ((evt === 'payment.captured' || evt === 'order.paid') && orderId) {
      const order = await Order.findById(orderId);

      if (!order) {
        logger.warn(`Razorpay webhook: Order not found (${orderId})`);
      } else if (order.status === 'paid') {
        logger.info(`Razorpay webhook: Already paid (${orderId})`);
      } else {
        order.status = 'paid';
        order.paymentProvider = 'razorpay';
        order.paymentIntentId = paymentEntity?.id;

        await order.save();
        logger.info(`Razorpay webhook: Order marked PAID (${orderId})`);
      }
    } else {
      logger.debug(`Razorpay webhook: Unhandled event ${evt}`);
    }

    return res.json({ ok: true });
  } catch (err) {
    logger.error('Razorpay webhook internal error:', err);
    return res.status(500).send('Internal webhook error');
  }
};
