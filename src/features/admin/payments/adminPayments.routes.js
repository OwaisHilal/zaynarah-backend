const router = require('express').Router();
const ctrl = require('./adminPayments.controller');
const { requireLogin, requireAdmin } = require('../../../middlewares/auth');

router.get('/', requireLogin, requireAdmin, ctrl.listPayments);

module.exports = router;
