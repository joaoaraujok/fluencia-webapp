import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();
const controller = new ReportsController();

router.use(authMiddleware);

router.get('/students/:studentId', controller.getStudentReport.bind(controller));
router.get('/classes/:classId', controller.getClassReport.bind(controller));

export const reportsRoutes = router;
