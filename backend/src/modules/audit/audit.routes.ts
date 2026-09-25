import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new AuditController();

router.use(authMiddleware);

// Restrito exclusivamente a SUPERADMIN
router.get('/', requireRole('SUPERADMIN'), controller.list.bind(controller));

export const auditRoutes = router;
