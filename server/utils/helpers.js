import slugify from 'slugify';
import Article from '../models/Article.js';

export async function generateUniqueSlug(title, excludeId = null) {
  let baseSlug = slugify(title, { lower: true, strict: true, trim: true });
  if (!baseSlug) baseSlug = 'article';

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await Article.findOne(query).select('_id');
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export function estimateReadingTime(content) {
  if (!content) return 1;
  const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function sanitizeHtml(html) {
  if (!html) return '';
  // Basic sanitization - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '');
}

export function paginate(page = 1, limit = 10) {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(50, Math.max(1, parseInt(limit)));
  return { skip: (p - 1) * l, limit: l, page: p };
}
