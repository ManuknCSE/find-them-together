const axios = require('axios');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, _res, next) => {
  if (process.env.NODE_ENV === 'test' || !process.env.CAPTCHA_SECRET) return next();

  const token = req.body.captchaToken;
  if (!token) throw new AppError('CAPTCHA token is required', 400);

  const { data } = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
    params: { secret: process.env.CAPTCHA_SECRET, response: token }
  });

  if (!data.success) throw new AppError('CAPTCHA validation failed', 400);
  next();
});

