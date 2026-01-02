//backend/src/features/notifications/notifications.emailRules.js

const { NOTIFICATION_TYPES, PRIORITY } = require('./notifications.types');

module.exports = {
  [NOTIFICATION_TYPES.ORDER_PAID]: {
    sendEmail: true,
    priority: PRIORITY.HIGH,
    roles: ['customer'],
  },

  [NOTIFICATION_TYPES.ORDER_SHIPPED]: {
    sendEmail: true,
    priority: PRIORITY.NORMAL,
    roles: ['customer'],
  },

  [NOTIFICATION_TYPES.ORDER_DELIVERED]: {
    sendEmail: true,
    priority: PRIORITY.NORMAL,
    roles: ['customer'],
  },

  [NOTIFICATION_TYPES.PAYMENT_FAILED]: {
    sendEmail: true,
    priority: PRIORITY.HIGH,
    roles: ['customer', 'admin'],
  },

  [NOTIFICATION_TYPES.ADMIN_ANNOUNCEMENT]: {
    sendEmail: true,
    priority: PRIORITY.NORMAL,
    roles: ['admin'],
  },
};
