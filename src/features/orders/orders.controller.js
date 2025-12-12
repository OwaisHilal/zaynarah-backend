// src/features/orders/orders.controller.js
const ordersService = require('./orders.service');
const ApiError = require('../../core/errors/ApiError');

module.exports = {
  // Create full order (fallback if frontend posts everything)
  create: async (req, res, next) => {
    try {
      const userId = req.user && req.user._id;
      if (!userId)
        return res.status(401).json({ message: 'Authentication required' });

      const payload = req.validatedBody || req.body || {};
      const order = await ordersService.createOrder(userId, payload);
      return res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  },

  // Get order (owner or admin)
  get: async (req, res, next) => {
    try {
      const id = req.validatedParams?.id || req.params.id;
      const order = await ordersService.getOrderById(id);

      if (
        req.user.role !== 'admin' &&
        String(order.user) !== String(req.user._id)
      ) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  // Admin listing
  listAdmin: async (req, res, next) => {
    try {
      if (req.user.role !== 'admin')
        return res.status(403).json({ message: 'Admin required' });

      const { page = 1, limit = 50, status } = req.query;
      const orders = await ordersService.listForAdmin({ page, limit, status });
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  // Admin update status
  updateStatus: async (req, res, next) => {
    try {
      if (req.user.role !== 'admin')
        return res.status(403).json({ message: 'Admin required' });

      const id = req.validatedParams?.id || req.params.id;
      const { status } = req.validatedBody || req.body;
      const order = await ordersService.updateStatus(id, status);
      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  // Get current user's orders
  myOrders: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const orders = await ordersService.listForUser(userId);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  // Checkout lifecycle endpoints

  // POST /orders/checkout/session/init
  initSession: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const session = await ordersService.initSessionFromCart(userId);
      res.json(session);
    } catch (err) {
      next(err);
    }
  },

  // POST /orders/checkout/session/finalize-pricing
  finalizePricing: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const payload = req.validatedBody || req.body || {};
      const result = await ordersService.finalizePricing(userId, payload);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // POST /orders/create-draft
  createDraft: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { checkoutSessionId, paymentGateway } =
        req.validatedBody || req.body || {};
      if (!checkoutSessionId)
        return res.status(400).json({ message: 'checkoutSessionId required' });

      const order = await ordersService.createDraftOrder(userId, {
        checkoutSessionId,
        paymentGateway,
      });
      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  // Manual confirm (frontend-callable)
  confirmPayment: async (req, res, next) => {
    try {
      const { orderId, paymentIntentId, gateway } =
        req.validatedBody || req.body;
      if (!orderId)
        return res.status(400).json({ message: 'orderId required' });

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
      const { orderId, reason } = req.validatedBody || req.body;
      if (!orderId)
        return res.status(400).json({ message: 'orderId required' });

      const order = await ordersService.markFailed(
        orderId,
        reason || 'payment_failed'
      );
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
};
