import { Router } from 'express';
import { SchoolsController } from './schools.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new SchoolsController();

router.use(authMiddleware);

// Todos os usuários autenticados (SUPERADMIN, ADMIN, SUPERVISOR) podem listar/consultar escolas
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

// SUPERADMIN e ADMIN podem criar e atualizar escolas
router.post('/', requireRole('SUPERADMIN', 'ADMIN'), controller.create.bind(controller));
router.patch('/:id', requireRole('SUPERADMIN', 'ADMIN'), controller.update.bind(controller));

export const schoolsRoutes = router;
