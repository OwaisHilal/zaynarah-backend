// src/middlewares/errorHandler.js
const logger = require('../lib/logger');

function errorHandler(err, req, res, next) {
  logger.error(err);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Server error',
  });
}

module.exports = { errorHandler };
