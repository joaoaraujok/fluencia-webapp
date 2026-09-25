import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();
const controller = new AuthController();

// Rotas públicas
router.post('/login', controller.login.bind(controller));

// Rotas autenticadas
router.get('/me', authMiddleware, controller.getProfile.bind(controller));
router.post('/change-password', authMiddleware, controller.changePassword.bind(controller));

export const authRoutes = router;
