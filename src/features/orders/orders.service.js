/* backend/src/features/orders/orders.service.js */
const Order = require('./orders.model');
const Product = require('../products/products.model');
const Cart = require('../cart/cart.model');
const ApiError = require('../../core/errors/ApiError');
const { nanoid } = require('nanoid');

const notificationsService = require('../notifications/notifications.service');
const {
  ENTITY_TYPES,
  NOTIFICATION_TYPES,
} = require('../notifications/notifications.types');

function formatCurrency(value, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(value);
}

function buildInvoiceHtml(order) {
  const items = order.items || [];
  const totals = order.cartTotal || {};
  const billing = order.billingAddress || {};
  const shipping = order.shippingAddress || billing;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${order._id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      margin: 0;
      padding: 40px;
      color: #111827;
    }
    .invoice {
      max-width: 800px;
      margin: auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 16px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .brand h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: -0.5px;
    }
    .brand p {
      margin: 4px 0 0;
      color: #6b7280;
    }
    .meta {
      text-align: right;
      font-size: 14px;
      color: #374151;
    }
    h2 {
      font-size: 18px;
      margin: 32px 0 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      text-align: left;
      padding: 12px 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
    }
    .totals {
      margin-top: 24px;
      width: 100%;
      max-width: 360px;
      margin-left: auto;
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .totals .grand {
      font-size: 18px;
      font-weight: 700;
      border-top: 2px solid #111827;
      padding-top: 12px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 48px;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="brand">
        <h1>Zaynarah</h1>
        <p>Handcrafted luxury from Kashmir</p>
      </div>
      <div class="meta">
        <div>Invoice #${order._id}</div>
        <div>${new Date(order.createdAt).toLocaleDateString()}</div>
        <div>Status: ${order.paymentStatus}</div>
      </div>
    </div>

    <h2>Billing Address</h2>
    <p>
      ${billing.name || ''}<br/>
      ${billing.line1 || ''}<br/>
      ${billing.city || ''} ${billing.postalCode || ''}<br/>
      ${billing.country || ''}
    </p>

    <h2>Items</h2>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (i) => `
          <tr>
            <td>${i.title}</td>
            <td>${i.qty}</td>
            <td>${formatCurrency(i.price, totals.currency)}</td>
            <td>${formatCurrency(i.price * i.qty, totals.currency)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="totals">
      <div>
        <span>Subtotal</span>
        <span>${formatCurrency(totals.items || 0, totals.currency)}</span>
      </div>
      <div>
        <span>Shipping</span>
        <span>${formatCurrency(totals.shipping || 0, totals.currency)}</span>
      </div>
      <div>
        <span>Tax</span>
        <span>${formatCurrency(totals.tax || 0, totals.currency)}</span>
      </div>
      <div class="grand">
        <span>Total</span>
        <span>${formatCurrency(totals.grand || 0, totals.currency)}</span>
      </div>
    </div>

    <div class="footer">
      Thank you for shopping with Zaynarah.<br/>
      This invoice is generated electronically and is valid without a signature.
    </div>
  </div>
</body>
</html>
`;
}

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

  generateInvoiceHtml: async (orderId) => {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new ApiError(404, 'Order not found');
    return buildInvoiceHtml(order);
  },

  updateStatus: async (orderId, status, actor, note) => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.status === status) return order.toObject();

    const fromStatus = order.status;
    order.status = status;

    if (actor) {
      order.statusHistory.push({
        from: fromStatus,
        to: status,
        at: new Date(),
        actor: {
          id: actor._id,
          role: actor.role,
        },
        note,
      });
    }

    await order.save();

    if (status === 'cancelled') {
      await notificationsService.enqueue({
        userId: order.user,
        type: NOTIFICATION_TYPES.ORDER_CANCELLED,
        entityType: ENTITY_TYPES.ORDER,
        entityId: order._id,
        title: 'Order cancelled',
        message: 'Your order has been cancelled.',
        actionUrl: `/orders/${order._id}`,
        priority: 'high',
      });
    }

    return order.toObject();
  },

  updateFulfillment: async (orderId, fulfillment) => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    order.fulfillment = {
      ...(order.fulfillment || {}),
      ...fulfillment,
    };

    if (order.status === 'paid' && fulfillment.trackingId) {
      order.status = 'shipped';
      order.fulfillment.shippedAt = fulfillment.shippedAt || new Date();

      await notificationsService.enqueue({
        userId: order.user,
        type: NOTIFICATION_TYPES.ORDER_SHIPPED,
        entityType: ENTITY_TYPES.ORDER,
        entityId: order._id,
        title: 'Order shipped',
        message: 'Your order is on its way.',
        actionUrl: `/orders/${order._id}`,
        priority: 'normal',
      });
    }

    if (order.status === 'shipped' && fulfillment.deliveredAt) {
      order.status = 'delivered';

      await notificationsService.enqueue({
        userId: order.user,
        type: NOTIFICATION_TYPES.ORDER_DELIVERED,
        entityType: ENTITY_TYPES.ORDER,
        entityId: order._id,
        title: 'Order delivered',
        message: 'Your order has been delivered.',
        actionUrl: `/orders/${order._id}`,
        priority: 'normal',
      });
    }

    await order.save();
    return order.toObject();
  },

  markPaid: async (orderId, { paymentIntentId, gateway }) => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.paymentStatus === 'paid') {
      return order.toObject();
    }

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

    await notificationsService.enqueue({
      userId: order.user,
      type: NOTIFICATION_TYPES.ORDER_PAID,
      entityType: ENTITY_TYPES.ORDER,
      entityId: order._id,
      title: 'Payment successful',
      message: 'We have received your payment.',
      actionUrl: `/orders/${order._id}`,
      priority: 'high',
    });

    return order.toObject();
  },

  markFailed: async (orderId, reason = 'payment_failed') => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.paymentStatus === 'paid') {
      return order.toObject();
    }

    if (order.paymentStatus === 'failed') {
      return order.toObject();
    }

    order.paymentStatus = 'failed';
    order.status = 'pending';
    order.failureReason = reason;
    order.failedAt = new Date();

    await order.save();

    await notificationsService.enqueue({
      userId: order.user,
      type: NOTIFICATION_TYPES.PAYMENT_FAILED,
      entityType: ENTITY_TYPES.PAYMENT,
      entityId: order._id,
      title: 'Payment failed',
      message: 'Your payment could not be completed. Please try again.',
      actionUrl: `/checkout?order=${order._id}`,
      priority: 'high',
    });

    return order.toObject();
  },
};
