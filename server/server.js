import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { config, validateEnv } from './config/config.js';
import { connectDB } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';
import { reportContent } from './controllers/commentController.js';
import Category from './models/Category.js';

// Routes
import authRoutes from './routes/auth.js';
import articleRoutes from './routes/articles.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required env vars on startup
validateEnv();

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS - allow configured frontend and vercel.app domains
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.includes('vercel.app') || origin === config.frontendUrl || origin.startsWith('http://localhost')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// High-capacity rate limit tuned for 200+ concurrent users
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check (no auth needed)
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Public categories route
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json({ success: true, categories });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load categories' });
  }
});

// Content reporting (authenticated users)
app.post('/api/reports', authenticate, reportContent);

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
    console.log(`[SERVER] Environment: ${config.nodeEnv}`);
    console.log(`[SERVER] Gemini AI: ${config.geminiApiKey ? 'Configured' : 'NOT configured (AI features disabled)'}`);
  });
}

if (!process.env.VERCEL) {
  start();
}

export default app;
