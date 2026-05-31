const Joi = require('joi');

const list = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    role: Joi.string(),
    status: Joi.string()
  })
});

// BUG-008: Expanded status options to match full MissingPersonCase enum
const verifyCase = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
  body: Joi.object({
    status: Joi.string()
      .valid('active', 'rejected', 'resolved', 'closed', 'pending_verification', 'matched')
      .required(),
    notes: Joi.string().max(1000).allow('', null)
  })
});

const verifyReport = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() }),
  body: Joi.object({
    verificationStatus: Joi.string()
      .valid('verified', 'fake', 'rejected', 'under_review')
      .required(),
    notes: Joi.string().max(1000).allow('', null)
  })
});

module.exports = { list, verifyCase, verifyReport };
