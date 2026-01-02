const Stripe = require('stripe');
const logger = require('../../lib/logger');
const ordersService = require('../orders/orders.service');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    logger.warn('Stripe webhook: Missing stripe-signature');
    return res.status(400).send('Missing stripe-signature');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody || req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Stripe webhook: Verification failed', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        logger.warn('Stripe webhook: Missing orderId in metadata');
        return res.json({ received: true });
      }

      await ordersService.markPaid(orderId, {
        paymentIntentId: session.payment_intent || session.id,
        gateway: 'stripe',
      });

      logger.info(`Stripe webhook: Payment completed for order ${orderId}`);
    } else if (
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
      const obj = event.data.object;

      const orderId =
        obj.metadata?.orderId ||
        obj.client_reference_id ||
        obj.metadata?.checkoutSessionId ||
        null;

      if (!orderId) {
        logger.warn('Stripe webhook: Failure event without orderId', {
          type: event.type,
        });
        return res.json({ received: true });
      }

      const failureReason =
        obj.last_payment_error?.message ||
        obj.cancellation_reason ||
        'payment_failed';

      await ordersService.markFailed(orderId, failureReason);

      logger.warn(`Stripe webhook: Payment failed for order ${orderId}`, {
        reason: failureReason,
        event: event.type,
      });
    } else {
      logger.debug(`Stripe webhook: Ignored event ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook internal error', {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).send('Internal webhook error');
  }
};
