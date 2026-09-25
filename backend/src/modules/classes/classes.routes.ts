import { Router } from 'express';
import { ClassesController } from './classes.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new ClassesController();

router.use(authMiddleware);

// Todos os usuários autenticados podem listar turmas e obter detalhes
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

// SUPERADMIN e ADMIN podem criar e atualizar turmas
router.post('/', requireRole('SUPERADMIN', 'ADMIN'), controller.create.bind(controller));
router.patch('/:id', requireRole('SUPERADMIN', 'ADMIN'), controller.update.bind(controller));

export const classesRoutes = router;
