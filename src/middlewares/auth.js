// backend/src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../features/users/users.model');
const UserSession = require('../features/auth/userSession.model');

async function requireLogin(req, res, next) {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Missing auth token' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const { id, jti } = payload;

    if (!id || !jti) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const session = await UserSession.findOne({
      jti,
      revokedAt: null,
    });

    if (!session) {
      return res.status(401).json({ message: 'Session revoked or expired' });
    }

    session.lastSeenAt = new Date();
    await session.save();

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.session = session;
    next();
  } catch {
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
