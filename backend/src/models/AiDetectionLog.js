const mongoose = require('mongoose');

const aiDetectionLogSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'MissingPersonCase', index: true },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'VolunteerReport', index: true },
  sourceImageHash: String,
  targetImageHash: String,
  confidence: { type: Number, min: 0, max: 100, index: true },
  status: { type: String, enum: ['queued', 'processing', 'match', 'possible_match', 'no_match', 'failed'], default: 'queued', index: true },
  provider: { type: String, default: 'external_ai' },
  rawResponse: mongoose.Schema.Types.Mixed,
  errorMessage: String
}, { timestamps: true });

aiDetectionLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AiDetectionLog', aiDetectionLogSchema);

