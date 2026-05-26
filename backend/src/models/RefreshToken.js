const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  userAgent: String,
  ipAddress: String,
  revokedAt: Date,
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

refreshTokenSchema.index({ user: 1, revokedAt: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);

