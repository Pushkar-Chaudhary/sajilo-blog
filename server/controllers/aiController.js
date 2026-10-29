import { config } from '../config/config.js';
import { generateArticleDraft, rewriteSelectedText } from '../services/geminiService.js';

function respondWithAIError(error, res) {
  const status = error.status || error.statusCode;
  if (status === 400) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (status === 429) {
    return res.status(429).json({ success: false, message: 'AI request limit reached. Please try again later.' });
  }
  if (status === 401 || status === 403) {
    console.error('[AI] Gemini credentials were rejected.');
    return res.status(503).json({ success: false, message: 'AI is not available. Check the server Gemini configuration.' });
  }
  if (status === 404) {
    console.error('[AI] The configured Gemini model is unavailable.');
    return res.status(503).json({ success: false, message: 'The configured Gemini model is unavailable. Check GEMINI_MODEL.' });
  }

  console.error(`[AI] Gemini request failed (${error.name || 'Error'}${status ? `, status ${status}` : ''}).`);
  const responseStatus = status === 503 ? 503 : 502;
  return res.status(responseStatus).json({
    success: false,
    message: responseStatus === 503
      ? 'Gemini is temporarily unavailable. Please try again shortly.'
      : 'The AI service could not complete this request. Please try again.',
  });
}

export async function generateArticle(req, res) {
  if (!config.geminiApiKey) {
    return res.status(503).json({ success: false, message: 'AI is not configured on the server. Set GEMINI_API_KEY.' });
  }

  try {
    const result = await generateArticleDraft(req.body);
    return res.json({ success: true, result });
  } catch (error) {
    return respondWithAIError(error, res);
  }
}

export async function rewriteText(req, res) {
  if (!config.geminiApiKey) {
    return res.status(503).json({ success: false, message: 'AI is not configured on the server. Set GEMINI_API_KEY.' });
  }

  try {
    const result = await rewriteSelectedText(req.body);
    return res.json({ success: true, result });
  } catch (error) {
    return respondWithAIError(error, res);
  }
}
