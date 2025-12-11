// src/orders/orders.services.js
const Order = require('./orders.model');
const Cart = require('../cart/cart.model');
const Product = require('../products/products.model');
const ApiError = require('../../core/errors/ApiError');
const { nanoid } = require('nanoid');

module.exports = {
  initSessionFromCart: async (userId) => {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !cart.items.length) throw new ApiError(400, 'Cart is empty');

    const items = cart.items.map((it) => ({
      productId: it.product?._id,
      name: it.product?.title || it.product?.name || 'Product',
      price: it.product?.price || 0,
      qty: it.quantity,
      image: it.product?.image || it.product?.images?.[0] || '',
    }));

    for (const it of cart.items) {
      if (!it.product) throw new ApiError(400, 'Product not found in cart');
      if (it.product.stock != null && it.quantity > it.product.stock) {
        throw new ApiError(
          400,
          `Insufficient stock for ${it.product.title || it.product.name}`
        );
      }
    }

    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const checkoutSessionId = `cs_${nanoid(10)}`;

    const order = await Order.create({
      user: userId,
      checkoutSessionId,
      items,
      totalAmount: subtotal,
      currency: 'INR',
      paymentStatus: 'pending',
      status: 'pending',
    });

    return { checkoutSessionId, items, subtotal, orderId: order._id };
  },

  finalizePricing: async (
    userId,
    { checkoutSessionId, shippingAddress, billingAddress, shippingMethod }
  ) => {
    const order = await Order.findOne({ checkoutSessionId, user: userId });
    if (!order) throw new ApiError(404, 'Checkout session not found');

    const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    const shippingCost = shippingMethod === 'express' ? 100 : 50;
    const tax = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + shippingCost + tax;

    order.shippingAddress = shippingAddress;
    order.billingAddress = billingAddress || shippingAddress;
    order.shippingMethod = shippingMethod || 'standard';
    order.totalAmount = totalAmount;
    order.metadata = { subtotal, tax, shippingCost };
    await order.save();

    return {
      checkoutSessionId: order.checkoutSessionId,
      orderId: order._id,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      currency: order.currency,
    };
  },

  createDraftOrder: async (userId, { checkoutSessionId, paymentGateway }) => {
    const order = await Order.findOne({ checkoutSessionId, user: userId });
    if (!order) throw new ApiError(404, 'Checkout session not found');

    order.status = 'pending';
    order.paymentMethod = paymentGateway;
    order.paymentProvider = paymentGateway;
    await order.save();
    return order;
  },

  markPaid: async (orderId, { paymentIntentId, gateway }) => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    // Deduct stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product && product.stock != null) {
        product.stock = Math.max(0, product.stock - item.qty);
        await product.save();
      }
    }

    order.paymentIntentId = paymentIntentId;
    order.paymentStatus = 'paid';
    order.paymentProvider = gateway || order.paymentProvider;
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();

    return order;
  },

  markFailed: async (orderId, reason) => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    order.paymentStatus = 'failed';
    order.status = 'failed';
    order.metadata = { ...order.metadata, failedReason: reason };

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product && product.stock != null) {
        product.stock += item.qty;
        await product.save();
      }
    }

    await order.save();
    return order;
  },

  getOrderById: async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  },
};
