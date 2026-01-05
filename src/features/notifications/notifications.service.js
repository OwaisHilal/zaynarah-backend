// backend/src/features/notifications/notifications.service.js
const Notification = require('./notifications.model');
const { notificationsQueue } = require('../../services/queue.service');

function buildJobId(payload) {
  return [
    payload.userId,
    payload.type,
    payload.entityType,
    payload.entityId || 'none',
  ].join(':');
}

module.exports = {
  enqueue: async (payload) => {
    const jobId = buildJobId(payload);

    await notificationsQueue.add('create-notification', payload, {
      jobId,
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
      readAt: null,
    });
  },

  listForUser: async (userId, { page = 1, limit = 20 } = {}) => {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const skip = (safePage - 1) * safeLimit;

    return Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();
  },

  unreadCount: async (userId) => {
    return Notification.countDocuments({
      user: userId,
      readAt: null,
    });
  },

  markAsRead: async (userId, notificationId) => {
    await Notification.updateOne(
      {
        _id: notificationId,
        user: userId,
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
      }
    );
  },

  markAllAsRead: async (userId) => {
    await Notification.updateMany(
      {
        user: userId,
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
      }
    );
  },
};
