///backend/src/features/notifications/notifications.service.js
const Notification = require('./notifications.model');
const { notificationsQueue } = require('../../services/queue.service');

module.exports = {
  enqueue: async (payload) => {
    await notificationsQueue.add('create-notification', payload, {
      removeOnComplete: true,
      removeOnFail: 100,
    });
  },

  create: async ({
    userId,
    type,
    entityType,
    entityId,
    title,
    message,
    actionUrl,
    priority = 'normal',
    metadata = {},
  }) => {
    return Notification.create({
      user: userId,
      type,
      entityType,
      entityId,
      title,
      message,
      actionUrl,
      priority,
      metadata,
    });
  },

  listForUser: async (userId, { page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;

    const items = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return items;
  },

  unreadCount: async (userId) => {
    return Notification.countDocuments({
      user: userId,
      readAt: null,
    });
  },

  markAsRead: async (userId, notificationId) => {
    await Notification.updateOne(
      { _id: notificationId, user: userId, readAt: null },
      { $set: { readAt: new Date() } }
    );
  },

  markAllAsRead: async (userId) => {
    await Notification.updateMany(
      { user: userId, readAt: null },
      { $set: { readAt: new Date() } }
    );
  },
};
