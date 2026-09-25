import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../shared/errors/AppError.js';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface JwtPayload {
  sub: string;
  role: Role;
  email: string;
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token de autenticação não fornecido.', 401);
  }

  const [scheme, token] = authHeader.split(' ');

  if (!token || scheme !== 'Bearer') {
    throw new AppError('Formato de token inválido. Esperado Bearer <token>.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, name: true, email: true, role: true, active: true }
    });

    if (!user || !user.active) {
      throw new AppError('Usuário inativo ou não encontrado no sistema.', 401);
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err: any) {
    if (err instanceof AppError) {
      throw err;
    }
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Sessão expirada. Faça login novamente.', 401);
    }
    throw new AppError('Token inválido ou adulterado.', 401);
  }
}
