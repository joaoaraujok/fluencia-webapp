import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const router = Router();
const controller = new SettingsController();

router.use(authMiddleware);

// Leitura de parâmetros pedagógicos
router.get('/', controller.getSettings.bind(controller));

// Apenas SUPERADMIN pode alterar configurações pedagógicas e globais
router.put('/', requireRole('SUPERADMIN'), controller.updateSetting.bind(controller));

export const settingsRoutes = router;
