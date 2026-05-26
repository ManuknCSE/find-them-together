const express = require('express');
const controller = require('../controllers/case.controller');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const ROLES = require('../constants/roles');
const caseValidation = require('../validations/case.validation');

const router = express.Router();

router.get('/', validate(caseValidation.listCases), controller.listCases);
router.get('/nearby', controller.nearbyCases);
router.get('/:id', validate(caseValidation.idParam), controller.getCase);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.FAMILY_MEMBER, ROLES.NGO_PARTNER, ROLES.POLICE_VERIFICATION_TEAM),
  upload.fields([{ name: 'photos', maxCount: 8 }, { name: 'firCopy', maxCount: 1 }]),
  validate(caseValidation.createCase),
  controller.createCase
);

module.exports = router;

