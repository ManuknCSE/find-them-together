const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { hashValue } = require('../utils/crypto');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');

async function issueTokenPair(user, req) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, user.tokenVersion);
  const decoded = jwt.decode(refreshToken);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashValue(refreshToken),
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
    expiresAt: new Date(decoded.exp * 1000)
  });

  return { accessToken, refreshToken };
}

async function rotateRefreshToken(refreshToken, req) {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || user.tokenVersion !== decoded.tokenVersion) throw new AppError('Invalid refresh token', 401);

  const stored = await RefreshToken.findOne({ tokenHash: hashValue(refreshToken), revokedAt: null });
  if (!stored) throw new AppError('Refresh token revoked', 401);

  stored.revokedAt = new Date();
  await stored.save();
  return issueTokenPair(user, req);
}

module.exports = { issueTokenPair, rotateRefreshToken };

