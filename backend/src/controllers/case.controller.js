const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MissingPersonCase = require('../models/MissingPersonCase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const { uploadFile, uploadMany } = require('../services/cloudinaryService');
const { createNotification } = require('../services/notificationService');
const { getJson, setJson, delPattern } = require('../services/cacheService');
const { encryptString, decryptString } = require('../utils/encryption');

const createCase = asyncHandler(async (req, res) => {
  const photos = req.files?.photos
    ? await uploadMany(req.files.photos, 'findthem/cases/photos')
    : [];
  const firCopy = req.files?.firCopy?.[0]
    ? await uploadFile(req.files.firCopy[0], 'findthem/cases/fir')
    : undefined;

  // BUG-009: Safe GPS coordinates parsing
  let gpsCoordinates = { type: 'Point', coordinates: [0, 0] };
  try {
    const raw = req.body.gpsCoordinates;
    const coords = Array.isArray(raw) ? raw.map(Number) : JSON.parse(raw);
    if (coords.length === 2 && coords.every(n => !isNaN(n))) {
      gpsCoordinates = { type: 'Point', coordinates: coords };
    }
  } catch {
    // Keep default [0,0]
  }

  // Safe JSON parsing for nested objects
  let lastSeenLocation = {};
  let familyContactDetails = {};
  try {
    if (req.body.lastSeenLocation) {
      lastSeenLocation = typeof req.body.lastSeenLocation === 'string'
        ? JSON.parse(req.body.lastSeenLocation)
        : req.body.lastSeenLocation;
    }
    if (req.body.familyContactDetails) {
      familyContactDetails = typeof req.body.familyContactDetails === 'string'
        ? JSON.parse(req.body.familyContactDetails)
        : req.body.familyContactDetails;
    }
  } catch {
    // Keep defaults
  }

  // SEC-07: Encrypt family contact details
  if (familyContactDetails.phone) {
    familyContactDetails.phone = encryptString(familyContactDetails.phone);
  }
  if (familyContactDetails.email) {
    familyContactDetails.email = encryptString(familyContactDetails.email);
  }

  const caseDoc = await MissingPersonCase.create({
    missingPersonName: req.body.missingPersonName,
    age: req.body.age,
    gender: req.body.gender,
    height: req.body.height,
    weight: req.body.weight,
    bodyShape: req.body.bodyShape,
    tattoos: req.body.tattoos,
    birthmarks: req.body.birthmarks,
    lastSeenClothing: req.body.lastSeenClothing,
    lastSeenDate: req.body.lastSeenDate,
    rewardAmount: Number(req.body.rewardAmount || 0),
    lastSeenLocation,
    familyContactDetails,
    gpsCoordinates,
    uploadedPhotos: photos,
    firCopy,
    createdBy: req.user._id
  });

  // Invalidate Redis list caches
  await delPattern('cases:list:*');

  await createNotification({
    recipient: req.user._id,
    type: 'system',
    title: 'Case submitted successfully',
    message: `Your case for ${caseDoc.missingPersonName} has been submitted for verification.`,
    channels: ['in_app', 'email'],
    data: { caseId: caseDoc._id }
  });

  res.status(201).json(caseDoc);
});

const listCases = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  // Optional authentication check
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  let user = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      user = await User.findById(decoded.id);
    } catch (err) {
      // ignore
    }
  }

  const isAdmin = user && (user.role === 'admin' || user.role === 'police_verification_team');
  if (!isAdmin) {
    if (req.query.status) {
      if (['active', 'resolved', 'matched'].includes(req.query.status)) {
        filter.caseStatus = req.query.status;
      } else {
        filter.caseStatus = 'active';
      }
    } else {
      filter.caseStatus = { $in: ['active', 'resolved', 'matched'] };
    }
  } else {
    if (req.query.status) {
      filter.caseStatus = req.query.status;
    }
  }

  // Normalize query to generate cache key
  const normalizedQuery = {
    search: req.query.search || '',
    city: req.query.city || '',
    state: req.query.state || '',
    minAge: req.query.minAge || '',
    maxAge: req.query.maxAge || '',
    status: filter.caseStatus,
    lng: req.query.lng || '',
    lat: req.query.lat || '',
    radiusKm: req.query.radiusKm || 25,
    page,
    limit
  };

  const cacheScope = isAdmin ? 'admin' : 'public';
  const cacheKey = `cases:list:${cacheScope}:${JSON.stringify(normalizedQuery)}`;
  const cached = await getJson(cacheKey);
  if (cached) return res.json(cached);

  if (req.query.search) {
    // Note: $text and $near cannot be combined
    if (!req.query.lng && !req.query.lat) {
      filter.$text = { $search: req.query.search };
    }
  }
  if (req.query.city) filter['lastSeenLocation.city'] = new RegExp(req.query.city, 'i');
  if (req.query.state) filter['lastSeenLocation.state'] = new RegExp(req.query.state, 'i');
  if (req.query.gender) filter.gender = req.query.gender;
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
    MissingPersonCase.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'fullName mobileNumber'),
    MissingPersonCase.countDocuments(filter)
  ]);

  const response = paginatedResponse({ data, total, page, limit });
  await setJson(cacheKey, response, 60);

  res.json(response);
});

const getCase = asyncHandler(async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  let user = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      user = await User.findById(decoded.id);
    } catch (err) {
      // ignore
    }
  }

  const cacheScope = user && (user.role === 'admin' || user.role === 'police_verification_team') ? 'admin' : 'public';
  const cacheKey = `cases:single:${cacheScope}:${req.params.id}`;
  const cached = await getJson(cacheKey);
  if (cached) return res.json(cached);

  const caseDoc = await MissingPersonCase.findById(req.params.id)
    .populate('createdBy', 'fullName email mobileNumber')
    .populate('verifiedBy', 'fullName role');

  if (!caseDoc) throw new AppError('Case not found', 404);

  const isAdminOrOwner = user && (user.role === 'admin' || user.role === 'police_verification_team' || String(user._id) === String(caseDoc.createdBy?._id));
  
  let responseData = caseDoc.toObject();
  if (!isAdminOrOwner) {
    // Strip family contact details and creator details
    if (responseData.familyContactDetails) {
      responseData.familyContactDetails = {
        name: responseData.familyContactDetails.name,
        relationship: responseData.familyContactDetails.relationship
      };
    }
    if (responseData.createdBy) {
      responseData.createdBy = {
        fullName: responseData.createdBy.fullName
      };
    }
  } else {
    // Decrypt family contact details
    if (responseData.familyContactDetails) {
      if (responseData.familyContactDetails.phone) {
        responseData.familyContactDetails.phone = decryptString(responseData.familyContactDetails.phone);
      }
      if (responseData.familyContactDetails.email) {
        responseData.familyContactDetails.email = decryptString(responseData.familyContactDetails.email);
      }
    }
  }

  await setJson(cacheKey, responseData, 30);
  res.json(responseData);
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
