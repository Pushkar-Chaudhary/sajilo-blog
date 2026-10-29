import { GoogleGenAI } from '@google/genai';
import { config } from '../config/config.js';

const MAX_TOPIC_LENGTH = 300;
const MAX_TEXT_LENGTH = 8000;
const articleCategories = ['Technology', 'Startup', 'Lifestyle', 'Finance', 'Health', 'Travel'];
let client;

function getClient() {
  if (!config.geminiApiKey) {
    const error = new Error('Gemini is not configured.');
    error.status = 503;
    throw error;
  }

  client ??= new GoogleGenAI({ apiKey: config.geminiApiKey });
  return client;
}

function parseJsonResponse(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('The AI returned an invalid draft. Please try again.');
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateText(prompt, maxOutputTokens = 4096) {
  let response;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await getClient().models.generateContent({
        model: config.geminiModel,
        contents: prompt,
        config: {
          maxOutputTokens,
          abortSignal: AbortSignal.timeout(50_000),
        },
      });
      break;
    } catch (error) {
      if (attempt === 0 && [500, 503].includes(error.status)) {
        await new Promise((resolve) => setTimeout(resolve, 750));
        continue;
      }
      throw error;
    }
  }

  if (!response.text?.trim()) {
    throw new Error('The AI returned an empty response. Please try again.');
  }
  return response.text.trim();
}

export async function generateArticleDraft({ topic, audience, tone, length, category }) {
  if (typeof topic !== 'string' || !topic.trim() || topic.length > MAX_TOPIC_LENGTH) {
    const error = new Error(`Topic must be between 1 and ${MAX_TOPIC_LENGTH} characters.`);
    error.status = 400;
    throw error;
  }
  if (audience !== undefined && (typeof audience !== 'string' || audience.length > 200)) {
    const error = new Error('Audience must be 200 characters or fewer.');
    error.status = 400;
    throw error;
  }
  if (tone !== undefined && (typeof tone !== 'string' || tone.length > 80)) {
    const error = new Error('Tone must be 80 characters or fewer.');
    error.status = 400;
    throw error;
  }
  const allowedLengths = ['Concise (300-500 words)', 'Standard (600-800 words)', 'Detailed (900-1200 words)'];
  if (length !== undefined && !allowedLengths.includes(length)) {
    const error = new Error('Choose a supported article length.');
    error.status = 400;
    throw error;
  }

  const requestedCategory = articleCategories.includes(category) ? category : '';
  const prompt = `Write an original blog article that feels specific, thoughtful, and useful to a real reader.

Topic: ${topic.trim()}
Audience: ${audience?.trim() || 'General readers'}
Tone: ${tone?.trim() || 'Warm and conversational'}
Length: ${length || allowedLengths[1]}
${requestedCategory ? `Category: ${requestedCategory}` : `Choose one category from: ${articleCategories.join(', ')}`}

Avoid generic filler, repeated advice, fabricated personal experiences, unsupported statistics, and invented quotations or sources. Use concrete examples where helpful. Return one valid JSON object only, with these fields:
{
  "title": "Article title",
  "subtitle": "One-sentence summary",
  "category": "One category from the allowed list",
  "content": "<p>Original opening paragraph...</p><h2>Section heading</h2><p>Useful, specific discussion...</p>",
  "tags": ["tag-one", "tag-two"]
}
The content must be HTML using only p, h2, h3, ul, ol, and li elements. Do not include markdown fences.`;

  const result = parseJsonResponse(await generateText(prompt));
  if (
    typeof result.title !== 'string' ||
    typeof result.subtitle !== 'string' ||
    typeof result.content !== 'string' ||
    !result.title.trim() ||
    !result.content.trim()
  ) {
    throw new Error('The AI returned an incomplete draft. Please try again.');
  }

  return {
    title: result.title.trim().slice(0, 200),
    subtitle: result.subtitle.trim().slice(0, 300),
    content: result.content,
    category: articleCategories.includes(result.category) ? result.category : requestedCategory || 'Lifestyle',
    tags: Array.isArray(result.tags)
      ? result.tags.filter((tag) => typeof tag === 'string').slice(0, 10).map((tag) => tag.trim().toLowerCase())
      : [],
  };
}

export async function rewriteSelectedText({ text, instruction }) {
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT_LENGTH) {
    const error = new Error(`Select text between 1 and ${MAX_TEXT_LENGTH} characters to rewrite.`);
    error.status = 400;
    throw error;
  }
  if (instruction !== undefined && (typeof instruction !== 'string' || instruction.length > 300)) {
    const error = new Error('Rewrite instruction must be 300 characters or fewer.');
    error.status = 400;
    throw error;
  }

  const prompt = `Rewrite the selected passage for clarity and a natural human voice. Preserve its meaning, factual claims, and any HTML tags. Do not add facts, an introduction, or commentary.
${instruction?.trim() ? `Instruction: ${instruction.trim().slice(0, 300)}` : ''}

Selected passage:
${text}`;

  return generateText(prompt, 2048);
}
