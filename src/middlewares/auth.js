// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../features/auth/auth.model');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header)
      return res.status(401).json({ message: 'Missing auth header' });

    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function admin(req, res, next) {
  if (!req.user?.isAdmin)
    return res.status(403).json({ message: 'Admin access required' });
  next();
}

module.exports = { auth, admin };
