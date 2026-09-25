import { prisma } from '../../database/prisma.js';
import { Shift } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import { recordAuditLog } from '../../middlewares/audit.middleware.js';

interface CreateClassInput {
  schoolId: string;
  name: string;
  gradeYear: string;
  schoolYear: number;
  shift: Shift;
  actorUserId: string;
}

interface UpdateClassInput {
  id: string;
  name?: string;
  gradeYear?: string;
  schoolYear?: number;
  shift?: Shift;
  active?: boolean;
  actorUserId: string;
}

export class ClassesService {
  public async listClasses(schoolId?: string) {
    const where: any = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }

    return prisma.schoolClass.findMany({
      where,
      include: {
        school: { select: { id: true, name: true, city: true, state: true } },
        _count: {
          select: {
            students: true,
            evaluations: true
          }
        }
      },
      orderBy: [{ schoolYear: 'desc' }, { name: 'asc' }]
    });
  }

  public async getClassById(id: string) {
    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id },
      include: {
        school: true,
        students: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { evaluations: true } }
          }
        },
        _count: {
          select: { evaluations: true }
        }
      }
    });

    if (!schoolClass) {
      throw new AppError('Turma não encontrada.', 404);
    }

    return schoolClass;
  }

  public async createClass({
    schoolId,
    name,
    gradeYear,
    schoolYear,
    shift,
    actorUserId
  }: CreateClassInput) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new AppError('Escola informada não existe.', 404);
    }

    const schoolClass = await prisma.schoolClass.create({
      data: {
        schoolId,
        name: name.trim(),
        gradeYear: gradeYear.trim(),
        schoolYear,
        shift,
        active: true
      },
      include: {
        school: { select: { id: true, name: true } }
      }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'CREATE',
      entity: 'SchoolClass',
      entityId: schoolClass.id,
      newValue: { name: schoolClass.name, schoolId, gradeYear, schoolYear, shift }
    });

    return schoolClass;
  }

  public async updateClass({
    id,
    name,
    gradeYear,
    schoolYear,
    shift,
    active,
    actorUserId
  }: UpdateClassInput) {
    const existing = await prisma.schoolClass.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Turma não encontrada.', 404);
    }

    const updated = await prisma.schoolClass.update({
      where: { id },
      data: {
        name: name?.trim(),
        gradeYear: gradeYear?.trim(),
        schoolYear,
        shift,
        active
      },
      include: {
        school: { select: { id: true, name: true } }
      }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'UPDATE',
      entity: 'SchoolClass',
      entityId: id,
      oldValue: existing,
      newValue: updated
    });

    return updated;
  }
}
