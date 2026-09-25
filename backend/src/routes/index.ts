import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { usersRoutes } from '../modules/users/users.routes.js';
import { schoolsRoutes } from '../modules/schools/schools.routes.js';
import { classesRoutes } from '../modules/classes/classes.routes.js';
import { studentsRoutes } from '../modules/students/students.routes.js';
import { questionsRoutes } from '../modules/questions/questions.routes.js';
import { evaluationsRoutes } from '../modules/evaluations/evaluations.routes.js';
import { reportsRoutes } from '../modules/reports/reports.routes.js';
import { analyticsRoutes } from '../modules/analytics/analytics.routes.js';
import { settingsRoutes } from '../modules/settings/settings.routes.js';
import { auditRoutes } from '../modules/audit/audit.routes.js';

const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'FluencIA API Institucional'
  });
});

// Módulos da API
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/schools', schoolsRoutes);
router.use('/classes', classesRoutes);
router.use('/students', studentsRoutes);
router.use('/questions', questionsRoutes);
router.use('/evaluations', evaluationsRoutes);
router.use('/reports', reportsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit', auditRoutes);

export const apiRouter = router;
