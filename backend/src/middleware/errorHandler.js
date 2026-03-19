/**
 * Global Error Handler Middleware
 */

const config = require('../config');

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Une erreur est survenue';

  // Prisma errors
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Cette entrée existe déjà';
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Ressource non trouvée';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Response
  const response = {
    error: message,
    ...(config.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
module.exports.AppError = AppError;
