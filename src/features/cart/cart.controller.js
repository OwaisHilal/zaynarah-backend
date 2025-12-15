// src/features/cart/cart.controller.js
const cartService = require('./cart.service');

const normalizeCart = (cart) => {
  if (!cart || !Array.isArray(cart.items)) {
    return { items: [] };
  }

  return {
    items: cart.items.map((i) => ({
      productId: i.product?._id?.toString() || null,
      title: i.product?.title || i.product?.name || 'Untitled',
      price: i.product?.price ?? 0,
      image: i.product?.image || i.product?.images?.[0] || '',
      qty: i.quantity,
    })),
  };
};

module.exports = {
  getCart: async (req, res, next) => {
    try {
      const cart = await cartService.getCartByUser(req.user.id);
      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  addItem: async (req, res, next) => {
    try {
      const { productId, quantity } = req.validatedBody;
      const cart = await cartService.addItem(req.user.id, productId, quantity);

      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  updateItem: async (req, res, next) => {
    try {
      const { quantity } = req.validatedBody;
      const { productId } = req.validatedParams;

      const cart = await cartService.updateItem(
        req.user.id,
        productId,
        quantity
      );

      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  removeItem: async (req, res, next) => {
    try {
      const { productId } = req.validatedParams;

      const cart = await cartService.removeItem(req.user.id, productId);
      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  clearCart: async (req, res, next) => {
    try {
      const cart = await cartService.clearCart(req.user.id);
      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  mergeCart: async (req, res, next) => {
    try {
      const { items } = req.body;
      const cart = await cartService.mergeCart(req.user.id, items || []);

      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  getAllCarts: async (req, res, next) => {
    try {
      const carts = await cartService.getAllCarts();
      res.json(carts); // Admin gets raw data
    } catch (err) {
      next(err);
    }
  },
};
