// backend/src/features/orders/orders.service.js
const Order = require('./orders.model');
const Product = require('../products/products.model');
const Cart = require('../cart/cart.model');
const ApiError = require('../../core/errors/ApiError');
const { nanoid } = require('nanoid');

module.exports = {
  initSessionFromCart: async (userId) => {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !cart.items || !cart.items.length) {
      throw new ApiError(400, 'Cart is empty');
    }

    const items = cart.items.map((it) => {
      if (!it.product) throw new ApiError(400, 'Product not found in cart');
      if (it.product.stock != null && it.quantity > it.product.stock) {
        throw new ApiError(
          400,
          `Insufficient stock for ${it.product.title || it.product.name}`
        );
      }

      return {
        productId: it.product._id,
        title: it.product.title || it.product.name || 'Product',
        price: Number(it.product.price || 0),
        qty: Number(it.quantity || 1),
        image: it.product.image || it.product.images?.[0] || '',
        sku: it.product.sku || '',
      };
    });

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

    const checkoutSessionId = `cs_${nanoid(10)}`;

    const order = await Order.create({
      user: userId,
      checkoutSessionId,
      items,
      cartTotal: {
        items: subtotal,
        shipping: 0,
        tax: 0,
        grand: subtotal,
        currency: 'INR',
      },
      paymentMethod: 'stripe',
      paymentProvider: null,
      paymentStatus: 'pending',
      status: 'pending',
      metadata: { createdFrom: 'cart', cartId: cart._id },
    });

    return {
      checkoutSessionId,
      orderId: order._id,
      subtotal,
    };
  },

  finalizePricing: async (
    userId,
    { checkoutSessionId, shippingAddress, billingAddress, shippingMethod }
  ) => {
    if (!checkoutSessionId) {
      throw new ApiError(400, 'checkoutSessionId required');
    }

    const order = await Order.findOne({ checkoutSessionId, user: userId });
    if (!order) throw new ApiError(404, 'Checkout session not found');

    const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);

    const shippingCost =
      shippingMethod && typeof shippingMethod === 'object'
        ? Number(shippingMethod.cost || 0)
        : 0;

    const tax = Math.round(subtotal * 0.18);
    const grand = subtotal + shippingCost + tax;

    order.shippingAddress = shippingAddress;
    order.billingAddress = billingAddress || shippingAddress;
    order.shippingMethod = shippingMethod || null;
    order.cartTotal = {
      items: subtotal,
      shipping: shippingCost,
      tax,
      grand,
      currency: order.cartTotal.currency || 'INR',
    };

    await order.save();

    return {
      checkoutSessionId: order.checkoutSessionId,
      orderId: order._id,
      subtotal,
      tax,
      shippingCost,
      totalAmount: grand,
      currency: order.cartTotal.currency,
    };
  },

  createDraftOrder: async (userId, { checkoutSessionId, paymentGateway }) => {
    const order = await Order.findOne({ checkoutSessionId, user: userId });
    if (!order) throw new ApiError(404, 'Checkout session not found');

    order.paymentMethod = paymentGateway;
    order.paymentProvider = paymentGateway;
    await order.save();

    return order.toObject();
  },

  getOrderById: async (orderId) => {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  },

  listForAdmin: async ({ page = 1, limit = 50, status } = {}) => {
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    return Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
  },

  listForUser: async (userId) => {
    return Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  },

  updateStatus: async (orderId, status) => {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).lean();

    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  },

  markPaid: async (orderId, { paymentIntentId, gateway }) => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product && product.stock != null) {
        product.stock = Math.max(0, product.stock - item.qty);
        await product.save();
      }
    }

    order.paymentIntentId = paymentIntentId;
    order.paymentProvider = gateway;
    order.paymentStatus = 'paid';
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();

    await Cart.findOneAndUpdate({ user: order.user }, { items: [] });

    return order.toObject();
  },
};
