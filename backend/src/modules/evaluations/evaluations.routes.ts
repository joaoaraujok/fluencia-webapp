import { Router } from 'express';
import { EvaluationsController } from './evaluations.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new EvaluationsController();

router.use(authMiddleware);

// Consultar avaliações
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

// Aplicar/salvar avaliação (SUPERVISOR e SUPERADMIN)
router.post('/', requireRole('SUPERVISOR', 'SUPERADMIN'), controller.create.bind(controller));

export const evaluationsRoutes = router;
