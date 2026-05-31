const logger = require('../utils/logger');

module.exports = (error, _req, res, _next) => {
  // DOC-001: Handle Multer-specific errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      status: 'fail',
      message: 'File is too large. Maximum size is 10 MB per file.'
    });
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      status: 'fail',
      message: 'Too many files uploaded. Maximum is 10 files.'
    });
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      status: 'fail',
      message: `Unexpected file field: ${error.field}`
    });
  }

  // Handle Mongoose CastError (bad ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({ status: 'fail', message: `Invalid ${error.path}: ${error.value}` });
  }

  // Handle Mongoose duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    return res.status(409).json({
      status: 'fail',
      message: `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Value'} already exists`
    });
  }

  const statusCode = error.statusCode || 500;
  const payload = {
    status: error.status || 'error',
    message: error.isOperational ? error.message : 'Something went wrong'
  };

  if (error.details) payload.details = error.details;
  if (process.env.NODE_ENV !== 'production') payload.stack = error.stack;

  if (!error.isOperational) logger.error(error);
  res.status(statusCode).json(payload);
};
