const Order = require('./orders.model');
const ApiError = require('../../core/errors/ApiError');
const subServices = require('./services');

module.exports = {
  getOrderById: async (orderId) => {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  },

  listForAdmin: async ({ page = 1, limit = 50, status } = {}) => {
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    return Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
  },

  listForUser: async (userId) => {
    return Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  },

  ...subServices,
};
