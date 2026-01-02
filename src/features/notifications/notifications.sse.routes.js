// backend/src/features/notifications/notifications.sse.routes.js
const router = require('express').Router();
const { requireLogin } = require('../../middlewares/auth');
const { addClient } = require('./notifications.sse');

// Handled at /api/notifications/stream
router.get('/stream', requireLogin, (req, res) => {
  if (!req.user?._id) {
    return res.status(401).end();
  }

  const userId = req.user._id.toString();

  // SSE specific headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  addClient(userId, res);
});

module.exports = router;
