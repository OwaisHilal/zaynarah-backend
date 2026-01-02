//backend/src/features/notifications/notifications.routes.js
const router = require('express').Router();
const ctrl = require('./notifications.controller');
const { requireLogin } = require('../../middlewares/auth');

router.get('/', requireLogin, ctrl.listMyNotifications);
router.get('/unread-count', requireLogin, ctrl.getUnreadCount);
router.post('/:id/read', requireLogin, ctrl.markAsRead);
router.post('/read-all', requireLogin, ctrl.markAllAsRead);

module.exports = router;
