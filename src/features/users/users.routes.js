const router = require('express').Router();
const ctrl = require('./users.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');

// --- Public routes ---
router.post('/register', ctrl.register);

// --- Authenticated routes ---
router.get('/me', requireLogin, ctrl.profile);
router.put('/me', requireLogin, ctrl.updateProfile);
router.put('/me/change-password', requireLogin, ctrl.changePassword);

// --- Admin routes ---
router.get('/', requireLogin, requireAdmin, ctrl.getAllUsers);
router.put('/:userId/role', requireLogin, requireAdmin, ctrl.updateUserRole);
router.delete('/:userId', requireLogin, requireAdmin, ctrl.deleteUser);

module.exports = router;
