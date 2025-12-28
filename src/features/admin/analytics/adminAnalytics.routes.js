const router = require('express').Router();
const { requireLogin, requireAdmin } = require('../../../middlewares/auth');
const ctrl = require('./adminAnalytics.controller');

router.get('/summary', requireLogin, requireAdmin, ctrl.getSummary);
router.get('/orders-trend', requireLogin, requireAdmin, ctrl.getOrdersTrend);
router.get(
  '/payments-breakdown',
  requireLogin,
  requireAdmin,
  ctrl.getPaymentsBreakdown
);
router.get('/recent-orders', requireLogin, requireAdmin, ctrl.getRecentOrders);
router.get('/low-stock', requireLogin, requireAdmin, ctrl.getLowStockProducts);

module.exports = router;
