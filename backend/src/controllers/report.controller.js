const MissingPersonCase = require('../models/MissingPersonCase');
const VolunteerReport = require('../models/VolunteerReport');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { uploadMany } = require('../services/cloudinaryService');
const { compareFaces } = require('../services/aiFaceService');
const { createNotification, triggerEmergencyMatch } = require('../services/notificationService');
const { emitToCase } = require('../services/socketService');

const createReport = asyncHandler(async (req, res) => {
  const caseDoc = await MissingPersonCase.findById(req.body.relatedCaseId);
  if (!caseDoc) throw new AppError('Related case not found', 404);

  const evidence = await uploadMany(req.files || [], 'findthem/reports/evidence');
  const report = await VolunteerReport.create({
    ...req.body,
    volunteerId: req.user._id,
    currentGpsLocation: { type: 'Point', coordinates: req.body.currentGpsLocation },
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

  if (caseDoc.uploadedPhotos[0] && evidence[0]) {
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
    report.matchResult = result.isMatch ? 'possible_match' : 'no_match';
    await report.save();

    caseDoc.aiMatchStatus = result.isMatch ? 'match_found' : 'no_match';
    if (result.isMatch) caseDoc.caseStatus = 'matched';
    await caseDoc.save();

    emitToCase(caseDoc._id, 'ai:scan-progress', { status: caseDoc.aiMatchStatus, confidence: result.confidence });
    if (result.isMatch) await triggerEmergencyMatch({ caseDoc, report, confidence: result.confidence });
  }

  res.status(201).json(report);
});

const listReports = asyncHandler(async (_req, res) => {
  const reports = await VolunteerReport.find().sort({ createdAt: -1 }).limit(100)
    .populate('volunteerId', 'fullName role volunteerRating')
    .populate('relatedCaseId', 'caseId missingPersonName caseStatus');
  res.json(reports);
});

module.exports = { createReport, listReports };

