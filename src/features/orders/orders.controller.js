// src/features/orders/orders.controller.js
const Order = require('./orders.model');
const ApiError = require('../../core/errors/ApiError');

module.exports = {
  // Create a new order
  create: async (req, res, next) => {
    try {
      const { items, address, totalAmount, currency, paymentMethod } =
        req.validatedBody;

      const order = await Order.create({
        user: req.user?._id,
        items,
        address,
        totalAmount,
        currency: currency || 'INR',
        paymentMethod,
        status: 'pending',
      });

      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  },

  // Get a single order by ID
  get: async (req, res, next) => {
    try {
      const { id } = req.validatedParams;
      const order = await Order.findById(id);

      if (!order) return res.status(404).json({ message: 'Not found' });

      // Only admin or order owner can access
      if (
        req.user.role !== 'admin' &&
        (!order.user || !order.user.equals(req.user._id))
      ) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  // List all orders (admin only)
  listAdmin: async (req, res, next) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 }).limit(200);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  // Update order status (admin only)
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.validatedParams;
      const { status } = req.validatedBody;

      const order = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!order) return res.status(404).json({ message: 'Order not found' });

      res.json(order);
    } catch (err) {
      next(err);
    }
  },
};
