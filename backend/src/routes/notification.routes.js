const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const idParam = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() })
});

router.get('/', authenticate, controller.listMine);
router.patch('/:id/read', authenticate, validate(idParam), controller.markRead);

module.exports = router;

