// src/features/cart/cart.service.js
const Cart = require('./cart.model');
const Product = require('../products/products.model');
const ApiError = require('../../core/errors/ApiError');
const mongoose = require('mongoose');

module.exports = {
  // -------------------------------------------------
  // GET CART
  // -------------------------------------------------
  getCartByUser: async (userId) => {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    return cart; // raw cart (controller normalizes)
  },

  // -------------------------------------------------
  // ADD ITEM
  // -------------------------------------------------
  addItem: async (userId, productId, quantity = 1) => {
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    const existing = cart.items.find((i) => i.product.equals(productId));

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate('items.product');
    return cart;
  },

  // -------------------------------------------------
  // UPDATE ITEM
  // -------------------------------------------------
  updateItem: async (userId, productId, quantity) => {
    if (quantity < 1) throw new ApiError(400, 'Quantity must be at least 1');

    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) throw new ApiError(404, 'Cart not found');

    const item = cart.items.find((i) => i.product.equals(productId));
    if (!item) throw new ApiError(404, 'Product not in cart');

    item.quantity = quantity;
    await cart.save();
    return cart;
  },

  // -------------------------------------------------
  // REMOVE ITEM
  // -------------------------------------------------
  removeItem: async (userId, productId) => {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) throw new ApiError(404, 'Cart not found');

    cart.items = cart.items.filter((i) => !i.product.equals(productId));
    await cart.save();
    return cart;
  },

  // -------------------------------------------------
  // CLEAR CART
  // -------------------------------------------------
  clearCart: async (userId) => {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) throw new ApiError(404, 'Cart not found');

    cart.items = [];
    await cart.save();
    return cart;
  },

  // -------------------------------------------------
  // MERGE CART AFTER LOGIN
  // -------------------------------------------------
  mergeCart: async (userId, clientItems) => {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    clientItems.forEach((ci) => {
      if (!ci.productId) return;

      const pid = new mongoose.Types.ObjectId(ci.productId);
      const existing = cart.items.find((i) => i.product.equals(pid));

      if (existing) {
        existing.quantity += ci.qty || ci.quantity || 1;
      } else {
        cart.items.push({ product: pid, quantity: ci.qty || ci.quantity || 1 });
      }
    });

    await cart.save();
    await cart.populate('items.product');
    return cart;
  },

  // -------------------------------------------------
  // ADMIN GET ALL
  // -------------------------------------------------
  getAllCarts: async () => {
    const carts = await Cart.find().populate('user items.product');
    return carts; // admin gets raw
  },
};
