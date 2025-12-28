const router = require('express').Router();
const { requireLogin, requireAdmin } = require('../../middlewares/auth');

// Analytics
router.use(
  '/analytics',
  requireLogin,
  requireAdmin,
  require('./analytics/adminAnalytics.routes')
);

module.exports = router;
