import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { StudentsService } from './students.service.js';
import { getParam } from '../../shared/utils/param.util.js';

const studentsService = new StudentsService();

const createStudentSchema = z.object({
  schoolId: z.string().uuid().optional(),
  classId: z.string().uuid('ID da turma deve ser um UUID válido'),
  name: z.string().min(2, 'Nome do aluno deve ter ao menos 2 caracteres'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve seguir formato YYYY-MM-DD').optional(),
  registrationNumber: z.string().optional(),
  notes: z.string().optional()
});

const updateStudentSchema = z.object({
  classId: z.string().uuid().optional(),
  name: z.string().min(2).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  registrationNumber: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional()
});

export class StudentsController {
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = req.query.classId as string | undefined;
      const schoolId = req.query.schoolId as string | undefined;
      const search = req.query.search as string | undefined;

      const students = await studentsService.listStudents(classId, schoolId, search);
      res.status(200).json({ status: 'success', data: { students } });
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentsService.getStudentById(getParam(req.params.id));
      res.status(200).json({ status: 'success', data: { student } });
    } catch (err) {
      next(err);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createStudentSchema.parse(req.body);
      const actorUserId = req.user!.id;

      const student = await studentsService.createStudent({
        ...data,
        schoolId: data.schoolId || '',
        actorUserId
      });

      res.status(201).json({ status: 'success', data: { student } });
    } catch (err) {
      next(err);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateStudentSchema.parse(req.body);
      const actorUserId = req.user!.id;

      const student = await studentsService.updateStudent({
        id: getParam(req.params.id),
        ...data,
        actorUserId
      });

      res.status(200).json({ status: 'success', data: { student } });
    } catch (err) {
      next(err);
    }
  }
}
