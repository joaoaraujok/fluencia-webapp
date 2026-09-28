import bcrypt from 'bcryptjs';
import { prisma } from '../../database/prisma.js';
import { Prisma, Role } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import { recordAuditLog } from '../../middlewares/audit.middleware.js';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  schoolId?: string | null;
  actorUserId: string;
}

interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  schoolId?: string | null;
  active?: boolean;
  actorUserId: string;
}

export class UsersService {
  public async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        school: { select: { id: true, name: true } },
        active: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        school: { select: { id: true, name: true } },
        active: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return user;
  }

  public async createUser({ name, email, password, role, schoolId, actorUserId }: CreateUserInput) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      throw new AppError('Já existe um usuário cadastrado com este e-mail.', 400);
    }

    if (password.length < 8) {
      throw new AppError('A senha deve ter ao menos 8 caracteres.', 400);
    }

    if (schoolId) {
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!school) {
        throw new AppError('Escola vinculada informada não existe.', 404);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        schoolId: schoolId || null,
        active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        school: { select: { id: true, name: true } },
        active: true,
        createdAt: true
      }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      newValue: { name: user.name, email: user.email, role: user.role, schoolId }
    });

    return user;
  }

  public async updateUser({ id, name, email, password, role, schoolId, active, actorUserId }: UpdateUserInput) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // Regra: Não permitir que o último SUPERADMIN ativo seja desativado ou rebaixado
    if (existing.role === 'SUPERADMIN' && (active === false || (role && role !== 'SUPERADMIN'))) {
      const superAdminsCount = await prisma.user.count({
        where: { role: 'SUPERADMIN', active: true }
      });
      if (superAdminsCount <= 1) {
        throw new AppError('Não é possível desativar ou alterar a função do único SUPERADMIN do sistema.', 400);
      }
    }

    const dataToUpdate: Prisma.UserUncheckedUpdateInput = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== existing.email) {
        const emailInUse = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (emailInUse) {
          throw new AppError('Este e-mail já está em uso por outro usuário.', 400);
        }
        dataToUpdate.email = normalizedEmail;
      }
    }
    if (password !== undefined && password.trim().length > 0) {
      if (password.length < 8) {
        throw new AppError('A nova senha deve ter ao menos 8 caracteres.', 400);
      }
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }
    if (role !== undefined) dataToUpdate.role = role;
    if (active !== undefined) dataToUpdate.active = active;

    if (schoolId !== undefined) {
      if (schoolId) {
        const school = await prisma.school.findUnique({ where: { id: schoolId } });
        if (!school) {
          throw new AppError('Escola vinculada informada não existe.', 404);
        }
        dataToUpdate.schoolId = schoolId;
      } else {
        dataToUpdate.schoolId = null;
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        school: { select: { id: true, name: true } },
        active: true,
        updatedAt: true
      }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      oldValue: { name: existing.name, email: existing.email, role: existing.role, active: existing.active },
      newValue: { name: updated.name, email: updated.email, role: updated.role, active: updated.active }
    });

    return updated;
  }

  public async deleteUser(id: string, actorUserId: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    if (existing.role === 'SUPERADMIN') {
      const superAdminsCount = await prisma.user.count({
        where: { role: 'SUPERADMIN', active: true }
      });
      if (superAdminsCount <= 1) {
        throw new AppError('Não é possível excluir o único SUPERADMIN do sistema.', 400);
      }
    }

    try {
      await prisma.user.delete({ where: { id } });
      await recordAuditLog({
        userId: actorUserId,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        oldValue: { name: existing.name, email: existing.email, role: existing.role },
        newValue: { action: 'hard_delete' }
      });
      return { message: 'Usuário excluído com sucesso.' };
    } catch {
      const updated = await prisma.user.update({
        where: { id },
        data: { active: false },
        select: { id: true, active: true }
      });

      await recordAuditLog({
        userId: actorUserId,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        oldValue: { active: existing.active },
        newValue: { active: false, action: 'soft_delete' }
      });

      return { message: 'Usuário desativado com sucesso.', user: updated };
    }
  }
}

