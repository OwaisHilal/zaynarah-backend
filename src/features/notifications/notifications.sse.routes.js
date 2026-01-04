// backend/src/features/notifications/notifications.sse.routes.js
const router = require('express').Router();
const { requireLogin } = require('../../middlewares/auth');
const { addClient } = require('./notifications.sse');

// Handled at /api/notifications/stream
router.get('/stream', requireLogin, (req, res) => {
  if (!req.user?._id || !req.session?.jti) {
    return res.status(401).end();
  }

  const userId = req.user._id.toString();
  const jti = req.session.jti;

  // SSE specific headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  addClient({ userId, jti }, res);
});

module.exports = router;
