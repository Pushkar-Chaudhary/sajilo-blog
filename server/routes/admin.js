import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { reportContent } from '../controllers/commentController.js';

const router = Router();

// All admin routes require admin role
router.use(authenticate, requireAdmin);

router.get('/overview', admin.getOverview);

// Users
router.get('/users', admin.getUsers);
router.patch('/users/:userId/status', admin.updateUserStatus);
router.patch('/users/:userId/role', admin.updateUserRole);

// Articles
router.get('/articles', admin.getAdminArticles);

// Reports
router.get('/reports', admin.getReports);
router.patch('/reports/:reportId', admin.resolveReport);

// Categories
router.get('/categories', admin.getCategories);
router.post('/categories', admin.createCategory);
router.patch('/categories/:categoryId', admin.updateCategory);
router.delete('/categories/:categoryId', admin.deleteCategory);

export default router;
