import { prisma } from '../../database/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { recordAuditLog } from '../../middlewares/audit.middleware.js';

interface CreateStudentInput {
  schoolId: string;
  classId: string;
  name: string;
  birthDate?: string; // YYYY-MM-DD
  registrationNumber?: string;
  notes?: string;
  actorUserId: string;
}

interface UpdateStudentInput {
  id: string;
  schoolId?: string;
  classId?: string;
  name?: string;
  birthDate?: string;
  registrationNumber?: string;
  notes?: string;
  active?: boolean;
  actorUserId: string;
}

export class StudentsService {
  public async listStudents(classId?: string, schoolId?: string, search?: string) {
    const where: any = {};
    if (classId) where.classId = classId;
    if (schoolId) where.schoolId = schoolId;
    if (search && search.trim().length > 0) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    return prisma.student.findMany({
      where,
      include: {
        school: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, gradeYear: true, schoolYear: true } },
        _count: {
          select: { evaluations: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  public async getStudentById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        school: true,
        class: true,
        evaluations: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            mode: true,
            status: true,
            accuracyPercentage: true,
            averageResponseTimeMs: true,
            totalItems: true,
            correctCount: true,
            criteriaVersion: true
          }
        }
      }
    });

    if (!student) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    return student;
  }

  public async createStudent({
    schoolId,
    classId,
    name,
    birthDate,
    registrationNumber,
    notes,
    actorUserId
  }: CreateStudentInput) {
    // Valida turma e escola
    const schoolClass = await prisma.schoolClass.findUnique({
      where: { id: classId },
      include: { school: true }
    });

    if (!schoolClass) {
      throw new AppError('Turma informada não existe.', 404);
    }

    const student = await prisma.student.create({
      data: {
        schoolId: schoolClass.schoolId, // Garante integridade referencial com a escola da turma
        classId,
        name: name.trim(),
        birthDate: birthDate ? new Date(birthDate) : null,
        registrationNumber: registrationNumber?.trim() || null,
        notes: notes?.trim() || null,
        active: true
      },
      include: {
        class: { select: { id: true, name: true, gradeYear: true } },
        school: { select: { id: true, name: true } }
      }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'CREATE',
      entity: 'Student',
      entityId: student.id,
      newValue: { name: student.name, classId, schoolId: schoolClass.schoolId }
    });

    return student;
  }

  public async updateStudent({
    id,
    schoolId,
    classId,
    name,
    birthDate,
    registrationNumber,
    notes,
    active,
    actorUserId
  }: UpdateStudentInput) {
    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Aluno não encontrado.', 404);
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (birthDate !== undefined) dataToUpdate.birthDate = birthDate ? new Date(birthDate) : null;
    if (registrationNumber !== undefined) dataToUpdate.registrationNumber = registrationNumber.trim();
    if (notes !== undefined) dataToUpdate.notes = notes.trim();
    if (active !== undefined) dataToUpdate.active = active;

    if (classId && classId !== existing.classId) {
      const schoolClass = await prisma.schoolClass.findUnique({ where: { id: classId } });
      if (!schoolClass) {
        throw new AppError('Nova turma informada não existe.', 404);
      }
      dataToUpdate.classId = classId;
      dataToUpdate.schoolId = schoolClass.schoolId;
    }

    const updated = await prisma.student.update({
      where: { id },
      data: dataToUpdate,
      include: {
        class: { select: { id: true, name: true, gradeYear: true } },
        school: { select: { id: true, name: true } }
      }
    });

    await recordAuditLog({
      userId: actorUserId,
      action: 'UPDATE',
      entity: 'Student',
      entityId: id,
      oldValue: existing,
      newValue: updated
    });

    return updated;
  }
}
