const axios = require('axios');
const AppError = require('../utils/AppError');

async function moderateImage(file) {
  if (!file || file.mimetype === 'application/pdf' || !process.env.IMAGE_MODERATION_URL) {
    return { approved: true, reason: 'skipped' };
  }

  const { data } = await axios.post(process.env.IMAGE_MODERATION_URL, {
    mimeType: file.mimetype,
    imageBase64: file.buffer.toString('base64')
  }, {
    headers: process.env.IMAGE_MODERATION_API_KEY
      ? { Authorization: `Bearer ${process.env.IMAGE_MODERATION_API_KEY}` }
      : undefined
  });

  if (data.approved === false) {
    throw new AppError(data.reason || 'Image failed moderation', 400);
  }

  return data;
}

module.exports = { moderateImage };

