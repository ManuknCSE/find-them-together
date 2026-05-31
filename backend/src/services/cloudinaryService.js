const crypto = require('crypto');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const { moderateImage } = require('./imageModerationService');
const logger = require('../utils/logger');

async function optimizeImage(file) {
  if (file.mimetype === 'application/pdf') return file.buffer;
  return sharp(file.buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

async function validateMagicBytes(file) {
  if (file.mimetype === 'application/pdf') {
    const header = file.buffer.slice(0, 4).toString('ascii');
    if (!header.startsWith('%PDF')) throw new AppError('File is not a valid PDF', 400);
    return;
  }
  try {
    await sharp(file.buffer).metadata();
  } catch {
    throw new AppError('File does not appear to be a valid image', 400);
  }
}

async function uploadFile(file, folder = process.env.CLOUDINARY_FOLDER || 'findthem') {
  if (!file) throw new AppError('File is required', 400);

  // SEC-004: Magic byte validation
  await validateMagicBytes(file);

  // Dev fallback: if Cloudinary not configured, return a placeholder
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('File storage is not configured', 503);
    }
    logger.warn('[DEV] Cloudinary not configured — returning placeholder for file:', file.originalname);
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const label = encodeURIComponent(file.originalname || 'photo');
    return {
      url: `https://placehold.co/800x600/6c5ce7/ffffff?text=${label}`,
      publicId: `dev/${hash}`,
      thumbnailUrl: `https://placehold.co/300x300/6c5ce7/ffffff?text=${label}`,
      hash,
      mimeType: file.mimetype
    };
  }

  await moderateImage(file);
  const buffer = await optimizeImage(file);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const nonce = crypto.randomBytes(8).toString('hex');
  const publicId = `${hash}_${nonce}`;
  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder,
      resource_type: resourceType,
      public_id: publicId,
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

// PERF-003: Concurrency-limited batch upload
async function uploadMany(files = [], folder, concurrency = 3) {
  if (!files.length) return [];
  const results = [];
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(f => uploadFile(f, folder)));
    results.push(...batchResults);
  }
  return results;
}

module.exports = { uploadFile, uploadMany };
