const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const uploadedFileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String,
  thumbnailUrl: String,
  hash: String,
  mimeType: String
}, { _id: false });

const caseSchema = new mongoose.Schema({
  caseId: { type: String, default: () => `FT-${uuidv4()}`, unique: true, index: true },
  missingPersonName: { type: String, required: true, trim: true, index: true },
  age: { type: Number, min: 0, max: 120, index: true },
  gender: { type: String, enum: ['male', 'female', 'non_binary', 'unknown'], index: true },
  height: String,
  weight: String,
  bodyShape: String,
  tattoos: String,
  birthmarks: String,
  lastSeenClothing: String,
  lastSeenDate: { type: Date, required: true, index: true },
  lastSeenLocation: {
    address: String,
    city: { type: String, index: true },
    state: { type: String, index: true },
    country: String
  },
  gpsCoordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  uploadedPhotos: [uploadedFileSchema],
  firCopy: uploadedFileSchema,
  familyContactDetails: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  rewardAmount: { type: Number, default: 0, min: 0 },
  caseStatus: {
    type: String,
    enum: ['draft', 'pending_verification', 'active', 'matched', 'resolved', 'rejected', 'closed'],
    default: 'pending_verification',
    index: true
  },
  aiMatchStatus: {
    type: String,
    enum: ['not_started', 'queued', 'scanning', 'match_found', 'no_match', 'failed'],
    default: 'not_started',
    index: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date
}, { timestamps: true });

caseSchema.index({ gpsCoordinates: '2dsphere' });
caseSchema.index({ missingPersonName: 'text', 'lastSeenLocation.city': 'text', 'lastSeenLocation.state': 'text' });
caseSchema.index({ caseStatus: 1, createdAt: -1 });
caseSchema.index({ age: 1, gender: 1 });

module.exports = mongoose.model('MissingPersonCase', caseSchema);

