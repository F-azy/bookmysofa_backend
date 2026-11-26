const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// POST /api/upload
const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided.' });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'bookmysofa/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
      // Convert to WebP on Cloudinary's side and compress
      format: 'webp',
      transformation: [
        {
          width: 1200,
          crop: 'limit',       
          quality: 'auto:good', 
          fetch_format: 'webp', 
        },
      ],
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
      eager_async: true, 
    });

    fs.unlink(req.file.path, () => {});

    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('Cloudinary upload error:', err.message);
    return res.status(500).json({ message: 'Image upload failed.' });
  }
};

// GET /api/config/whatsapp
const getWhatsAppConfig = async (req, res) => {
  const number = process.env.SHOP_WHATSAPP_NUMBER;
  if (!number) {
    return res.status(500).json({ message: 'WhatsApp number not configured.' });
  }
  return res.status(200).json({ whatsappNumber: number });
};

module.exports = { uploadImage, getWhatsAppConfig };