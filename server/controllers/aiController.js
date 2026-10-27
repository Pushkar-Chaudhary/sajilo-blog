import * as gemini from '../services/geminiService.js';
import { config } from '../config/config.js';
import AIUsage from '../models/AIUsage.js';

const AI_DAILY_LIMIT = 50; // requests per user per day

async function checkRateLimit(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await AIUsage.countDocuments({
    user: userId,
    createdAt: { $gte: today },
    status: 'success',
  });
  return count >= AI_DAILY_LIMIT;
}

function handleAIError(error, res) {
  console.error('[AI] Error:', error.message);

  if (error.message.includes('API key')) {
    return res.status(503).json({
      success: false,
      message: 'AI features are not configured. Please contact the administrator.',
    });
  }
  if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
    return res.status(429).json({ success: false, message: 'AI quota exceeded. Please try again later.' });
  }
  if (error.message.includes('not found') || error.message.includes('NOT_FOUND')) {
    return res.status(503).json({ success: false, message: 'AI model is temporarily unavailable.' });
  }
  return res.status(500).json({ success: false, message: 'AI request failed. Please try again.' });
}

export async function generateArticle(req, res) {
  if (!config.geminiApiKey) {
    return res.status(503).json({ success: false, message: 'AI features are not configured.' });
  }
  if (await checkRateLimit(req.user._id)) {
    return res.status(429).json({ success: false, message: 'Daily AI usage limit reached. Try again tomorrow.' });
  }

  try {
    const result = await gemini.generateArticle(req.body, req.user._id);
    res.json({ success: true, result });
  } catch (error) {
    handleAIError(error, res);
  }
}

export async function rewriteText(req, res) {
  if (!config.geminiApiKey) {
    return res.status(503).json({ success: false, message: 'AI features are not configured.' });
  }
  if (await checkRateLimit(req.user._id)) {
    return res.status(429).json({ success: false, message: 'Daily AI usage limit reached. Try again tomorrow.' });
  }

  try {
    const result = await gemini.rewriteText(req.body, req.user._id);
    res.json({ success: true, result });
  } catch (error) {
    handleAIError(error, res);
  }
}

export async function summarizeArticle(req, res) {
  if (!config.geminiApiKey) {
    return res.status(503).json({ success: false, message: 'AI features are not configured.' });
  }
  if (await checkRateLimit(req.user._id)) {
    return res.status(429).json({ success: false, message: 'Daily AI usage limit reached. Try again tomorrow.' });
  }

  try {
    const { content } = req.body;
    const result = await gemini.summarizeArticle(content, req.user._id);
    res.json({ success: true, result });
  } catch (error) {
    handleAIError(error, res);
  }
}

export async function generateTitles(req, res) {
  if (!config.geminiApiKey) {
    return res.status(503).json({ success: false, message: 'AI features are not configured.' });
  }
  if (await checkRateLimit(req.user._id)) {
    return res.status(429).json({ success: false, message: 'Daily AI usage limit reached. Try again tomorrow.' });
  }

  try {
    const { content } = req.body;
    const result = await gemini.generateTitles(content, req.user._id);
    res.json({ success: true, result });
  } catch (error) {
    handleAIError(error, res);
  }
}

export async function generateOutline(req, res) {
  if (!config.geminiApiKey) {
    return res.status(503).json({ success: false, message: 'AI features are not configured.' });
  }
  if (await checkRateLimit(req.user._id)) {
    return res.status(429).json({ success: false, message: 'Daily AI usage limit reached. Try again tomorrow.' });
  }

  try {
    const { topic } = req.body;
    const result = await gemini.generateOutline(topic, req.user._id);
    res.json({ success: true, result });
  } catch (error) {
    handleAIError(error, res);
  }
}

export async function generateSEO(req, res) {
  if (!config.geminiApiKey) {
    return res.status(503).json({ success: false, message: 'AI features are not configured.' });
  }
  if (await checkRateLimit(req.user._id)) {
    return res.status(429).json({ success: false, message: 'Daily AI usage limit reached. Try again tomorrow.' });
  }

  try {
    const result = await gemini.generateSEO(req.body, req.user._id);
    res.json({ success: true, result });
  } catch (error) {
    handleAIError(error, res);
  }
}

export async function suggestTags(req, res) {
  if (!config.geminiApiKey) {
    return res.status(503).json({ success: false, message: 'AI features are not configured.' });
  }
  if (await checkRateLimit(req.user._id)) {
    return res.status(429).json({ success: false, message: 'Daily AI usage limit reached. Try again tomorrow.' });
  }

  try {
    const { content } = req.body;
    const result = await gemini.suggestTags(content, req.user._id);
    res.json({ success: true, result });
  } catch (error) {
    handleAIError(error, res);
  }
}

export async function chatWithAssistant(req, res) {
  if (!config.geminiApiKey) {
    return res.status(503).json({ success: false, message: 'AI features are not configured.' });
  }
  if (await checkRateLimit(req.user._id)) {
    return res.status(429).json({ success: false, message: 'Daily AI usage limit reached. Try again tomorrow.' });
  }

  try {
    const result = await gemini.chatWithAssistant(req.body, req.user._id);
    res.json({ success: true, result });
  } catch (error) {
    handleAIError(error, res);
  }
}
