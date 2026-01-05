// backend/src/features/orders/services/checkout.service.js
const Order = require('../orders.model');
const Cart = require('../../cart/cart.model');
const ApiError = require('../../../core/errors/ApiError');
const { nanoid } = require('nanoid');

module.exports = {
  initSessionFromCart: async (userId) => {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !cart.items?.length) {
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
      status: 'draft',
      paymentStatus: 'uninitiated',
      statusHistory: [
        {
          from: null,
          to: 'draft',
          note: 'Checkout session created from cart',
        },
      ],
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

    if (order.status !== 'draft') {
      throw new ApiError(400, 'Order is not in draft state');
    }

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

    order.statusHistory.push({
      from: order.status,
      to: 'priced',
      note: 'Pricing finalized',
    });

    order.status = 'priced';

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

  preparePayment: async (userId, { checkoutSessionId, paymentGateway }) => {
    if (!checkoutSessionId || !paymentGateway) {
      throw new ApiError(400, 'checkoutSessionId and paymentGateway required');
    }

    const order = await Order.findOne({ checkoutSessionId, user: userId });
    if (!order) throw new ApiError(404, 'Checkout session not found');

    if (order.status !== 'priced') {
      throw new ApiError(400, 'Order is not ready for payment');
    }

    order.paymentMethod = paymentGateway;
    order.paymentProvider = paymentGateway;
    order.paymentStatus = 'pending';

    order.statusHistory.push({
      from: order.status,
      to: 'payment_pending',
      note: `Payment initiated via ${paymentGateway}`,
    });

    order.status = 'payment_pending';

    await order.save();

    return order.toObject();
  },
};
