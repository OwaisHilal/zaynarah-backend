// backend/src/features/notifications/notifications.sse.js
const clients = new Map();
const HEARTBEAT_INTERVAL = 25000;

function addClient(userId, res) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }

  clients.get(userId).add(res);

  res.write('retry: 3000\n\n');
  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': heartbeat\n\n');
    }
  }, HEARTBEAT_INTERVAL);

  res.on('close', () => {
    clearInterval(heartbeat);
    removeClient(userId, res);
  });
}

function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;

  set.delete(res);

  if (set.size === 0) {
    clients.delete(userId);
  }
}

function sendToUser(userId, event) {
  const set = clients.get(userId);
  if (!set) return;

  const payload = `event: ${event.type}\ndata: ${JSON.stringify(
    event.payload
  )}\n\n`;

  for (const res of set) {
    if (!res.writableEnded) {
      res.write(payload);
    }
  }
}

module.exports = {
  addClient,
  removeClient,
  sendToUser,
};
