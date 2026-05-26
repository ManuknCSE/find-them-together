const AppError = require('../utils/AppError');

module.exports = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate({
    body: req.body,
    query: req.query,
    params: req.params
  }, { abortEarly: false, stripUnknown: true });

  if (error) {
    return next(new AppError('Validation failed', 422, error.details.map((item) => item.message)));
  }

  req.body = value.body || req.body;
  req.query = value.query || req.query;
  req.params = value.params || req.params;
  return next();
};

