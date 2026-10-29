import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ai from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many AI requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

router.post('/generate', ai.generateArticle);
router.post('/rewrite', ai.rewriteText);

export default router;
