const Joi = require('joi');

const createReport = Joi.object({
  body: Joi.object({
    relatedCaseId: Joi.string().hex().length(24).required(),
    currentGpsLocation: Joi.any().optional(),
    address: Joi.string().allow('', null),
    additionalNotes: Joi.string().allow('', null)
  })
});

const idParam = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() })
});

module.exports = { createReport, idParam };
