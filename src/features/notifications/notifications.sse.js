//backend/src/features/notifications/notifications.sse.js

const clients = new Map();

function addClient(userId, res) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);
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
    res.write(data);
  }
}

module.exports = {
  addClient,
  removeClient,
  sendToUser,
};
