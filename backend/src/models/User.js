const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const ROLES = require('../constants/roles');

const notificationPreferencesSchema = new mongoose.Schema({
  email: { type: Boolean, default: true },
  sms: { type: Boolean, default: true },
  whatsapp: { type: Boolean, default: true },
  push: { type: Boolean, default: true },
  nearbyAlerts: { type: Boolean, default: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, lowercase: true, trim: true, sparse: true, index: true },
  passwordHash: { type: String, select: false },
  mobileNumber: { type: String, trim: true, index: true },
  countryCode: { type: String, trim: true, default: '+91' },
  profilePhoto: {
    url: String,
    publicId: String,
    thumbnailUrl: String
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.FAMILY_MEMBER,
    index: true
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address: String,
    city: String,
    state: String,
    country: String
  },
  firebaseUid: { type: String, sparse: true, index: true },
  googleId: { type: String, sparse: true, index: true },
  verifiedStatus: { type: Boolean, default: false, index: true },
  volunteerRating: { type: Number, default: 0, min: 0, max: 5 },
  notificationPreferences: { type: notificationPreferencesSchema, default: () => ({}) },
  passwordResetTokenHash: String,
  passwordResetExpiresAt: Date,
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });
userSchema.index({ fullName: 'text', email: 'text', mobileNumber: 'text' });
userSchema.index({ email: 1, role: 1 });

userSchema.virtual('createdAtField').get(function createdAtField() {
  return this.createdAt;
});

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.comparePassword = async function comparePassword(password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);

