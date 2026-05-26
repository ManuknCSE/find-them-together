const logger = require('../utils/logger');

module.exports = (error, _req, res, _next) => {
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

