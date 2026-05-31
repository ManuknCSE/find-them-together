const MissingPersonCase = require('../models/MissingPersonCase');
const VolunteerReport = require('../models/VolunteerReport');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const { uploadMany } = require('../services/cloudinaryService');
const { compareFaces } = require('../services/aiFaceService');
const { createNotification, triggerEmergencyMatch } = require('../services/notificationService');
const { emitToCase } = require('../services/socketService');
const logger = require('../utils/logger');

const createReport = asyncHandler(async (req, res) => {
  const caseDoc = await MissingPersonCase.findById(req.body.relatedCaseId);
  if (!caseDoc) throw new AppError('Related case not found', 404);

  const evidence = await uploadMany(req.files || [], 'findthem/reports/evidence');

  // BUG-009 fix for report: parse GPS coordinates safely
  let gpsCoords = [0, 0];
  try {
    const raw = req.body.currentGpsLocation;
    gpsCoords = Array.isArray(raw) ? raw.map(Number) : JSON.parse(raw);
  } catch {
    gpsCoords = [0, 0];
  }

  const report = await VolunteerReport.create({
    ...req.body,
    volunteerId: req.user._id,
    currentGpsLocation: { type: 'Point', coordinates: gpsCoords },
    uploadedEvidenceImages: evidence
  });

  await createNotification({
    recipient: caseDoc.createdBy,
    type: 'new_report',
    title: 'New volunteer report',
    message: `A volunteer submitted a report for ${caseDoc.missingPersonName}.`,
    channels: ['in_app', 'email'],
    data: { caseId: caseDoc._id, reportId: report._id }
  });

  // PERF-002: Respond IMMEDIATELY, run AI matching asynchronously
  res.status(201).json(report);

  // Fire-and-forget AI matching — does NOT block the response
  if (caseDoc.uploadedPhotos[0] && evidence[0]) {
    setImmediate(async () => {
      try {
        caseDoc.aiMatchStatus = 'scanning';
        await caseDoc.save();
        emitToCase(caseDoc._id, 'ai:scan-progress', { status: 'scanning', reportId: report._id });

        const result = await compareFaces({
          caseId: caseDoc._id,
          reportId: report._id,
          sourceImage: caseDoc.uploadedPhotos[0],
          targetImage: evidence[0]
        });

        report.aiMatchConfidence = result.confidence;
        report.matchResult = result.isMatch
          ? 'confirmed_match'
          : result.isPossibleMatch
          ? 'possible_match'
          : 'no_match';
        await report.save();

        caseDoc.aiMatchStatus = result.isMatch ? 'match_found' : 'no_match';
        if (result.isMatch) caseDoc.caseStatus = 'matched';
        await caseDoc.save();

        emitToCase(caseDoc._id, 'ai:scan-progress', {
          status: caseDoc.aiMatchStatus,
          confidence: result.confidence,
          reportId: report._id
        });

        if (result.isMatch) {
          await triggerEmergencyMatch({ caseDoc, report, confidence: result.confidence });
        }
      } catch (err) {
        logger.error('Async AI matching failed:', err.message);
        caseDoc.aiMatchStatus = 'failed';
        await caseDoc.save().catch(() => {});
        emitToCase(caseDoc._id, 'ai:scan-progress', { status: 'failed', reportId: report._id });
      }
    });
  }
});

// BUG-006: Proper pagination + filters for listReports
const listReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.caseId) filter.relatedCaseId = req.query.caseId;
  if (req.query.status) filter.verificationStatus = req.query.status;
  if (req.query.matchResult) filter.matchResult = req.query.matchResult;

  const [data, total] = await Promise.all([
    VolunteerReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('volunteerId', 'fullName role volunteerRating')
      .populate('relatedCaseId', 'caseId missingPersonName caseStatus'),
    VolunteerReport.countDocuments(filter)
  ]);

  res.json(paginatedResponse({ data, total, page, limit }));
});

module.exports = { createReport, listReports };
