const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// Keep multer in memory instead of disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const valid =
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype);
    valid ? cb(null, true) : cb(new Error('Only image files are allowed'));
  }
});

const uploadToGCS = (req, res, next) => {
  if (!req.file) return next();

  const filename = `${Date.now()}${path.extname(req.file.originalname)}`;
  const blob = bucket.file(filename);

  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: req.file.mimetype,
  });

  blobStream.on('error', (err) => next(err));

  blobStream.on('finish', () => {
    // Public URL of the uploaded file
    req.file.gcsUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${filename}`;
    next();
  });

  blobStream.end(req.file.buffer);
};
module.exports = { upload, uploadToGCS };
