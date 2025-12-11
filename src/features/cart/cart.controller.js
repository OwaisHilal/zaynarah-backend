// src/features/cart/cart.controller.js
const cartService = require('./cart.service');

// Helper to normalize cart items for frontend
const normalizeCart = (cart) => ({
  items: (cart.items || []).map((i) => ({
    productId: i.product._id,
    title: i.product.title,
    price: i.product.price,
    image: i.product.image,
    qty: i.quantity,
  })),
});

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
      res.json(carts); // admin can handle full object
    } catch (err) {
      next(err);
    }
  },
};
