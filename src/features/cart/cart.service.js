const Cart = require('./cart.model');
const Product = require('../products/products.model');
const ApiError = require('../../core/errors/ApiError');
const mongoose = require('mongoose');

// --- Helper to normalize cart items for frontend ---
const normalizeCart = (cart) => ({
  items: (cart.items || []).map((i) => ({
    productId: i.product._id.toString(),
    title: i.product.title || i.product.name || 'Untitled',
    price: i.product.price ?? 0,
    image: i.product.image ?? i.product.images?.[0] ?? '',
    qty: i.quantity,
  })),
});

module.exports = {
  // Get user's cart
  getCartByUser: async (userId) => {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    return normalizeCart(cart);
  },

  // Add product to cart
  addItem: async (userId, productId, quantity = 1) => {
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    const existingItem = cart.items.find((item) =>
      item.product.equals(productId)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate('items.product');
    return normalizeCart(cart);
  },

  // Update product quantity
  updateItem: async (userId, productId, quantity) => {
    if (quantity < 1) throw new ApiError(400, 'Quantity must be at least 1');

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) throw new ApiError(404, 'Cart not found');

    const item = cart.items.find((i) => i.product.equals(productId));
    if (!item) throw new ApiError(404, 'Product not in cart');

    item.quantity = quantity;
    await cart.save();
    return normalizeCart(cart);
  },

  // Remove product from cart
  removeItem: async (userId, productId) => {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) throw new ApiError(404, 'Cart not found');

    cart.items = cart.items.filter((i) => !i.product.equals(productId));
    await cart.save();
    return normalizeCart(cart);
  },

  // Clear entire cart
  clearCart: async (userId) => {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) throw new ApiError(404, 'Cart not found');

    cart.items = [];
    await cart.save();
    return normalizeCart(cart);
  },

  // Merge client cart into user cart (on login)
  mergeCart: async (userId, clientItems) => {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    clientItems.forEach((ci) => {
      if (!ci.productId) return; // skip invalid
      const pid = mongoose.Types.ObjectId(ci.productId);
      const existing = cart.items.find((i) => i.product.equals(pid));
      if (existing) {
        existing.quantity += ci.qty || ci.quantity || 1;
      } else {
        cart.items.push({ product: pid, quantity: ci.qty || ci.quantity || 1 });
      }
    });

    await cart.save();
    await cart.populate('items.product');
    return normalizeCart(cart);
  },

  // Admin: get all carts (normalized for admin view)
  getAllCarts: async () => {
    const carts = await Cart.find().populate('user items.product');
    return carts.map((cart) => ({
      userId: cart.user._id,
      items: (cart.items || []).map((i) => ({
        productId: i.product._id.toString(),
        title: i.product.title || i.product.name || 'Untitled',
        price: i.product.price ?? 0,
        image: i.product.image ?? i.product.images?.[0] ?? '',
        qty: i.quantity,
      })),
    }));
  },
};
