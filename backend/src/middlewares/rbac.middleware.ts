import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../shared/errors/AppError.js';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `Acesso negado. Esta operação exige perfil ${allowedRoles.join(' ou ')}. Seu perfil atual é ${req.user.role}.`,
        403
      );
    }

    next();
  };
}
