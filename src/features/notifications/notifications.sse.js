// backend/src/features/notifications/notifications.sse.js
const clients = new Map();
const HEARTBEAT_INTERVAL = 25000;

function addClient({ userId, jti }, res) {
  clients.set(jti, {
    userId: userId.toString(),
    res,
  });

  res.write('retry: 3000\n\n');
  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': heartbeat\n\n');
    }
  }, HEARTBEAT_INTERVAL);

  res.on('close', () => {
    clearInterval(heartbeat);
    removeClient(jti);
  });
}

function removeClient(jti) {
  clients.delete(jti);
}

function sendToUser(userId, event) {
  const payload = `event: ${event.type}\ndata: ${JSON.stringify(
    event.payload
  )}\n\n`;

  for (const { userId: uid, res } of clients.values()) {
    if (uid === userId.toString() && !res.writableEnded) {
      res.write(payload);
    }
  }
}

module.exports = {
  addClient,
  removeClient,
  sendToUser,
};
