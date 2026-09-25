import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { recordAuditLog } from '../../middlewares/audit.middleware.js';

interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  public async login({ email, password, ipAddress, userAgent }: LoginInput) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      throw new AppError('Credenciais incorretas ou usuário não encontrado.', 401);
    }

    if (!user.active) {
      throw new AppError('Usuário desativado. Entre em contato com o administrador.', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Credenciais incorretas ou usuário não encontrado.', 401);
    }

    // Atualiza o último acesso
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Registra auditoria de login
    await recordAuditLog({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent
    });

    // Gera token JWT
    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
        name: user.name
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      },
      token
    };
  }

  public async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return user;
  }

  public async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Senha atual informada é incorreta.', 400);
    }

    if (newPass.length < 8) {
      throw new AppError('A nova senha deve possuir ao menos 8 caracteres.', 400);
    }

    const newHash = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    await recordAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'User',
      entityId: userId,
      newValue: { passwordChanged: true }
    });

    return { message: 'Senha alterada com sucesso.' };
  }
}
