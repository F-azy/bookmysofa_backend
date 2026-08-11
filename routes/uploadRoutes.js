const express = require('express');
const router = express.Router();
const multer = require('multer');
const os = require('os');
const path = require('path');
const { uploadImage, getWhatsAppConfig } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Multer: store uploaded files temporarily in the OS temp dir
// (os.tmpdir() resolves correctly on Windows, Mac, and Linux —
// a hardcoded '/tmp' breaks on Windows since it resolves to C:\tmp,
// which doesn't exist by default)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `bookmysofa_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// POST /api/upload  (admin only)
router.post('/', protect, adminOnly, upload.single('image'), uploadImage);

// GET /api/config/whatsapp  (authenticated users)
router.get('/whatsapp', protect, getWhatsAppConfig);

module.exports = router;