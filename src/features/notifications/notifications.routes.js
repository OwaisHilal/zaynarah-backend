// backend/src/features/notifications/notifications.routes.js
const router = require('express').Router();
const ctrl = require('./notifications.controller');
const { requireLogin } = require('../../middlewares/auth');

router.use(requireLogin);

router.get('/', ctrl.listMyNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.post('/:id/read', ctrl.markAsRead);
router.post('/read-all', ctrl.markAllAsRead);

module.exports = router;
