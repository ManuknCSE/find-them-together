const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true, index: true },
  countryCode: { type: String, required: true },
  otpHash: String,
  purpose: { type: String, enum: ['signup', 'login', 'password_reset'], required: true },
  attempts: { type: Number, default: 0 },
  verifiedAt: Date,
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

otpVerificationSchema.index({ mobileNumber: 1, purpose: 1, createdAt: -1 });

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);

