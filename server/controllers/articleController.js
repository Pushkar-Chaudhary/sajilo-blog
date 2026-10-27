import Article from '../models/Article.js';
import Bookmark from '../models/Bookmark.js';
import Comment from '../models/Comment.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateUniqueSlug, estimateReadingTime, sanitizeHtml, paginate } from '../utils/helpers.js';

export async function getArticles(req, res, next) {
  try {
    const { page, limit, category, tag, search, sort = 'newest', status } = req.query;
    const { skip, limit: lim, page: p } = paginate(page, limit || 12);

    const query = {};

    // Public routes only show published
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'published';
    } else if (status) {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }
    if (tag) {
      query.tags = { $in: [tag] };
    }
    if (search) {
      const searchQuery = search.slice(0, 200);
      query.$text = { $search: searchQuery };
    }

    let sortOption = { publishedAt: -1 };
    if (sort === 'popular') sortOption = { viewCount: -1, publishedAt: -1 };
    if (sort === 'oldest') sortOption = { publishedAt: 1 };
    if (search) sortOption = { score: { $meta: 'textScore' }, publishedAt: -1 };

    const [articles, total] = await Promise.all([
      Article.find(query)
        .select(search ? { score: { $meta: 'textScore' } } : {})
        .sort(sortOption)
        .skip(skip)
        .limit(lim)
        .populate('author', 'name avatar bio')
        .populate('category', 'name slug color')
        .lean(),
      Article.countDocuments(query),
    ]);

    res.json({
      success: true,
      articles,
      pagination: {
        page: p,
        limit: lim,
        total,
        totalPages: Math.ceil(total / lim),
        hasMore: skip + lim < total,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getArticleBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const query = { slug };

    // Non-admins can only see published articles
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'published';
    }

    const article = await Article.findOne(query)
      .populate('author', 'name avatar bio website')
      .populate('category', 'name slug color');

    if (!article) {
      return next(new AppError('Article not found', 404));
    }

    // If article belongs to current user, allow viewing drafts
    if (
      article.status !== 'published' &&
      req.user?.role !== 'admin' &&
      article.author._id.toString() !== req.user?._id?.toString()
    ) {
      return next(new AppError('Article not found', 404));
    }

    // Increment view count asynchronously
    Article.findByIdAndUpdate(article._id, { $inc: { viewCount: 1 } }).catch(() => {});

    // Check if current user has bookmarked
    let isBookmarked = false;
    if (req.user) {
      const bookmark = await Bookmark.findOne({ user: req.user._id, article: article._id });
      isBookmarked = !!bookmark;
    }

    // Get related articles
    const relatedQuery = { status: 'published', _id: { $ne: article._id } };
    if (article.category) relatedQuery.category = article.category._id;
    const related = await Article.find(relatedQuery)
      .select('title subtitle slug coverImage publishedAt readingTime')
      .populate('author', 'name avatar')
      .limit(3)
      .sort({ publishedAt: -1 })
      .lean();

    res.json({ success: true, article, isBookmarked, related });
  } catch (error) {
    next(error);
  }
}

export async function createArticle(req, res, next) {
  try {
    const { title, subtitle, content, coverImage, category, tags, status, seoTitle, seoDescription } = req.body;

    if (!title || title.trim().length === 0) {
      return next(new AppError('Title is required', 400));
    }

    const slug = await generateUniqueSlug(title);
    const sanitizedContent = sanitizeHtml(content || '');
    const readingTime = estimateReadingTime(sanitizedContent);

    const article = await Article.create({
      author: req.user._id,
      title: title.trim().slice(0, 200),
      slug,
      subtitle: subtitle?.trim().slice(0, 300) || '',
      content: sanitizedContent,
      coverImage: coverImage || '',
      category: category || null,
      tags: Array.isArray(tags) ? tags.slice(0, 10).map((t) => t.trim().toLowerCase()) : [],
      status: status === 'published' ? 'published' : 'draft',
      publishedAt: status === 'published' ? new Date() : null,
      readingTime,
      seoTitle: seoTitle?.trim().slice(0, 70) || '',
      seoDescription: seoDescription?.trim().slice(0, 160) || '',
    });

    await article.populate('author', 'name avatar');
    await article.populate('category', 'name slug');
    res.status(201).json({ success: true, article });
  } catch (error) {
    next(error);
  }
}

export async function updateArticle(req, res, next) {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);

    if (!article) return next(new AppError('Article not found', 404));

    // Only author or admin can update
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to edit this article', 403));
    }

    const { title, subtitle, content, coverImage, category, tags, status, seoTitle, seoDescription, featured } = req.body;
    const updates = {};

    if (title !== undefined) {
      updates.title = title.trim().slice(0, 200);
      // Only regenerate slug if title actually changed
      if (title.trim() !== article.title) {
        updates.slug = await generateUniqueSlug(title, id);
      }
    }
    if (subtitle !== undefined) updates.subtitle = subtitle.trim().slice(0, 300);
    if (content !== undefined) {
      updates.content = sanitizeHtml(content);
      updates.readingTime = estimateReadingTime(updates.content);
    }
    if (coverImage !== undefined) updates.coverImage = coverImage;
    if (category !== undefined) updates.category = category || null;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.slice(0, 10).map((t) => t.trim().toLowerCase()) : [];
    if (seoTitle !== undefined) updates.seoTitle = seoTitle.trim().slice(0, 70);
    if (seoDescription !== undefined) updates.seoDescription = seoDescription.trim().slice(0, 160);
    if (featured !== undefined && req.user.role === 'admin') updates.featured = featured;

    // Handle status transitions
    if (status !== undefined) {
      updates.status = status;
      if (status === 'published' && article.status !== 'published') {
        updates.publishedAt = new Date();
      }
      if (status === 'draft' && article.status === 'published') {
        updates.publishedAt = null;
      }
    }

    const updated = await Article.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('author', 'name avatar')
      .populate('category', 'name slug');

    res.json({ success: true, article: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteArticle(req, res, next) {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);

    if (!article) return next(new AppError('Article not found', 404));

    if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this article', 403));
    }

    await Article.findByIdAndDelete(id);
    // Clean up bookmarks for this article
    Bookmark.deleteMany({ article: id }).catch(() => {});
    Comment.deleteMany({ article: id }).catch(() => {});

    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getMyArticles(req, res, next) {
  try {
    const { page, limit, status, search } = req.query;
    const { skip, limit: lim, page: p } = paginate(page, limit || 10);

    const query = { author: req.user._id };
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query.status = status;
    }
    if (search) {
      query.$text = { $search: search.slice(0, 200) };
    }

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('category', 'name slug')
        .lean(),
      Article.countDocuments(query),
    ]);

    res.json({
      success: true,
      articles,
      pagination: { page: p, limit: lim, total, totalPages: Math.ceil(total / lim) },
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleBookmark(req, res, next) {
  try {
    const { id } = req.params;
    const article = await Article.findById(id).select('_id status');
    if (!article || article.status !== 'published') {
      return next(new AppError('Article not found', 404));
    }

    const existing = await Bookmark.findOne({ user: req.user._id, article: id });
    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      return res.json({ success: true, bookmarked: false });
    }

    await Bookmark.create({ user: req.user._id, article: id });
    res.json({ success: true, bookmarked: true });
  } catch (error) {
    next(error);
  }
}

export async function getBookmarks(req, res, next) {
  try {
    const { page, limit } = req.query;
    const { skip, limit: lim, page: p } = paginate(page, limit || 10);

    const [bookmarks, total] = await Promise.all([
      Bookmark.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate({
          path: 'article',
          select: 'title subtitle slug coverImage publishedAt readingTime category status',
          populate: [
            { path: 'author', select: 'name avatar' },
            { path: 'category', select: 'name slug' },
          ],
        })
        .lean(),
      Bookmark.countDocuments({ user: req.user._id }),
    ]);

    // Filter out deleted articles
    const validBookmarks = bookmarks.filter((b) => b.article && b.article.status === 'published');

    res.json({
      success: true,
      bookmarks: validBookmarks,
      pagination: { page: p, limit: lim, total, totalPages: Math.ceil(total / lim) },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAuthorProfile(req, res, next) {
  try {
    const { userId } = req.params;
    const author = await User.findById(userId).select('name avatar bio website createdAt');
    if (!author) return next(new AppError('Author not found', 404));

    const articles = await Article.find({ author: userId, status: 'published' })
      .select('title subtitle slug coverImage publishedAt readingTime category')
      .populate('category', 'name slug')
      .sort({ publishedAt: -1 })
      .limit(20)
      .lean();

    const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);
    res.json({ success: true, author, articles, stats: { articleCount: articles.length, totalViews } });
  } catch (error) {
    next(error);
  }
}
