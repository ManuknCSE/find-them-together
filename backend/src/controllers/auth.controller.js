const initFirebase = require('../config/firebase');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { randomToken, hashValue } = require('../utils/crypto');
const { issueTokenPair, rotateRefreshToken } = require('../services/authService');
const { sendOtp, verifyOtp } = require('../services/twilioService');
const { sendEmail } = require('../services/emailService');
const ROLES = require('../constants/roles');

// Roles that can be self-assigned during registration/social login
const SELF_ASSIGNABLE_ROLES = [ROLES.FAMILY_MEMBER, ROLES.VOLUNTEER, ROLES.NGO_PARTNER];

function sanitizeRole(role) {
  return SELF_ASSIGNABLE_ROLES.includes(role) ? role : ROLES.FAMILY_MEMBER;
}

const register = asyncHandler(async (req, res) => {
  const existing = await User.findOne({
    $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }]
  });
  if (existing) throw new AppError('User already exists with that email or mobile number', 409);

  // SEC-003: Sanitize role — users cannot self-assign admin or police roles
  const safeRole = sanitizeRole(req.body.role);

  const user = new User({ ...req.body, role: safeRole });
  await user.setPassword(req.body.password);
  await user.save();

  // Send OTP (silently skipped if Twilio not configured)
  await sendOtp(`${user.countryCode}${user.mobileNumber}`);

  const tokens = await issueTokenPair(user, req);

  // Don't expose passwordHash
  const userObj = user.toObject();
  delete userObj.passwordHash;

  res.status(201).json({ user: userObj, ...tokens });
});

const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = await issueTokenPair(user, req);

  const userObj = user.toObject();
  delete userObj.passwordHash;

  res.json({ user: userObj, ...tokens });
});

const resendOtp = asyncHandler(async (req, res) => {
  await sendOtp(`${req.body.countryCode}${req.body.mobileNumber}`);
  res.json({ message: 'OTP sent' });
});

const verifyOtpCode = asyncHandler(async (req, res) => {
  const to = `${req.body.countryCode}${req.body.mobileNumber}`;
  const result = await verifyOtp(to, req.body.otp);
  if (result.status !== 'approved') throw new AppError('Invalid or expired OTP', 400);

  const user = await User.findOneAndUpdate(
    { mobileNumber: req.body.mobileNumber, countryCode: req.body.countryCode },
    { verifiedStatus: true },
    { new: true }
  );

  const tokens = user ? await issueTokenPair(user, req) : {};
  res.json({ message: 'Phone number verified successfully', user, ...tokens });
});

const googleLogin = asyncHandler(async (req, res) => {
  const firebase = initFirebase();
  if (!firebase) throw new AppError('Firebase authentication is not configured', 503);

  const decoded = await firebase.auth().verifyIdToken(req.body.firebaseIdToken);
  let user = await User.findOne({ firebaseUid: decoded.uid });

  if (!user) {
    // SEC-003: Sanitize role for Google sign-in
    const safeRole = sanitizeRole(req.body.role);

    user = await User.create({
      fullName: decoded.name || decoded.email,
      email: decoded.email,
      profilePhoto: { url: decoded.picture },
      role: safeRole,
      firebaseUid: decoded.uid,
      googleId: decoded.firebase?.identities?.['google.com']?.[0],
      verifiedStatus: true
    });
  }

  const tokens = await issueTokenPair(user, req);
  res.json({ user, ...tokens });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = randomToken();
    user.passwordResetTokenHash = hashValue(token);
    user.passwordResetExpiresAt = new Date(
      Date.now() + Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || 15) * 60000
    );
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:8080'}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'FindThem — Reset your password',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#6c5ce7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
            Reset Password
          </a>
          <p style="color:#666;font-size:12px">If you didn't request this, ignore this email. Your password remains unchanged.</p>
        </div>
      `,
      text: `Reset your FindThem password: ${resetUrl} — Expires in 15 minutes.`
    });
  }
  // Always return success to prevent email enumeration
  res.json({ message: 'If that email is registered, a password reset link has been sent.' });
});

// BUG-013: New resetPassword endpoint
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) throw new AppError('Token and new password are required', 400);
  if (newPassword.length < 8) throw new AppError('Password must be at least 8 characters', 400);

  const hash = hashValue(token);
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpiresAt: { $gt: new Date() }
  });
  if (!user) throw new AppError('Password reset link is invalid or has expired', 400);

  await user.setPassword(newPassword);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all existing sessions
  await user.save();

  res.json({ message: 'Password reset successful. Please log in with your new password.' });
});

const refreshToken = asyncHandler(async (req, res) => {
  const tokens = await rotateRefreshToken(req.body.refreshToken, req);
  res.json(tokens);
});

module.exports = {
  register, login, resendOtp, verifyOtpCode,
  googleLogin, forgotPassword, resetPassword, refreshToken
};
