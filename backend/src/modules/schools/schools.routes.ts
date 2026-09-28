import { Router } from 'express';
import { SchoolsController } from './schools.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new SchoolsController();

router.use(authMiddleware);

// Todos os usuários autenticados podem consultar escolas (Supervisor vê apenas a sua)
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

// Apenas SUPERADMIN pode criar, editar e excluir escolas
router.post('/', requireRole('SUPERADMIN'), controller.create.bind(controller));
router.patch('/:id', requireRole('SUPERADMIN'), controller.update.bind(controller));
router.delete('/:id', requireRole('SUPERADMIN'), controller.delete.bind(controller));

export const schoolsRoutes = router;

