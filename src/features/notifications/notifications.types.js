//backend/src/features/notifications/notifications.types.js

module.exports = {
  ENTITY_TYPES: {
    ORDER: 'order',
    PAYMENT: 'payment',
    SYSTEM: 'system',
  },

  NOTIFICATION_TYPES: {
    ORDER_CREATED: 'order_created',
    ORDER_PAID: 'order_paid',
    ORDER_INVOICE_EMAIL: 'order_invoice_email',
    ORDER_SHIPPED: 'order_shipped',
    ORDER_DELIVERED: 'order_delivered',
    ORDER_CANCELLED: 'order_cancelled',

    PAYMENT_FAILED: 'payment_failed',

    ADMIN_ANNOUNCEMENT: 'admin_announcement',
  },

  PRIORITY: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
  },
};
