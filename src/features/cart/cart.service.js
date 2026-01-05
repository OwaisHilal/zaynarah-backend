// src/features/cart/cart.service.js
const Cart = require('./cart.model');
const Product = require('../products/products.model');
const ApiError = require('../../core/errors/ApiError');
const mongoose = require('mongoose');

const clampQty = (qty, max) => {
  const q = Number(qty) || 1;
  return Math.max(1, Math.min(q, max));
};

module.exports = {
  async getCartByUser(userId) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
      await cart.populate('items.product');
    }
    return cart;
  },

  async addItem(userId, productId, quantity = 1) {
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');

    const qty = clampQty(quantity, product.stock);

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    const existing = cart.items.find((i) => i.product.equals(product._id));

    if (existing) {
      existing.quantity = clampQty(existing.quantity + qty, product.stock);
    } else {
      cart.items.push({ product: product._id, quantity: qty });
    }

    await cart.save();
    await cart.populate('items.product');
    return cart;
  },

  async updateItem(userId, productId, quantity) {
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');

    const qty = clampQty(quantity, product.stock);

    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) throw new ApiError(404, 'Cart not found');

    const item = cart.items.find((i) => i.product.equals(product._id));
    if (!item) throw new ApiError(404, 'Product not in cart');

    item.quantity = qty;
    await cart.save();
    return cart;
  },

  async removeItem(userId, productId) {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) throw new ApiError(404, 'Cart not found');

    cart.items = cart.items.filter((i) => !i.product.equals(productId));
    await cart.save();
    return cart;
  },

  async clearCart(userId) {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) throw new ApiError(404, 'Cart not found');

    cart.items = [];
    await cart.save();
    return cart;
  },

  async mergeCart(userId, clientItems) {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    const items = Array.isArray(clientItems) ? clientItems : [];

    for (const ci of items) {
      if (!ci.productId) continue;
      if (!mongoose.Types.ObjectId.isValid(ci.productId)) continue;

      const product = await Product.findById(ci.productId);
      if (!product) continue;

      const qty = clampQty(ci.qty || ci.quantity || 1, product.stock);

      const existing = cart.items.find((i) => i.product.equals(product._id));

      if (existing) {
        existing.quantity = clampQty(existing.quantity + qty, product.stock);
      } else {
        cart.items.push({ product: product._id, quantity: qty });
      }
    }

    await cart.save();
    await cart.populate('items.product');
    return cart;
  },

  async getAllCarts() {
    return Cart.find().populate('user items.product');
  },
};
