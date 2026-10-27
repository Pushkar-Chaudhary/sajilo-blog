import { Router } from 'express';
import * as articles from '../controllers/articleController.js';
import * as comments from '../controllers/commentController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', optionalAuth, articles.getArticles);
router.get('/author/:userId', articles.getAuthorProfile);
router.get('/:slug', optionalAuth, articles.getArticleBySlug);

// Article comments
router.get('/:articleId/comments', comments.getComments);
router.post('/:articleId/comments', authenticate, comments.createComment);
router.delete('/comments/:commentId', authenticate, comments.deleteComment);

// Protected routes
router.post('/', authenticate, articles.createArticle);
router.patch('/:id', authenticate, articles.updateArticle);
router.delete('/:id', authenticate, articles.deleteArticle);
router.post('/:id/bookmark', authenticate, articles.toggleBookmark);

// User-specific routes
router.get('/user/my-articles', authenticate, articles.getMyArticles);
router.get('/user/bookmarks', authenticate, articles.getBookmarks);

export default router;
