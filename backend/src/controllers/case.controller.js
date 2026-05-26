const MissingPersonCase = require('../models/MissingPersonCase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const { uploadFile, uploadMany } = require('../services/cloudinaryService');
const { createNotification } = require('../services/notificationService');

const createCase = asyncHandler(async (req, res) => {
  const photos = req.files?.photos ? await uploadMany(req.files.photos, 'findthem/cases/photos') : [];
  const firCopy = req.files?.firCopy?.[0] ? await uploadFile(req.files.firCopy[0], 'findthem/cases/fir') : undefined;

  const caseDoc = await MissingPersonCase.create({
    ...req.body,
    gpsCoordinates: { type: 'Point', coordinates: req.body.gpsCoordinates },
    uploadedPhotos: photos,
    firCopy,
    createdBy: req.user._id
  });

  await createNotification({
    recipient: req.user._id,
    type: 'system',
    title: 'Case submitted',
    message: 'Your missing person case was submitted for police verification.',
    channels: ['in_app', 'email'],
    data: { caseId: caseDoc._id }
  });

  res.status(201).json(caseDoc);
});

const listCases = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.search) filter.$text = { $search: req.query.search };
  if (req.query.city) filter['lastSeenLocation.city'] = new RegExp(req.query.city, 'i');
  if (req.query.state) filter['lastSeenLocation.state'] = new RegExp(req.query.state, 'i');
  if (req.query.status) filter.caseStatus = req.query.status;
  if (req.query.minAge || req.query.maxAge) {
    filter.age = {};
    if (req.query.minAge) filter.age.$gte = Number(req.query.minAge);
    if (req.query.maxAge) filter.age.$lte = Number(req.query.maxAge);
  }
  if (req.query.lng && req.query.lat) {
    filter.gpsCoordinates = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(req.query.lng), Number(req.query.lat)] },
        $maxDistance: Number(req.query.radiusKm || 25) * 1000
      }
    };
  }

  const [data, total] = await Promise.all([
    MissingPersonCase.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('createdBy', 'fullName mobileNumber'),
    MissingPersonCase.countDocuments(filter)
  ]);

  res.json(paginatedResponse({ data, total, page, limit }));
});

const getCase = asyncHandler(async (req, res) => {
  const caseDoc = await MissingPersonCase.findById(req.params.id)
    .populate('createdBy', 'fullName email mobileNumber')
    .populate('verifiedBy', 'fullName role');
  if (!caseDoc) throw new AppError('Case not found', 404);
  res.json(caseDoc);
});

const nearbyCases = asyncHandler(async (req, res) => {
  const { lng, lat, radiusKm = 25 } = req.query;
  if (!lng || !lat) throw new AppError('lng and lat query parameters are required', 400);

  const cases = await MissingPersonCase.find({
    caseStatus: 'active',
    gpsCoordinates: {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radiusKm) * 1000
      }
    }
  }).limit(100);

  res.json(cases);
});

module.exports = { createCase, listCases, getCase, nearbyCases };

