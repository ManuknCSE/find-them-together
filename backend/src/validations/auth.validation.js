const Joi = require('joi');
const ROLES = require('../constants/roles');

const password = Joi.string().min(8).max(128);

const register = Joi.object({
  body: Joi.object({
    fullName: Joi.string().min(2).max(120).required(),
    email: Joi.string().email().required(),
    password: password.required(),
    mobileNumber: Joi.string().min(7).max(20).required(),
    countryCode: Joi.string().min(1).max(6).default('+91'),
    role: Joi.string().valid(...Object.values(ROLES)).default(ROLES.FAMILY_MEMBER),
    captchaToken: Joi.string().allow('', null)
  })
});

const login = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: password.required(),
    captchaToken: Joi.string().allow('', null)
  })
});

const resendOtp = Joi.object({
  body: Joi.object({
    mobileNumber: Joi.string().min(7).max(20).required(),
    countryCode: Joi.string().min(1).max(6).default('+91'),
    purpose: Joi.string().valid('signup', 'login', 'password_reset').default('login')
  })
});

const verifyOtp = Joi.object({
  body: Joi.object({
    mobileNumber: Joi.string().min(7).max(20).required(),
    countryCode: Joi.string().min(1).max(6).default('+91'),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
    purpose: Joi.string().valid('signup', 'login', 'password_reset').default('login')
  })
});

const googleLogin = Joi.object({
  body: Joi.object({
    firebaseIdToken: Joi.string().required(),
    role: Joi.string().valid(...Object.values(ROLES)).default(ROLES.FAMILY_MEMBER)
  })
});

const forgotPassword = Joi.object({
  body: Joi.object({ email: Joi.string().email().required() })
});

// BUG-013: Added resetPassword validation
const resetPassword = Joi.object({
  body: Joi.object({
    token: Joi.string().hex().length(64).required(),
    newPassword: password.required()
  })
});

const refresh = Joi.object({
  body: Joi.object({ refreshToken: Joi.string().required() })
});

module.exports = { register, login, resendOtp, verifyOtp, googleLogin, forgotPassword, resetPassword, refresh };
