import { Router } from 'express';
import { StudentsController } from './students.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new StudentsController();

router.use(authMiddleware);

// Todos os usuários autenticados (SUPERADMIN, ADMIN, SUPERVISOR) podem listar e consultar alunos
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

// SUPERADMIN, ADMIN e SUPERVISOR podem criar e atualizar alunos de suas turmas
router.post('/', requireRole('SUPERADMIN', 'ADMIN', 'SUPERVISOR'), controller.create.bind(controller));
router.patch('/:id', requireRole('SUPERADMIN', 'ADMIN', 'SUPERVISOR'), controller.update.bind(controller));

export const studentsRoutes = router;
