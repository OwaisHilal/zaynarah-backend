//backend/src/features/notifications/notifications.sse.routes.js

const router = require('express').Router();
const { requireLogin } = require('../../middlewares/auth');
const { addClient, removeClient } = require('./notifications.sse');

router.get('/stream', requireLogin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.flushHeaders();

  const userId = req.user._id.toString();
  addClient(userId, res);

  res.write(`event: connected\ndata: {}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: {}\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(userId, res);
  });
});

module.exports = router;
