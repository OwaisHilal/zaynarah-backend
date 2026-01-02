// backend/src/features/notifications/notifications.controller.js
const notificationsService = require('./notifications.service');

exports.listMyNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationsService.listForUser(
      req.user._id,
      req.query
    );
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationsService.unreadCount(req.user._id);
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await notificationsService.markAsRead(req.user._id, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await notificationsService.markAllAsRead(req.user._id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
