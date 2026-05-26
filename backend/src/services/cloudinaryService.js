const crypto = require('crypto');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const { moderateImage } = require('./imageModerationService');

async function optimizeImage(file) {
  if (file.mimetype === 'application/pdf') return file.buffer;
  return sharp(file.buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

async function uploadFile(file, folder = process.env.CLOUDINARY_FOLDER || 'findthem') {
  if (!file) throw new AppError('File is required', 400);

  await moderateImage(file);
  const buffer = await optimizeImage(file);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder,
      resource_type: resourceType,
      public_id: hash,
      overwrite: false
    }, (error, uploadResult) => {
      if (error) return reject(error);
      return resolve(uploadResult);
    });
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    thumbnailUrl: resourceType === 'image'
      ? cloudinary.url(result.public_id, { width: 300, height: 300, crop: 'fill', secure: true })
      : result.secure_url,
    hash,
    mimeType: file.mimetype
  };
}

async function uploadMany(files = [], folder) {
  return Promise.all(files.map((file) => uploadFile(file, folder)));
}

module.exports = { uploadFile, uploadMany };
