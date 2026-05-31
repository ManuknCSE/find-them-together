const axios = require('axios');
const AiDetectionLog = require('../models/AiDetectionLog');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// AI-003: Configurable thresholds
const MATCH_THRESHOLD = Number(process.env.AI_MATCH_THRESHOLD || 85);
const POSSIBLE_THRESHOLD = Number(process.env.AI_POSSIBLE_THRESHOLD || 65);

async function compareFaces({ caseId, reportId, sourceImage, targetImage }) {
  // AI-002: Pre-validate — PDFs cannot be face-matched
  if (sourceImage?.mimeType === 'application/pdf' || targetImage?.mimeType === 'application/pdf') {
    throw new AppError('Face matching requires image files, not PDFs', 400);
  }

  // AI-005: Deduplication — skip if same pair already processed
  if (sourceImage?.hash && targetImage?.hash) {
    const existing = await AiDetectionLog.findOne({
      sourceImageHash: sourceImage.hash,
      targetImageHash: targetImage.hash,
      status: { $in: ['match', 'no_match'] }
    });
    if (existing) {
      logger.info(`[AI] Returning cached result for hash pair: ${existing.status}`);
      return { confidence: existing.confidence, isMatch: existing.status === 'match', log: existing };
    }
  }

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
        headers: { Authorization: `Bearer ${process.env.AI_FACE_MATCH_API_KEY}` },
        timeout: 30000
      });
      confidence = Number(data.confidence || data.score || 0);
      rawResponse = { provider: data.provider || 'external_ai', confidence };
    } else {
      // AI-001: Better dev fallback — simulated realistic confidence
      // In prod, this should never run (AI_FACE_MATCH_URL required)
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('AI face matching service (AI_FACE_MATCH_URL) is not configured', 503);
      }
      // Simulate: same hash = high match, otherwise random realistic score
      if (sourceImage?.hash && sourceImage.hash === targetImage?.hash) {
        confidence = 97;
      } else {
        // Realistic distribution: mostly no-match, occasional possible match
        const r = Math.random();
        if (r < 0.70) confidence = Math.floor(Math.random() * 65);        // no match
        else if (r < 0.90) confidence = Math.floor(65 + Math.random() * 20);  // possible
        else confidence = Math.floor(85 + Math.random() * 15);                  // match
      }
      rawResponse = { provider: 'dev_simulation', note: 'Set AI_FACE_MATCH_URL for real matching' };
      logger.warn('[DEV] AI face match simulated. Set AI_FACE_MATCH_URL for real results.');
    }

    const status = confidence >= MATCH_THRESHOLD ? 'match'
                 : confidence >= POSSIBLE_THRESHOLD ? 'possible_match'
                 : 'no_match';

    log.confidence = confidence;
    log.status = status; // DB now supports 'possible_match'
    log.rawResponse = rawResponse;
    await log.save();

    return {
      confidence,
      isMatch: confidence >= MATCH_THRESHOLD,
      isPossibleMatch: confidence >= POSSIBLE_THRESHOLD,
      status,
      log
    };
  } catch (error) {
    log.status = 'failed';
    log.errorMessage = error.message;
    await log.save();
    if (error.isOperational) throw error;
    logger.error('AI face matching error:', error.message);
    throw new AppError('AI face matching failed. Please try again later.', 502);
  }
}

module.exports = { compareFaces };
