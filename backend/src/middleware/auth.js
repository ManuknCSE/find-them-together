const jwt = require('jsonwebtoken');
const initFirebase = require('../config/firebase');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Authentication required', 401);

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists', 401);

  req.user = user;
  next();
});

const authenticateFirebase = asyncHandler(async (req, _res, next) => {
  const firebase = initFirebase();
  if (!firebase) throw new AppError('Firebase authentication is not configured', 503);

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Firebase token required', 401);

  req.firebaseUser = await firebase.auth().verifyIdToken(token);
  next();
});

module.exports = { authenticate, authenticateFirebase };

