// backend/src/features/orders/orders.service.js
const Order = require('./orders.model');
const ApiError = require('../../core/errors/ApiError');
const subServices = require('./services');

const normalizePage = (v, def) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) return def;
  return n;
};

const normalizeLimit = (v, def, max) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) return def;
  return Math.min(n, max);
};

async function markPaid(orderId, { paymentIntentId, gateway }) {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.paymentStatus === 'paid') {
    return order.toObject();
  }

  if (order.status !== 'payment_pending') {
    throw new ApiError(
      400,
      `Cannot mark order paid from status ${order.status}`
    );
  }

  order.paymentStatus = 'paid';
  order.paymentProvider = gateway || order.paymentProvider;
  order.paymentIntentId = paymentIntentId || order.paymentIntentId;
  order.paidAt = new Date();

  order.statusHistory.push({
    from: order.status,
    to: 'confirmed',
    note: `Payment confirmed via ${gateway}`,
  });

  order.status = 'confirmed';

  await order.save();
  return order.toObject();
}

async function markFailed(orderId, reason) {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.paymentStatus === 'paid') {
    return order.toObject();
  }

  if (order.paymentStatus === 'failed') {
    return order.toObject();
  }

  if (!['payment_pending', 'priced'].includes(order.status)) {
    throw new ApiError(
      400,
      `Cannot mark order failed from status ${order.status}`
    );
  }

  order.paymentStatus = 'failed';
  order.failureReason = reason || 'payment_failed';
  order.failedAt = new Date();

  order.statusHistory.push({
    from: order.status,
    to: 'failed',
    note: order.failureReason,
  });

  order.status = 'failed';

  await order.save();
  return order.toObject();
}

module.exports = {
  async getOrderById(orderId) {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  },

  async listForAdmin({ page, limit, status } = {}) {
    const safePage = normalizePage(page, 1);
    const safeLimit = normalizeLimit(limit, 50, 100);
    const skip = (safePage - 1) * safeLimit;

    const filter = status ? { status } : {};

    return Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();
  },

  async listForUser(userId) {
    if (!userId) throw new ApiError(400, 'User required');

    return Order.find({
      user: userId,
      status: { $ne: 'draft' },
    })
      .sort({ createdAt: -1 })
      .lean();
  },

  markPaid,
  markFailed,

  ...subServices,
};
