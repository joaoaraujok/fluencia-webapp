import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/AppError.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Erro operacional conhecido
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      ...(err.details ? { details: err.details } : {})
    });
    return;
  }

  // Erro de validação de schemas Zod
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    res.status(400).json({
      status: 'validation_error',
      statusCode: 400,
      message: 'Dados enviados na requisição são inválidos.',
      errors: formattedErrors
    });
    return;
  }

  // Log de erros não esperados
  console.error('💥 Erro interno não tratado:', err);

  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
    ...(env.NODE_ENV === 'development' ? { stack: err.stack, rawError: err.message } : {})
  });
}
