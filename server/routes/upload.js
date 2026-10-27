import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../config/config.js';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.resolve(__dirname, '../uploads');

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

// File filter (Images only)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowed.test(ext) || allowed.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Standard Picture Upload
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Picture Upload with AI Vision Analysis (Generate title, tags & outline from image)
router.post('/ai-analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    let aiAnalysis = null;

    if (config.geminiApiKey) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const base64Data = fileBuffer.toString('base64');

        const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

        const prompt = `You are an AI editor for a modern blog platform. Analyze this image and generate blog ideas in valid JSON only (no markdown fences):
{
  "suggestedTitle": "Catchy headline for an article featuring this image",
  "suggestedCategory": "Technology | Startup | Lifestyle | Finance",
  "altText": "Accessible description of what is depicted in the image",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "storyHook": "Engaging opening paragraph or story hook inspired by this visual"
}`;

        const response = await ai.models.generateContent({
          model: config.geminiModel,
          contents: [
            prompt,
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: base64Data,
              },
            },
          ],
        });

        const rawText = response.text || '';
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        aiAnalysis = JSON.parse(cleaned);
      } catch (err) {
        console.warn('[AI Vision] Analysis error:', err.message);
        aiAnalysis = {
          suggestedTitle: 'Exploring New Horizons',
          suggestedCategory: 'Lifestyle',
          altText: 'Uploaded blog visual',
          tags: ['Inspiration', 'Trending', 'Story'],
          storyHook: 'Every picture tells a compelling story waiting to be explored.',
        };
      }
    }

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      ai: aiAnalysis,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
