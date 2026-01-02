// backend/src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../features/users/users.model');

async function requireLogin(req, res, next) {
  try {
    let token;

    // 1. Check Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Check Query Parameter (Required for SSE/EventSource)
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Missing auth token' });
    }

    // Verify token
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'supersecretjwtkey'
    );

    // Extract ID - Support both 'id' and '_id' keys
    const userId = payload.id || payload._id;

    if (!userId) {
      console.error('[AuthMiddleware] Invalid token payload: ID missing');
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      console.error(`[AuthMiddleware] User not found for ID: ${userId}`);
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[AuthMiddleware] Error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
