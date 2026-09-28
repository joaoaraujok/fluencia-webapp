import { prisma } from '../../database/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { recordAuditLog } from '../../middlewares/audit.middleware.js';

interface CreateSchoolInput {
  name: string;
  code?: string;
  city: string;
  state: string;
  actorUserId: string;
}

interface UpdateSchoolInput {
  id: string;
  name?: string;
  code?: string;
  city?: string;
  state?: string;
  active?: boolean;
  actorUserId: string;
}

export class SchoolsService {
  public async listSchools(user?: { role: string; schoolId?: string | null }) {
    const where: any = {};
    if (user?.role === 'SUPERVISOR' && user?.schoolId) {
      where.id = user.schoolId;
    }

    return prisma.school.findMany({
      where,
      include: {
        _count: {
          select: {
            classes: true,
            students: true,
            evaluations: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  public async getSchoolById(id: string) {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            _count: { select: { students: true } }
          }
        },
        _count: {
          select: { students: true, evaluations: true }
        }
      }
    });

    if (!school) {
      throw new AppError('Escola não encontrada.', 404);
    }

    return school;
  }

  public async createSchool({ name, code, city, state, actorUserId }: CreateSchoolInput) {
    if (code) {
      const existing = await prisma.school.findUnique({ where: { code } });
      if (existing) {
        throw new AppError('Já existe uma escola cadastrada com este código.', 400);
      }
    }

    const school = await prisma.school.create({
      data: {
        name: name.trim(),
        code: code?.trim() || null,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        active: true
      }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'CREATE',
      entity: 'School',
      entityId: school.id,
      newValue: { name: school.name, city: school.city, state: school.state }
    });

    return school;
  }

  public async updateSchool({ id, name, code, city, state, active, actorUserId }: UpdateSchoolInput) {
    const existing = await prisma.school.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Escola não encontrada.', 404);
    }

    if (code && code !== existing.code) {
      const codeInUse = await prisma.school.findUnique({ where: { code } });
      if (codeInUse) {
        throw new AppError('Este código já está em uso por outra escola.', 400);
      }
    }

    const updated = await prisma.school.update({
      where: { id },
      data: {
        name: name?.trim(),
        code: code?.trim(),
        city: city?.trim(),
        state: state?.trim().toUpperCase(),
        active
      }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'UPDATE',
      entity: 'School',
      entityId: id,
      oldValue: existing,
      newValue: updated
    });

    return updated;
  }

  public async deleteSchool(id: string, actorUserId: string) {
    const existing = await prisma.school.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Escola não encontrada.', 404);
    }

    await prisma.school.delete({
      where: { id }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'DELETE',
      entity: 'School',
      entityId: id,
      oldValue: { name: existing.name, code: existing.code }
    });

    return { message: 'Escola removida com sucesso.' };
  }
}
