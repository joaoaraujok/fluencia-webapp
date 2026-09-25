import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ClassesService } from './classes.service.js';
import { Shift } from '@prisma/client';
import { getParam } from '../../shared/utils/param.util.js';

const classesService = new ClassesService();

const createClassSchema = z.object({
  schoolId: z.string().uuid('ID da escola inválido'),
  name: z.string().min(1, 'Nome da turma é obrigatório'),
  gradeYear: z.string().min(1, 'Ano/Série escolar é obrigatório'),
  schoolYear: z.number().int().min(2020).max(2050),
  shift: z.nativeEnum(Shift).default(Shift.MANHA)
});

const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  gradeYear: z.string().min(1).optional(),
  schoolYear: z.number().int().min(2020).max(2050).optional(),
  shift: z.nativeEnum(Shift).optional(),
  active: z.boolean().optional()
});

export class ClassesController {
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.query.schoolId as string | undefined;
      const classes = await classesService.listClasses(schoolId);
      res.status(200).json({ status: 'success', data: { classes } });
    } catch (err) {
      next(err);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolClass = await classesService.getClassById(getParam(req.params.id));
      res.status(200).json({ status: 'success', data: { class: schoolClass } });
    } catch (err) {
      next(err);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createClassSchema.parse(req.body);
      const actorUserId = req.user!.id;
      const schoolClass = await classesService.createClass({ ...data, actorUserId });

      res.status(201).json({ status: 'success', data: { class: schoolClass } });
    } catch (err) {
      next(err);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateClassSchema.parse(req.body);
      const actorUserId = req.user!.id;
      const schoolClass = await classesService.updateClass({
        id: getParam(req.params.id),
        ...data,
        actorUserId
      });

      res.status(200).json({ status: 'success', data: { class: schoolClass } });
    } catch (err) {
      next(err);
    }
  }
}
