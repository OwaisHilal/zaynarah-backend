// backend/src/features/notifications/notifications.sse.js
const clients = new Map();
const HEARTBEAT_INTERVAL = 25000;

function addClient(userId, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  res.write('retry: 3000\n\n');

  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }

  clients.get(userId).add(res);

  const heartbeat = setInterval(() => {
    if (res.writableEnded) return;
    res.write(': ping\n\n');
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

function sendToUser(userId, payload) {
  const set = clients.get(userId);
  if (!set) return;

  const data = `data: ${JSON.stringify(payload)}\n\n`;

  for (const res of set) {
    if (!res.writableEnded) {
      res.write(data);
    }
  }
}

module.exports = {
  addClient,
  removeClient,
  sendToUser,
};
