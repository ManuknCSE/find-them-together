const express = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const captcha = require('../middleware/captcha');
const { authLimiter } = require('../middleware/rateLimit');
const authValidation = require('../validations/auth.validation');

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a FindThem user and send OTP
 */
router.post('/register', authLimiter, validate(authValidation.register), captcha, controller.register);
router.post('/login', authLimiter, validate(authValidation.login), captcha, controller.login);
router.post('/otp/verify', authLimiter, validate(authValidation.verifyOtp), controller.verifyOtpCode);
router.post('/otp/resend', authLimiter, validate(authValidation.resendOtp), controller.resendOtp);
router.post('/google', authLimiter, validate(authValidation.googleLogin), controller.googleLogin);
router.post('/forgot-password', authLimiter, validate(authValidation.forgotPassword), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(authValidation.resetPassword), controller.resetPassword);
router.post('/refresh-token', authLimiter, validate(authValidation.refresh), controller.refreshToken);

module.exports = router;
