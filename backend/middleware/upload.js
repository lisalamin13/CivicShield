const multer = require('multer');

const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 10);

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSizeMb * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error('Unsupported file type'));
    }

    return callback(null, true);
  },
});

module.exports = {
  upload,
};
