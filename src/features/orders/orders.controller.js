// src/orders/orders.controller.js
const ordersService = require('./orders.service');
const Order = require('./orders.model');
const ApiError = require('../../core/errors/ApiError');

module.exports = {
  create: async (req, res, next) => {
    try {
      const { items, address, totalAmount, currency, paymentMethod } =
        req.validatedBody;
      const order = await Order.create({
        user: req.user._id,
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

  get: async (req, res, next) => {
    try {
      const order = await Order.findById(req.validatedParams.id);
      if (!order) return res.status(404).json({ message: 'Not found' });
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

  listAdmin: async (req, res, next) => {
    try {
      const { page = 1, limit = 50, status } = req.query;
      const filter = status ? { status } : {};
      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

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

  initSession: async (req, res, next) => {
    try {
      const session = await ordersService.initSessionFromCart(req.user._id);
      res.json(session);
    } catch (err) {
      next(err);
    }
  },

  finalizePricing: async (req, res, next) => {
    try {
      const result = await ordersService.finalizePricing(
        req.user._id,
        req.validatedBody
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  createDraft: async (req, res, next) => {
    try {
      const { checkoutSessionId, paymentGateway } = req.validatedBody;
      const order = await ordersService.createDraftOrder(req.user._id, {
        checkoutSessionId,
        paymentGateway,
      });
      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  confirmPayment: async (req, res, next) => {
    try {
      const { orderId, paymentIntentId, gateway } = req.validatedBody;
      const order = await ordersService.markPaid(orderId, {
        paymentIntentId,
        gateway,
      });
      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  paymentFailed: async (req, res, next) => {
    try {
      const { orderId, reason } = req.validatedBody;
      const order = await ordersService.markFailed(orderId, reason);
      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  myOrders: async (req, res, next) => {
    try {
      const orders = await Order.find({ user: req.user._id }).sort({
        createdAt: -1,
      });
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },
};
