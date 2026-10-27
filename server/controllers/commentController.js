import Comment from '../models/Comment.js';
import Article from '../models/Article.js';
import Report from '../models/Report.js';
import { AppError } from '../middleware/errorHandler.js';
import { paginate } from '../utils/helpers.js';

export async function getComments(req, res, next) {
  try {
    const { articleId } = req.params;
    const { page, limit } = req.query;
    const { skip, limit: lim, page: p } = paginate(page, limit || 20);

    const [comments, total] = await Promise.all([
      Comment.find({ article: articleId, status: 'active', parent: null })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('author', 'name avatar')
        .lean(),
      Comment.countDocuments({ article: articleId, status: 'active', parent: null }),
    ]);

    // Fetch replies for top-level comments
    const commentIds = comments.map((c) => c._id);
    const replies = await Comment.find({
      article: articleId,
      status: 'active',
      parent: { $in: commentIds },
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: 1 })
      .lean();

    const replyMap = {};
    replies.forEach((r) => {
      const key = r.parent.toString();
      if (!replyMap[key]) replyMap[key] = [];
      replyMap[key].push(r);
    });

    const commentsWithReplies = comments.map((c) => ({
      ...c,
      replies: replyMap[c._id.toString()] || [],
    }));

    res.json({
      success: true,
      comments: commentsWithReplies,
      pagination: { page: p, limit: lim, total, totalPages: Math.ceil(total / lim) },
    });
  } catch (error) {
    next(error);
  }
}

export async function createComment(req, res, next) {
  try {
    const { articleId } = req.params;
    const { content, parentId } = req.body;

    if (!content || content.trim().length === 0) {
      return next(new AppError('Comment content is required', 400));
    }

    const article = await Article.findOne({ _id: articleId, status: 'published' });
    if (!article) return next(new AppError('Article not found', 404));

    const comment = await Comment.create({
      article: articleId,
      author: req.user._id,
      content: content.trim().slice(0, 2000),
      parent: parentId || null,
    });

    // Update comment count on article
    await Article.findByIdAndUpdate(articleId, { $inc: { commentCount: 1 } });

    await comment.populate('author', 'name avatar');
    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) return next(new AppError('Comment not found', 404));

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this comment', 403));
    }

    await Comment.findByIdAndUpdate(commentId, { status: 'deleted' });
    await Article.findByIdAndUpdate(comment.article, { $inc: { commentCount: -1 } });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
}

export async function reportContent(req, res, next) {
  try {
    const { targetType, targetId, reason, details } = req.body;
    if (!targetType || !targetId || !reason) {
      return next(new AppError('targetType, targetId, and reason are required', 400));
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      details: details?.trim().slice(0, 500) || '',
    });

    res.status(201).json({ success: true, message: 'Report submitted successfully', report });
  } catch (error) {
    next(error);
  }
}
