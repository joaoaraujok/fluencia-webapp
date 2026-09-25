import { Router } from 'express';
import { QuestionsController } from './questions.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new QuestionsController();

router.use(authMiddleware);

// Rota para seleção balanceada de itens de avaliação (todos os perfis autenticados)
router.get('/evaluation-items', controller.getEvaluationItems.bind(controller));

// Listagem e detalhes
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

// Apenas SUPERADMIN pode gerenciar o banco de questões
router.post('/', requireRole('SUPERADMIN'), controller.create.bind(controller));
router.patch('/:id', requireRole('SUPERADMIN'), controller.update.bind(controller));
router.delete('/:id', requireRole('SUPERADMIN'), controller.delete.bind(controller));

export const questionsRoutes = router;
