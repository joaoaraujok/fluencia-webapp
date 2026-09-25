import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { docsRouter } from './docs/swagger.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);

// Rate Limiting para mitigação de ataques de força bruta e DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: env.NODE_ENV === 'test' ? 10000 : 500, // 500 requisições por janela em produção
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Muitas requisições originadas deste IP. Aguarde alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Parsing de requisições JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Documentação da API
app.use('/api-docs', docsRouter);

// Roteamento Central da API v1
app.use('/api/v1', apiRouter);

// Handler Centralizado de Erros
app.use(errorHandler);
