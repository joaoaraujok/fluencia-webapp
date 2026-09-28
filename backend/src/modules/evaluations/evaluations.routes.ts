import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { EvaluationsController } from './evaluations.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `audio-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB
  }
});

const router = Router();
const controller = new EvaluationsController();

// Avaliar leitura com IA Fonética (Whisper Large v3 Groq + Google Gemini)
// Disponível para o motor de avaliação em tempo real do frontend
router.post('/analyze-audio', upload.single('audioFile'), controller.analyzeAudio.bind(controller));
router.post('/generate-session-synthesis', controller.generateSessionSynthesis.bind(controller));

// Rotas administrativas protegidas por autenticação
router.use(authMiddleware);

// Consultar avaliações
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));

// Aplicar/salvar avaliação de teste de crianças (Exclusivo SUPERVISOR - SuperAdmin e Admin não realizam testes)
router.post('/', requireRole('SUPERVISOR'), controller.create.bind(controller));

// Atualizar observações da avaliação pelo supervisor responsável
router.patch('/:id/notes', requireRole('SUPERVISOR'), controller.updateNotes.bind(controller));

// Avaliar/revisar relatório de supervisores (ADMIN e SUPERADMIN)
router.patch('/:id/review', requireRole('ADMIN', 'SUPERADMIN'), controller.review.bind(controller));

export const evaluationsRoutes = router;
