const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const locationSchema = Joi.object({
  body: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    state: Joi.string().allow('', null),
    country: Joi.string().allow('', null)
  })
});

router.get('/me', authenticate, controller.me);
router.patch('/me/location', authenticate, validate(locationSchema), controller.updateMyLocation);

module.exports = router;

