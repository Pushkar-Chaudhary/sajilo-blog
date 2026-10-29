import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.resolve(__dirname, '../uploads');
const useBlobStorage = Boolean(process.env.VERCEL);

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    console.warn('[Uploads] Could not create uploads dir:', e.message);
  }
}

// Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

// File filter (raster images only; SVG can contain active content)
const allowedImageTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedImageTypes.get(ext) === file.mimetype.toLowerCase()) {
    cb(null, true);
  } else {
    cb(new Error('Only valid JPEG, PNG, WebP, and GIF images are allowed'));
  }
};

const upload = multer({
  storage: useBlobStorage ? multer.memoryStorage() : storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

function uploadImage(req, res, next) {
  if (useBlobStorage && !process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      success: false,
      message: 'Image storage is not configured. Add BLOB_READ_WRITE_TOKEN to the deployment environment.',
    });
  }
  upload.single('image')(req, res, next);
}

async function saveImage(req) {
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (useBlobStorage) {
    const blob = await put(`uploads/${randomUUID()}${ext}`, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
    });
    return { url: blob.url, filename: blob.pathname };
  }

  return {
    url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
    filename: req.file.filename,
  };
}

// Standard Picture Upload
router.post('/', authenticate, uploadImage, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const savedImage = await saveImage(req);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      ...savedImage,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
