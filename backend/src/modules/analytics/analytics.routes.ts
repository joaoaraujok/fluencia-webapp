import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new AnalyticsController();

router.use(authMiddleware);

router.get('/overview', requireRole('SUPERADMIN', 'ADMIN'), controller.getOverview.bind(controller));

export const analyticsRoutes = router;
