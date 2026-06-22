/**
 * Global error handler middleware
 * Handles Mongoose-specific errors and generic errors with consistent format
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for dev
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error.message = `Resource not found with id: ${err.value}`;
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error.message = `Duplicate value for field '${field}': '${value}'. Please use a different value.`;
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error.message = messages.join('. ');
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds the maximum limit of 5MB',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
    });
  }

  // Default error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
