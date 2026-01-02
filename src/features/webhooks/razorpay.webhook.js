const crypto = require('crypto');
const logger = require('../../lib/logger');
const ordersService = require('../orders/orders.service');

module.exports = async function razorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];

  if (!signature) {
    logger.warn('Razorpay webhook: Missing signature');
    return res.status(400).send('Missing signature');
  }

  try {
    const rawBody = (req.rawBody || req.body).toString('utf8');

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('Razorpay webhook: Signature mismatch');
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (!event) {
      logger.warn('Razorpay webhook: Missing event type');
      return res.json({ ok: true });
    }

    const paymentEntity =
      payload.payload?.payment?.entity || payload.payload?.payment || {};

    const orderId =
      paymentEntity?.notes?.orderId ||
      paymentEntity?.receipt ||
      paymentEntity?.order_id ||
      null;

    if (!orderId) {
      logger.warn('Razorpay webhook: Missing orderId', { event });
      return res.json({ ok: true });
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      await ordersService.markPaid(orderId, {
        paymentIntentId: paymentEntity?.id,
        gateway: 'razorpay',
      });

      logger.info(`Razorpay webhook: Payment captured for order ${orderId}`);
    } else if (event === 'payment.failed' || event === 'order.payment_failed') {
      const failureReason =
        paymentEntity?.error_reason ||
        paymentEntity?.error_description ||
        'payment_failed';

      await ordersService.markFailed(orderId, failureReason);

      logger.warn(`Razorpay webhook: Payment failed for order ${orderId}`, {
        reason: failureReason,
      });
    } else {
      logger.debug(`Razorpay webhook: Ignored event ${event}`);
    }

    return res.json({ ok: true });
  } catch (err) {
    logger.error('Razorpay webhook internal error', {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).send('Internal webhook error');
  }
};
