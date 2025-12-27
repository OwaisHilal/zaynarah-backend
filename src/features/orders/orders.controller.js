// src/features/orders/orders.controller.js
const ordersService = require('./orders.service');

/* =====================================================
   🚫 LEGACY ORDER CREATION (DISABLED)
===================================================== */

async function legacyCreateDisabled(req, res) {
  return res.status(410).json({
    message:
      'Direct order creation is disabled. Use checkout session flow instead.',
  });
}

module.exports = {
  /* =====================================================
     ❌ LEGACY (INTENTIONALLY DISABLED)
  ===================================================== */

  create: legacyCreateDisabled,

  /* =====================================================
     🔐 ORDER ACCESS
  ===================================================== */

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

  myOrders: async (req, res, next) => {
    try {
      const orders = await ordersService.listForUser(req.user._id);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  /* =====================================================
     🧾 ADMIN
  ===================================================== */

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

  updateStatus: async (req, res, next) => {
    try {
      if (req.user.role !== 'admin')
        return res.status(403).json({ message: 'Admin required' });

      const id = req.validatedParams?.id || req.params.id;
      const { status } = req.validatedBody;
      const order = await ordersService.updateStatus(id, status);
      res.json(order);
    } catch (err) {
      next(err);
    }
  },

  /* =====================================================
     🧠 CHECKOUT SESSION LIFECYCLE
  ===================================================== */

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

  /* =====================================================
     🔒 PAYMENT CONFIRMATION (SERVER-ONLY)
  ===================================================== */

  confirmPayment: async (req, res) => {
    return res.status(403).json({
      message:
        'Direct payment confirmation is disabled. Payments are verified server-side.',
    });
  },

  paymentFailed: async (req, res, next) => {
    try {
      const { orderId, reason } = req.validatedBody;
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
