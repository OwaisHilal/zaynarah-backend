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
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getCartByUser(req.user.id);
      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  async addItem(req, res, next) {
    try {
      const { productId, quantity } = req.validatedBody;
      const cart = await cartService.addItem(req.user.id, productId, quantity);
      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  async updateItem(req, res, next) {
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

  async removeItem(req, res, next) {
    try {
      const { productId } = req.validatedParams;
      const cart = await cartService.removeItem(req.user.id, productId);
      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  async clearCart(req, res, next) {
    try {
      const cart = await cartService.clearCart(req.user.id);
      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  async mergeCart(req, res, next) {
    try {
      const { items } = req.body;
      const cart = await cartService.mergeCart(req.user.id, items || []);
      res.json(normalizeCart(cart));
    } catch (err) {
      next(err);
    }
  },

  async getAllCarts(req, res, next) {
    try {
      const carts = await cartService.getAllCarts();
      res.json(carts);
    } catch (err) {
      next(err);
    }
  },
};
