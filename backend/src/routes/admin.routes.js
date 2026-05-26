const express = require('express');
const controller = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const ROLES = require('../constants/roles');
const adminValidation = require('../validations/admin.validation');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.POLICE_VERIFICATION_TEAM));

router.get('/users', validate(adminValidation.list), controller.listUsers);
router.get('/cases', validate(adminValidation.list), controller.listCases);
router.patch('/cases/:id/verify', validate(adminValidation.verifyCase), controller.verifyCase);
router.patch('/reports/:id/verify', validate(adminValidation.verifyReport), controller.verifyReport);
router.get('/analytics', controller.analytics);
router.get('/ai-logs', controller.aiLogs);
router.get('/rewards', controller.rewards);

module.exports = router;

