const express = require('express');
const controller = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const ROLES = require('../constants/roles');
const reportValidation = require('../validations/report.validation');

const router = express.Router();

router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.POLICE_VERIFICATION_TEAM, ROLES.NGO_PARTNER), controller.listReports);
router.post(
  '/',
  authenticate,
  authorize(ROLES.VOLUNTEER, ROLES.NGO_PARTNER, ROLES.ADMIN),
  upload.array('evidenceImages', 8),
  validate(reportValidation.createReport),
  controller.createReport
);

module.exports = router;

