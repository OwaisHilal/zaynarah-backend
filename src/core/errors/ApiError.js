// src/core/errors/ApiError.js

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;

    // Maintains proper stack traces for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
