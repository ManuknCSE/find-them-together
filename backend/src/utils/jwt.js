const jwt = require('jsonwebtoken');

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function signRefreshToken(user, tokenVersion = 0) {
  return jwt.sign(
    { id: user._id, tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
}

module.exports = { signAccessToken, signRefreshToken };

