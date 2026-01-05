// backend/src/features/orders/services/status.service.js
const Order = require('../orders.model');
const Product = require('../../products/products.model');
const Cart = require('../../cart/cart.model');
const ApiError = require('../../../core/errors/ApiError');
const notificationsService = require('../../notifications/notifications.service');
const {
  ENTITY_TYPES,
  NOTIFICATION_TYPES,
} = require('../../notifications/notifications.types');

async function pushStatusHistory(order, from, to, actor, note) {
  order.statusHistory.push({
    from,
    to,
    at: new Date(),
    actor: actor
      ? {
          id: actor._id,
          role: actor.role,
        }
      : undefined,
    note,
  });
}

module.exports = {
  updateStatus: async (orderId, nextStatus, actor, note) => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.status === nextStatus) return order.toObject();

    const fromStatus = order.status;
    order.status = nextStatus;

    await pushStatusHistory(order, fromStatus, nextStatus, actor, note);
    await order.save();

    if (nextStatus === 'cancelled') {
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
      const fromStatus = order.status;
      order.status = 'shipped';
      order.fulfillment.shippedAt = fulfillment.shippedAt || new Date();

      await pushStatusHistory(order, fromStatus, 'shipped', null, null);

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
      const fromStatus = order.status;
      order.status = 'delivered';

      await pushStatusHistory(order, fromStatus, 'delivered', null, null);

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

    if (order.paymentStatus === 'paid') return order.toObject();

    if (order.status !== 'payment_pending') {
      throw new ApiError(
        400,
        `Cannot mark order paid from status ${order.status}`
      );
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product && product.stock != null) {
        product.stock = Math.max(0, product.stock - item.qty);
        await product.save();
      }
    }

    const fromStatus = order.status;

    order.paymentIntentId = paymentIntentId;
    order.paymentProvider = gateway;
    order.paymentStatus = 'paid';
    order.status = 'paid';
    order.paidAt = new Date();

    await pushStatusHistory(
      order,
      fromStatus,
      'paid',
      null,
      `Payment confirmed via ${gateway}`
    );

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

    await notificationsService.enqueue({
      userId: order.user,
      type: NOTIFICATION_TYPES.ORDER_INVOICE_EMAIL,
      entityType: ENTITY_TYPES.ORDER,
      entityId: order._id,
      title: 'Your invoice is ready',
      message: 'Please find your invoice attached to this email.',
      actionUrl: `/orders/${order._id}`,
      priority: 'high',
    });

    return order.toObject();
  },

  markFailed: async (orderId, reason = 'payment_failed') => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.paymentStatus === 'paid') return order.toObject();
    if (order.paymentStatus === 'failed') return order.toObject();

    if (!['payment_pending', 'priced'].includes(order.status)) {
      throw new ApiError(
        400,
        `Cannot mark order failed from status ${order.status}`
      );
    }

    const fromStatus = order.status;

    order.paymentStatus = 'failed';
    order.status = 'failed';
    order.failureReason = reason;
    order.failedAt = new Date();

    await pushStatusHistory(order, fromStatus, 'failed', null, reason);
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
