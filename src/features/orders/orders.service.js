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

    return Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  },

  ...subServices,
};
