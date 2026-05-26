const initFirebase = require('../config/firebase');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { randomToken, hashValue } = require('../utils/crypto');
const { issueTokenPair, rotateRefreshToken } = require('../services/authService');
const { sendOtp, verifyOtp } = require('../services/twilioService');
const { sendEmail } = require('../services/emailService');

const register = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ $or: [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] });
  if (existing) throw new AppError('User already exists', 409);

  const user = new User(req.body);
  await user.setPassword(req.body.password);
  await user.save();
  await sendOtp(`${user.countryCode}${user.mobileNumber}`);

  const tokens = await issueTokenPair(user, req);
  res.status(201).json({ user, ...tokens });
});

const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = await issueTokenPair(user, req);
  res.json({ user, ...tokens });
});

const resendOtp = asyncHandler(async (req, res) => {
  await sendOtp(`${req.body.countryCode}${req.body.mobileNumber}`);
  res.json({ message: 'OTP sent' });
});

const verifyOtpCode = asyncHandler(async (req, res) => {
  const to = `${req.body.countryCode}${req.body.mobileNumber}`;
  const result = await verifyOtp(to, req.body.otp);
  if (result.status !== 'approved') throw new AppError('Invalid OTP', 400);

  const user = await User.findOneAndUpdate(
    { mobileNumber: req.body.mobileNumber, countryCode: req.body.countryCode },
    { verifiedStatus: true },
    { new: true }
  );

  const tokens = user ? await issueTokenPair(user, req) : {};
  res.json({ message: 'OTP verified', user, ...tokens });
});

const googleLogin = asyncHandler(async (req, res) => {
  const firebase = initFirebase();
  if (!firebase) throw new AppError('Firebase authentication is not configured', 503);

  const decoded = await firebase.auth().verifyIdToken(req.body.firebaseIdToken);
  let user = await User.findOne({ firebaseUid: decoded.uid });

  if (!user) {
    user = await User.create({
      fullName: decoded.name || decoded.email,
      email: decoded.email,
      profilePhoto: { url: decoded.picture },
      role: req.body.role,
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
    user.passwordResetExpiresAt = new Date(Date.now() + Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || 15) * 60000);
    await user.save();
    await sendEmail({
      to: user.email,
      subject: 'FindThem password reset',
      text: `Use this password reset token: ${token}`
    });
  }
  res.json({ message: 'If the email exists, a password reset message has been sent' });
});

const refreshToken = asyncHandler(async (req, res) => {
  const tokens = await rotateRefreshToken(req.body.refreshToken, req);
  res.json(tokens);
});

module.exports = { register, login, resendOtp, verifyOtpCode, googleLogin, forgotPassword, refreshToken };
