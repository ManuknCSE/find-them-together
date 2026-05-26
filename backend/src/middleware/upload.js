const multer = require('multer');
const AppError = require('../utils/AppError');

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new AppError('Unsupported file type', 400));
  }
  return cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  }
});

