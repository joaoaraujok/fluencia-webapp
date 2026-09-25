import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../modules/auth/auth.service.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../shared/errors/AppError.js';

vi.mock('../database/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    }
  }
}));

describe('AuthService - Autenticação e Segurança', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  it('deve autenticar com sucesso quando as credenciais estiverem corretas', async () => {
    const passwordHash = await bcrypt.hash('SenhaForte123!', 10);
    const mockUser = {
      id: 'user-123',
      name: 'Super Admin Test',
      email: 'admin@fluencia.edu.br',
      passwordHash,
      role: 'SUPERADMIN',
      active: true,
      lastLoginAt: null
    };

    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.user.update as any).mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });

    const result = await authService.login({
      email: 'admin@fluencia.edu.br',
      password: 'SenhaForte123!'
    });

    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe('admin@fluencia.edu.br');
    expect(result.user.role).toBe('SUPERADMIN');
  });

  it('deve rejeitar login com senha incorreta', async () => {
    const passwordHash = await bcrypt.hash('Correta123', 10);
    const mockUser = {
      id: 'user-123',
      name: 'Super Admin Test',
      email: 'admin@fluencia.edu.br',
      passwordHash,
      role: 'SUPERADMIN',
      active: true
    };

    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    await expect(
      authService.login({
        email: 'admin@fluencia.edu.br',
        password: 'SenhaErrada'
      })
    ).rejects.toThrow(AppError);
  });

  it('deve bloquear login de usuário inativo', async () => {
    const passwordHash = await bcrypt.hash('Senha123', 10);
    const mockUser = {
      id: 'user-123',
      name: 'User Inativo',
      email: 'inativo@fluencia.edu.br',
      passwordHash,
      role: 'SUPERVISOR',
      active: false
    };

    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    await expect(
      authService.login({
        email: 'inativo@fluencia.edu.br',
        password: 'Senha123'
      })
    ).rejects.toThrow('Usuário desativado');
  });
});
