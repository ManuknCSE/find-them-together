const Joi = require('joi');

const list = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    role: Joi.string(),
    status: Joi.string()
  })
});

const verifyCase = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
  body: Joi.object({
    status: Joi.string().valid('active', 'rejected').required()
  })
});

const verifyReport = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
  body: Joi.object({
    verificationStatus: Joi.string().valid('verified', 'fake', 'rejected').required()
  })
});

module.exports = { list, verifyCase, verifyReport };

