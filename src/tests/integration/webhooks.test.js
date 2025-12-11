/**
 * tests/integration/webhooks.test.js
 *
 * Integration tests for Stripe + Razorpay webhooks.
 */

const request = require('supertest');
const app = require('../../server');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../../features/orders/orders.model');

const STRIPE_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const RZP_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

// helper to create an order
async function makeOrder() {
  return await Order.create({
    user: new mongoose.Types.ObjectId(),
    items: [],
    totalAmount: 1200,
    shippingAddress: {},
    status: 'pending',
  });
}

/* -------------------------------------------------------------
    STRIPE WEBHOOK TEST
------------------------------------------------------------- */
describe('POST /webhooks/stripe', () => {
  test('marks order as paid when checkout.session.completed', async () => {
    const order = await makeOrder();

    // Fake Stripe event
    const payload = {
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          payment_intent: 'pi_test_123',
          metadata: { orderId: order._id.toString() },
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(payload));

    // Stripe signature header simulation
    const signedPayload = [
      `t=${Math.floor(Date.now() / 1000)}`,
      crypto
        .createHmac('sha256', STRIPE_SECRET)
        .update(`${Math.floor(Date.now() / 1000)}.${rawBody}`)
        .digest('hex'),
    ].join(',');

    const res = await request(app)
      .post('/webhooks/stripe')
      .set('stripe-signature', signedPayload)
      .send(rawBody);

    expect(res.statusCode).toBe(200);

    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('paid');
    expect(updated.paymentProvider).toBe('stripe');
    expect(updated.paymentIntentId).toBe('pi_test_123');
  });
});

/* -------------------------------------------------------------
    RAZORPAY WEBHOOK TEST
------------------------------------------------------------- */
describe('POST /webhooks/razorpay', () => {
  test('marks order as paid when payment.captured', async () => {
    const order = await makeOrder();

    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_123',
            notes: { orderId: order._id.toString() },
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);

    // Razorpay HMAC signature
    const signature = crypto
      .createHmac('sha256', RZP_SECRET)
      .update(rawBody)
      .digest('hex');

    const res = await request(app)
      .post('/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .send(rawBody);

    expect(res.statusCode).toBe(200);

    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('paid');
    expect(updated.paymentProvider).toBe('razorpay');
    expect(updated.paymentIntentId).toBe('pay_test_123');
  });
});
