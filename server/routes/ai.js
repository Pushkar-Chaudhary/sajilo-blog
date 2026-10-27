import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ai from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: 'Too many AI requests. Please wait a moment.' },
});

// All AI routes require authentication
router.use(authenticate);
router.use(aiLimiter);

router.post('/generate', ai.generateArticle);
router.post('/rewrite', ai.rewriteText);
router.post('/summarize', ai.summarizeArticle);
router.post('/titles', ai.generateTitles);
router.post('/outline', ai.generateOutline);
router.post('/seo', ai.generateSEO);
router.post('/tags', ai.suggestTags);
router.post('/chat', ai.chatWithAssistant);

export default router;
