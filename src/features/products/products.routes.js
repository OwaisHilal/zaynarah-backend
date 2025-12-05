const express = require('express');
const ctrl = require('./products.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const router = express.Router();

// --- Public routes ---
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);

// --- Admin routes ---
router.post('/', requireLogin, requireAdmin, ctrl.create);
router.put('/:id', requireLogin, requireAdmin, ctrl.update);
router.delete('/:id', requireLogin, requireAdmin, ctrl.remove);

module.exports = router;
