const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const caseRoutes = require('./case.routes');
const reportRoutes = require('./report.routes');
const aiRoutes = require('./ai.routes');
const notificationRoutes = require('./notification.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cases', caseRoutes);
router.use('/reports', reportRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

