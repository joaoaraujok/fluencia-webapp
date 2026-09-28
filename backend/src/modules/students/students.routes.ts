import { Router } from 'express';
import { StudentsController } from './students.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new StudentsController();

router.use(authMiddleware);

// Todos os usuários autenticados podem consultar alunos (Supervisor vê apenas da sua escola)
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

// Apenas SUPERADMIN pode criar, editar e excluir alunos
router.post('/', requireRole('SUPERADMIN'), controller.create.bind(controller));
router.patch('/:id', requireRole('SUPERADMIN'), controller.update.bind(controller));
router.delete('/:id', requireRole('SUPERADMIN'), controller.delete.bind(controller));

export const studentsRoutes = router;
