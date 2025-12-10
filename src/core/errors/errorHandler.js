// src/core/errors/errorHandler.js

module.exports = (err, req, res, next) => {
  console.error('[ERROR]', err);

  // Zod validation error
  if (err.errors && Array.isArray(err.errors)) {
    return res.status(400).json({
      message: err.errors[0].message,
    });
  }

  // Custom ApiError
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  // Fallback
  return res.status(500).json({
    message: 'Internal server error',
  });
};
