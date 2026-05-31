const AiDetectionLog = require('../models/AiDetectionLog');
const MissingPersonCase = require('../models/MissingPersonCase');
const Reward = require('../models/Reward');
const User = require('../models/User');
const VolunteerReport = require('../models/VolunteerReport');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.query.role ? { role: req.query.role } : {};
  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json(paginatedResponse({ data, total, page, limit }));
});

const listCases = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.query.status ? { caseStatus: req.query.status } : {};
  const [data, total] = await Promise.all([
    MissingPersonCase.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    MissingPersonCase.countDocuments(filter)
  ]);
  res.json(paginatedResponse({ data, total, page, limit }));
});

const verifyCase = asyncHandler(async (req, res) => {
  const caseDoc = await MissingPersonCase.findByIdAndUpdate(req.params.id, {
    caseStatus: req.body.status,
    verifiedBy: req.user._id,
    verifiedAt: new Date()
  }, { new: true });

  if (!caseDoc) throw new AppError('Case not found', 404);

  await createNotification({
    recipient: caseDoc.createdBy,
    type: 'case_verified',
    title: 'Case verification updated',
    message: `Your case is now ${caseDoc.caseStatus}.`,
    channels: ['in_app', 'email'],
    data: { caseId: caseDoc._id }
  });

  res.json(caseDoc);
});

const verifyReport = asyncHandler(async (req, res) => {
  const report = await VolunteerReport.findByIdAndUpdate(req.params.id, {
    verificationStatus: req.body.verificationStatus,
    verifiedBy: req.user._id,
    verifiedAt: new Date()
  }, { new: true });
  if (!report) throw new AppError('Report not found', 404);
  res.json(report);
});

const analytics = asyncHandler(async (_req, res) => {
  const [usersByRole, casesByStatus, reportsByStatus, aiMatches, rewards] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    MissingPersonCase.aggregate([{ $group: { _id: '$caseStatus', count: { $sum: 1 } } }]),
    VolunteerReport.aggregate([{ $group: { _id: '$verificationStatus', count: { $sum: 1 } } }]),
    AiDetectionLog.countDocuments({ status: 'match' }),
    Reward.aggregate([{ $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }])
  ]);
  res.json({ usersByRole, casesByStatus, reportsByStatus, aiMatches, rewards });
});

const aiLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [data, total] = await Promise.all([
    AiDetectionLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('caseId reportId status confidence createdAt errorMessage'),
    AiDetectionLog.countDocuments()
  ]);
  res.json(paginatedResponse({ data, total, page, limit }));
});

const rewards = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [data, total] = await Promise.all([
    Reward.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('caseId', 'caseId missingPersonName')
      .populate('claimant', 'fullName email mobileNumber'),
    Reward.countDocuments()
  ]);
  res.json(paginatedResponse({ data, total, page, limit }));
});

module.exports = { listUsers, listCases, verifyCase, verifyReport, analytics, aiLogs, rewards };

