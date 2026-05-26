const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const evidenceSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String,
  thumbnailUrl: String,
  hash: String,
  mimeType: String
}, { _id: false });

const volunteerReportSchema = new mongoose.Schema({
  reportId: { type: String, default: () => `VR-${uuidv4()}`, unique: true, index: true },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  relatedCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'MissingPersonCase', required: true, index: true },
  uploadedEvidenceImages: [evidenceSchema],
  currentGpsLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: String,
  aiMatchConfidence: { type: Number, min: 0, max: 100, default: 0 },
  matchResult: { type: String, enum: ['pending', 'possible_match', 'confirmed_match', 'no_match'], default: 'pending', index: true },
  additionalNotes: String,
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'verified', 'fake', 'rejected'],
    default: 'pending',
    index: true
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date
}, { timestamps: true });

volunteerReportSchema.index({ currentGpsLocation: '2dsphere' });
volunteerReportSchema.index({ relatedCaseId: 1, createdAt: -1 });
volunteerReportSchema.index({ verificationStatus: 1, aiMatchConfidence: -1 });

module.exports = mongoose.model('VolunteerReport', volunteerReportSchema);

