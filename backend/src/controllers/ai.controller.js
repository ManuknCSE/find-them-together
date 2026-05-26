const MissingPersonCase = require('../models/MissingPersonCase');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { uploadFile } = require('../services/cloudinaryService');
const { compareFaces } = require('../services/aiFaceService');

const compareUploadedImage = asyncHandler(async (req, res) => {
  const caseDoc = await MissingPersonCase.findById(req.body.caseId);
  if (!caseDoc) throw new AppError('Case not found', 404);
  if (!caseDoc.uploadedPhotos[0]) throw new AppError('Case has no reference photo', 400);
  if (!req.file) throw new AppError('Comparison image is required', 400);

  const targetImage = await uploadFile(req.file, 'findthem/ai/comparisons');
  const result = await compareFaces({
    caseId: caseDoc._id,
    sourceImage: caseDoc.uploadedPhotos[0],
    targetImage
  });

  res.json({ confidence: result.confidence, isMatch: result.isMatch, logId: result.log._id });
});

module.exports = { compareUploadedImage };

