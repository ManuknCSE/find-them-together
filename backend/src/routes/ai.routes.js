const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');

const router = express.Router();

const compareSchema = Joi.object({
  body: Joi.object({
    caseId: Joi.string().hex().length(24).required()
  })
});

router.post('/face/compare', authenticate, upload.single('image'), validate(compareSchema), controller.compareUploadedImage);

module.exports = router;

