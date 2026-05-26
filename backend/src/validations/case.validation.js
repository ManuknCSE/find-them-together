const Joi = require('joi');

const coordinates = Joi.array().items(Joi.number()).length(2).required();

const createCase = Joi.object({
  body: Joi.object({
    missingPersonName: Joi.string().min(2).max(120).required(),
    age: Joi.number().integer().min(0).max(120).required(),
    gender: Joi.string().valid('male', 'female', 'non_binary', 'unknown').required(),
    height: Joi.string().allow('', null),
    weight: Joi.string().allow('', null),
    bodyShape: Joi.string().allow('', null),
    tattoos: Joi.string().allow('', null),
    birthmarks: Joi.string().allow('', null),
    lastSeenClothing: Joi.string().allow('', null),
    lastSeenDate: Joi.date().required(),
    lastSeenLocation: Joi.object({
      address: Joi.string().allow('', null),
      city: Joi.string().allow('', null),
      state: Joi.string().allow('', null),
      country: Joi.string().allow('', null)
    }).default({}),
    gpsCoordinates: coordinates,
    familyContactDetails: Joi.object({
      name: Joi.string().allow('', null),
      relationship: Joi.string().allow('', null),
      phone: Joi.string().allow('', null),
      email: Joi.string().email().allow('', null)
    }).default({}),
    rewardAmount: Joi.number().min(0).default(0)
  })
});

const listCases = Joi.object({
  query: Joi.object({
    search: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    state: Joi.string().allow('', null),
    minAge: Joi.number().integer().min(0),
    maxAge: Joi.number().integer().min(0),
    status: Joi.string().allow('', null),
    lng: Joi.number(),
    lat: Joi.number(),
    radiusKm: Joi.number().min(1).max(500).default(25),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
});

const idParam = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() })
});

module.exports = { createCase, listCases, idParam };

