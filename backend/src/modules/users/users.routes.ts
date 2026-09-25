import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new UsersController();

// Apenas usuários autenticados
router.use(authMiddleware);

// ADMIN e SUPERADMIN podem listar e ver detalhes
router.get('/', requireRole('SUPERADMIN', 'ADMIN'), controller.list.bind(controller));
router.get('/:id', requireRole('SUPERADMIN', 'ADMIN'), controller.getById.bind(controller));

// Apenas SUPERADMIN pode criar, editar ou desativar usuários
router.post('/', requireRole('SUPERADMIN'), controller.create.bind(controller));
router.patch('/:id', requireRole('SUPERADMIN'), controller.update.bind(controller));
router.delete('/:id', requireRole('SUPERADMIN'), controller.delete.bind(controller));

export const usersRoutes = router;
