const axios = require('axios');
const AiDetectionLog = require('../models/AiDetectionLog');
const AppError = require('../utils/AppError');

async function compareFaces({ caseId, reportId, sourceImage, targetImage }) {
  const log = await AiDetectionLog.create({
    caseId,
    reportId,
    sourceImageHash: sourceImage?.hash,
    targetImageHash: targetImage?.hash,
    status: 'processing'
  });

  try {
    let confidence;
    let rawResponse;

    if (process.env.AI_FACE_MATCH_URL) {
      const { data } = await axios.post(process.env.AI_FACE_MATCH_URL, {
        sourceImageUrl: sourceImage.url,
        targetImageUrl: targetImage.url
      }, {
        headers: { Authorization: `Bearer ${process.env.AI_FACE_MATCH_API_KEY}` }
      });
      confidence = Number(data.confidence || data.score || 0);
      rawResponse = data;
    } else {
      confidence = sourceImage.hash === targetImage.hash ? 100 : 0;
      rawResponse = { provider: 'local_hash_fallback' };
    }

    log.confidence = confidence;
    log.status = confidence > 80 ? 'match' : 'no_match';
    log.rawResponse = rawResponse;
    await log.save();

    return { confidence, isMatch: confidence > 80, log };
  } catch (error) {
    log.status = 'failed';
    log.errorMessage = error.message;
    await log.save();
    throw new AppError('AI face matching failed', 502);
  }
}

module.exports = { compareFaces };

