import User from '../models/User.js';
import Article from '../models/Article.js';
import Comment from '../models/Comment.js';
import Report from '../models/Report.js';
import Category from '../models/Category.js';
import AIUsage from '../models/AIUsage.js';
import { AppError } from '../middleware/errorHandler.js';
import { paginate } from '../utils/helpers.js';

export async function getOverview(req, res, next) {
  try {
    const [
      totalUsers,
      totalArticles,
      publishedArticles,
      draftArticles,
      pendingReports,
      recentUsers,
      recentArticles,
      aiUsageToday,
    ] = await Promise.all([
      User.countDocuments(),
      Article.countDocuments(),
      Article.countDocuments({ status: 'published' }),
      Article.countDocuments({ status: 'draft' }),
      Report.countDocuments({ status: 'pending' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email avatar createdAt role status'),
      Article.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status createdAt publishedAt')
        .populate('author', 'name'),
      AIUsage.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);

    // Total views from published articles
    const viewAgg = await Article.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } },
    ]);
    const totalViews = viewAgg[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalArticles,
        publishedArticles,
        draftArticles,
        pendingReports,
        totalViews,
        aiUsageToday,
      },
      recentUsers,
      recentArticles,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req, res, next) {
  try {
    const { page, limit, search, role, status } = req.query;
    const { skip, limit: lim, page: p } = paginate(page, limit || 20);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search.slice(0, 100), $options: 'i' } },
        { email: { $regex: search.slice(0, 100), $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page: p, limit: lim, total, totalPages: Math.ceil(total / lim) },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    // Prevent admin from suspending themselves
    if (userId === req.user._id.toString()) {
      return next(new AppError('Cannot change your own account status', 400));
    }

    const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
    if (!user) return next(new AppError('User not found', 404));

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return next(new AppError('Invalid role', 400));
    }

    // Prevent admin from demoting themselves
    if (userId === req.user._id.toString()) {
      return next(new AppError('Cannot change your own role', 400));
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) return next(new AppError('User not found', 404));

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

export async function getAdminArticles(req, res, next) {
  try {
    const { page, limit, status, search } = req.query;
    const { skip, limit: lim, page: p } = paginate(page, limit || 20);

    const query = {};
    if (status) query.status = status;
    if (search) query.$text = { $search: search.slice(0, 200) };

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('author', 'name email')
        .populate('category', 'name')
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

export async function getReports(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const { skip, limit: lim, page: p } = paginate(page, limit || 20);

    const query = {};
    if (status) query.status = status;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('reporter', 'name email')
        .populate('resolvedBy', 'name')
        .lean(),
      Report.countDocuments(query),
    ]);

    res.json({
      success: true,
      reports,
      pagination: { page: p, limit: lim, total, totalPages: Math.ceil(total / lim) },
    });
  } catch (error) {
    next(error);
  }
}

export async function resolveReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const { status, moderationNote } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      return next(new AppError('Status must be resolved or dismissed', 400));
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status, moderationNote: moderationNote || '', resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!report) return next(new AppError('Report not found', 404));

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

// Category management
export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, description, color } = req.body;
    if (!name) return next(new AppError('Category name is required', 400));

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await Category.findOne({ slug });
    if (existing) return next(new AppError('Category with this name already exists', 409));

    const category = await Category.create({ name: name.trim(), slug, description, color });
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { categoryId } = req.params;
    const { name, description, color } = req.body;
    const updates = {};
    if (name) {
      updates.name = name.trim();
      updates.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (description !== undefined) updates.description = description;
    if (color) updates.color = color;

    const category = await Category.findByIdAndUpdate(categoryId, updates, { new: true });
    if (!category) return next(new AppError('Category not found', 404));
    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) return next(new AppError('Category not found', 404));

    // Unset category on existing articles
    await Article.updateMany({ category: categoryId }, { $unset: { category: 1 } });
    await Category.findByIdAndDelete(categoryId);

    res.json({ success: true, message: 'Category deleted. Affected articles have been uncategorized.' });
  } catch (error) {
    next(error);
  }
}
