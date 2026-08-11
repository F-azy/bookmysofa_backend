const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// POST /api/upload
// Receives a file via multer, uploads to Cloudinary, returns secure URL
const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided.' });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'bookmysofa/products',
      // Accept common formats from camera/gallery
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
      // Convert to WebP on Cloudinary's side and compress
      format: 'webp',
      transformation: [
        {
          width: 1200,
          crop: 'limit',       // Never upscale, only shrink if larger than 1200px
          quality: 'auto:good', // Cloudinary picks best quality/size balance
          fetch_format: 'webp', // Ensure output is WebP
        },
      ],
      // Eagerly generate a thumbnail version at upload time for product cards
      eager: [
        {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto:good',
          fetch_format: 'webp',
        },
      ],
      eager_async: true, // Don't block the upload response for thumbnail generation
    });

    // Remove the temp file after upload
    fs.unlink(req.file.path, () => {});

    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    // Clean up temp file if upload fails
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('Cloudinary upload error:', err.message);
    return res.status(500).json({ message: 'Image upload failed.' });
  }
};

// GET /api/config/whatsapp
// Returns shop WhatsApp number to the authenticated frontend
const getWhatsAppConfig = async (req, res) => {
  const number = process.env.SHOP_WHATSAPP_NUMBER;
  if (!number) {
    return res.status(500).json({ message: 'WhatsApp number not configured.' });
  }
  return res.status(200).json({ whatsappNumber: number });
};

module.exports = { uploadImage, getWhatsAppConfig };