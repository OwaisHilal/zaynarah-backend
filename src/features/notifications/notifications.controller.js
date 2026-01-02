//backend/src/features/notifications/notifications.controller.js
const notificationsService = require('./notifications.service');

exports.listMyNotifications = async (req, res) => {
  const notifications = await notificationsService.listForUser(
    req.user._id,
    req.query
  );

  res.json(notifications);
};

exports.getUnreadCount = async (req, res) => {
  const count = await notificationsService.unreadCount(req.user._id);
  res.json({ count });
};

exports.markAsRead = async (req, res) => {
  await notificationsService.markAsRead(req.user._id, req.params.id);
  res.status(204).end();
};

exports.markAllAsRead = async (req, res) => {
  await notificationsService.markAllAsRead(req.user._id);
  res.status(204).end();
};
