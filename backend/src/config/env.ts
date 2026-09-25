import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((v) => parseInt(v, 10)).default('3001'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPERADMIN_NAME: z.string().default('Super Administrador FluencIA'),
  SUPERADMIN_EMAIL: z.string().email().default('superadmin@fluencia.edu.br'),
  SUPERADMIN_PASSWORD: z.string().min(8).default('Fluencia@2026!SuperAdmin'),
  EVALUATION_DEFAULT_WORD_DURATION_SEC: z.string().transform((v) => parseInt(v, 10)).default('10'),
  EVALUATION_CRITERIA_VERSION: z.string().default('2026.1'),
  EVALUATION_SILENT_MODE_DURING_SPEECH: z.string().transform((v) => v === 'true').default('true')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Erro na validação das variáveis de ambiente:', parsed.error.format());
  throw new Error('Configuração de variáveis de ambiente inválida.');
}

export const env = parsed.data;
